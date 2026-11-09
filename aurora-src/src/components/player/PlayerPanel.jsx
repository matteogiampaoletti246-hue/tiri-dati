import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { X } from 'lucide-react';
import PlayerPhoto from '@/components/PlayerPhoto';
import Crest from '@/components/Crest';
import InjuryIcon from '@/components/InjuryIcon';
import { useModalLock } from '@/lib/modal';
import { finishCarousel } from '@/lib/carousel';
import { closePanel, usePlayerPanel } from '@/data/playerPanel';
import { playerById } from '@/data/players';
import { teamById } from '@/data/teams';
import { injuryOf } from '@/data/injuries';
import Alert from '@/components/Alert';
import { playerFace } from '@/data/archive';
import { parseArchiveId, makeArchivePlayer } from '@/data/archivePlayer';
import { useBioPid, usePlayerCareer } from '@/data/playerIndex';
import { money } from '@/data/carriere';
import { resetSel } from '@/components/past/PastBits';
import { StatistichePanel, playerHasCurStats, useBio } from './PlayerTabs';

// Pannello giocatore da destra (partite non ancora iniziate): foto e Informazioni del Profilo, tasto Profilo, sotto solo le Statistiche.
// Meccanica del componente "information drawer" (GSAP): velo, pannello che scorre, contenuto che appare dopo l'apertura.
const DUR = 0.65;
const EASE = 'power2.inOut';
const VEIL = 0.45;
const FADE = 0.25;
const WIDTH = '68%';
// foto senza sfondo che sfuma sul bordo in basso (sagoma "green screen" sopra la linea della squadra)
const PHOTO_FADE = 'linear-gradient(to bottom, #000 80%, transparent 100%)';
const L = { fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' };

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// dentro una fila che scorre di lato (e non e' all'inizio) lo swipe a destra fa scorrere la fila, non chiude il pannello
const hScrolled = (el, stop) => {
  for (let n = el; n && n !== stop; n = n.parentElement) {
    if (n.scrollWidth > n.clientWidth + 1 && n.scrollLeft > 0 && /(auto|scroll)/.test(getComputedStyle(n).overflowX)) return true;
  }
  return false;
};
const needArchive = (id) => { const p = playerById(id); return !p || !!p.lite; };

// iPhone: altezza e posizione dallo schermo vero (visualViewport), come la finestra giocatore
function useScreenBox(on) {
  const [box, setBox] = useState(null);
  useEffect(() => {
    if (!on) return undefined;
    const vv = window.visualViewport;
    if (!vv) return undefined;
    const upd = () => {
      const a = document.activeElement;
      if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      const h = Math.max(Math.round(vv.height), Math.round(window.innerHeight || 0));
      const t = Math.round(vv.offsetTop);
      setBox((o) => (o && o.h === h && o.t === t ? o : { h, t }));
    };
    upd();
    vv.addEventListener('resize', upd);
    vv.addEventListener('scroll', upd);
    window.addEventListener('resize', upd);
    window.addEventListener('sl-resume', upd);
    const iv = setInterval(upd, 700);
    return () => { vv.removeEventListener('resize', upd); vv.removeEventListener('scroll', upd); window.removeEventListener('resize', upd); window.removeEventListener('sl-resume', upd); clearInterval(iv); setBox(null); };
  }, [on]);
  return box;
}

// larghezza della scheda giocatore (Profilo): lo schermo, al massimo la colonna dell'app
const pageWidth = () => {
  const app = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-w')) || 430;
  return Math.min(window.innerWidth || app, app);
};

// Statistiche identiche a quelle del Profilo, rimpicciolite in proporzione: si disegnano larghe come la scheda giocatore
// e si riducono alla larghezza del pannello (scala: caratteri, barre e tabelle tengono lo stesso rapporto larghezza-altezza).
// Niente zoom CSS: in WebKit sposta le lineette della media. L'altezza occupata segue quella vera del contenuto ridotto.
function Scaled({ children }) {
  const ref = useRef(null);
  const inner = useRef(null);
  const [fit, setFit] = useState(null);
  const [h, setH] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const upd = () => {
      const w = el.clientWidth;
      const W = pageWidth();
      if (!w || !W) return;
      const k = Math.min(1, w / W);
      setFit((o) => (o && o.W === W && Math.abs(o.k - k) < 0.001 ? o : { W, k }));
    };
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    window.addEventListener('resize', upd);
    return () => { ro.disconnect(); window.removeEventListener('resize', upd); };
  }, []);
  useLayoutEffect(() => {
    const el = inner.current;
    if (!el || !fit) return undefined;
    const upd = () => setH(Math.ceil(el.offsetHeight * fit.k));
    upd();
    const ro = new ResizeObserver(upd);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);
  return (
    <div ref={ref} className="relative w-full" style={{ height: fit ? h : 0 }}>
      {fit ? <div ref={inner} className="absolute left-0 top-0" style={{ width: fit.W, transform: `scale(${fit.k})`, transformOrigin: '0 0' }}>{children}</div> : null}
    </div>
  );
}

// Informazioni del pannello (solo qui, il Profilo resta com'e'): nazionalita', ruolo, piede e valore in quattro riquadri 2x2
function useFields(player) {
  const { c, cells } = useBio(player);
  const m = Object.fromEntries(cells.filter(([, v]) => v !== '—'));
  return { m, mv: c.mv ? money(c.mv) : null };
}
const Cell = ({ k, v, gold }) => (
  <div className="min-w-0">
    <p style={{ ...L, fontSize: 8.5 }}>{k}</p>
    <p className={`tnum mt-0.5 truncate ${gold ? 'text-[13px]' : 'text-[12px]'} font-medium leading-tight`} style={{ color: gold ? '#e0a528' : 'var(--ink)' }}>{v}</p>
  </div>
);
const Shirt = ({ n }) => (n ? <span className="tnum text-[26px] font-extrabold leading-none" style={{ color: 'var(--ink)', letterSpacing: '-.04em' }}><span className="text-[13px] font-bold" style={{ color: 'var(--ink-3)' }}>#</span>{n}</span> : null);

// foto in alto a sinistra con accanto nome, squadra, maglia e tasto Profilo (piccolo come le tendine); sotto i riquadri
function Head({ player, team, photo, onProfile }) {
  const { m, mv } = useFields(player);
  const tiles = [
    m['Nazionalità'] ? ['Nazionalità', m['Nazionalità']] : null,
    m.Ruolo ? ['Ruolo', m.Ruolo] : null,
    m.Piede ? ['Piede', m.Piede] : null,
    mv ? ['Valore', mv, true] : null,
  ].filter(Boolean);
  return (
    <div className="safe-top px-4 pb-3.5 pt-3">
      <div className="flex items-end gap-3 pr-8">
        <div className="relative aspect-square w-[40%] shrink-0" style={{ WebkitMaskImage: PHOTO_FADE, maskImage: PHOTO_FADE }}>
          <PlayerPhoto src={photo} alt={player.name} cover={false} className="absolute inset-0 h-full w-full" />
        </div>
        <div className="min-w-0 flex-1 pb-1">
          <h2 className="title-lg text-[17px] leading-tight" style={{ color: 'var(--ink)', letterSpacing: '-.03em' }}>{player.name}</h2>
          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
            {team ? <Crest team={team} size={15} /> : null}
            <span className="truncate">{team ? team.name : player.teamName}</span>
          </p>
          <div className="mt-2.5 flex items-center gap-2">
            <Shirt n={m.Maglia} />
            <button type="button" className="press rounded-full px-4 py-[6px] text-[12px] font-extrabold leading-none" style={{ background: 'var(--accent)', color: '#fff' }} onClick={onProfile}>Profilo</button>
          </div>
        </div>
      </div>
      {tiles.length ? (
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          {tiles.map(([k, v, g]) => (
            <div key={k} className="min-w-0 rounded-lg px-2 py-1.5" style={{ background: 'var(--hair-2)' }}><Cell k={k} v={v} gold={g} /></div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Body({ player, onProfile, showStats }) {
  const team = teamById(player.teamId);
  const pid = useBioPid(player);
  const photo = (player && player.photo) || (pid ? playerFace(pid) : null);
  const car = usePlayerCareer(player);
  const hasStats = playerHasCurStats(player) || !!car.loading || car.rows.length > 0;
  const c0 = team && team.colors ? team.colors[0] : null;
  const tint = (pct) => (c0 ? `color-mix(in srgb, ${c0} ${pct}%, transparent)` : `color-mix(in srgb, var(--accent) ${pct}%, transparent)`);
  const inj = injuryOf(player.id);
  return (
    <>
      <div className="relative" style={{ backgroundImage: `radial-gradient(120% 120% at 0% 0%, ${tint(53)} 0%, transparent 62%), radial-gradient(90% 70% at 25% 85%, ${tint(45)} 0%, transparent 70%)`, borderBottom: `2px solid ${c0 || 'var(--accent)'}` }}>
        <Head player={player} team={team} photo={photo} onProfile={onProfile} />
      </div>
      {inj ? (
        <Alert tone="red" className="mx-4 mt-3" icon={<InjuryIcon size={20} />} title="Infortunato">{inj.reason}{inj.label ? ` · Rientro previsto: ${inj.label}` : ''}</Alert>
      ) : null}
      {hasStats && showStats ? (
        <div className="club-scope pt-2" style={{ '--club': c0 || 'var(--accent)', '--club-a': '16%' }}>
          <Scaled><StatistichePanel player={player} team={team} /></Scaled>
        </div>
      ) : null}
    </>
  );
}

export default function PlayerPanelHost() {
  const st = usePlayerPanel();
  const navigate = useNavigate();
  const loc = useLocation();
  const [shown, setShown] = useState(null); // id disegnato (resta durante la chiusura)
  const [ready, setReady] = useState(false); // giocatore costruito dall'archivio se serve
  const [showStats, setShowStats] = useState(false);
  const [bodyOn, setBodyOn] = useState(false); // contenuto montato solo a pannello fermo: lo scorrimento resta leggero
  const rootRef = useRef(null);
  const veilRef = useRef(null);
  const panelRef = useRef(null);
  const contentRef = useRef(null);
  const scrollRef = useRef(null);
  const tl = useRef(null);
  const phase = useRef('closed'); // 'open' da quando parte l'apertura fino alla fine della chiusura
  const [openKey, setOpenKey] = useState(0);
  const timers = useRef([]);
  const box = useScreenBox(!!shown);
  useModalLock(!!shown); // pagina sotto immobile, nessuno swipe di pagina con il pannello aperto

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  const later = (f, ms) => { timers.current.push(setTimeout(f, ms)); };
  const kill = () => { if (tl.current) tl.current.kill(); tl.current = null; gsap.killTweensOf([veilRef.current, panelRef.current, contentRef.current].filter(Boolean)); };

  // apertura / cambio giocatore / chiusura chiesta da fuori
  useEffect(() => {
    if (st) {
      clearTimers();
      resetSel(st.id); // aprendo da zero competizione e stagione ripartono da "Attuale"
      setShown(st.id);
      setOpenKey(st.t);
      setShowStats(false);
      if (phase.current === 'closed') setBodyOn(false);
      setReady(!(parseArchiveId(st.id) && needArchive(st.id)));
      return;
    }
    if (shown) animateClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st]);

  // giocatori dei campionati aggiunti / fuori dall'elenco: scheda costruita dall'archivio, come la pagina giocatore
  useEffect(() => {
    if (!shown || ready) return undefined;
    const arc = parseArchiveId(shown);
    let on = true;
    makeArchivePlayer(arc.fm, arc.sk, arc.pid).then(() => { if (on) setReady(true); }, () => { if (on) closePanel(); });
    return () => { on = false; };
  }, [shown, ready]);

  const player = shown && ready ? playerById(shown) : null;

  // entrata: pannello da destra e velo; a pannello fermo si monta il contenuto, che appare in dissolvenza, poi le Statistiche
  useLayoutEffect(() => {
    if (!player || !panelRef.current) return undefined;
    const rm = reduced();
    kill();
    clearTimers();
    // gia' aperto (altro giocatore, o riaperto mentre si chiudeva): si riparte dal punto in cui e' il pannello
    const open = phase.current === 'open';
    if (!open) {
      gsap.set(panelRef.current, { xPercent: 100, x: 0, force3D: true });
      gsap.set(veilRef.current, { opacity: 0 });
    }
    phase.current = 'open';
    gsap.set(contentRef.current, { opacity: 0 });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    const t = gsap.timeline();
    t.to(veilRef.current, { opacity: VEIL, duration: rm ? 0 : DUR, ease: EASE }, 0);
    t.to(panelRef.current, { xPercent: 0, x: 0, duration: rm ? 0 : DUR, ease: EASE, force3D: true }, 0);
    if (open) setBodyOn(true);
    else t.call(() => setBodyOn(true), null, rm ? 0 : DUR);
    tl.current = t;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player && player.id, openKey]);

  // contenuto (foto, Informazioni, Profilo) in dissolvenza appena montato; poi si montano le Statistiche
  useLayoutEffect(() => {
    if (!bodyOn || !player || !contentRef.current) return;
    gsap.fromTo(contentRef.current, { opacity: 0 }, { opacity: 1, duration: reduced() ? 0 : FADE, ease: EASE, overwrite: 'auto', onComplete: () => setShowStats(true) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyOn, player && player.id, openKey]);

  // le Statistiche appaiono in dissolvenza anche loro
  useEffect(() => {
    if (!showStats || !contentRef.current) return;
    const el = contentRef.current.querySelector('.club-scope');
    if (el) gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: reduced() ? 0 : FADE, ease: EASE });
  }, [showStats]);

  const finish = () => {
    clearTimers();
    kill();
    phase.current = 'closed';
    setBodyOn(false);
    setShown(null);
    setReady(false);
    setShowStats(false);
  };

  // chiusura: prima sparisce il contenuto, poi il pannello torna a destra (dallo swipe: subito dal punto in cui e' il dito)
  function animateClose(fromSwipe = false) {
    if (!panelRef.current) { finish(); return; }
    const rm = reduced();
    kill();
    const t = gsap.timeline({ onComplete: finish });
    if (!fromSwipe) t.to(contentRef.current, { opacity: 0, duration: rm ? 0 : FADE, ease: EASE });
    const w = panelRef.current.offsetWidth || 1;
    const x = Number(gsap.getProperty(panelRef.current, 'x')) || 0;
    const d = rm ? 0 : fromSwipe ? Math.max(0.2, DUR * (1 - x / w)) : DUR;
    t.to(panelRef.current, { x: 0, xPercent: 100, duration: d, ease: fromSwipe ? 'power2.out' : EASE, force3D: true }, fromSwipe ? 0 : '>');
    t.to(veilRef.current, { opacity: 0, duration: d, ease: fromSwipe ? 'power2.out' : EASE }, '<');
    tl.current = t;
    // rete di sicurezza: se la WebView sospende le animazioni il pannello non resta a meta'
    later(finish, (d + FADE) * 1000 + 600);
  }

  const close = () => { closePanel(); };

  // cambio pagina (tasto Profilo, indietro): il pannello sparisce subito
  const path = loc.pathname;
  const firstPath = useRef(path);
  useEffect(() => {
    if (firstPath.current === path) return;
    firstPath.current = path;
    if (shown) { closePanel(); finish(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  const toProfile = () => {
    const id = shown;
    closePanel();
    finish();
    navigate(`/giocatore/${id}`);
  };

  // pagina sotto ferma (iPhone: anche overflow sul body)
  useEffect(() => {
    if (!shown) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev === 'hidden' ? '' : prev; };
  }, [!!shown]);

  // pulizia
  useEffect(() => () => { clearTimers(); kill(); }, []);

  // swipe verso destra per chiudere: il pannello segue il dito
  useEffect(() => {
    const root = rootRef.current;
    const panel = panelRef.current;
    if (!root || !panel || !player) return undefined;
    let s = null;
    const onStart = (e) => {
      finishCarousel();
      if (e.touches.length !== 1) { s = null; return; }
      const tg = e.target;
      s = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now(), axis: null, noH: !!(tg.closest && tg.closest('[data-pop-scroll], [role="listbox"]')) || hScrolled(tg, panel), dx: 0 };
    };
    const onMove = (e) => {
      if (e.touches.length > 1) { if (e.cancelable) e.preventDefault(); s = null; return; } // niente zoom con due dita
      if (!s) return;
      const dx = e.touches[0].clientX - s.x;
      const dy = e.touches[0].clientY - s.y;
      if (!s.axis) {
        if (Math.abs(dx) < 9 && Math.abs(dy) < 9) return;
        s.axis = !s.noH && dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
        if (s.axis === 'x') kill();
      }
      if (s.axis !== 'x') return;
      if (e.cancelable) e.preventDefault();
      s.dx = Math.max(0, dx);
      const w = panel.offsetWidth || 1;
      gsap.set(panel, { x: s.dx, xPercent: 0, force3D: true });
      gsap.set(veilRef.current, { opacity: VEIL * Math.max(0, 1 - s.dx / w) });
    };
    const onEnd = () => {
      const d = s;
      s = null;
      if (!d || d.axis !== 'x') return;
      const w = panel.offsetWidth || 1;
      const v = d.dx / Math.max(60, Date.now() - d.t);
      if (d.dx > w * 0.3 || v > 0.5) { closePanel(); animateClose(true); return; }
      gsap.to(panel, { x: 0, duration: 0.28, ease: 'power2.out', force3D: true });
      gsap.to(veilRef.current, { opacity: VEIL, duration: 0.28, ease: 'power2.out' });
    };
    // sul velo nessun trascinamento muove la pagina sotto (React registra i tocchi come passivi: serve un ascoltatore vero)
    const veil = veilRef.current;
    const stop = (e) => { if (e.cancelable) e.preventDefault(); };
    if (veil) veil.addEventListener('touchmove', stop, { passive: false });
    panel.addEventListener('touchstart', onStart, { passive: true });
    panel.addEventListener('touchmove', onMove, { passive: false });
    panel.addEventListener('touchend', onEnd, { passive: true });
    panel.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      if (veil) veil.removeEventListener('touchmove', stop);
      panel.removeEventListener('touchstart', onStart);
      panel.removeEventListener('touchmove', onMove);
      panel.removeEventListener('touchend', onEnd);
      panel.removeEventListener('touchcancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player && player.id]);

  if (!shown) return null;
  return createPortal(
    <div ref={rootRef} data-no-back="1" role="dialog" aria-modal="true" aria-label={player ? player.name : 'Giocatore'} className="fixed inset-x-0 z-[81]" style={box ? { top: box.t, height: box.h } : { top: 0, bottom: 0 }}>
      <div ref={veilRef} aria-hidden="true" className="absolute inset-0" style={{ background: '#000', opacity: 0, touchAction: 'none' }} onClick={close} />
      <div className="pointer-events-none relative mx-auto h-full w-full max-w-[var(--app-w)] overflow-hidden">
        <div
          ref={panelRef}
          className="pointer-events-auto absolute inset-y-0 right-0 flex flex-col overflow-hidden"
          style={{ width: WIDTH, background: 'var(--sky-2)', borderLeft: '1px solid var(--glass-border)', boxShadow: '-18px 0 50px rgba(0,0,0,.35)', touchAction: 'pan-y', transform: 'translate3d(100%,0,0)', willChange: 'transform' }}
        >
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
            <div ref={contentRef} style={{ opacity: 0 }}>
              {player && bodyOn ? <Body player={player} onProfile={toProfile} showStats={showStats} /> : null}
              <div style={{ height: 'max(24px, env(safe-area-inset-bottom))' }} />
            </div>
          </div>
          <button type="button" onClick={close} aria-label="Chiudi" className="press absolute right-3 flex h-9 w-9 items-center justify-center rounded-full" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)', background: 'color-mix(in srgb, var(--sky-2) 82%, transparent)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid var(--glass-border)', color: 'var(--ink)' }}>
            <X size={17} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

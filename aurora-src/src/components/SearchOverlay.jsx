import PlayerPhoto from '@/components/PlayerPhoto';
import { useModalLock } from '@/lib/modal';
import { teamGrad } from '@/lib/tint';
import { searchAll, matchSpan, norm } from '@/lib/search';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import Crest from './Crest';
import FlagDot from './FlagDot';
import ClubNatLine from './ClubNatLine';
import { countryIt } from '@/data/carriere';
import LeagueBadge from './LeagueBadge';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';

const ring = (t) => (t && t.colors && t.colors[0]) || 'var(--hair)';

export function PlayerFace({ p, size }) {
  const t = teamById(p.teamId);
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span className="block h-full w-full overflow-hidden rounded-full" style={{ background: t ? `linear-gradient(150deg, ${t.colors[0]}, ${t.colors[1]})` : 'var(--hair)', boxShadow: `0 0 0 2px ${ring(t)}` }}>
        <PlayerPhoto src={p.photo} alt="" />
      </span>
    </span>
  );
}

// Banner giocatore della ricerca: riga nel colore della squadra, volto, nome, stemma e squadra. `compact` = versione piccola della tendina.
export function PlayerBanner({ p, onClick, compact = false, q = '' }) {
  const t = teamById((p.nat && p.club ? p.club : p).teamId);
  return (
    <button type="button" onClick={onClick} className={`glass press flex w-full items-center text-left ${compact ? 'gap-2.5 rounded-[14px] px-2.5 py-[7px]' : 'gap-3.5 rounded-[20px] px-4 py-3'}`} style={{ background: teamGrad(t, compact ? 0x66 : 0x55) }}>
      <PlayerFace p={p} size={compact ? 36 : 52} />
      <span className="min-w-0">
        <span className={`block truncate font-extrabold ${compact ? 'text-[14.5px]' : 'text-[16px]'}`} style={{ color: 'var(--ink)' }}><Hl text={p.name} q={q} /></span>
        {/* un solo banner per giocatore: stemma e club, poi (linea sottile) bandiera e nazionale */}
        <ClubNatLine p={p} className={`text-[12px] ${compact ? 'mt-px' : 'mt-0.5'}`} />
      </span>
    </button>
  );
}

// Squadra nella ricerca: stesso banner colorato dei giocatori (colore sociale, stemma, nome, campionato)
export function TeamBanner({ t, onClick, q = '' }) {
  const l = leagueById(t.leagueId);
  const c = countryOf(t);
  return (
    <button type="button" onClick={onClick} className="glass press flex w-full items-center gap-2.5 rounded-[14px] px-2.5 py-[7px] text-left" style={{ background: teamGrad(t, 0x66) }}>
      <span className="grid h-9 w-9 shrink-0 place-items-center"><Crest team={t} size={30} /></span>
      <span className="min-w-0">
        <span className="block truncate text-[14.5px] font-extrabold" style={{ color: 'var(--ink)' }}><Hl text={t.name} q={q} /></span>
        <span className="mt-px flex min-w-0 items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink-2)' }}>
          {l ? <LeagueBadge league={l} size={14} /> : null}
          <span className="truncate">{c}{c && l ? ' · ' : ''}{l ? l.name : ''}</span>
        </span>
      </span>
    </button>
  );
}

// parte del nome che corrisponde a quanto scritto, evidenziata (concept "Smart Tag Input")
export function Hl({ text, q }) {
  const sp = q ? matchSpan(text, q) : null;
  if (!sp) return text;
  return <>{text.slice(0, sp[0])}<b style={{ color: 'var(--accent)', fontWeight: 800 }}>{text.slice(sp[0], sp[1])}</b>{text.slice(sp[1])}</>;
}

const countryOf = (t) => {
  const l = leagueById(t.leagueId);
  return l ? l.country : '';
};

const EASE = [0.22, 1, 0.36, 1];
const BAR = 52;

// Ricerca a tendina: la barra si allarga in un pannello unico in cima allo schermo e i risultati scendono a cascata.
// Si chiude toccando fuori, con X / ESC o scegliendo un risultato; la pagina sotto non si muove.
export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (open) {
      setQ('');
      setDq('');
      const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [open]);
  // filtro con debounce (~200 ms)
  useEffect(() => {
    const id = setTimeout(() => setDq(q), 200);
    return () => clearTimeout(id);
  }, [q]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useModalLock(!!open);
  // altezza visibile (sopra la tastiera): il pannello arriva al massimo fino alla tastiera e scorre al suo interno
  const [vh, setVh] = useState(() => (typeof window !== 'undefined' ? (window.visualViewport ? window.visualViewport.height : window.innerHeight) : 800));
  useEffect(() => {
    if (!open) return undefined;
    const vv = window.visualViewport;
    const f = () => setVh(vv ? vv.height : window.innerHeight);
    f();
    if (vv) { vv.addEventListener('resize', f); vv.addEventListener('scroll', f); }
    window.addEventListener('resize', f);
    return () => { if (vv) { vv.removeEventListener('resize', f); vv.removeEventListener('scroll', f); } window.removeEventListener('resize', f); };
  }, [open]);
  const hideKb = () => { const el = inputRef.current; if (el && document.activeElement === el) el.blur(); };

  const { needle, leagues, teams, players, referees, fuzzy } = useMemo(() => searchAll(dq), [dq]);
  // suggerimento mentre si scrive: completamento in grigio del primo nome che inizia con il testo (tocco = accetta)
  const ghost = useMemo(() => {
    const t = q.trimStart();
    if (!t || t !== dq.trimStart()) return '';
    const nq = norm(t);
    const top = [...players, ...teams, ...leagues].find((o) => norm(o.name).startsWith(nq));
    return top && top.name.length > t.length ? top.name.slice(t.length) : '';
  }, [q, dq, players, teams, leagues]);
  const any = leagues.length + teams.length + players.length + referees.length > 0;

  const go = (path) => {
    onClose();
    navigate(path);
  };

  // entrata a cascata: ogni voce nuova scende dal basso con un piccolo ritardo (le voci gia' presenti non si ridisegnano)
  let n = 0;
  const anim = () => {
    const i = n++;
    return reduce ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay: 0.06 + Math.min(i, 10) * 0.045, ease: EASE } };
  };
  const section = (title, body) => (
    <div className="pt-2">
      <motion.p key={`t-${title}`} {...anim()} className="label-sm px-2 pb-1.5 pt-1">{title}</motion.p>
      {body}
    </div>
  );
  const row = (key, onClick, children) => (
    <motion.button key={key} {...anim()} type="button" onClick={onClick} className="flex w-full items-center gap-3 px-2 py-2 text-left active:opacity-50">
      {children}
    </motion.button>
  );

  return (
    <AnimatePresence>
      {open ? (
        <div key="srch" className="fixed inset-0 z-[220]" role="dialog" aria-modal="true" aria-label="Cerca">
          <motion.div
            className="absolute inset-0"
            style={{ background: 'var(--scrim)', touchAction: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.26 }}
            onClick={onClose}
          />
          <motion.div
            className="halo-card ring-def absolute left-0 right-0 mx-auto overflow-hidden rounded-[26px]"
            style={{ top: 'calc(env(safe-area-inset-top) + 6px)', width: 'calc(min(100%, var(--app-w, 100%)) - 24px)', background: 'var(--sky-2)', border: '1px solid var(--hair)', boxShadow: '0 24px 60px var(--scrim)' }}
            initial={reduce ? { opacity: 0 } : { clipPath: `inset(0px 0px calc(100% - ${BAR}px) 0px round 26px)`, opacity: 0.4 }}
            animate={reduce ? { opacity: 1 } : { clipPath: 'inset(0px 0px 0% 0px round 26px)', opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.18 } }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="glow-line flex items-center gap-2.5 pl-4 pr-2" style={{ height: BAR, borderBottom: needle && any ? '1px solid var(--hair)' : '1px solid transparent', touchAction: 'none' }}>
              <Search size={18} strokeWidth={2} className="shrink-0" style={{ color: 'var(--accent)' }} />
              <span className="relative flex min-w-0 flex-1">
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre text-[17px]" style={{ lineHeight: '24px', top: 0 }}>
                  <span style={{ visibility: 'hidden' }}>{q}</span><span style={{ color: 'var(--ink-3)', opacity: 0.6 }}>{ghost}</span>
                </span>
                <input
                  ref={inputRef}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => { if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghost) { e.preventDefault(); setQ(q + ghost); } }}
                  placeholder="Cerca giocatori, squadre…"
                  enterKeyHint="search"
                  className="relative min-w-0 flex-1 bg-transparent text-[17px] outline-none"
                  style={{ color: 'var(--ink)', lineHeight: '24px' }}
                />
                {ghost ? <button type="button" aria-label={`Completa: ${q}${ghost}`} onClick={() => { setQ(q + ghost); inputRef.current && inputRef.current.focus(); }} className="absolute inset-y-0 right-0 w-1/2" /> : null}
              </span>
              <button type="button" className="glass lglass press flex h-9 w-9 shrink-0 items-center justify-center rounded-full" aria-label="Chiudi" onClick={onClose}>
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            {needle && any ? (
              <div className="hide-sb overflow-y-auto px-2.5 pb-2.5" style={{ maxHeight: `calc(${Math.round(vh)}px - env(safe-area-inset-top) - ${BAR + 18}px)`, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }} onScroll={hideKb} onTouchMove={hideKb} onTouchStart={(e) => { if (!e.target.closest('button')) hideKb(); }}>
                {fuzzy ? (
                  <motion.p key="fz" {...anim()} className="px-2 pt-2.5 text-[12px]" style={{ color: 'var(--ink-3)' }}>
                    Risultati simili a «<span style={{ color: 'var(--ink-2)' }}>{dq.trim()}</span>»
                  </motion.p>
                ) : null}
                {leagues.length ? section('Campionati', <>
                  {leagues.map((l) => row(`l-${l.id}`, () => go(`/campionato/${l.id}`), <>
                    <LeagueBadge league={l} size={26} />
                    <span className="min-w-0 flex-1 truncate text-[14.5px]" style={{ color: 'var(--ink)' }}><Hl text={l.name} q={dq} /></span>
                    {l.country ? <span className="shrink-0 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{l.country}</span> : null}
                  </>))}
                  {row('l-all', () => go('/competizioni'), <span className="text-[13.5px] font-bold" style={{ color: 'var(--accent)' }}>Tutte le competizioni per paese</span>)}
                </>) : null}
                {teams.length ? section('Squadre', teams.map((t) => (
                  <motion.div key={`t-${t.id}`} {...anim()} className="pb-1.5">
                    <TeamBanner t={t} q={dq} onClick={() => go(`/squadra/${t.id}`)} />
                  </motion.div>
                ))) : null}
                {players.length ? section('Giocatori', players.map((p) => (
                  <motion.div key={`p-${p.id}`} {...anim()} className="pb-1.5">
                    <PlayerBanner p={p} compact q={dq} onClick={() => go(`/giocatore/${p.id}`)} />
                  </motion.div>
                ))) : null}
                {referees.length ? section('Arbitri', referees.map((x) => row(`r-${x.id}`, () => go(`/arbitro/${x.id}`), <>
                  <span className="avatar h-[26px] w-[26px] text-[10px]">{x.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                  <span className="truncate text-[14.5px]" style={{ color: 'var(--ink)' }}><Hl text={x.name} q={dq} /></span>
                </>))) : null}
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

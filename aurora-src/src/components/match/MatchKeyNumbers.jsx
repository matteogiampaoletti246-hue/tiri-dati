import { useEffect, useMemo, useRef, useState } from 'react';
import PlayerPhoto from '@/components/PlayerPhoto';
import useAsync from '@/hooks/useAsync';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { matchKeyNumbers } from '@/data/extras';
import { matchKeyPlayers } from '@/data/keyPlayers';
import { comma } from '@/lib/format';
import { cn } from '@/lib/utils';

const DUR = 5500; // durata di una scheda
const HOLD_MS = 180; // tenuto premuto oltre questo = pausa, non tocco
const SWIPE_PX = 40;

// Numeri da tenere d'occhio, stile storie (concept C): barrette in alto, avanzamento automatico, tocco a destra/sinistra,
// tenuto premuto = pausa, swipe di lato. Schede di squadra con lo stemma sfocato di sfondo, schede giocatore col volto.
// La barretta si muove con un requestAnimationFrame che scrive solo il suo transform (nessun nuovo disegno della pagina);
// fermo quando il riquadro non si vede, l'app e' in background o il telefono chiede meno animazioni.
export default function MatchKeyNumbers({ match }) {
  const teamCards = matchKeyNumbers(match);
  const { data: playerCards } = useAsync(() => matchKeyPlayers(match), [match]);
  const cards = useMemo(() => {
    const ref = teamCards.filter((c) => c.side === 'ref');
    const T = teamCards.filter((c) => c.side !== 'ref');
    const P = [...(playerCards || [])];
    const out = [];
    while (T.length || P.length) { if (T.length) out.push(T.shift()); if (P.length) out.push(P.shift()); }
    return [...out, ...ref];
  }, [teamCards, playerCards]);
  const n = cards.length;
  if (!n) return null;
  return (
    <section>
      <h3 className="px-5 pb-2 text-[12.5px] font-extrabold uppercase tracking-wider">Numeri da tenere d&apos;occhio</h3>
      <Story match={match} cards={cards} />
    </section>
  );
}

function Story({ match, cards }) {
  const n = cards.length;
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);
  const league = leagueById(match.leagueId);
  const [idx, setIdx] = useState(0);
  const [prev, setPrev] = useState(-1);
  const boxRef = useRef(null);
  const fillRefs = useRef([]);
  const st = useRef({ acc: 0, held: false, visible: true, raf: 0, last: 0, down: null, holdT: 0, reduce: false, idx: 0, n });
  st.current.n = n;
  st.current.idx = idx;

  const go = (i) => {
    const s = st.current;
    const next = ((i % s.n) + s.n) % s.n;
    s.acc = 0;
    setPrev(s.idx);
    setIdx(next);
  };
  const goRef = useRef(go);
  goRef.current = go;

  // nuove schede (giocatori arrivati dopo): si resta sulla scheda corrente se c'e' ancora
  useEffect(() => { if (idx >= n) { st.current.acc = 0; setIdx(0); } }, [n, idx]);

  // barrette: le precedenti piene, le successive vuote; la corrente la muove il ciclo qui sotto
  useEffect(() => {
    fillRefs.current.forEach((f, j) => { if (f) f.style.transform = `scaleX(${j < idx || (st.current.reduce && j === idx) ? 1 : 0})`; });
  }, [idx, n]);

  // la scheda che esce resta visibile solo per la dissolvenza, poi non si disegna piu'
  useEffect(() => {
    if (prev < 0) return undefined;
    const t = setTimeout(() => setPrev(-1), 420);
    return () => clearTimeout(t);
  }, [prev, idx]);

  useEffect(() => {
    const s = st.current;
    const el = boxRef.current;
    const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    s.reduce = !!(mq && mq.matches);
    const playing = () => !s.held && s.visible && !document.hidden && !s.reduce;
    const tick = (now) => {
      s.raf = 0;
      if (!playing()) return;
      s.acc += Math.min(500, now - (s.last || now)); // limite: un frame lento non fa saltare la scheda
      s.last = now;
      if (s.acc >= DUR) { goRef.current(s.idx + 1); s.acc = 0; }
      const f = fillRefs.current[s.idx];
      if (f) f.style.transform = `scaleX(${Math.min(1, s.acc / DUR)})`;
      s.raf = requestAnimationFrame(tick);
    };
    const kick = () => { if (!s.raf && playing()) { s.last = 0; s.raf = requestAnimationFrame(tick); } };
    s.kick = kick;
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; kick(); }, { threshold: 0.35 });
    if (el) io.observe(el);
    const vis = () => kick();
    const onMq = () => { s.reduce = !!(mq && mq.matches); kick(); };
    document.addEventListener('visibilitychange', vis);
    if (mq && mq.addEventListener) mq.addEventListener('change', onMq);
    kick();
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
      if (mq && mq.removeEventListener) mq.removeEventListener('change', onMq);
      if (s.raf) cancelAnimationFrame(s.raf);
      s.raf = 0;
      clearTimeout(s.holdT);
    };
  }, []);

  const setHeld = (v) => {
    const s = st.current;
    s.held = v;
    if (boxRef.current) boxRef.current.classList.toggle('km-hold', v);
    if (!v && s.kick) s.kick();
  };
  const cur = () => boxRef.current && boxRef.current.querySelector('.km-slide.on');

  const onDown = (e) => {
    const s = st.current;
    s.down = { x: e.clientX, y: e.clientY, t: performance.now(), drag: false };
    clearTimeout(s.holdT);
    s.holdT = setTimeout(() => setHeld(true), HOLD_MS);
  };
  const onMove = (e) => {
    const d = st.current.down;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.drag && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - d.y)) { d.drag = true; clearTimeout(st.current.holdT); setHeld(true); }
    if (d.drag) { const c = cur(); if (c) { c.style.transition = 'none'; c.style.transform = `translate3d(${dx * 0.35}px,0,0)`; } }
  };
  const reset = () => { const c = cur(); if (c) { c.style.transition = ''; c.style.transform = ''; } };
  const onUp = (e) => {
    const s = st.current;
    const d = s.down;
    s.down = null;
    clearTimeout(s.holdT);
    const wasHeld = s.held;
    reset();
    setHeld(false);
    if (!d) return;
    const dx = e.clientX - d.x;
    if (d.drag) { if (Math.abs(dx) > SWIPE_PX) go(dx < 0 ? s.idx + 1 : s.idx - 1); return; }
    if (wasHeld && performance.now() - d.t > HOLD_MS) return; // tenuto premuto = solo pausa
    const r = e.currentTarget.getBoundingClientRect();
    go(e.clientX - r.left < r.width / 3 ? s.idx - 1 : s.idx + 1);
  };
  const onCancel = () => { const s = st.current; s.down = null; clearTimeout(s.holdT); reset(); setHeld(false); };

  return (
    <div className="px-5">
      <div
        ref={boxRef}
        className="km-story"
        data-no-swipe
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onContextMenu={(e) => e.preventDefault()}
        role="group"
        aria-roledescription="carosello"
        aria-label="Numeri da tenere d'occhio"
      >
        <div className="km-bars" aria-hidden="true">
          {cards.map((c, j) => (
            <i key={`b-${j}`}><b ref={(r) => { fillRefs.current[j] = r; }} /></i>
          ))}
        </div>
        <span className="km-paused" aria-hidden="true">PAUSA</span>
        {cards.map((c, j) => {
          const team = c.side === 'home' ? home : c.side === 'away' ? away : null;
          const shown = j === idx || j === prev;
          return (
            <div
              key={`${c.kind || 'team'}-${c.side}-${c.pid || j}`}
              className={cn('km-slide', j === idx && 'on')}
              style={{ visibility: shown ? 'visible' : 'hidden', ...colorsVar(team, league) }}
              aria-hidden={j !== idx}
            >
              {c.kind === 'player' ? <PlayerSlide card={c} team={team} /> : <TeamSlide card={c} team={team} league={league} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const colorsVar = (team, league) => {
  const c = (team && team.colors) || (league && league.colors) || [];
  return { '--km-c1': c[0] || 'var(--story-base)', '--km-c2': c[1] || c[0] || 'var(--story-base)' };
};

const artOf = (team, league) => (team ? team.crest : league ? league.logo : null) || null;

function Who({ src, children }) {
  return (
    <span className="km-who">
      {src ? <img src={src} alt="" width={20} height={20} decoding="async" /> : null}
      {children}
    </span>
  );
}

function TeamSlide({ card, team, league }) {
  const art = artOf(team, league);
  const who = team ? team.name : league ? league.name : '';
  return (
    <>
      {art ? <img className="km-blur" src={art} alt="" decoding="async" /> : null}
      {art ? <img className="km-bigcrest" src={art} alt="" decoding="async" /> : null}
      <span className="km-scrim" />
      <div className="km-in">
        {who ? <Who src={art}>{who}</Who> : null}
        <span className="km-val tnum">{comma(card.value, card.digits)}{card.unit || ''}</span>
        <span className="km-lab">{card.label}</span>
        {card.note ? <div className="km-row"><span className="km-pill">{card.note}</span></div> : null}
      </div>
    </>
  );
}

function PlayerSlide({ card, team }) {
  const art = team ? team.crest : null;
  return (
    <>
      {art ? <img className="km-blur" src={art} alt="" decoding="async" /> : null}
      <span className="km-ghost tnum" aria-hidden="true">{card.rank}°</span>
      <span className="km-face"><PlayerPhoto src={card.photo} alt={card.name} /></span>
      <span className="km-scrim" />
      <div className="km-in">
        <Who src={art}>{card.stat} ogni 90&apos;</Who>
        <span className="km-name">{card.name}</span>
        <span className="km-val tnum">{comma(card.p90, 2)}</span>
        {card.tot != null ? <span className="km-lab tnum">{card.tot} {card.unit} in totale</span> : null}
        <div className="km-row">
          <span className="km-pill">{card.rank}° in {card.comp}</span>
          {card.also.length ? <span className="km-sub">anche {card.also.map((a) => `${a.rank}° ${a.label.toLowerCase()}`).join(', ')}</span> : null}
        </div>
      </div>
    </>
  );
}

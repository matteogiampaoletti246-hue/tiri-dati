import { useSel } from '@/components/past/PastBits';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAsync from '@/hooks/useAsync';
import useArchFresh from '@/hooks/useArchFresh';
import { useTeamColors } from '@/components/archive/parts';
import { teamLogo } from '@/data/archive';
import { loadBracket, peekBracket, CUP_NAME } from '@/data/bracket';
import { teamByName } from '@/data/teams';
import { LEAGUES, leagueTint } from '@/data/leagues';
import { FM_ID } from '@/data/archive';

// Tabellone: due fasi per schermata, le pillole delle fasi fanno scorrere il tabellone da un lato all'altro.
// Le posizioni sono calcolate a ogni fotogramma (niente componenti ricreati): si muovono solo i transform.
const H = 62; const U = 74; const X0 = 16; const GAP = 18; const POSTER_H = 250;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const eIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - ((-2 * x + 2) ** 3) / 2);

const sigla = (name) => {
  const t = teamByName(name);
  if (t && t.initials) return String(t.initials).toUpperCase();
  return String(name || '?').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z ]/g, '').split(/\s+/)[0].slice(0, 3).toUpperCase();
};
const lgFor = (fm) => { const e = Object.entries(FM_ID).find(([, v]) => Number(v) === Number(fm)); return e ? LEAGUES.find((l) => l.id === e[0]) : null; };

const legsText = (t) => {
  const s = t.legs.filter((l) => l.score).map((l) => {
    const sc = l.h === t.a ? l.score : [l.score[1], l.score[0]];
    return `${sc[0]}–${sc[1]}`;
  });
  if (t.pen) s.push(`rig. ${t.pen[0]}–${t.pen[1]}`);
  return t.legs.length > 1 || t.pen ? s.join(' · ') : '';
};

// Concept B: il lato passato e' luminoso con una barretta dorata, quello eliminato e' piu' piccolo, spento e quasi senza colore
function Side({ id, name, state }) {
  const win = state === 'win'; const lose = state === 'lose';
  const z = win ? 30 : lose ? 24 : 28;
  return (
    <div className="flex w-[44px] flex-col items-center gap-[2px]">
      <img src={teamLogo(id)} alt="" width={z} height={z} decoding="async" style={{ width: z, height: z, opacity: lose ? 0.42 : 1, filter: lose ? 'grayscale(.6)' : 'none' }} className="object-contain" />
      <b className="text-[9px] tracking-[.08em]" style={{ opacity: lose ? 0.4 : 1 }}>{sigla(name)}</b>
      <i className="block h-[3px] w-[22px] rounded-full" style={{ background: win ? '#ffd66b' : 'transparent', boxShadow: win ? '0 0 8px #ffd66b88' : 'none' }} />
    </div>
  );
}

function Tie({ t, names, col, w }) {
  const na = names[t.a] || '—'; const nb = names[t.b] || '—';
  const ca = col(t.a, na).colors[0]; const cb = col(t.b, nb).colors[0];
  const done = t.played;
  const sa = t.win === 'a' ? 'win' : t.win === 'b' ? 'lose' : 'even';
  const sb = t.win === 'b' ? 'win' : t.win === 'a' ? 'lose' : 'even';
  const ga = sa === 'lose' ? '44' : 'cc'; const gb = sb === 'lose' ? '44' : 'cc';
  return (
    <div
      className="flex h-full items-center justify-between rounded-[22px] px-2"
      style={{ width: w, background: `radial-gradient(90px 60px at 0% 50%, ${ca}${ga}, transparent), radial-gradient(90px 60px at 100% 50%, ${cb}${gb}, transparent), var(--panel-solid, #0b1426)`, border: '1px solid var(--hair)', color: 'var(--ink)' }}
    >
      <Side id={t.a} name={na} state={sa} />
      <div className="min-w-0 text-center">
        {done || t.legs.some((l) => l.score) ? (
          <div className="tnum text-[19px] font-extrabold tracking-[.02em]">
            <span style={{ opacity: sa === 'lose' ? 0.45 : 1 }}>{t.sa}</span><span style={{ opacity: 0.4 }}>–</span><span style={{ opacity: sb === 'lose' ? 0.45 : 1 }}>{t.sb}</span>
          </div>
        ) : (
          <div className="tnum text-[12px] font-bold" style={{ color: 'var(--ink-2)' }}>
            {new Date(t.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }).replace('.', '')}
          </div>
        )}
        <div className="tnum truncate text-[9.5px] font-bold" style={{ color: 'var(--ink-2)', maxWidth: 'calc(var(--cw) - 100px)' }}>{legsText(t)}</div>
      </div>
      <Side id={t.b} name={nb} state={sb} />
    </div>
  );
}

// finale: i colori e il logo della competizione, stemmi nitidi e risultato in primo piano
function Poster({ t, names, fm, tint, mid, name }) {
  const na = names[t.a] || '—'; const nb = names[t.b] || '—';
  const wn = t.win === 'a' ? na : t.win === 'b' ? nb : null;
  const done = t.played || t.legs.some((l) => l.score);
  const logo = `https://images.fotmob.com/image_resources/logo/leaguelogo/dark/${fm}.png`;
  return (
    <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: 30, background: `linear-gradient(180deg, ${tint} 0%, ${mid} 60%, #050912 100%)`, border: '1px solid rgba(255,255,255,.22)', color: '#fff' }}>
      <img src={logo} alt="" className="absolute left-1/2 top-1/2 w-[330px] -translate-x-1/2 -translate-y-1/2" style={{ opacity: 0.14 }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(255,255,255,.0), transparent 38%, transparent 62%, rgba(255,255,255,0))' }} />
      <div className="absolute inset-x-0 top-4 text-center text-[11px] font-extrabold uppercase tracking-[.16em]" style={{ color: 'rgba(255,255,255,.8)' }}>{name} · Finale</div>
      <div className="absolute inset-x-0 top-14 flex items-center justify-center gap-5">
        <span className="rounded-full p-[6px]" style={{ background: 'rgba(255,255,255,.1)', boxShadow: t.win === 'a' ? '0 0 0 2px #ffd66b, 0 0 30px #ffd66b55' : 'none' }}>
          <img src={teamLogo(t.a)} alt="" width={68} height={68} className="block object-contain" style={{ width: 68, height: 68, opacity: t.win === 'b' ? 0.85 : 1 }} />
        </span>
        <div className="tnum text-[42px] font-extrabold">{done ? <>{t.sa}<span className="mx-1.5 opacity-50">–</span>{t.sb}</> : <span className="text-[26px] opacity-70">vs</span>}</div>
        <span className="rounded-full p-[6px]" style={{ background: 'rgba(255,255,255,.1)', boxShadow: t.win === 'b' ? '0 0 0 2px #ffd66b, 0 0 30px #ffd66b55' : 'none' }}>
          <img src={teamLogo(t.b)} alt="" width={68} height={68} className="block object-contain" style={{ width: 68, height: 68, opacity: t.win === 'a' ? 0.85 : 1 }} />
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-[18px] px-4 text-center text-[12.5px] font-bold" style={{ color: '#d8e4ff' }}>
        {wn ? `🏆 ${wn} vince${t.pen ? ` ai rigori ${Math.max(...t.pen)}–${Math.min(...t.pen)}` : ''}` : done ? '' : new Date(t.date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Rome' })}
      </div>
    </div>
  );
}

function BracketView({ data, fm, sk }) {
  const nav = useNavigate();
  const col = useTeamColors();
  const { rounds, slots, names } = data;
  const L = rounds.length;
  const hasFinal = rounds[L - 1].key === 'final';
  const lg = lgFor(fm);
  const tint = leagueTint(lg ? lg.id : '');
  const mid = (lg && lg.colors && lg.colors[0]) || '#0A1C5E';
  const boxRef = useRef(null);
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const cardRefs = useRef({});
  const pillRefs = useRef([]);
  const indRef = useRef(null);
  const posterRef = useRef(null);
  const P = useRef(null);
  const raf = useRef(0);
  const rowRef = useRef(null);
  const dims = useRef({ cw: 170, step: 188 });
  // ordine verticale dei riquadri di ogni turno (per tenerli sempre ben distanziati, mai uno dentro l'altro)
  const ord = useMemo(() => rounds.map((r) => r.ties.map((_, i) => i).sort((a, b) => r.ties[a].cy - r.ties[b].cy)), [rounds]);

  const start = useMemo(() => {
    const open = rounds.findIndex((r) => r.ties.some((t) => !t.played));
    if (open >= 0) return Math.min(open, Math.max(0, L - 1));
    return Math.max(0, L - 3);
  }, [rounds, L]);
  const [saved, setSaved] = useSel(`lg-${fm}`, `ph-${sk}`, null);
  const first = saved != null && saved < L ? saved : start;
  const [active, setActive] = useState(first);
  if (P.current == null) P.current = first;

  const scale = useMemo(() => {
    const a = rounds.map((r) => 1 / Math.max(1, slots / r.ties.length));
    if (L > 1) a[L - 1] = a[L - 2];
    return a;
  }, [rounds, slots, L]);
  const SY = useCallback((p) => {
    const k = clamp(Math.floor(p), 0, L - 1);
    const n = Math.min(k + 1, L - 1);
    return scale[k] + (scale[n] - scale[k]) * clamp(p - k);
  }, [scale, L]);

  const draw = useCallback((p) => {
    const { cw, step } = dims.current;
    const sy = SY(p);
    const s = hasFinal ? clamp((p - (L - 1) + 0.45) / 0.45) : 0;
    const pos = {};
    let maxB = 0;
    const k0v = Math.floor(p);
    rounds.forEach((r, ri) => {
      let prev = -1e9;
      ord[ri].forEach((i) => {
        const t = r.ties[i];
        const x = X0 + (ri - p) * step; let y = 8 + t.cy * U * sy - H / 2;
        if (y < prev + H + 10) y = prev + H + 10; // distanza minima fra due riquadri dello stesso turno
        prev = y;
        pos[`${ri}-${i}`] = { x, y, t };
        if (ri >= k0v && ri <= k0v + 1 && !(hasFinal && ri === L - 1 && s > 0.5)) maxB = Math.max(maxB, y + H);
        const el = cardRefs.current[`${ri}-${i}`];
        if (!el) return;
        el.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
        el.style.opacity = hasFinal && ri === L - 1 ? String(1 - s) : '1';
        el.style.visibility = x < -cw - 4 || x > cw * 2 + 60 ? 'hidden' : 'visible';
      });
    });
    let d1 = ''; let d2 = '';
    rounds.forEach((r, ri) => {
      if (!ri) return;
      r.ties.forEach((t, i) => {
        const to = pos[`${ri}-${i}`];
        (t.kids || []).forEach((k) => {
          const fi = rounds[ri - 1].ties.indexOf(k); const f = pos[`${ri - 1}-${fi}`];
          if (!f) return;
          const x1 = f.x + cw; const y1 = f.y + H / 2; const x2 = to.x; const y2 = to.y + H / 2; const mx = (x1 + x2) / 2;
          const seg = `M${x1.toFixed(1)} ${y1.toFixed(1)}H${mx.toFixed(1)}V${y2.toFixed(1)}H${x2.toFixed(1)}`;
          if (hasFinal && ri === L - 1) d2 += seg; else d1 += seg;
        });
      });
    });
    const svg = svgRef.current;
    if (svg) {
      svg.children[0].setAttribute('d', d1);
      svg.children[1].setAttribute('d', d2);
      svg.children[1].style.opacity = String(1 - s);
    }
    const pf = posterRef.current;
    const fin = pos[`${L - 1}-0`];
    if (pf && fin && hasFinal) {
      const px = X0 + (L - 1 - p) * step; const py = fin.y + (14 - fin.y) * s;
      pf.style.transform = `translate3d(${px.toFixed(2)}px,${py.toFixed(2)}px,0)`;
      pf.style.opacity = String(s);
      pf.style.visibility = s <= 0.001 ? 'hidden' : 'visible';
    }
    const box = boxRef.current;
    if (box) box.style.height = `${Math.max(hasFinal ? POSTER_H + 40 : 200, Math.max(slots * U * sy, maxB) + 24)}px`;
    // indicatore delle pillole fasi
    const it = pillRefs.current; const ind = indRef.current;
    if (ind && it[0]) {
      const k0 = clamp(Math.floor(p), 0, L - 1); const k1 = clamp(k0 + 1, 0, L - 1); const f = p - k0;
      const a = it[k0]; const b = it[k1];
      if (a && b) {
        ind.style.width = `${a.offsetWidth + (b.offsetWidth - a.offsetWidth) * f}px`;
        ind.style.transform = `translate3d(${a.offsetLeft + (b.offsetLeft - a.offsetLeft) * f}px,0,0)`;
      }
    }
  }, [rounds, slots, L, SY, hasFinal, ord]);

  const measure = useCallback(() => {
    // se il tabellone e' ancora nascosto (display none) la larghezza si prende dal primo contenitore visibile: niente salto al primo disegno
    let w = 0; let n = wrapRef.current;
    while (n && !w) { w = n.clientWidth; n = n.parentElement; }
    w = w || 390;
    const cw = Math.max(120, (w - 2 * X0 - GAP) / 2);
    dims.current = { cw, step: cw + GAP };
    const wr = wrapRef.current;
    if (wr) { wr.style.setProperty('--cw', `${cw}px`); wr.style.setProperty('--pw', `${w - 2 * X0}px`); }
    draw(P.current);
  }, [draw]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const go = (to) => {
    setActive(to);
    setSaved(to);
    cancelAnimationFrame(raf.current);
    const from = P.current;
    if (from === to) return;
    const dur = 750 + 100 * (Math.abs(to - from) - 1 > 0 ? Math.abs(to - from) - 1 : 0);
    const t0 = performance.now();
    const row = rowRef.current; const sc0 = row ? row.scrollLeft : 0; const sc1 = rowTarget(to);
    // livelli separati solo durante il passaggio tra fasi: da fermo (e nello swipe tra schede) un solo livello, non decine
    const layer = (v) => { Object.values(cardRefs.current).forEach((el) => { if (el) el.style.willChange = v; }); if (posterRef.current) posterRef.current.style.willChange = v; };
    layer('transform');
    const step = (now) => {
      const k = clamp((now - t0) / dur);
      P.current = from + (to - from) * eIO(k);
      draw(P.current);
      if (row) row.scrollLeft = sc0 + (sc1 - sc0) * eIO(k);
      if (k < 1) raf.current = requestAnimationFrame(step); else { P.current = to; draw(to); layer(''); }
    };
    raf.current = requestAnimationFrame(step);
  };

  // la riga di pillole scorre col dito; la pillola del turno scelto viene portata al centro da sola, piano piano
  const rowTarget = (p) => {
    const row = rowRef.current; if (!row) return 0;
    const k0 = clamp(Math.floor(p), 0, L - 1); const k1 = clamp(k0 + 1, 0, L - 1); const f = p - k0;
    const c = (i) => { const e = pillRefs.current[i]; return e ? e.offsetLeft + e.offsetWidth / 2 : 0; };
    const ctr = c(k0) + (c(k1) - c(k0)) * f;
    return clamp(ctr - row.clientWidth / 2, 0, Math.max(0, row.scrollWidth - row.clientWidth));
  };
  useLayoutEffect(() => { const row = rowRef.current; if (row) row.scrollLeft = rowTarget(P.current); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = (t) => {
    const l = [...t.legs].reverse().find((x) => x.score) || t.legs[t.legs.length - 1];
    if (l) nav(`/match/a-${fm}-${sk}-${l.mid}`);
  };

  return (
    <div ref={wrapRef} className="relative overflow-x-clip pb-6">
      <div ref={rowRef} data-no-back className="hide-sb relative mx-4 mt-3 flex items-center gap-1.5 overflow-x-auto" style={{ overflowY: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' }}>
        <span ref={indRef} aria-hidden="true" className="absolute left-0 top-0 h-full rounded-full" style={{ background: 'var(--accent)', willChange: 'transform' }} />
        {rounds.map((r, i) => (
          <button key={r.key} ref={(el) => { pillRefs.current[i] = el; }} type="button" onClick={() => go(i)} className="press relative shrink-0 rounded-full px-[13px] py-2 text-[12.5px] font-extrabold" style={{ color: active === i ? '#fff' : 'var(--ink-3)', transition: 'color .25s ease' }}>
            {r.label}
          </button>
        ))}
      </div>
      <div ref={boxRef} className="relative mt-3 overflow-hidden" style={{ minHeight: POSTER_H + 40 }}>
        <svg ref={svgRef} className="pointer-events-none absolute left-0 top-0" width="100%" height="100%" style={{ overflow: 'visible' }}>
          <path fill="none" stroke="var(--hair)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path fill="none" stroke="var(--hair)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {rounds.map((r, ri) => r.ties.map((t, i) => (
          <div
            key={`${ri}-${i}`}
            ref={(el) => { cardRefs.current[`${ri}-${i}`] = el; }}
            role="button"
            tabIndex={0}
            onClick={() => open(t)}
            className="press absolute left-0 top-0"
            style={{ width: 'var(--cw)', height: H, contain: 'layout paint' }}
          >
            <Tie t={t} names={names} col={col} w="var(--cw)" />
          </div>
        )))}
        {hasFinal ? <div ref={posterRef} role="button" tabIndex={0} onClick={() => open(rounds[L - 1].ties[0])} className="absolute left-0 top-0" style={{ width: 'var(--pw)', height: POSTER_H, contain: 'layout paint', visibility: 'hidden' }}>
          <Poster t={rounds[L - 1].ties[0]} names={names} fm={fm} tint={tint} mid={mid} name={CUP_NAME[fm] || (lg && lg.name) || ''} />
        </div> : null}
      </div>
    </div>
  );
}

export default function Bracket({ fm, sk }) {
  const hit = sk ? peekBracket(fm, sk) : null;
  const { data: d0, loading } = useAsync(() => (sk ? loadBracket(fm, sk) : null), [fm, sk]);
  // risultati arrivati dopo (stagione in corso): stesso componente, dati ricalcolati
  // (solo aggiornamenti arrivati dopo la comparsa e solo se i risultati cambiano: niente ridisegno durante lo swipe d'entrata)
  const ver = useArchFresh(fm, sk);
  const ver0 = useRef(ver);
  const [fresh, setFresh] = useState(null);
  useEffect(() => {
    if (ver === ver0.current || !sk) return undefined;
    ver0.current = ver;
    let on = true;
    const sig = (d) => (d && d.rounds ? d.rounds.map((r) => r.ties.map((t) => `${t.a}${t.b}${t.sa}${t.sb}${t.win}`).join()).join('|') : '');
    const cur = (fresh && fresh.d) || d0 || hit;
    loadBracket(fm, sk).then((d) => { if (on && d && d.rounds && sig(d) !== sig(cur)) setFresh({ k: `${fm}-${sk}`, d }); });
    return () => { on = false; };
  }, [ver, fm, sk]); // eslint-disable-line react-hooks/exhaustive-deps
  const data = (fresh && fresh.k === `${fm}-${sk}` && fresh.d) || d0 || hit;
  if (loading && !data) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Carico il tabellone…</p>;
  if (!data || !data.rounds || !data.rounds.length) {
    return null;
  }
  return <BracketView key={`${fm}-${sk}`} data={data} fm={fm} sk={sk} />;
}

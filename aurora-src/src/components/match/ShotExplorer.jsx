import { useEffect, useRef, useState } from 'react';
import { comma } from '@/lib/format';
import { situationOf, zoneOf, outcomeOf } from './MatchShotMap';
import { ShotDot, SHOT_HOME, SHOT_PITCH, SHOT_LINE, SHOT_GOALBG } from './ShotDot';

const PITCH = SHOT_PITCH;
const LINE = SHOT_LINE;
const dotCol = (s) => (s.outcome === 'Gol' ? '#2FBF71' : s.onTarget ? '#4aa3ff' : s.outcome === 'Bloccato' ? '#9aa4b2' : '#e5a84a');
// Pallone da calcio disegnato dentro il pallino del gol (r = raggio del pallino).
function Ball({ r }) {
  const b = r * 0.78;
  const pent = [0, 1, 2, 3, 4].map((k) => { const a = (-90 + k * 72) * Math.PI / 180; return [Math.cos(a) * b * 0.42, Math.sin(a) * b * 0.42]; });
  return (
    <g pointerEvents="none">
      <circle r={b} fill="#fff" />
      <polygon points={pent.map((p) => p.join(',')).join(' ')} fill="#111" />
      {pent.map((p, k) => { const a = (-90 + k * 72) * Math.PI / 180; return <line key={k} x1={p[0]} y1={p[1]} x2={Math.cos(a) * b * 0.95} y2={Math.sin(a) * b * 0.95} stroke="#111" strokeWidth={b * 0.14} strokeLinecap="round" />; })}
    </g>
  );
}
const px = (v) => Math.max(66, Math.min(104.5, v));
const py = (v) => Math.max(12, Math.min(54, v));
const bodyOf = (b) => (b === 'Testa' ? 'Di testa' : b === 'Destro' ? 'Di destro' : b === 'Sinistro' ? 'Di sinistro' : '—');
const dist = (s) => (s.px != null ? Math.round(Math.hypot(105 - s.px, 34 - s.py)) : null);

function Goal({ list, sel, onSel, dim = true, h = 150, frame = 'rgba(255,255,255,.8)' }) {
  const W = 11.5 * 0.9;
  const x0 = 14;
  return (
    <svg viewBox="0 0 100 52" className="w-full" style={{ maxHeight: h, background: SHOT_GOALBG, borderRadius: 10 }}>
      <line x1="2" x2="98" y1="44" y2="44" strokeWidth="0.5" style={{ stroke: 'rgba(150,175,225,.5)' }} />
      <rect x={x0} y={44 - 2.44 * W} width={7.32 * W} height={2.44 * W} strokeWidth="1.2" style={{ fill: 'rgba(255,255,255,.04)', stroke: '#dfe8fb' }} />
      {list.map((s, i) => {
        if (s.gy == null || s.gz == null) return null;
        const cx = x0 + (s.gy - 30.34) * W;
        const cy = 44 - Math.max(0, Math.min(s.gz, 3.4)) * W;
        const on = sel === i;
        return (
          <g key={i} onClick={() => onSel(i)} style={{ cursor: 'pointer' }} opacity={sel == null || on || !dim ? 1 : 0.35}>
            {on ? <circle cx={Math.max(3, Math.min(97, cx))} cy={cy} r="4.2" fill="none" stroke="#f5a400" strokeWidth="0.7" /> : null}
            <g transform={`translate(${Math.max(3, Math.min(97, cx))} ${cy})`}><ShotDot c={SHOT_HOME} goal={s.outcome === 'Gol'} on={!!s.onTarget} r={2.2} /></g>
          </g>
        );
      })}
    </svg>
  );
}

function Half({ list, sel, onSel, h = 190, line = true }) {
  const cur = sel != null ? list[sel] : null;
  return (
    <svg viewBox="64 10 42 46" className="w-full overflow-hidden rounded-[12px]" style={{ background: PITCH, maxHeight: h }}>
      <rect x="0" y="0" width="105" height="68" fill="none" stroke={LINE} strokeWidth="0.5" />
      <polyline points="105,13.84 88.5,13.84 88.5,54.16 105,54.16" fill="none" stroke={LINE} strokeWidth="0.5" />
      <polyline points="105,24.84 99.5,24.84 99.5,43.16 105,43.16" fill="none" stroke={LINE} strokeWidth="0.5" />
      <circle cx="94" cy="34" r="0.5" fill={LINE} />
      {line && cur && cur.px != null ? <line x1={px(cur.px)} y1={py(cur.py)} x2="105" y2="34" stroke="#0b1a10" strokeWidth="0.45" strokeDasharray="1.3 1.1" /> : null}
      {list.map((s, i) => {
        if (s.px == null) return null;
        const on = sel === i;
        return (
          <g key={i} onClick={() => onSel(i)} style={{ cursor: 'pointer' }} opacity={sel == null || on ? 1 : 0.35}>
            {on ? <circle cx={px(s.px)} cy={py(s.py)} r="3.6" fill="none" stroke="#f5a400" strokeWidth="0.7" /> : null}
            <g transform={`translate(${px(s.px)} ${py(s.py)})`}><ShotDot c={SHOT_HOME} goal={s.outcome === 'Gol'} on={!!s.onTarget} r={2} /></g>
          </g>
        );
      })}
    </svg>
  );
}

function Details({ s, cols = 2 }) {
  const rows = s
    ? [
        ['xG', comma(s.xg, 2)],
        ['xGOT', s.onTarget || s.outcome === 'Gol' ? comma(s.xgot, 2) : '—'],
        ['Esito', outcomeOf(s)],
        ['Situazione', situationOf(s.situation)],
        ['Tipo di tiro', bodyOf(s.body)],
        ['Zona gol', zoneOf(s)],
        ['Distanza', dist(s) != null ? `${dist(s)} m` : '—'],
        ['Minuto', `${s.minute}'`],
      ]
    : [];
  if (!s) return <p className="py-3 text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>Scegli un minuto per vedere posizione e coordinate verso la porta</p>;
  return (
    <div className="grid gap-x-3 gap-y-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
      {rows.map(([k, v]) => (
        <div key={k}>
          <p className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{k}</p>
          <p className="text-[13px] font-bold leading-tight">{v}</p>
        </div>
      ))}
    </div>
  );
}

function Chips({ list, sel, onSel, variant }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current && ref.current.querySelector('[data-on="1"]');
    if (el && ref.current) ref.current.scrollTo({ left: Math.max(0, el.offsetLeft - 60), behavior: 'smooth' });
  }, [sel]);
  const items = [{ label: 'Tutti', i: null }, ...list.map((s, i) => ({ label: `${s.minute}'`, i, s }))];
  return (
    <div ref={ref} data-no-swipe className="hide-sb -mx-1 flex gap-2 overflow-x-auto px-1 py-1" style={{ touchAction: 'pan-x' }}>
      {items.map((it) => {
        const on = sel === it.i;
        const goal = it.s && it.s.outcome === 'Gol';
        const base = { flex: '0 0 auto' };
        const c = it.s ? dotCol(it.s) : null;
        const fg = c === '#e5a84a' ? '#1d1500' : '#fff';
        let st;
        if (variant === 'a') st = { ...base, width: it.i === null ? 54 : 40, height: 40, borderRadius: 999, background: it.i === null ? (on ? 'var(--accent)' : 'var(--pill-bg)') : c, border: on ? '2px solid #fff' : '2px solid transparent', boxShadow: on ? `0 0 0 2px ${c || 'var(--accent)'}` : 'none', opacity: on || sel == null || it.i === null ? 1 : 0.55, color: it.i === null ? '#fff' : fg, fontSize: 12, fontWeight: 800 };
        else if (variant === 'b') st = { ...base, padding: '0 14px', height: 34, borderRadius: 999, background: it.i === null ? (on ? 'var(--ink)' : 'var(--pill-bg)') : c, color: it.i === null ? (on ? 'var(--sky-2)' : 'var(--ink)') : fg, border: on ? '2px solid #fff' : '1px solid var(--glass-border)', boxShadow: on && c ? `0 0 0 2px ${c}` : 'none', opacity: on || sel == null || it.i === null ? 1 : 0.55, fontSize: 12.5, fontWeight: 800 };
        else st = { ...base, minWidth: 52, height: 46, borderRadius: 14, background: it.i === null ? (on ? 'var(--accent)' : 'var(--hair-2)') : c, color: it.i === null ? (on ? '#fff' : 'var(--ink)') : fg, border: on ? '2px solid #fff' : '2px solid transparent', boxShadow: on && c ? `0 0 0 2px ${c}` : 'none', opacity: on || sel == null || it.i === null ? 1 : 0.55, fontSize: 12.5, fontWeight: 800 };
        return (
          <button key={String(it.i)} type="button" data-on={on ? 1 : 0} onClick={() => onSel(it.i)} className="press tnum flex items-center justify-center gap-1" style={st}>
            {goal ? <span style={{ fontSize: 11 }}>⚽</span> : null}{it.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ShotExplorer({ shots, concept }) {
  const list = [...shots].filter((s) => s.px != null).sort((a, b) => (a.minute || 0) - (b.minute || 0));
  const [sel, setSel] = useState(null);
  const pick = (i) => setSel((p) => (i === p ? null : i));
  const cur = sel != null ? list[sel] : null;
  const on = list.filter((s) => s.onTarget || s.outcome === 'Gol').length;
  const goals = list.filter((s) => s.outcome === 'Gol').length;
  const xg = list.reduce((a, s) => a + (s.xg || 0), 0);
  const sum = (
    <div className="grid grid-cols-4 text-center">
      {[['Tiri', list.length], ['In porta', on], ['Gol', goals], ['xG', comma(xg, 2)]].map(([k, v]) => (
        <div key={k}><p className="tnum text-[17px] font-semibold leading-none">{v}</p><p className="mt-1 text-[10px]" style={{ color: 'var(--ink-3)' }}>{k}</p></div>
      ))}
    </div>
  );
  if (!list.length) {
    return <p className="rounded-[16px] py-5 text-center text-[12.5px]" style={{ background: 'var(--hair-2)', color: 'var(--ink-3)' }}>Nessun tiro del giocatore</p>;
  }

  if (concept === 'b') {
    return (
      <div className="flex flex-col gap-3 rounded-[20px] p-3" style={{ background: 'var(--hair-2)' }}>
        {sum}
        <Chips list={list} sel={sel} onSel={(i) => (i === null ? setSel(null) : pick(i))} variant="b" />
        <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="flex flex-col gap-2">
            <Goal list={list} sel={sel} onSel={pick} h={86} />
            <Half list={list} sel={sel} onSel={pick} h={150} />
          </div>
          <div className="flex items-center"><Details s={cur} cols={1} /></div>
        </div>
      </div>
    );
  }
  if (concept === 'c') {
    return (
      <div className="flex flex-col gap-3">
        <div className="relative rounded-[20px] p-3" style={{ background: PITCH }}>
          <Half list={list} sel={sel} onSel={pick} h={230} />
          <div className="absolute right-4 top-4 w-[38%] rounded-[10px] p-1" style={{ background: 'rgba(8,16,28,.72)' }}>
            <Goal list={list} sel={sel} onSel={pick} h={70} />
          </div>
        </div>
        <Chips list={list} sel={sel} onSel={(i) => (i === null ? setSel(null) : pick(i))} variant="c" />
        <div className="rounded-[18px] p-3.5" style={{ background: 'var(--hair-2)' }}>{cur ? <Details s={cur} cols={4} /> : sum}</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 rounded-[20px] p-3" style={{ background: 'var(--hair-2)' }}>
      <div className="rounded-[14px] px-2 pt-2" style={{ background: 'rgba(8,16,28,.55)' }}>
        <Goal list={list} sel={sel} onSel={pick} h={130} />
      </div>
      <Chips list={list} sel={sel} onSel={(i) => (i === null ? setSel(null) : pick(i))} variant="a" />
      <div className="grid gap-3" style={{ gridTemplateColumns: '0.9fr 1.1fr' }}>
        <Half list={list} sel={sel} onSel={pick} h={150} />
        <div className="flex items-center"><Details s={cur} cols={2} /></div>
      </div>
    </div>
  );
}

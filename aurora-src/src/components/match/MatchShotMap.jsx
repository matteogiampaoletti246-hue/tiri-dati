import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TextFilter from '@/components/TextFilter';
import { comma } from '@/lib/format';
import PlayerLink from './PlayerLink';
import { findInMatch } from '@/data/playerSheet';

// Mappa tiri stile "campo verde": casa attacca a sinistra, trasferta a destra.
// Sotto il campo: le due porte viste da davanti. Toccando un tiro compare la scheda con i dettagli.
const HC = 'var(--accent)';
const AC = 'var(--live)';
const PITCH = 'rgba(42,98,62,.92)';
const LINE = 'rgba(255,255,255,.55)';

const arc = (cx, cy, r, from, to, n = 30) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
};
const mir = (pts) => pts.map(([x, y]) => [105 - x, y]);
const pl = (pts) => pts.map((p) => p.join(',')).join(' ');
const RIGHT = [
  [[105, 13.84], [88.5, 13.84], [88.5, 54.16], [105, 54.16]],
  [[105, 24.84], [99.5, 24.84], [99.5, 43.16], [105, 43.16]],
];

const SITUATION = {
  RegularPlay: 'Azione', FastBreak: 'Contropiede', SetPiece: 'Palla inattiva', FromCorner: 'Da calcio d\'angolo',
  FreeKick: 'Calcio di punizione', Penalty: 'Rigore', ThrowInSetPiece: 'Rimessa laterale', IndirectFreekick: 'Punizione indiretta',
  Assisted: 'Assistito', IndividualPlay: 'Azione personale', Corner: 'Da calcio d\'angolo',
};
export const situationOf = (s) => SITUATION[s] || (s ? String(s).replace(/([a-z])([A-Z])/g, '$1 $2') : '—');

export const zoneOf = (s) => {
  if (s.gy == null || s.gz == null) return '—';
  const y = s.gy - 34;
  const col = Math.abs(y) < 1.2 ? 'al centro' : y < 0 ? 'a sinistra' : 'a destra';
  const row = s.gz > 1.6 ? 'In alto' : s.gz > 0.8 ? 'A metà' : 'In basso';
  if (s.gy < 30.34 - 0.2 || s.gy > 37.66 + 0.2 || s.gz > 2.44 + 0.1) return 'Fuori dallo specchio';
  return `${row} ${col}`;
};
export const outcomeOf = (s) => (s.outcome === 'Fuori' && s.onTarget ? 'Palo / traversa' : s.outcome);

const FILTERS = [
  { value: 'all', label: 'Tutti' },
  { value: 'target', label: 'Tiri in porta' },
];

export default function MatchShotMap({ shots = [], home, away, match = null, linkNames = true }) {
  const [mode, setMode] = useState('all');
  const [sel, setSel] = useState(null);
  const list = shots.filter((s) => s.px != null && (mode !== 'target' || s.onTarget));
  const cur = sel != null && list[sel] ? list[sel] : null;
  const color = (s) => (s.side === 'home' ? HC : AC);
  const pos = (s) => (s.side === 'home' ? [105 - s.px, 68 - s.py] : [s.px, s.py]);
  const radius = (s) => (1.9);
  const found = cur && match ? findInMatch(match, cur.playerName) : null;
  const photo = found ? found.entry.photo : null;
  // le foto dei giocatori dei tiri si caricano in anticipo: cambiando tiro con la freccia non c'e' attesa
  useEffect(() => {
    if (!match) return;
    const seen = new Set();
    list.forEach((s) => {
      if (seen.has(s.playerName)) return;
      seen.add(s.playerName);
      const f = findInMatch(match, s.playerName);
      const u = f && f.entry && f.entry.photo;
      if (u) { const im = new Image(); im.decoding = 'async'; im.src = u; }
    });
  }, [list.length, match]);
  const step = (d) => setSel((i) => (list.length ? (((i == null ? -1 : i) + d + list.length) % list.length) : null));

  const Dot = ({ s, cx, cy, r, active, onClick, k }) => (
    <g key={k} transform={`translate(${cx} ${cy})`} onClick={onClick} style={{ cursor: 'pointer' }}>
      {active ? <circle r={r + 1.6} fill="none" stroke="#fff" strokeWidth="0.6" /> : null}
      {s.outcome === 'Gol' ? (
        <>
          <circle r={r + 0.9} fill="#fff" stroke={color(s)} strokeWidth="0.7" />
          <polygon points="0,-1.15 1.1,-0.35 0.7,0.95 -0.7,0.95 -1.1,-0.35" fill="#111" />
          {[[0, -1.15, 0, -2.3], [1.1, -0.35, 2.2, -0.75], [0.7, 0.95, 1.4, 1.9], [-0.7, 0.95, -1.4, 1.9], [-1.1, -0.35, -2.2, -0.75]].map((l, i) => (
            <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke="#111" strokeWidth="0.35" />
          ))}
        </>
      ) : (
        <>
          <circle r={r} fill={s.onTarget ? color(s) : 'rgba(255,255,255,.28)'} fillOpacity={s.onTarget ? 0.9 : 1} stroke={color(s)} strokeWidth="0.6" />
          {s.onTarget ? <circle r="0.55" fill="#fff" /> : null}
        </>
      )}
    </g>
  );

  // porta vista da davanti: 7,32 m × 2,44 m
  const Goal = ({ side }) => {
    const W = 11.5;
    const gl = list.filter((s) => s.side === side && s.gy != null && s.gz != null);
    const x0 = 10;
    return (
      <svg viewBox="0 0 100 52" className="w-full">
        <line x1="2" x2="98" y1="44" y2="44" strokeWidth="0.5" style={{ stroke: 'var(--ink-3)' }} />
        <rect x={x0 + 4} y={44 - 2.44 * W * 0.9} width={7.32 * W * 0.9} height={2.44 * W * 0.9} strokeWidth="1.2" style={{ fill: 'var(--hair-2)', stroke: 'var(--ink)' }} />
        {gl.map((s) => {
          const i = list.indexOf(s);
          const cx = x0 + 4 + (s.gy - 30.34) * W * 0.9;
          const cy = 44 - Math.max(0, Math.min(s.gz, 3.4)) * W * 0.9;
          return Dot({ k: i, s, cx: Math.max(3, Math.min(97, cx)), cy, r: 2.3, active: i === sel, onClick: () => setSel(i) });
        })}
      </svg>
    );
  };

  const team = cur ? (cur.side === 'home' ? home : away) : null;
  const goalPt = cur && cur.gy != null ? { x: cur.side === 'home' ? 0 : 105, y: cur.side === 'home' ? 68 - cur.gy : cur.gy } : null;

  return (
    <div className="flex flex-col gap-3">
      <TextFilter options={FILTERS} value={mode} onChange={(v) => { setMode(v); setSel(null); }} />

      <svg viewBox="-1 -1 107 70" className="w-full overflow-hidden rounded-[10px]" style={{ background: PITCH }}>
        <rect x="0" y="0" width="105" height="68" fill="none" stroke={LINE} strokeWidth="0.5" />
        <line x1="52.5" x2="52.5" y1="0" y2="68" stroke={LINE} strokeWidth="0.5" />
        <circle cx="52.5" cy="34" r="9.15" fill="none" stroke={LINE} strokeWidth="0.5" />
        <circle cx="52.5" cy="34" r="0.6" fill={LINE} />
        {RIGHT.map((l, i) => <polyline key={`r${i}`} points={pl(l)} fill="none" stroke={LINE} strokeWidth="0.5" />)}
        {RIGHT.map((l, i) => <polyline key={`l${i}`} points={pl(mir(l))} fill="none" stroke={LINE} strokeWidth="0.5" />)}
        <polyline points={arc(94, 34, 9.15, 127, 233)} fill="none" stroke={LINE} strokeWidth="0.5" />
        <polyline points={arc(11, 34, 9.15, -53, 53)} fill="none" stroke={LINE} strokeWidth="0.5" />
        {cur && goalPt ? (
          <line x1={pos(cur)[0]} y1={pos(cur)[1]} x2={goalPt.x} y2={goalPt.y} stroke="#fff" strokeWidth="0.45" strokeDasharray="1.4 1.2" />
        ) : null}
        {list.map((s, i) => {
          const [cx, cy] = pos(s);
          return Dot({ k: i, s, cx, cy, r: radius(s), active: i === sel, onClick: () => setSel(i === sel ? null : i) });
        })}
      </svg>

      <div className="grid grid-cols-2 gap-2">
        <div><p className="mb-0.5 text-[10.5px] font-bold" style={{ color: HC }}>{home ? home.short || home.name : 'Casa'}</p>{Goal({ side: 'home' })}</div>
        <div><p className="mb-0.5 text-right text-[10.5px] font-bold" style={{ color: AC }}>{away ? away.short || away.name : 'Trasferta'}</p>{Goal({ side: 'away' })}</div>
      </div>

      {cur ? (
        <div className="rounded-[18px] p-3.5" style={{ background: 'var(--hair-2)' }}>
          <div className="flex items-center gap-2">
            <button type="button" className="press p-1" onClick={() => step(-1)} aria-label="Tiro precedente"><ChevronLeft size={20} style={{ color: 'var(--accent)' }} /></button>
            <div className="min-w-0 flex-1 text-center">
              <div className="flex items-center justify-center gap-2">
                {photo ? <img src={photo} alt="" decoding="async" className="h-[34px] w-[34px] shrink-0 rounded-full object-cover" style={{ background: 'var(--hair)' }} /> : null}
                {linkNames && match ? (
                  <PlayerLink match={match} name={cur.playerName} fmId={found && found.fmId} className="truncate text-[14px] font-extrabold" style={{ color: color(cur) }}>{cur.playerName}</PlayerLink>
                ) : (
                  <p className="truncate text-[14px] font-extrabold" style={{ color: color(cur) }}>{cur.playerName}</p>
                )}
              </div>
              <p className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{team ? team.name : ''} · {cur.minute}&apos;</p>
            </div>
            <button type="button" className="press p-1" onClick={() => step(1)} aria-label="Tiro successivo"><ChevronRight size={20} style={{ color: 'var(--accent)' }} /></button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-y-3 text-center">
            {[
              ['xG', comma(cur.xg, 2)],
              ['xGOT', cur.onTarget || cur.outcome === 'Gol' ? comma(cur.xgot, 2) : '—'],
              ['Esito', outcomeOf(cur)],
              ['Situazione', situationOf(cur.situation)],
              ['Tipo di tiro', cur.body === 'Testa' ? 'Colpo di testa' : cur.body === 'Destro' ? 'Piede destro' : cur.body === 'Sinistro' ? 'Piede sinistro' : 'Altro'],
              ['Zona gol', zoneOf(cur)],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{k}</p>
                <p className="text-[12.5px] font-bold leading-tight">{v}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-center text-[11.5px]" style={{ color: 'var(--ink-3)' }}>Tocca un tiro per vedere i dettagli</p>
      )}
      {!list.length ? <p className="py-4 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun tiro</p> : null}
    </div>
  );
}

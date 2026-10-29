import { BallIcon } from '@/components/match/EventIcons';
import { comma } from '@/lib/format';

// Mappa tiri in metri (campo 105×68, tiri sempre verso la porta di destra).
// concept: a = mezzo campo in verticale, b = campo intero (le due squadre), c = mezzo campo in orizzontale.
const HC = 'var(--accent)';
const AC = 'var(--live)';

const circle = (cx, cy, r, from = 0, to = 360, n = 40) => {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
};
const half = (m) => (m ? (pt) => [105 - pt[0], 68 - pt[1]] : (pt) => pt);
const LINES = [
  [[0, 0], [105, 0], [105, 68], [0, 68], [0, 0]],
  [[52.5, 0], [52.5, 68]],
  circle(52.5, 34, 9.15),
  [[105, 13.84], [88.5, 13.84], [88.5, 54.16], [105, 54.16]],
  [[105, 24.84], [99.5, 24.84], [99.5, 43.16], [105, 43.16]],
  circle(94, 34, 9.15, 127, 233),
  [[105, 30.34], [107, 30.34], [107, 37.66], [105, 37.66]],
];
const LEFT = LINES.slice(3).map((l) => l.map(half(true)));

function Marker({ x, y, s, rot }) {
  const c = s.side === 'home' ? HC : AC;
  const r = 1 + Math.min(4.2, s.xg * 9);
  const goal = s.outcome === 'Gol';
  const filled = !goal && s.onTarget;
  const [cx, cy] = rot(x, y);
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {goal ? (
        <>
          <circle r={r + 1.2} fill={c} stroke="#fff" strokeWidth="0.5" />
          <path d="M0 -1.5l1.5 1.1-.6 1.8h-1.8l-.6-1.8z" fill="#fff" />
        </>
      ) : (
        <circle r={r} fill={filled ? c : 'none'} fillOpacity=".85" stroke={c} strokeWidth="0.9" />
      )}
    </g>
  );
}

function Field({ shots, concept }) {
  const full = concept === 'b';
  const T = full
    ? { vb: '-3 -3 111 74', rot: (x, y) => [x, y], lines: [...LINES, ...LEFT] }
    : concept === 'c'
      ? { vb: '48 -2 62 72', rot: (x, y) => [x, y], lines: LINES }
      : { vb: '-2 -3 72 58', rot: (x, y) => [y, 105 - x], lines: LINES };
  const mapPt = (pt) => T.rot(pt[0], pt[1]);
  return (
    <svg viewBox={T.vb} className="w-full rounded-[16px]" style={{ background: 'var(--glass-bg)', border: '1px solid var(--hair)' }}>
      {T.lines.map((l, i) => (
        <polyline key={i} points={l.map(mapPt).map((p) => p.join(' ')).join(' ')} fill="none" stroke="var(--ink-3)" strokeOpacity=".55" strokeWidth="0.35" />
      ))}
      {shots.map((s, i) => {
        let { px, py } = s;
        if (px == null) return null;
        if (full && s.side === 'away') {
          px = 105 - px;
          py = 68 - py;
        }
        return <Marker key={i} x={px} y={py} s={s} rot={T.rot} />;
      })}
    </svg>
  );
}

function GoalView({ shots }) {
  const W = 9.56;
  const pts = shots.filter((s) => s.gy != null && s.gz != null && s.gy > 22 && s.gy < 46 && s.gz < 4.5);
  return (
    <svg viewBox="0 0 100 44" className="w-full rounded-[16px]" style={{ background: 'var(--glass-bg)', border: '1px solid var(--hair)' }}>
      <line x1="2" x2="98" y1="34" y2="34" stroke="var(--ink-3)" strokeOpacity=".5" strokeWidth="0.4" />
      <rect x="15" y={34 - 2.44 * W} width={7.32 * W} height={2.44 * W} fill="var(--hair-2)" stroke="var(--ink)" strokeWidth="1" />
      {[1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={15 + (i * 7.32 * W) / 7} x2={15 + (i * 7.32 * W) / 7} y1={34 - 2.44 * W} y2="34" stroke="var(--ink-3)" strokeOpacity=".3" strokeWidth="0.3" />)}
      {pts.map((s, i) => {
        const cx = 15 + (s.gy - 30.34) * W;
        const cy = 34 - s.gz * W;
        const c = s.side === 'home' ? HC : AC;
        return s.outcome === 'Gol' ? (
          <g key={i} transform={`translate(${cx} ${cy})`}><circle r="3.1" fill={c} stroke="#fff" strokeWidth="0.5" /><path d="M0 -1.5l1.5 1.1-.6 1.8h-1.8l-.6-1.8z" fill="#fff" /></g>
        ) : (
          <circle key={i} cx={cx} cy={cy} r="2.2" fill={s.onTarget ? c : 'none'} fillOpacity=".85" stroke={c} strokeWidth="0.8" />
        );
      })}
    </svg>
  );
}

export default function ShotMap({ shots = [], home, away, concept = 'a' }) {
  return (
    <div className="flex flex-col gap-3">
      <Field shots={shots} concept={concept} />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
        <span className="flex items-center gap-1.5"><span className="h-[10px] w-[10px] rounded-full" style={{ border: '1.5px solid var(--ink-2)' }} />Fuori</span>
        <span className="flex items-center gap-1.5"><span className="h-[10px] w-[10px] rounded-full" style={{ background: 'var(--ink-2)' }} />In porta / parato</span>
        <span className="flex items-center gap-1.5"><BallIcon size={13} />Gol</span>
      </div>
      <div className="flex items-center gap-3 text-[11.5px] font-bold">
        <span className="flex items-center gap-1.5"><span className="h-[8px] w-[8px] rounded-full" style={{ background: HC }} />{home ? home.short || home.name : 'Casa'}</span>
        <span className="flex items-center gap-1.5"><span className="h-[8px] w-[8px] rounded-full" style={{ background: AC }} />{away ? away.short || away.name : 'Trasferta'}</span>
      </div>

      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Porta</p>
      <GoalView shots={shots} />

      <div>
        {shots.map((s, i) => (
          <div key={`${s.minute}-row-${i}`} className="grid items-center gap-3 py-2" style={{ borderTop: '1px solid var(--hair-2)', gridTemplateColumns: '38px 1fr 62px 34px' }}>
            <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{s.minute}&apos;</span>
            <span className="truncate text-[13px] font-semibold" style={{ color: s.side === 'home' ? HC : AC }}>{s.playerName}</span>
            <span className="text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{s.outcome === 'Fuori' && s.onTarget ? 'In porta' : s.outcome}</span>
            <span className="tnum text-right text-[12px]" style={{ color: 'var(--ink-3)' }}>{comma(s.xg, 2)}</span>
          </div>
        ))}
        {!shots.length ? <p className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun tiro</p> : null}
      </div>
    </div>
  );
}

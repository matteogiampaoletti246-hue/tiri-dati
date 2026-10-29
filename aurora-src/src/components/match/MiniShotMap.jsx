import { useState } from 'react';
import { comma } from '@/lib/format';

// Mappetta tiri del singolo giocatore: metà campo offensiva + porta vista da davanti.
import { ShotDot, ShotHit, BlockTrace, isBlocked, SHOT_HOME, SHOT_PITCH, SHOT_LINE, SHOT_GOALBG } from './ShotDot';
const PITCH = SHOT_PITCH;
const LINE = SHOT_LINE;
const cx = (v) => Math.max(66, Math.min(104.5, v));
const cy = (v) => Math.max(12, Math.min(54, v));


export default function MiniShotMap({ shots }) {
  const [sel, setSel] = useState(null);
  const list = shots.filter((s) => s.px != null);
  const on = list.filter((s) => s.onTarget || s.outcome === 'Gol').length;
  const goals = list.filter((s) => s.outcome === 'Gol').length;
  const xg = list.reduce((a, s) => a + (s.xg || 0), 0);
  const cur = sel != null ? list[sel] : null;
  const W = 11;
  return (
    <div className="rounded-[20px] p-3" style={{ background: 'var(--hair-2)' }}>
      <div className="mb-2.5 grid grid-cols-4 text-center">
        {[['Tiri', list.length], ['In porta', on], ['Gol', goals], ['xG', comma(xg, 2)]].map(([k, v]) => (
          <div key={k}>
            <p className="tnum text-[17px] font-semibold leading-none">{v}</p>
            <p className="mt-1 text-[10px]" style={{ color: 'var(--ink-3)' }}>{k}</p>
          </div>
        ))}
      </div>
      <div className="grid items-center gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <svg viewBox="64 10 42 46" className="w-full overflow-hidden rounded-[10px]" style={{ background: PITCH, maxHeight: 150 }}>
          <rect x="0" y="0" width="105" height="68" fill="none" stroke={LINE} strokeWidth="0.5" />
          <line x1="52.5" x2="52.5" y1="0" y2="68" stroke={LINE} strokeWidth="0.5" />
          <polyline points="105,13.84 88.5,13.84 88.5,54.16 105,54.16" fill="none" stroke={LINE} strokeWidth="0.5" />
          <polyline points="105,24.84 99.5,24.84 99.5,43.16 105,43.16" fill="none" stroke={LINE} strokeWidth="0.5" />
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke={LINE} strokeWidth="0.5" />
          {cur && isBlocked(cur) && cur.bx != null ? <BlockTrace x1={cx(cur.px)} y1={cy(cur.py)} x2={cx(cur.bx)} y2={cy(cur.by)} /> : null}
          {list.map((s, i) => (
            <g key={i} onClick={() => setSel(i === sel ? null : i)}>
              {i === sel ? <circle cx={cx(s.px)} cy={cy(s.py)} r="3.4" fill="none" stroke="#f5a400" strokeWidth="0.7" /> : null}
              <g transform={`translate(${cx(s.px)} ${cy(s.py)})`}><ShotHit /><ShotDot c={SHOT_HOME} goal={s.outcome === 'Gol'} on={!!s.onTarget} r={2} /></g>
            </g>
          ))}
        </svg>
        <svg viewBox="0 0 60 52" className="w-full" style={{ maxHeight: 150, background: SHOT_GOALBG, borderRadius: 10 }}>
          <line x1="2" x2="58" y1="44" y2="44" stroke="rgba(150,175,225,.5)" strokeWidth="0.5" />
          <rect x="4" y={44 - 2.44 * W * 0.7} width={7.32 * W * 0.7} height={2.44 * W * 0.7} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.75)" strokeWidth="1" />
          {list.filter((s) => s.gy != null && s.gz != null && !isBlocked(s)).map((s) => {
            const i = list.indexOf(s);
            const gx = 4 + (s.gy - 30.34) * W * 0.7;
            const gyy = 44 - Math.max(0, Math.min(s.gz, 3.4)) * W * 0.7;
            return <g key={i} transform={`translate(${Math.max(3, Math.min(57, gx))} ${gyy})`} onClick={() => setSel(i === sel ? null : i)}><ShotHit /><ShotDot c={SHOT_HOME} goal={s.outcome === 'Gol'} on={!!s.onTarget} r={2} /></g>;
          })}
        </svg>
      </div>
      {cur ? (
        <p className="mt-2 text-center text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
          {cur.minute}&apos; · {cur.outcome} · xG {comma(cur.xg, 2)}{cur.onTarget || cur.outcome === 'Gol' ? ` · xGOT ${comma(cur.xgot, 2)}` : ''}
        </p>
      ) : <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Tocca un tiro per i dettagli</p>}
    </div>
  );
}

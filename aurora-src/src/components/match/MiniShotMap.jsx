import { useState } from 'react';
import { comma } from '@/lib/format';

// Mappetta tiri del singolo giocatore: metà campo offensiva + porta vista da davanti.
const PITCH = 'rgba(42,98,62,.92)';
const LINE = 'rgba(255,255,255,.55)';
const col = (s) => (s.outcome === 'Gol' ? '#fff' : s.onTarget ? '#7fd6ff' : 'rgba(255,255,255,.3)');

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
      <div className="grid gap-2" style={{ gridTemplateColumns: '1.35fr 1fr' }}>
        <svg viewBox="50 -1 56 70" className="w-full overflow-hidden rounded-[10px]" style={{ background: PITCH }}>
          <rect x="0" y="0" width="105" height="68" fill="none" stroke={LINE} strokeWidth="0.5" />
          <line x1="52.5" x2="52.5" y1="0" y2="68" stroke={LINE} strokeWidth="0.5" />
          <polyline points="105,13.84 88.5,13.84 88.5,54.16 105,54.16" fill="none" stroke={LINE} strokeWidth="0.5" />
          <polyline points="105,24.84 99.5,24.84 99.5,43.16 105,43.16" fill="none" stroke={LINE} strokeWidth="0.5" />
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke={LINE} strokeWidth="0.5" />
          {list.map((s, i) => (
            <g key={i} onClick={() => setSel(i === sel ? null : i)}>
              {i === sel ? <circle cx={s.px} cy={s.py} r="3.4" fill="none" stroke="#fff" strokeWidth="0.6" /> : null}
              <circle cx={s.px} cy={s.py} r="2" fill={col(s)} stroke={s.outcome === 'Gol' ? '#111' : '#fff'} strokeWidth={s.outcome === 'Gol' ? 0.7 : 0.35} />
            </g>
          ))}
        </svg>
        <svg viewBox="0 0 60 52" className="w-full">
          <line x1="2" x2="58" y1="44" y2="44" stroke={LINE} strokeWidth="0.5" />
          <rect x="4" y={44 - 2.44 * W * 0.7} width={7.32 * W * 0.7} height={2.44 * W * 0.7} fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.75)" strokeWidth="1" />
          {list.filter((s) => s.gy != null && s.gz != null).map((s) => {
            const i = list.indexOf(s);
            const cx = 4 + (s.gy - 30.34) * W * 0.7;
            const cy = 44 - Math.max(0, Math.min(s.gz, 3.4)) * W * 0.7;
            return <circle key={i} cx={Math.max(3, Math.min(57, cx))} cy={cy} r="2" fill={col(s)} stroke={s.outcome === 'Gol' ? '#111' : '#fff'} strokeWidth="0.4" onClick={() => setSel(i === sel ? null : i)} />;
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

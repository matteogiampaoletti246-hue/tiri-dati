import { comma } from '@/lib/format';

export default function Pitch({ lineup, team }) {
  if (!lineup || !lineup.xi || !team) return null;
  const { formation, xi } = lineup;
  const rows = [[xi[0]]];
  let idx = 1;
  formation.rows.forEach((count) => {
    rows.push(xi.slice(idx, idx + count));
    idx += count;
  });
  const display = [...rows.slice(1).reverse(), rows[0]];
  const lastName = (n) => String(n).split(' ').slice(-1)[0];

  return (
    <div
      className="relative overflow-hidden rounded-[22px] px-2 py-5"
      style={{
        background: 'linear-gradient(180deg, rgba(150,200,255,.20) 0%, rgba(150,200,255,.07) 60%, rgba(150,200,255,.14) 100%)',
        border: '1px solid var(--hair)',
      }}
    >
      <span className="pointer-events-none absolute inset-x-3 bottom-3 h-16 rounded-b-[14px]" style={{ border: '1px solid var(--hair-2)', borderTop: 'none' }} />
      <span className="pointer-events-none absolute inset-x-3 top-[42%] h-px" style={{ background: 'var(--hair-2)' }} />

      <div className="relative flex flex-col gap-6">
        {display.map((row, ri) => (
          <div key={ri} className="flex items-start justify-around gap-1">
            {row.map((p) => (
              <div key={p.playerId} className="flex w-[58px] flex-col items-center gap-1.5">
                <span
                  className="crest relative h-[34px] w-[34px]"
                  style={{
                    background: `linear-gradient(150deg, ${team.colors[0]}, ${team.colors[1]})`,
                    opacity: p.subOut ? 0.45 : 1,
                  }}
                >
                  <span className="tnum text-[11.5px]">{p.number}</span>
                  {p.card ? (
                    <span
                      className="absolute -right-1 -top-1 h-[9px] w-[7px] rounded-[1px]"
                      style={{ background: p.card === 'red' ? 'var(--live)' : '#E2C03C' }}
                    />
                  ) : null}
                  {p.captain ? (
                    <span
                      className="absolute -bottom-1 -left-1 flex h-[12px] w-[12px] items-center justify-center rounded-full text-[7.5px] font-semibold"
                      style={{ background: 'var(--panel-3)', color: 'var(--ink)' }}
                    >
                      C
                    </span>
                  ) : null}
                </span>
                <span
                  className="w-full truncate text-center text-[10px] leading-tight"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {lastName(p.name)}
                </span>
                <span className="tnum text-[9px]" style={{ color: 'var(--ink-3)' }}>
                  {comma(p.rating)}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

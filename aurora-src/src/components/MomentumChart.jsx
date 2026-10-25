// Grafico del momento: barre sopra/sotto l'asse, positivo = squadra di casa.
export default function MomentumChart({ values = [], home, away }) {
  if (!values.length) return null;
  const max = Math.max(40, ...values.map((v) => Math.abs(v)));

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
          <span className="h-[3px] w-3 rounded-full" style={{ background: 'var(--accent)' }} />
          {home ? home.short : 'Casa'}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
          {away ? away.short : 'Trasferta'}
          <span className="h-[3px] w-3 rounded-full" style={{ background: 'var(--live)' }} />
        </span>
      </div>

      <div className="relative flex h-[124px] items-stretch gap-[3px]">
        <span className="pointer-events-none absolute left-0 top-1/2 h-px w-full" style={{ background: 'var(--hair-2)' }} />
        {values.map((v, i) => {
          const h = (Math.abs(v) / max) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col">
              <div className="flex h-1/2 items-end">
                {v > 0 ? (
                  <span
                    className="w-full rounded-t-[2px]"
                    style={{ height: `${h}%`, background: 'var(--accent)', opacity: 0.85 }}
                  />
                ) : null}
              </div>
              <div className="flex h-1/2 items-start">
                {v < 0 ? (
                  <span
                    className="w-full rounded-b-[2px]"
                    style={{ height: `${h}%`, background: 'var(--live)', opacity: 0.85 }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex items-center">
        <span className="tnum text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
          0&apos;
        </span>
        <span className="mx-auto text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
          45&apos;
        </span>
        <span className="tnum text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
          90&apos;
        </span>
      </div>
    </div>
  );
}

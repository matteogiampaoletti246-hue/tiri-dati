import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ListTree, X } from 'lucide-react';

// Classifiche impilate (una per statistica) con il tasto "Vai a" per saltare a quella che serve.
// sections: [{ id, group, title, rows: [{ id, to, left, name, sub, value }] }]
export default function StatLists({ sections, controls = null, limit = 8 }) {
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState({});
  const groups = [];
  sections.forEach((s) => {
    let g = groups.find((x) => x.name === s.group);
    if (!g) groups.push((g = { name: s.group, items: [] }));
    g.items.push(s);
  });

  const go = (id) => {
    setSheet(false);
    setTimeout(() => {
      const el = document.getElementById(`st-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  };

  return (
    <div className="pb-6 pt-2">
      <div className="flex items-center gap-3 px-4">
        <div className="min-w-0 flex-1">{controls}</div>
        <button type="button" onClick={() => setSheet(true)} className="glass press flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold">
          <ListTree size={14} />
          Vai a
        </button>
      </div>

      {sections.map((s) => {
        const all = !!open[s.id];
        const rows = all ? s.rows : s.rows.slice(0, limit);
        return (
          <section key={s.id} id={`st-${s.id}`} className="glass mx-4 mt-4 overflow-hidden rounded-[24px]" style={{ scrollMarginTop: 150 }}>
            <div className="flex items-baseline justify-between px-4 pb-2 pt-3.5">
              <h3 className="text-[12.5px] font-extrabold uppercase tracking-wider">{s.title}</h3>
              <span className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{s.group}</span>
            </div>
            {rows.map((r, i) => {
              const inner = (
                <>
                  <span className="tnum w-[22px] shrink-0 text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{i + 1}</span>
                  {r.left}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold">{r.name}</span>
                    {r.sub ? <span className="block truncate text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{r.sub}</span> : null}
                  </span>
                  <span className="tnum text-[14.5px] font-extrabold">{r.value}</span>
                </>
              );
              const cls = 'press flex items-center gap-3 px-4 py-2.5';
              const st = { borderTop: '1px solid var(--hair-2)' };
              return r.to ? (
                <Link key={r.id} to={r.to} className={cls} style={st}>{inner}</Link>
              ) : (
                <div key={r.id} className={cls} style={st}>{inner}</div>
              );
            })}
            {s.rows.length > limit ? (
              <button
                type="button"
                onClick={() => setOpen({ ...open, [s.id]: !all })}
                className="press flex w-full items-center justify-center gap-1 py-3 text-[12px] font-bold"
                style={{ borderTop: '1px solid var(--hair-2)', color: 'var(--accent)' }}
              >
                {all ? 'Mostra meno' : `Mostra tutti (${s.rows.length})`}
                <ChevronDown size={14} style={{ transform: all ? 'rotate(180deg)' : 'none' }} />
              </button>
            ) : null}
          </section>
        );
      })}

      {sheet ? (
        <div className="fixed inset-0 z-[60] flex items-end justify-center" onClick={() => setSheet(false)} style={{ background: 'rgba(0,0,0,.45)' }}>
          <div className="glass-strong max-h-[72vh] w-full max-w-[430px] overflow-y-auto rounded-t-[28px] p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[15px] font-extrabold">Vai a</span>
              <button type="button" onClick={() => setSheet(false)} className="press" aria-label="Chiudi"><X size={18} /></button>
            </div>
            {groups.map((g) => (
              <div key={g.name} className="mb-4">
                <div className="mb-2 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{g.name}</div>
                <div className="flex flex-wrap gap-2">
                  {g.items.map((s) => (
                    <button key={s.id} type="button" onClick={() => go(s.id)} className="glass-flat press rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold">
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

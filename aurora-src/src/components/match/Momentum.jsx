// Momentum: positivo = squadra di casa. Tre versioni: A barre, B area, C periodi.
export default function Momentum({ values = [], events = [], home, away, concept }) {
  if (!values.length) return <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Momentum non disponibile</p>;
  const n = values.length;
  const max = Math.max(40, ...values.map((v) => Math.abs(v)));
  const goals = events.filter((e) => e.type === 'goal');
  const x = (minute) => Math.min(100, (parseInt(String(minute), 10) / (n * 3)) * 100);
  const HC = 'var(--accent)';
  const AC = 'var(--live)';

  const legend = (
    <div className="mb-2 flex items-center text-[11.5px] font-bold">
      <span className="flex items-center gap-1.5"><span className="h-[8px] w-[8px] rounded-full" style={{ background: HC }} />{home ? home.short : 'Casa'}</span>
      <span className="ml-auto flex items-center gap-1.5">{away ? away.short : 'Trasferta'}<span className="h-[8px] w-[8px] rounded-full" style={{ background: AC }} /></span>
    </div>
  );
  const axis = (
    <div className="mt-2 flex text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
      <span>0&apos;</span><span className="mx-auto">45&apos;</span><span>90&apos;</span>
    </div>
  );

  if (concept === 'c') {
    const per = [];
    const size = Math.ceil(n / 6);
    for (let i = 0; i < 6; i++) {
      const seg = values.slice(i * size, (i + 1) * size);
      if (!seg.length) continue;
      const h = seg.filter((v) => v > 0).reduce((a, v) => a + v, 0);
      const a = seg.filter((v) => v < 0).reduce((s, v) => s - v, 0);
      per.push({ label: `${i * 15}-${(i + 1) * 15}'`, h: h / ((h + a) || 1) });
    }
    return (
      <div>
        {legend}
        <div className="flex flex-col gap-3">
          {per.map((p) => (
            <div key={p.label} className="flex items-center gap-3">
              <span className="tnum w-[44px] text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{p.label}</span>
              <div className="flex h-[10px] flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}>
                <span style={{ width: `${p.h * 100}%`, background: HC, opacity: p.h >= 0.5 ? 1 : 0.4, transition: 'width .6s' }} />
                <span style={{ flex: 1, background: AC, opacity: p.h < 0.5 ? 1 : 0.4 }} />
              </div>
              <span className="tnum w-[30px] text-right text-[10.5px] font-bold">{Math.round(p.h * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (concept === 'b') {
    const W = 300;
    const H = 110;
    const mid = H / 2;
    const pts = values.map((v, i) => [(i / (n - 1 || 1)) * W, mid - (v / max) * (mid - 6)]);
    const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
    return (
      <div>
        {legend}
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 130 }}>
          <defs>
            <clipPath id="up"><rect x="0" y="0" width={W} height={mid} /></clipPath>
            <clipPath id="dn"><rect x="0" y={mid} width={W} height={mid} /></clipPath>
          </defs>
          <path d={`${path} L${W} ${mid} L0 ${mid} Z`} fill={HC} fillOpacity=".35" clipPath="url(#up)" />
          <path d={`${path} L${W} ${mid} L0 ${mid} Z`} fill={AC} fillOpacity=".35" clipPath="url(#dn)" />
          <path d={path} fill="none" stroke="var(--ink-2)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          <line x1="0" x2={W} y1={mid} y2={mid} stroke="var(--hair)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <line x1={W / 2} x2={W / 2} y1="0" y2={H} stroke="var(--hair-2)" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {goals.map((g, i) => (
            <circle key={i} cx={(x(g.minute) / 100) * W} cy={g.team === 'home' ? 8 : H - 8} r="3.4" fill={g.team === 'home' ? HC : AC} stroke="var(--ink)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {axis}
      </div>
    );
  }

  return (
    <div>
      {legend}
      <div className="relative flex h-[124px] items-stretch gap-[2px]">
        <span className="pointer-events-none absolute left-0 top-1/2 h-px w-full" style={{ background: 'var(--hair)' }} />
        {values.map((v, i) => {
          const h = (Math.abs(v) / max) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col">
              <div className="flex h-1/2 items-end">{v > 0 ? <span className="w-full rounded-t-[3px]" style={{ height: `${h}%`, background: HC, opacity: 0.4 + 0.6 * (h / 100) }} /> : null}</div>
              <div className="flex h-1/2 items-start">{v < 0 ? <span className="w-full rounded-b-[3px]" style={{ height: `${h}%`, background: AC, opacity: 0.4 + 0.6 * (h / 100) }} /> : null}</div>
            </div>
          );
        })}
        {goals.map((g, i) => (
          <span key={i} className="absolute h-[9px] w-[9px] -translate-x-1/2 rounded-full" style={{ left: `${x(g.minute)}%`, top: g.team === 'home' ? -4 : undefined, bottom: g.team === 'home' ? undefined : -4, background: g.team === 'home' ? HC : AC, border: '1.5px solid var(--ink)' }} />
        ))}
      </div>
      {axis}
    </div>
  );
}

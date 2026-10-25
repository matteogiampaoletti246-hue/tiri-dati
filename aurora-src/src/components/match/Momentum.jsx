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

  if (concept === 'a' || !concept) {
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

  const W = 300;
  const H = 120;
  const mid = H / 2;
  const pts = values.map((v, i) => [(i / (n - 1 || 1)) * W, mid - (v / max) * (mid - 10)]);
  // curva morbida (Catmull-Rom)
  const smooth = pts.map((p, i) => {
    if (!i) return `M${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    const p0 = pts[i - 2] || pts[i - 1];
    const p1 = pts[i - 1];
    const p2 = p;
    const p3 = pts[i + 1] || p;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }).join(' ');
  const yAt = (minute) => {
    const k = Math.min(n - 1, Math.max(0, Math.round((parseInt(String(minute), 10) / (n * 3)) * (n - 1))));
    return pts[k][1];
  };
  const glow = concept === 'c';
  return (
    <div>
      {legend}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" preserveAspectRatio="none" style={{ height: 140 }}>
        <defs>
          <linearGradient id="mg-up" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={HC} stopOpacity=".75" /><stop offset="100%" stopColor={HC} stopOpacity="0" /></linearGradient>
          <linearGradient id="mg-dn" x1="0" x2="0" y1="1" y2="0"><stop offset="0%" stopColor={AC} stopOpacity=".75" /><stop offset="100%" stopColor={AC} stopOpacity="0" /></linearGradient>
          <clipPath id="mc-up"><rect x="0" y="0" width={W} height={mid} /></clipPath>
          <clipPath id="mc-dn"><rect x="0" y={mid} width={W} height={mid} /></clipPath>
        </defs>
        <path d={`${smooth} L${W} ${mid} L0 ${mid} Z`} fill="url(#mg-up)" clipPath="url(#mc-up)" />
        <path d={`${smooth} L${W} ${mid} L0 ${mid} Z`} fill="url(#mg-dn)" clipPath="url(#mc-dn)" />
        <line x1="0" x2={W} y1={mid} y2={mid} stroke="var(--hair)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <line x1={W / 2} x2={W / 2} y1="0" y2={H} stroke="var(--hair-2)" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        <path d={smooth} fill="none" clipPath="url(#mc-up)" stroke={HC} strokeWidth={glow ? 2.6 : 1.6} vectorEffect="non-scaling-stroke" strokeLinecap="round" style={glow ? { filter: `drop-shadow(0 0 4px ${HC})` } : undefined} />
        <path d={smooth} fill="none" clipPath="url(#mc-dn)" stroke={AC} strokeWidth={glow ? 2.6 : 1.6} vectorEffect="non-scaling-stroke" strokeLinecap="round" style={glow ? { filter: `drop-shadow(0 0 4px ${AC})` } : undefined} />
        {goals.map((g, i) => {
          const cx = (x(g.minute) / 100) * W;
          const c = g.team === 'home' ? HC : AC;
          return glow ? (
            <g key={i}>
              <line x1={cx} x2={cx} y1={yAt(g.minute)} y2={g.team === 'home' ? 8 : H - 8} stroke={c} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
              <circle cx={cx} cy={g.team === 'home' ? 8 : H - 8} r="4.6" fill={c} stroke="var(--ink)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </g>
          ) : (
            <circle key={i} cx={cx} cy={yAt(g.minute)} r="3.4" fill="var(--ink)" stroke={c} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          );
        })}
      </svg>
      {axis}
    </div>
  );
}

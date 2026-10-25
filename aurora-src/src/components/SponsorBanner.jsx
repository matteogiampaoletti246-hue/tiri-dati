import { comma } from '@/lib/format';

export default function SponsorBanner({ odds, label = 'Sponsor' }) {
  return (
    <div className="hero-warm mx-5 px-5 py-4">
      <div className="relative flex items-center gap-4">
        <span className="text-[10px] font-medium uppercase tracking-[.18em]" style={{ color: 'rgba(62,31,18,.62)' }}>
          {label}
        </span>
        {odds ? (
          <div className="tnum ml-auto flex items-center gap-4 text-[15px] font-medium" style={{ color: 'var(--warm-ink)' }}>
            <span>{comma(odds.home, 2)}</span>
            <span>{comma(odds.draw, 2)}</span>
            <span>{comma(odds.away, 2)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

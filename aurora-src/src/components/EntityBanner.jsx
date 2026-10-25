import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';

// Banner fisso in alto (campionato / squadra): resta sempre visibile mentre si scorre.
export default function EntityBanner({ name, subtitle, meta, colors = ['#1E4BD8', '#7FB6E8'], logoUrl = null, initials = '', liveCount = 0, logoFilter }) {
  const navigate = useNavigate();
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => document.documentElement.style.setProperty('--ent-h', `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <header ref={ref} className="sticky top-0 z-30 overflow-hidden" style={{ background: 'color-mix(in srgb, hsl(var(--background)) 94%, transparent)', backdropFilter: 'blur(24px) saturate(170%)', WebkitBackdropFilter: 'blur(24px) saturate(170%)' }}>
      <span aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(120deg, ${colors[0]}55 0%, ${colors[1]}22 70%, transparent 100%)` }} />
      <div className="safe-top relative px-4 pb-3">
        <div className="flex items-center gap-3">
          <button type="button" className="glass press flex h-9 w-9 shrink-0 items-center justify-center rounded-full" aria-label="Indietro" onClick={() => navigate(-1)}>
            <ChevronLeft size={19} />
          </button>
          {logoUrl ? (
            <Image src={logoUrl} alt={name} className="h-[40px] w-[40px] shrink-0" fittingType="fit" style={{ objectFit: 'contain', filter: logoFilter }} />
          ) : (
            <span className="tnum flex h-[40px] w-[40px] shrink-0 items-center justify-center text-[14px] font-extrabold">{initials}</span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="title-lg truncate text-[19px]" style={{ color: 'var(--ink)', letterSpacing: '-.03em' }}>{name}</h1>
            {subtitle ? <p className="truncate text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{subtitle}</p> : null}
          </div>
          {liveCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--live)' }}>
              <span className="live-dot" />
              {liveCount} LIVE
            </span>
          ) : null}
        </div>
        {meta ? <div className="relative mt-2.5 pl-12">{meta}</div> : null}
      </div>
    </header>
  );
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';

// Banner di campionato / squadra: fisso in alto, sempre visibile, con il colore della squadra o del campionato.
// A = colore pieno, B = base scura con alone colorato, C = colore pieno più alto con logo grande in filigrana.
export default function EntityBanner({ name, subtitle, meta, colors = ['#1E4BD8', '#7FB6E8'], logoUrl = null, initials = '', liveCount = 0, logoFilter, tall = false, nameExtra = null, below = null }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  const [h, setH] = useState(120);
  const concept = 'b';

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => {
      setH(el.offsetHeight);
      document.documentElement.style.setProperty('--ent-h', `${el.offsetHeight}px`);
    };
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--ent-h', '0px');
    };
  }, []);

  const c0 = colors[0] || '#1E4BD8';
  const c1 = colors[1] || c0;
  const full = concept !== 'b';
  const bg = concept === 'b'
    ? `radial-gradient(120% 140% at 0% 0%, ${c0}88 0%, transparent 62%)`
    : concept === 'c'
      ? `linear-gradient(135deg, ${c0} 0%, ${c0}cc 55%, ${c1}aa 100%)`
      : `linear-gradient(110deg, ${c0} 0%, ${c0}d9 45%, ${c1}99 100%)`;
  const fg = full ? '#fff' : 'var(--ink)';
  const sub = full ? 'rgba(255,255,255,.78)' : 'var(--ink-3)';
  const big = tall ? 220 : concept === 'c' ? 200 : 150;

  const bar = (
    <header
      ref={ref}
      data-pf="1"
      className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[var(--app-w)] overflow-hidden"
      style={{ backgroundColor: 'var(--sky-2)', backgroundImage: bg, borderBottom: concept === 'b' ? `2px solid ${c0}` : '1px solid rgba(255,255,255,.12)' }}
    >
      {logoUrl ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            right: -big * 0.18,
            top: '50%',
            width: big,
            height: big,
            transform: 'translateY(-50%)',
            opacity: concept === 'b' ? 0.2 : 0.24,
            WebkitMaskImage: 'linear-gradient(to left, #000 35%, transparent 100%)',
            maskImage: 'linear-gradient(to left, #000 35%, transparent 100%)',
          }}
        >
          <img src={logoUrl} alt="" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: full ? 'brightness(0) invert(1)' : logoFilter }} />
        </span>
      ) : null}
      <div className={`safe-top relative px-4 ${tall ? 'pb-7 pt-5' : 'pb-4 pt-3'}`}>
        <div className="flex items-center gap-3">
          <button type="button" className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,.28)', color: '#fff' }} aria-label="Indietro" onClick={() => navigate(-1)}>
            <ChevronLeft size={19} />
          </button>
          {logoUrl ? (
            <Image src={logoUrl} alt={name} className={tall ? 'h-[72px] w-[72px] shrink-0' : 'h-[54px] w-[54px] shrink-0'} fittingType="fit" style={{ objectFit: 'contain', filter: logoFilter }} />
          ) : (
            <span className="tnum flex h-[54px] w-[54px] shrink-0 items-center justify-center text-[16px] font-extrabold" style={{ color: fg }}>{initials}</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2"><h1 className="title-lg truncate text-[22px]" style={{ color: fg, letterSpacing: '-.03em' }}>{name}</h1>{nameExtra}</div>
            {subtitle ? <p className="truncate text-[12px]" style={{ color: sub }}>{subtitle}</p> : null}
            {meta ? <div className="mt-1" style={{ color: sub }}>{meta}</div> : null}
          </div>
          {liveCount > 0 ? (
            <span className="relative flex shrink-0 items-center gap-1.5 text-[11px] font-bold" style={{ color: '#fff' }}>
              <span className="live-dot" />
              {liveCount} LIVE
            </span>
          ) : null}
        </div>
        {below ? <div className="mt-2.5 min-w-0">{below}</div> : null}
      </div>
    </header>
  );

  return (
    <>
      <div aria-hidden="true" style={{ height: h }} />
      {createPortal(bar, document.body)}
    </>
  );
}

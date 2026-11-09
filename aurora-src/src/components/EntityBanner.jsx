import { shown } from '@/lib/tint';
import PlayerPhoto from '@/components/PlayerPhoto';
import { useLayoutEffect, useRef, useState } from 'react';

const LAST_H = {};
import { goBack } from '@/lib/carousel';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Banner di campionato / squadra / giocatore: fisso in alto, sempre visibile, base scura con alone del colore della squadra o del campionato.
// Niente logo accanto al nome: a destra, dietro, lo stemma (o il volto del giocatore) grande e acceso che sfuma verso sinistra con una maschera.
const FADE_FLAG = 'linear-gradient(to left, #000 35%, transparent 100%)';
const FADE = 'linear-gradient(to left, #000 20%, transparent 85%)';

export default function EntityBanner({ name, subtitle, meta, colors = ['#1E4BD8', '#7FB6E8'], logoUrl = null, liveCount = 0, logoFilter, tall = false, nameExtra = null, below = null, person = false, flag = false }) {
  const navigate = useNavigate();
  const ref = useRef(null);
  // spazio riservato sotto il banner: misurato prima del disegno e partendo dall'ultima altezza vista (niente pagina che scende all'arrivo)
  const hk = `${tall ? 't' : 's'}${subtitle ? 1 : 0}${meta ? 1 : 0}${below ? 1 : 0}`;
  const [h, setH] = useState(() => LAST_H[hk] || 120);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const set = () => {
      if (el.offsetHeight) LAST_H[hk] = el.offsetHeight;
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
  // Profile Card concept A (21st, Isaiah): fondo sfumato nel colore del club + luce sfocata, nome che compare lettera per lettera
  const bg = `linear-gradient(160deg, ${c0}b3 0%, ${c0}40 45%, transparent 78%), radial-gradient(70% 120% at 100% 50%, ${c0}88 0%, transparent 70%)`;
  const big = tall ? 230 : 180;

  const bar = (
    <header
      ref={ref} data-back-banner="1"
      data-pf="1"
      className="fixed inset-x-0 top-0 z-40 mx-auto w-full max-w-[var(--app-w)] overflow-hidden"
      style={{ backgroundColor: 'var(--sky-2)', backgroundImage: bg, borderBottom: `2px solid ${c0}` }}
    >
      <span aria-hidden="true" className="pointer-events-none absolute rounded-full" style={{ right: -30, top: -60, width: 200, height: 200, background: shown(c0, 150), filter: 'blur(56px)', opacity: 0.5 }} />
      {person ? (
        // volto intero: riquadro quadrato poco più alto del banner, appoggiato in basso (si taglia solo la cima dei capelli)
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 block w-[60%]" style={{ WebkitMaskImage: FADE, maskImage: FADE }}>
          <span className="absolute bottom-0 right-3 block aspect-square h-[118%]" style={{ filter: 'saturate(1.15)' }}><PlayerPhoto src={logoUrl} className="h-full w-full" /></span>
        </span>
      ) : logoUrl && flag ? (
        // nazionali: bandiera intera sul lato destro, nitida, che sfuma verso sinistra (concept A)
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 block w-[78%]" style={{ WebkitMaskImage: FADE_FLAG, maskImage: FADE_FLAG }}>
          <img src={logoUrl} alt="" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
        </span>
      ) : logoUrl ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{ right: -big * 0.14, top: '50%', width: big, height: big, transform: 'translateY(-50%)', opacity: 0.62, WebkitMaskImage: FADE, maskImage: FADE }}
        >
          <img src={logoUrl} alt="" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'contain', filter: `${logoFilter || ''} saturate(1.5) brightness(1.08)` }} />
        </span>
      ) : null}
      <div className={`safe-top relative pl-1.5 pr-4 ${tall ? 'pb-7 pt-5' : 'pb-4 pt-3'}`}>
        <div className="flex items-start gap-0.5">
          <button type="button" className="press -my-1 flex h-[38px] w-8 shrink-0 items-center justify-center" style={{ color: 'var(--ink)' }} aria-label="Indietro" onClick={() => goBack(navigate)}>
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2"><h1 className="title-lg truncate text-[22px]" style={{ color: 'var(--ink)', letterSpacing: '-.03em' }} aria-label={typeof name === 'string' ? name : undefined}>{typeof name === 'string' && name.length < 40 ? name.split('').map((ch, i) => <span key={i} aria-hidden="true" className="pc-ch" style={{ animationDelay: `${120 + i * 28}ms` }}>{ch === ' ' ? '\u00a0' : ch}</span>) : name}</h1>{nameExtra}</div>
            {subtitle ? <p className="truncate text-[12px]" style={{ color: 'var(--ink-3)' }}>{subtitle}</p> : null}
            {meta ? <div className="mt-1" style={{ color: 'var(--ink-3)' }}>{meta}</div> : null}
          </div>
          {liveCount > 0 ? (
            <span className="relative mt-2 flex shrink-0 items-center gap-1.5 text-[11px] font-bold" style={{ color: 'var(--ink)' }}>
              <span className="live-dot" />
              {liveCount} LIVE
            </span>
          ) : null}
        </div>
        {below ? <div className="mt-2.5 min-w-0 pl-[34px]">{below}</div> : null}
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

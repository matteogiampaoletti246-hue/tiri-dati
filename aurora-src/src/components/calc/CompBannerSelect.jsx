import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import MenuBackdrop from '@/components/MenuBackdrop';
import LeagueBadge from '@/components/LeagueBadge';
import { usePopFit, popScroll } from '@/lib/popFit';
import { compAccent, compBg } from './calcComp';

// Competizione del giocatore (concept B, scelto dall'utente l'8/11/2026): il tasto mostra logo e nome della competizione scelta;
// la tendina elenca SOLO le competizioni del giocatore (campionato della sua squadra, coppa europea se la gioca, Nations League della
// sua nazionale), ognuna come banner nei colori della competizione con logo, nome e tipo. Stessa apertura di MiniSelect.
// options: [{ value: 'campionato' | 'coppa' | 'nations', comp: calcComp(key), sub }]
// logo della competizione sul cerchio chiaro dei banner: sempre la versione per sfondo chiaro, iniziali se manca
export function CompLogo({ comp, size = 22 }) {
  const [bad, setBad] = useState(false);
  if (!comp) return null;
  if (comp.logo && !bad) return <img src={comp.logo} alt="" width={size} height={size} loading="lazy" onError={() => setBad(true)} className="object-contain" style={{ width: size, height: size }} />;
  return <span className="text-[10px] font-extrabold" style={{ color: comp.colors[0] }}>{comp.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}</span>;
}

export default function CompBannerSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const ref = useRef(null);
  const room = usePopFit(ref, open, 280);
  const cur = options.find((o) => o.value === value) || null;

  useEffect(() => {
    if (!open) return undefined;
    const id = requestAnimationFrame(() => setShown(true));
    const off = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', off);
    return () => { cancelAnimationFrame(id); setShown(false); document.removeEventListener('pointerdown', off); };
  }, [open]);

  if (!options.length) return null;
  return (
    <div ref={ref} className="relative min-w-0" data-no-swipe="true" style={open ? { zIndex: 96 } : undefined}>
      <button
        type="button"
        aria-label="Competizione"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 max-w-full items-center gap-2 rounded-xl pl-2 pr-3 text-[15px] outline-none transition-opacity active:opacity-60"
        style={{ background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink)' }}
      >
        {cur ? <LeagueBadge league={cur.comp} size={22} /> : null}
        <span className="truncate">{cur ? cur.comp.name : 'Seleziona'}</span>
        <ChevronDown size={16} strokeWidth={1.5} className="shrink-0" style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }} />
      </button>
      {open ? <MenuBackdrop onClose={() => setOpen(false)} /> : null}
      {open ? (
        <div
          data-pop-scroll
          className={`hide-sb absolute right-0 ${room.up ? 'bottom-[calc(100%+6px)]' : 'top-[calc(100%+6px)]'} z-40 flex flex-col gap-1.5 rounded-2xl p-1.5`}
          style={{ width: 280, ...popScroll(room), opacity: shown ? 1 : 0, transform: shown ? 'translateY(0) scale(1)' : `translateY(${room.up ? 6 : -6}px) scale(.97)`, transformOrigin: room.up ? 'bottom right' : 'top right', transition: 'opacity .2s ease, transform .22s cubic-bezier(.22,.8,.24,1)', background: 'var(--sky-2)', border: '1px solid var(--hair)', boxShadow: '0 14px 34px rgba(0,0,0,.45)' }}
        >
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                data-comp-option={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                className="press flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left"
                style={{ background: compBg(o.comp), border: `1.5px solid ${on ? compAccent(o.comp) : 'transparent'}`, color: 'var(--on-banner)' }}
              >
                <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: 32, height: 32, background: 'var(--banner-chip)' }}>
                  <CompLogo comp={o.comp} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-bold">{o.comp.name}</span>
                  <span className="block truncate text-[11.5px]" style={{ color: 'var(--on-banner-2)' }}>{o.sub}</span>
                </span>
                {on ? <Check size={16} strokeWidth={2.2} className="shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

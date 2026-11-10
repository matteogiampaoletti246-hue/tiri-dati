import { sanitizeNum } from '@/lib/calc';

// Campo numerico essenziale: superficie vetrosa, virgola decimale, tocchi ampi.
// Il bordo animato (blu/viola, o del colore scelto con `tint`) sta sul contenitore: un campo non puo' avere pseudo-elementi.
export default function NumInput({ value, onChange, placeholder = '—', width = 78, allowDash = false, onFocus, ariaLabel, tint = null, onBanner = false }) {
  return (
    <span className={`halo-card inline-block flex-none rounded-xl${tint ? '' : ' ring-def'}`} style={tint ? { width, '--ring-c': tint, '--ring-c2': 'initial' } : { width }}>
      <input
        value={value}
        onChange={(e) => onChange(sanitizeNum(e.target.value, allowDash))}
        onFocus={onFocus}
        inputMode={allowDash ? 'text' : 'decimal'}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="tnum h-10 w-full rounded-xl px-2 text-center text-[15px] outline-none"
        style={{
          // onBanner: campo dentro un banner nei colori di una competizione (sempre scuro): testo chiaro in entrambi i temi
          background: tint ? `${tint}26` : onBanner ? 'var(--banner-field)' : 'var(--panel-2)',
          border: '1px solid transparent',
          color: tint || (onBanner ? 'var(--on-banner)' : 'var(--ink)'),
          fontWeight: tint ? 800 : undefined,
        }}
      />
    </span>
  );
}

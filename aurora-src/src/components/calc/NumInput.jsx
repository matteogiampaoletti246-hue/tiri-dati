import { sanitizeNum } from '@/lib/calc';

// Campo numerico essenziale: superficie vetrosa, virgola decimale, tocchi ampi.
export default function NumInput({ value, onChange, placeholder = '—', width = 78, allowDash = false, onFocus, ariaLabel, tint = null }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(sanitizeNum(e.target.value, allowDash))}
      onFocus={onFocus}
      inputMode={allowDash ? 'text' : 'decimal'}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="tnum h-10 rounded-xl px-2 text-center text-[15px] outline-none"
      style={{
        width,
        background: tint ? `${tint}26` : 'var(--panel-2)',
        border: tint ? `1px solid ${tint}66` : '1px solid var(--hair)',
        color: tint || 'var(--ink)',
        fontWeight: tint ? 800 : undefined,
      }}
    />
  );
}

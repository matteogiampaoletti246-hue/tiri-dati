// Riga etichetta + controllo: nessun box, solo filo sottile tra le righe.
export default function FieldRow({ label, hint, first = false, noSwipe = false, className = '', children }) {
  return (
    <div data-no-swipe={noSwipe ? 'true' : undefined} className={className}>
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderTop: first ? 'none' : '1px solid var(--hair-2)' }}>
        <p className="label-sm max-w-[48%] min-w-0 leading-tight">{label}</p>
        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2">{children}</div>
      </div>
      {hint ? (
        <p className="px-5 pb-3 text-right text-[11px] leading-snug" style={{ color: 'var(--ink-3)' }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

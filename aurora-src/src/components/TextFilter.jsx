// Filtri testuali: nessun box, il selezionato è pieno e gli altri sbiaditi.
export default function TextFilter({ options, value, onChange, className = '' }) {
  return (
    <div className={`hide-sb flex items-center gap-5 overflow-x-auto ${className}`}>
      {options.map((opt) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const label = typeof opt === 'string' ? opt : opt.label;
        const active = val === value;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`filter-btn shrink-0 ${active ? 'is-on' : ''}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

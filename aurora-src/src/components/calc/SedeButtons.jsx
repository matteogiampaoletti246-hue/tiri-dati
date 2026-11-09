import { House, Plane, Scale } from 'lucide-react';

// Sede (concept A, scelto dall'utente l'8/11/2026): tre tasti uguali senza la scritta "Sede", icona sopra il nome.
// Casa = casetta, Neutro = bilancia, Trasferta = aereo. Tasti in vetro liquido (concept B); quello scelto si accende col colore dell'app.
const ITEMS = [
  { value: 'casa', label: 'Casa', Icon: House },
  { value: 'neutro', label: 'Neutro', Icon: Scale },
  { value: 'trasferta', label: 'Trasferta', Icon: Plane },
];

export default function SedeButtons({ value, onChange }) {
  return (
    <div data-no-swipe="true" className="grid grid-cols-3 gap-2 px-5 py-3" style={{ borderTop: '1px solid var(--hair-2)' }} role="radiogroup" aria-label="Sede">
      {ITEMS.map(({ value: v, label, Icon }) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(v)}
            className={`lglass press flex flex-col items-center justify-center gap-1.5 rounded-[16px] py-2.5 ${on ? 'lglass-on' : ''}`}
            style={{ color: on ? 'var(--ink)' : 'var(--ink-3)', transition: 'color .2s ease' }}
          >
            <Icon size={21} strokeWidth={on ? 2 : 1.6} style={{ color: on ? 'var(--ink)' : 'currentColor' }} />
            <span className="text-[13px] font-semibold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

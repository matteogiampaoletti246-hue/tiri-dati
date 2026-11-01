import FieldRow from './FieldRow';
import MiniSelect from './MiniSelect';

export const STAT_OPTIONS = [
  { value: 'tiri', label: 'Tiri' },
  { value: 'porta', label: 'Tiri in Porta' },
  { value: 'fc', label: 'Falli Commessi' },
  { value: 'fs', label: 'Falli Subiti' },
];

// Statistiche del calcolo: tendina come "Valore linea" (si apre sotto il tasto, con transizione).
export default function CalcStatSelect({ value, onChange }) {
  return (
    <FieldRow label="Statistiche">
      <MiniSelect ariaLabel="Statistiche" width={176} value={value} onChange={onChange} options={STAT_OPTIONS} />
    </FieldRow>
  );
}

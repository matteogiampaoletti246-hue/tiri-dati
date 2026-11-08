import FieldRow from './FieldRow';
import MiniSelect from './MiniSelect';
import StatIcon from '@/components/StatIcon';

export const STAT_OPTIONS = [
  { value: 'tiri', label: 'Tiri', k: 'shots' },
  { value: 'porta', label: 'Tiri in Porta', k: 'sot' },
  { value: 'fc', label: 'Falli Commessi', k: 'fc' },
  { value: 'fs', label: 'Falli Subiti', k: 'fs' },
];
// concept A (8/11/2026): icona della statistica (le stesse di Matchup / Migliori Giocatori) prima del nome, nella tendina e nel tasto
const WITH_ICONS = STAT_OPTIONS.map((o) => ({ ...o, icon: <StatIcon k={o.k} size={19} /> }));

// Statistiche del calcolo: tendina come "Valore linea" (si apre sotto il tasto, con transizione).
export default function CalcStatSelect({ value, onChange }) {
  return (
    <FieldRow label="Statistiche">
      <MiniSelect ariaLabel="Statistiche" width={196} value={value} onChange={onChange} options={WITH_ICONS} />
    </FieldRow>
  );
}

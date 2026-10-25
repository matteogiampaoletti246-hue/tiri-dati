import { useState } from 'react';
import TextFilter from '@/components/TextFilter';
import ShotMap from '@/components/ShotMap';

export default function MatchShotsPanel({ view, home, away }) {
  const [side, setSide] = useState('all');
  const shots = (view.shots || [])
    .filter((s) => side === 'all' || s.side === side)
    .sort((a, b) => a.minute - b.minute);

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div className="px-5">
        <TextFilter
          options={[
            { value: 'all', label: 'Tutte' },
            { value: 'home', label: home ? home.short : 'Casa' },
            { value: 'away', label: away ? away.short : 'Trasferta' },
          ]}
          value={side}
          onChange={setSide}
        />
      </div>
      <div className="px-5">
        <ShotMap shots={shots} />
      </div>
    </div>
  );
}

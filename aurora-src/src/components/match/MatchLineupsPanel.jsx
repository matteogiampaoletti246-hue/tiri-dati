import TextFilter from '@/components/TextFilter';
import PanelTitle from '@/components/PanelTitle';
import Pitch from '@/components/Pitch';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { useState } from 'react';
import { coachOf, playerById } from '@/data/players';
import { comma } from '@/lib/format';

export default function MatchLineupsPanel({ view, home, away }) {
  const [side, setSide] = useState('home');
  const lineup = view.lineup ? view.lineup[side] : null;
  const team = side === 'home' ? home : away;

  return (
    <div className="flex flex-col gap-6 pt-2">
      <div className="px-5">
        <TextFilter
          options={[
            { value: 'home', label: home ? home.name : 'Casa' },
            { value: 'away', label: away ? away.name : 'Trasferta' },
          ]}
          value={side}
          onChange={setSide}
        />
      </div>

      {!lineup || !lineup.xi || !lineup.xi.length ? (
        <p className="px-5 py-12 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
          Formazioni non ancora disponibili
        </p>
      ) : null}

      {lineup && lineup.xi && lineup.xi.length ? (
      <div className="px-5">
        <div className="mb-3 flex items-center gap-3">
          <TeamLink team={team} className="flex flex-none items-center transition-opacity active:opacity-60">
            <Crest team={team} size={24} />
          </TeamLink>
          <span className="truncate text-[13px]" style={{ color: 'var(--ink-2)' }}>
            {lineup.coach || coachOf(team.id)}
          </span>
          <span className="label-sm ml-auto">{lineup.formation ? lineup.formation.label : ''}</span>
        </div>
        <Pitch lineup={lineup} team={team} />
      </div>
      ) : null}

      {lineup && lineup.bench ? (
      <section className="px-5">
        <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{lineup.bench.length}</span>}>
          Panchina
        </PanelTitle>
        <div className="panel-solid px-4 py-1">
          {lineup.bench.map((p, i) => {
            const player = playerById(p.playerId);
            return (
              <div
                key={p.playerId}
                className="flex items-center gap-3 py-2"
                style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}
              >
                <span className="tnum w-[20px] text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {p.number ?? ''}
                </span>
                <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: 'var(--ink)' }}>
                  {p.name}
                </span>
                {p.subIn ? (
                  <span className="tnum text-[10.5px]" style={{ color: 'var(--good)' }}>
                    {p.subIn}&apos;
                  </span>
                ) : null}
                <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
                  {comma(player ? player.rating : p.rating)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
      ) : null}
    </div>
  );
}

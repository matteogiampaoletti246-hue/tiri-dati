import Crest from '@/components/Crest';
import FormDots from '@/components/FormDots';
import TeamLink from '@/components/TeamLink';
import { teamForm } from '@/data/matches';

export default function FormCard({ match, home, away }) {
  return (
    <div className="glass mx-4 overflow-hidden rounded-[24px] px-4 py-3">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Forma recente</p>
      {[{ team: home, id: match.homeId }, { team: away, id: match.awayId }].map(({ team, id }, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <TeamLink team={team} className="flex min-w-0 items-center gap-3"><Crest team={team} size={24} /><span className="truncate text-[13.5px] font-semibold">{team ? team.name : '—'}</span></TeamLink>
          <span className="ml-auto"><FormDots form={teamForm(id)} size={17} /></span>
        </div>
      ))}
    </div>
  );
}

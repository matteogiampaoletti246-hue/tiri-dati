import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { recentMatches } from '@/data/extras';
import { teamById } from '@/data/teams';
import { conceptOf } from '@/components/match/FormCard';

const COL = { V: '#1FA45B', S: '#8A93A6', P: '#E0443A' };

const info = (m, teamId) => {
  const isHome = m.homeId === teamId;
  const gf = isHome ? m.score[0] : m.score[1];
  const ga = isHome ? m.score[1] : m.score[0];
  const [y, mo, da] = String(m.date).split('-').map(Number);
  const d = new Date(y, mo - 1, da);
  return { r: gf > ga ? 'V' : gf === ga ? 'S' : 'P', gf, ga, isHome, opp: teamById(isHome ? m.awayId : m.homeId), label: d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '') };
};

function Col({ team, id, side, concept }) {
  const list = recentMatches(id, 5).filter((m) => Array.isArray(m.score));
  const c = team ? team.colors[0] : '#2C3E66';
  const anim = { animation: `${side === 'l' ? 'slinL' : 'slinR'} .5s cubic-bezier(.22,.8,.24,1) both` };
  const head = (
    <TeamLink team={team} className="flex flex-col items-center gap-1 pb-2.5 pt-1">
      <Crest team={team} size={concept === 'c' ? 30 : 28} />
      <span className="max-w-full truncate text-[12.5px] font-extrabold">{team ? team.name : '—'}</span>
    </TeamLink>
  );
  const rows = list.map((m) => {
    const x = info(m, id);
    if (concept === 'b') {
      return (
        <div key={m.id} className="flex items-center gap-1.5 py-1.5" style={{ flexDirection: side === 'l' ? 'row' : 'row-reverse', borderTop: '1px solid var(--hair-2)' }}>
          <Crest team={x.opp} size={19} />
          <span className="tnum flex-1 text-[13px] font-bold" style={{ textAlign: side === 'l' ? 'left' : 'right' }}>{x.gf}–{x.ga}</span>
          <span className="h-[18px] w-[4px] rounded-full" style={{ background: COL[x.r] }} />
        </div>
      );
    }
    if (concept === 'c') {
      return (
        <div key={m.id} className="mb-1.5 flex items-center justify-between rounded-[14px] px-2.5 py-2" style={{ background: `${COL[x.r]}1C`, border: `1px solid ${COL[x.r]}40` }}>
          <Crest team={x.opp} size={20} />
          <span className="tnum text-[14px] font-extrabold">{x.gf}–{x.ga}</span>
          <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ background: COL[x.r] }}>{x.r}</span>
        </div>
      );
    }
    return (
      <div key={m.id} className="flex items-center gap-2 py-1.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
        <Crest team={x.opp} size={20} />
        <span className="min-w-0 flex-1">
          <span className="tnum block text-[13px] font-bold leading-tight">{x.gf}–{x.ga}</span>
          <span className="block text-[9.5px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{x.label} · {x.isHome ? 'Casa' : 'Fuori'}</span>
        </span>
        <span className={`badge badge-${x.r.toLowerCase()}`} style={{ width: 20, height: 20, fontSize: 11 }}>{x.r}</span>
      </div>
    );
  });
  return (
    <div className="min-w-0 flex-1 px-3 py-3" style={{ ...anim, background: concept === 'c' ? 'transparent' : `linear-gradient(${side === 'l' ? '160deg' : '200deg'}, ${c}33, transparent 70%)` }}>
      {head}
      {rows}
    </div>
  );
}

export default function RecentSplit({ match, home, away, concept = conceptOf('ultime') }) {
  const gap = concept === 'c';
  return (
    <section className={gap ? 'mx-4' : 'glass mx-4 overflow-hidden rounded-[24px]'}>
      <h3 className={`pb-1 text-[12.5px] font-extrabold uppercase tracking-wider ${gap ? 'px-1' : 'px-4 pt-3.5'}`}>Ultime gare</h3>
      <div className={gap ? 'glass flex overflow-hidden rounded-[24px]' : 'flex'}>
        <Col team={home} id={match.homeId} side="l" concept={concept} />
        <span className="my-3 w-px" style={{ background: 'var(--hair-2)' }} />
        <Col team={away} id={match.awayId} side="r" concept={concept} />
      </div>
    </section>
  );
}

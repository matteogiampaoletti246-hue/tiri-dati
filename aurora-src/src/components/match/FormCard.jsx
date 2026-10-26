import Crest from '@/components/Crest';
import FormDots from '@/components/FormDots';
import TeamLink from '@/components/TeamLink';
import { teamForm } from '@/data/matches';
import { recentMatches } from '@/data/extras';
import { teamById } from '@/data/teams';
import { Link } from 'react-router-dom';

const COL = { V: '#1FA45B', S: '#8A93A6', P: '#E0443A' };
const PTS = { V: 3, S: 1, P: 0 };
export const conceptOf = (k) => { try { return localStorage.getItem(`sl-concept-${k}`) || 'a'; } catch { return 'a'; } };

const resOf = (m, teamId) => {
  if (!Array.isArray(m.score)) return null;
  const isHome = m.homeId === teamId;
  const gf = isHome ? m.score[0] : m.score[1];
  const ga = isHome ? m.score[1] : m.score[0];
  return { r: gf > ga ? 'V' : gf === ga ? 'S' : 'P', gf, ga, opp: teamById(isHome ? m.awayId : m.homeId), isHome };
};

function summary(form) {
  const v = form.filter((x) => x === 'V').length;
  const s = form.filter((x) => x === 'S').length;
  const p = form.filter((x) => x === 'P').length;
  return { v, s, p, pts: form.reduce((a, x) => a + (PTS[x] || 0), 0) };
}

export default function FormCard({ match, home, away, concept = 'c' }) {
  const sides = [{ team: home, id: match.homeId }, { team: away, id: match.awayId }];

  if (concept === 'b') {
    return (
      <div className="glass mx-4 overflow-hidden rounded-[24px] px-3 py-3.5">
        <p className="mb-3 px-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Forma recente</p>
        <div className="grid grid-cols-2 gap-2">
          {sides.map(({ team, id }, i) => {
            const f = teamForm(id);
            const sm = summary(f);
            const c = team ? team.colors[0] : '#2C3E66';
            return (
              <div key={i} className="flex flex-col items-center rounded-[18px] px-2 py-3" style={{ background: `linear-gradient(160deg, ${c}55, transparent 75%)`, border: '1px solid var(--hair-2)' }}>
                <TeamLink team={team} className="flex flex-col items-center gap-1.5"><Crest team={team} size={34} /><span className="max-w-[140px] truncate text-[13px] font-bold">{team ? team.name : '—'}</span></TeamLink>
                <div className="mt-2.5"><FormDots form={f} size={22} /></div>
                <p className="tnum mt-2.5 text-[22px] font-extrabold leading-none">{sm.pts}<span className="text-[11px] font-semibold" style={{ color: 'var(--ink-3)' }}> / {f.length * 3} pt</span></p>
                <p className="mt-1 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{sm.v}V · {sm.s}N · {sm.p}P</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (concept === 'c') {
    return (
      <div className="glass mx-4 overflow-hidden rounded-[24px] px-4 py-3.5">
        <div className="mb-2 flex items-baseline justify-between"><p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Forma recente</p><p className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>meno recente</p></div>
        {sides.map(({ team, id }, i) => {
          const list = recentMatches(id, 5).slice().reverse();
          return (
            <div key={i} className="py-2" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
              <TeamLink team={team} className="mb-2 flex items-center gap-2"><Crest team={team} size={20} /><span className="text-[13px] font-bold">{team ? team.name : '—'}</span></TeamLink>
              <div className="grid grid-cols-5 gap-1.5">
                {list.map((m, k) => {
                  const x = resOf(m, id);
                  if (!x) return null;
                  const [yy, mm, dd] = String(m.date).split('-').map(Number);
                  const lab = new Date(yy, mm - 1, dd).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }).replace('.', '');
                  const last = k === list.length - 1;
                  return (
                    <Link key={m.id} to={`/match/${m.id}`} className="press relative flex flex-col items-center gap-1 rounded-[12px] py-1.5" style={{ background: `${COL[x.r]}1F`, boxShadow: last ? `inset 0 -2px 0 ${COL[x.r]}, 0 0 0 1.5px ${COL[x.r]}` : `inset 0 -2px 0 ${COL[x.r]}` }}>
                      <Crest team={x.opp} size={17} />
                      <span className="tnum text-[11.5px] font-bold">{x.gf}–{x.ga}</span>
                      <span className="text-[8.5px] uppercase tracking-wide" style={{ color: 'var(--ink-3)' }}>{lab}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // A
  return (
    <div className="glass mx-4 overflow-hidden rounded-[24px] px-4 py-3">
      <p className="mb-1 text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>Forma recente</p>
      {sides.map(({ team, id }, i) => {
        const f = teamForm(id);
        const sm = summary(f);
        return (
          <div key={i} className="py-2.5" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <div className="flex items-center gap-3">
              <TeamLink team={team} className="flex min-w-0 items-center gap-3"><Crest team={team} size={26} /><span className="truncate text-[13.5px] font-semibold">{team ? team.name : '—'}</span></TeamLink>
              <span className="ml-auto"><FormDots form={f} size={21} /></span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-[5px] flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}>
                <span style={{ width: `${(sm.pts / Math.max(1, f.length * 3)) * 100}%`, background: 'linear-gradient(90deg, var(--accent), #1FA45B)' }} />
              </span>
              <span className="tnum text-[10.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>{sm.pts} pt su {f.length * 3} · {sm.v}V {sm.s}N {sm.p}P</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

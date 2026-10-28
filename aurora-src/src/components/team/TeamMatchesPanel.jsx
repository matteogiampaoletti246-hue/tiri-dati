import { useMemo, useState } from 'react';
import TextFilter from '@/components/TextFilter';
import CompSeasonBar from '@/components/CompSeasonBar';
import LeagueBadge from '@/components/LeagueBadge';
import MatchRow from '@/components/MatchRow';
import useAsync from '@/hooks/useAsync';
import { allTeamMatches } from '@/data/extras';
import { teamCompetitions } from '@/data/competitions';
import { announceComp } from '@/components/past/PastBits';
import { ArchRow, fmtDate, dayKey } from '@/components/archive/parts';
import { FM_ID, loadSeason, teamIdByName, teamSeasons, sortSeasons } from '@/data/archive';
import { leagueById, leagueTint } from '@/data/leagues';
import { teamById } from '@/data/teams';
import { DATES, TODAY_INDEX, isoDate } from '@/data/matches';
import { dayLabel, longDate } from '@/lib/format';
import { tintGrad } from '@/lib/tint';

const CUP_FMS = [42, 73, 10216];
const LID_BY_FM = Object.fromEntries(Object.entries(FM_ID).map(([k, v]) => [v, k]));

const MATCH = {
  all: () => true,
  results: (m) => m.status === 'finished',
  upcoming: (m) => m.status !== 'finished',
};

// competizioni (id FotMob) da cercare nell'archivio per una squadra
const fmsFor = (team, comp) => (comp === 'all'
  ? [...new Set([FM_ID[team.leagueId], ...CUP_FMS].filter(Boolean))]
  : [FM_ID[comp]].filter(Boolean));

const dayHeadLive = (iso) => {
  const idx = DATES.findIndex((d) => isoDate(d) === iso);
  return idx >= 0 ? dayLabel(DATES[idx], TODAY_INDEX, idx) : longDate(new Date(`${iso}T12:00:00`));
};

// Raggruppa partite consecutive della stessa competizione: ogni gruppo e' un riquadro a pillola col colore di quella competizione.
function Pills({ items, row, dayHead }) {
  const groups = [];
  items.forEach((it) => {
    const g = groups[groups.length - 1];
    if (g && g.lid === it.lid) g.items.push(it); else groups.push({ lid: it.lid, items: [it] });
  });
  return (
    <div>
      {groups.map((g, gi) => {
        const lg = leagueById(g.lid);
        return (
          <section key={`${g.lid}-${gi}-${g.items[0].key}`} className="glass mx-4 mt-4 overflow-hidden rounded-[24px]" style={{ background: tintGrad(leagueTint(g.lid), 0x45) }}>
            <div className="flex items-center gap-2.5 px-4 pb-1 pt-3.5">
              {lg ? <LeagueBadge league={lg} size={20} /> : null}
              <span className="flex-1 truncate text-[12px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>{lg ? lg.name : ''}</span>
              <span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{g.items.length}</span>
            </div>
            {g.items.map((it, i) => (
              <div key={it.key}>
                {i === 0 || it.day !== g.items[i - 1].day ? <div className="px-4 pb-0.5 pt-2.5 text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)', borderTop: '1px solid var(--hair-2)' }}>{dayHead(it.day)}</div> : null}
                {row(it)}
              </div>
            ))}
          </section>
        );
      })}
      <div className="h-6" />
    </div>
  );
}

// partite di una stagione passata: campionato e coppe europee dall'archivio, in ordine cronologico discendente
function PastSeason({ team, comp, sk, filter }) {
  const { data, loading } = useAsync(async () => {
    const out = [];
    for (const fm of fmsFor(team, comp)) {
      const s = await loadSeason(fm, sk);
      if (!s || !s.teams) continue;
      const tid = teamIdByName(s.teams, team.name);
      if (!tid) continue;
      (s.fix || []).forEach((m) => {
        if (String(m[2]) !== String(tid) && String(m[3]) !== String(tid)) return;
        out.push({ key: `${fm}-${m[0]}`, day: dayKey(m[4]), date: String(m[4]), lid: LID_BY_FM[fm], fm, m, names: s.teams, tid, played: !!m[6] });
      });
    }
    return out;
  }, [team.name, comp, sk]);
  const list = useMemo(() => {
    const l = (data || []).filter((it) => (filter === 'all' ? true : filter === 'results' ? it.played : !it.played));
    return l.sort((a, b) => (filter === 'upcoming' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)));
  }, [data, filter]);
  if (loading) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Carico le partite…</p>;
  if (!list.length) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna partita</p>;
  return <Pills items={list} dayHead={(d) => fmtDate(d)} row={(it) => <ArchRow m={it.m} names={it.names} fm={it.fm} sk={sk} tid={it.tid} />} />;
}

// stagione in corso: partite gia' giocate e da giocare, con le competizioni che la squadra sta disputando
function CurrentSeason({ teamId, comp, filter }) {
  const list = useMemo(() => {
    const l = allTeamMatches(teamId).filter(MATCH[filter]).filter((m) => comp === 'all' || m.leagueId === comp);
    const items = l.map((m) => ({ key: m.id, day: m.date, ts: m.ts, lid: m.leagueId, m }));
    return items.sort((a, b) => (filter === 'upcoming' ? a.ts - b.ts : b.ts - a.ts));
  }, [teamId, comp, filter]);
  if (!list.length) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna partita</p>;
  return <Pills items={list} dayHead={dayHeadLive} row={(it) => <MatchRow match={it.m} teamId={teamId} />} />;
}

export default function TeamMatchesPanel({ teamId }) {
  const team = teamById(teamId);
  const [filter, setFilter] = useState('all');
  const [comp, setComp] = useState('all');
  const [season, setSeason] = useState('cur');
  const comps = teamCompetitions(teamId);
  // stagioni passate in cui la squadra ha giocato la competizione scelta (con "tutte" si sommano campionato e coppe europee)
  const { data: seasons } = useAsync(async () => {
    const lists = await Promise.all(fmsFor(team, comp).map((fm) => teamSeasons(fm, team.name)));
    return sortSeasons([...new Set(lists.flat())]);
  }, [team.name, comp]);
  const sList = seasons || [];
  const sk = season !== 'cur' && sList.includes(season) ? season : 'cur';

  return (
    <div className="pt-0">
      <CompSeasonBar
        comps={comps}
        comp={comp}
        allLabel="Tutte le competizioni"
        onComp={(c) => { setComp(c); announceComp(teamId, c); }}
        seasons={sList}
        season={sk}
        onSeason={setSeason}
      />
      <div className="px-5 pt-2">
        <TextFilter
          options={[
            { value: 'all', label: 'Tutte' },
            { value: 'results', label: 'Risultati' },
            { value: 'upcoming', label: 'Programmate' },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>
      <div key={`${comp}|${sk}|${filter}`} className="comp-in">
        {sk === 'cur' ? <CurrentSeason teamId={teamId} comp={comp} filter={filter} /> : <PastSeason team={team} comp={comp} sk={sk} filter={filter} />}
      </div>
    </div>
  );
}

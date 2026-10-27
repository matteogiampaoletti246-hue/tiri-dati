import { useState } from 'react';
import PanelTitle from '@/components/PanelTitle';
import CompareBars from '@/components/CompareBars';
import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import TextFilter from '@/components/TextFilter';
import MatchShotMap from './MatchShotMap';
import PreMatchStats from './PreMatchStats';
import { CATEGORY_DEFS, metricOf } from '@/data/standings';
import { comma, num } from '@/lib/format';

const LIVE_STATS = [
  { key: 'possesso', label: 'Possesso', format: (v) => `${comma(v, 0)}%` },
  { key: 'xg', label: 'xG', format: (v) => comma(v, 2) },
  { key: 'tiri', label: 'Tiri' },
  { key: 'tiriInPorta', label: 'Tiri in porta' },
  { key: 'occasioni', label: 'Occasioni nitide' },
  { key: 'corner', label: 'Corner' },
  { key: 'falli', label: 'Falli' },
  { key: 'cartellini', label: 'Cartellini' },
  { key: 'passaggi', label: 'Passaggi' },
  { key: 'fuorigioco', label: 'Fuorigioco' },
];

export default function MatchStatsPanel({ match, view, home, away, pre }) {
  const [period, setPeriod] = useState('all');
  const [full, setFull] = useState(false);
  const cs = 'a';

  if (pre) {
    return (
      <div>
        <PreMatchStats home={home} away={away} />
        <div className="mt-2">
          <button type="button" onClick={() => setFull(!full)} className="glass press mx-auto my-3 block rounded-full px-4 py-2 text-[12.5px] font-bold">
            {full ? 'Nascondi confronto completo' : 'Confronto completo delle statistiche'}
          </button>
          {full ? (
            <div className="flex flex-col gap-7 pt-2">
              {CATEGORY_DEFS.map((cat) => (
                <section key={cat.key} className="px-5">
                  <PanelTitle>{cat.title}</PanelTitle>
                  <CompareBars rows={cat.metrics.map((mt) => ({ label: mt.label, home: metricOf(match.homeId, mt.key), away: metricOf(match.awayId, mt.key) }))} format={num} />
                </section>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  const periods = view.statPeriods;
  const groups = periods ? periods[period] || periods.all : null;
  const per = { all: null, first: 'FirstHalf', second: 'SecondHalf' }[period];
  const shots = (view.shots || [])
    .filter((s) => (!per || s.period === per))
    .sort((a, b) => a.min - b.min);

  const stats = view.stats || {};
  const fallback = LIVE_STATS.filter((s) => stats[s.key]).map((s) => ({ label: s.label, home: stats[s.key][0], away: stats[s.key][1], format: s.format || num }));

  if (!groups && !fallback.length && !(view.shots || []).length) {
    return <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>{view.live ? 'Statistiche in arrivo' : 'Statistiche non disponibili per questa partita'}</p>;
  }

  return (
    <div className="flex flex-col gap-5 pb-4 pt-3">
      <div className="flex items-center gap-3 px-4">
        <TextFilter options={[{ value: 'all', label: 'Totale' }, { value: 'first', label: '1° tempo' }, { value: 'second', label: '2° tempo' }]} value={period} onChange={setPeriod} />
      </div>

      <div className="flex items-center gap-2 px-5">
        <TeamLink team={home} className="flex min-w-0 items-center gap-2"><Crest team={home} size={20} /><span className="truncate text-[12.5px] font-semibold">{home ? home.name : ''}</span></TeamLink>
        <TeamLink team={away} className="ml-auto flex min-w-0 items-center gap-2"><span className="truncate text-[12.5px] font-semibold">{away ? away.name : ''}</span><Crest team={away} size={20} /></TeamLink>
      </div>

      {groups ? (
        groups.slice(0, 1).map((g) => (
          <section key={g.key} className="glass tint-card mx-4 rounded-[24px] px-4 py-4">
            <PanelTitle>{g.title}</PanelTitle>
            <CompareBars variant={cs} rows={g.rows.map((r) => ({ label: r.label, home: r.home, away: r.away, homeText: r.homeText, awayText: r.awayText }))} />
          </section>
        ))
      ) : fallback.length ? (
        <section className="glass tint-card mx-4 rounded-[24px] px-4 py-4"><CompareBars variant={cs} rows={fallback} /></section>
      ) : null}

      {(view.shots || []).length ? (
        <section className="glass mx-4 rounded-[24px] px-4 py-4">
          <PanelTitle>Mappa tiri</PanelTitle>
          <MatchShotMap shots={shots} home={home} away={away} match={match} />
        </section>
      ) : null}

      {groups
        ? groups.slice(1).map((g) => (
            <section key={g.key} className="glass tint-card mx-4 rounded-[24px] px-4 py-4">
              <PanelTitle>{g.title}</PanelTitle>
              <CompareBars variant={cs} rows={g.rows.map((r) => ({ label: r.label, home: r.home, away: r.away, homeText: r.homeText, awayText: r.awayText }))} />
            </section>
          ))
        : null}
    </div>
  );
}

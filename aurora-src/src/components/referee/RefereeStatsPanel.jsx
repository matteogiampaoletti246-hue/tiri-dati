import UnderBar from '@/components/referee/UnderBar';
import PanelTitle from '@/components/PanelTitle';
import { comma } from '@/lib/format';
import { RefBar } from '@/components/match/RefereeCard';
import { leagueRefAvg, refStatsIn } from '@/data/referees';

const TILES = [
  { key: 'games', label: 'Gare' },
  { key: 'yellows', label: 'Gialli' },
  { key: 'reds', label: 'Rossi' },
  { key: 'penalties', label: 'Rigori' },
];

const ROWS = [
  { key: 'yellows', label: 'Cartellini gialli' },
  { key: 'reds', label: 'Cartellini rossi' },
  { key: 'fouls', label: 'Falli fischiati' },
  { key: 'penalties', label: 'Rigori assegnati' },
];

const COLS = '1fr 44px 54px';

// Ultime due stagioni (tutte le competizioni): gare, cartellini, medie. Dati di arbitri3/ (arbitri_gare.py).
function TwoSeasons({ two }) {
  const cards = two.m.reduce((a, x) => a + (x[8] || 0), 0);
  const tiles = [['Gare', two.n], ['Cartellini', cards], ['Cart. / gara', two.y != null ? comma(two.y, 2) : null], ['Falli / gara', two.fo != null ? comma(two.fo, 1) : null]].filter((t) => t[1] != null);
  return (
    <section className="px-5">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tiles.length}, 1fr)` }}>
        {tiles.map(([l, v]) => (
          <div key={l}>
            <p className="text-[9.5px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>{l}</p>
            <p className="tnum mt-1 text-[20px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px]" style={{ color: 'var(--ink-3)' }}>Ultime 2 stagioni, tutte le competizioni.</p>
      <div className="glass mt-4 rounded-[24px]"><UnderBar games={two.m} /></div>
    </section>
  );
}

export default function RefereeStatsPanel({ referee, two }) {
  const per = (value) => comma(referee.games ? value / referee.games : null, 2);

  const lg = referee.leagueId ? leagueRefAvg(referee.leagueId) : null;
  const st = lg ? refStatsIn(referee, referee.leagueId) : null;
  if (two) return <TwoSeasons two={two} />;
  return (
    <div className="flex flex-col gap-7">
      <section className="px-5">
        <div className="grid grid-cols-4 gap-3">
          {TILES.map((t) => (
            <div key={t.key}>
              <p className="text-[9.5px] uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>
                {t.label}
              </p>
              <p className="tnum mt-1 text-[20px] font-light" style={{ color: 'var(--ink)' }}>
                {referee[t.key]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {lg && st ? (
        <section className="px-5">
          <PanelTitle>Rispetto agli altri arbitri</PanelTitle>
          <div className="glass overflow-hidden rounded-[24px]">
            <RefBar label="Ammonizioni / partita" v={st.y} avg={lg.y} sorted={lg.ys} concept="b" />
            <div style={{ borderTop: '1px solid var(--hair-2)' }}><RefBar label="Falli fischiati / partita" v={st.fo} avg={lg.fo} sorted={lg.fos} concept="b" /></div>
            <p className="px-4 pb-3 text-[10px]" style={{ color: 'var(--ink-3)' }}>La lineetta è la media stagionale degli arbitri del campionato ({lg.n} arbitri).</p>
          </div>
        </section>
      ) : null}

      <section className="px-5">
        <PanelTitle>Medie</PanelTitle>
        <div
          className="grid items-center gap-2 pb-2 text-[9.5px] uppercase tracking-[.1em]"
          style={{ gridTemplateColumns: COLS, color: 'var(--ink-3)' }}
        >
          <span />
          <span className="text-right">Totale</span>
          <span className="text-right">Per gara</span>
        </div>
        <div className="panel-solid px-4 py-1">
          {ROWS.map((r, i) => (
            <div
              key={r.key}
              className="grid items-center gap-2 py-2.5"
              style={{ gridTemplateColumns: COLS, borderTop: i ? '1px solid var(--hair-2)' : 'none' }}
            >
              <span className="truncate text-[13px]" style={{ color: 'var(--ink-2)' }}>
                {r.label}
              </span>
              <span className="tnum text-right text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
                {referee[r.key]}
              </span>
              <span className="tnum text-right text-[13.5px] font-medium" style={{ color: 'var(--ink)' }}>
                {per(referee[r.key])}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

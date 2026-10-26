import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import Radar from './Radar';
import { comma } from '@/lib/format';
import { POS_IT, percentiles, ratingColor, dateIt } from './playerCalc';
import { teamByName } from '@/data/teams';
import { carriereOf, countryIt, FOOT, dateLong, ageOf, money, monthIt } from '@/data/carriere';

const L = { fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-3)' };

function RatingPill({ r, big }) {
  if (r === null || r === undefined) return <span className="tnum text-[12px]" style={{ color: 'var(--ink-3)' }}>—</span>;
  return (
    <span
      className="tnum inline-flex items-center justify-center rounded-lg font-semibold"
      style={{ background: ratingColor(r), color: '#fff', minWidth: big ? 44 : 36, height: big ? 28 : 22, fontSize: big ? 14 : 12 }}
    >
      {comma(r, 1)}
    </span>
  );
}

function Bars({ values, color }) {
  const vs = values.slice().reverse();
  return (
    <div className="flex h-[54px] items-end gap-1.5">
      {vs.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1">
          <span className="tnum text-[9.5px]" style={{ color: 'var(--ink-3)' }}>{comma(v, 1)}</span>
          <span className="w-full rounded-t-md" style={{ height: `${Math.max(8, ((v - 4) / 6) * 36)}px`, background: ratingColor(v), opacity: 0.9 }} />
        </div>
      ))}
    </div>
  );
}

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

function BioCard({ player, team }) {
  const c = carriereOf(player.id) || {};
  const age = ageOf(c.b);
  const cells = [
    ['Nazionalità', c.c ? countryIt(c.c) : '—'],
    ['Nato il', c.b ? `${dateLong(c.b)}${age ? ` · ${age} anni` : ''}` : '—'],
    ['Altezza', c.h ? `${c.h} cm` : '—'],
    ['Piede', FOOT[c.f] || '—'],
    ['Ruolo', POS_IT[player.position] || '—'],
    ['Maglia', c.n || player.number || '—'],
  ];
  return (
    <section>
      <PanelTitle>Informazioni</PanelTitle>
      <div className="panel-solid rounded-3xl px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <Crest team={team} size={30} />
          <div className="min-w-0">
            <p className="truncate text-[14.5px]" style={{ color: 'var(--ink)' }}>{team ? team.name : player.teamName}</p>
            <p className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{c.ce ? `Contratto fino al ${dateLong(c.ce)}` : ' '}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          {cells.map(([k, v]) => (
            <div key={k}>
              <p style={L}>{k}</p>
              <p className="mt-1 text-[14px]" style={{ color: 'var(--ink)' }}>{v}</p>
            </div>
          ))}
        </div>
        {c.mv ? (
          <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'rgba(127,160,200,.1)' }}>
            <span style={L}>Valore di mercato</span>
            <span className="tnum text-[17px] font-medium" style={{ color: '#e0a528' }}>{money(c.mv)}</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ---------- PROFILO ---------- */
export function ProfiloPanel({ player, team, concept }) {
  const pc = percentiles(player).filter((x) => x.key !== 'foulsCommitted');
  const colors = team ? team.colors : ['#1E4BD8', '#7FB6E8'];
  const r5 = player.ratings5 || [];
  const facts = [
    ['Squadra', team ? team.name : player.teamName],
    ['Ruolo', POS_IT[player.position] || '—'],
    ['Campionato', player.leagueId ? String(player.leagueId).toUpperCase() : '—'],
    ['Presenze', player.appearances],
    ['Minuti', player.minutes],
  ];
  const season = [
    ['Presenze', player.appearances],
    ['Gol', player.goals],
    ['Assist', player.assists],
    ['Voto', player.rating ? comma(player.rating, 2) : '—'],
  ];

  if (concept === 'b') {
    return (
      <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {season.map(([k, v]) => (
            <div key={k} className="panel-solid rounded-2xl px-4 py-4">
              <p style={L}>{k}</p>
              <p className="tnum mt-1 text-[30px] font-light leading-none" style={{ color: 'var(--ink)' }}>{v}</p>
            </div>
          ))}
        </div>
        {r5.length ? (
          <section>
            <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>media {comma(avg(r5), 2)}</span>}>Forma</PanelTitle>
            <div className="panel-solid rounded-2xl px-4 py-4"><Bars values={r5} /></div>
          </section>
        ) : null}
        <section>
          <PanelTitle>Punti di forza</PanelTitle>
          <div className="flex flex-wrap gap-2">
            {pc.filter((x) => x.pct !== null).sort((a, b) => b.pct - a.pct).slice(0, 4).map((x) => (
              <span key={x.key} className="glass-pill rounded-full px-3 py-1.5 text-[12px]" style={{ color: 'var(--ink)' }}>
                {x.label} <b className="tnum" style={{ color: 'var(--accent)' }}>{x.pct}°</b>
              </span>
            ))}
          </div>
        </section>
        <section>
          <PanelTitle>Informazioni</PanelTitle>
          <div className="panel-solid rounded-2xl px-4 py-1">
            {facts.map(([k, v], i) => (
              <div key={k} className="flex items-center justify-between py-3" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
                <span className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{k}</span>
                <span className="text-[13.5px]" style={{ color: 'var(--ink)' }}>{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (concept === 'c') {
    return (
      <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
        <div className="panel-solid flex items-center gap-5 rounded-3xl px-5 py-5">
          <div className="relative flex h-[92px] w-[92px] shrink-0 items-center justify-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--hair-2)" strokeWidth="7" />
              <circle cx="50" cy="50" r="44" fill="none" stroke={ratingColor(player.rating)} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${Math.max(0, Math.min(1, ((player.rating || 5) - 5) / 4)) * 276} 276`} transform="rotate(-90 50 50)" />
            </svg>
            <span className="tnum text-[26px] font-light" style={{ color: 'var(--ink)' }}>{player.rating ? comma(player.rating, 1) : '—'}</span>
          </div>
          <div className="grid flex-1 grid-cols-3 gap-2 text-center">
            {[['Pres.', player.appearances], ['Gol', player.goals], ['Assist', player.assists]].map(([k, v]) => (
              <div key={k}>
                <p className="tnum text-[22px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
                <p style={L}>{k}</p>
              </div>
            ))}
          </div>
        </div>
        <BioCard player={player} team={team} />
        <section>
          <PanelTitle>Profilo di gioco</PanelTitle>
          <div className="panel-solid rounded-3xl px-2 py-4"><Radar items={pc} color={colors[0]} /></div>
        </section>
      </div>
    );
  }

  // A — stile FotMob
  return (
    <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
      <div className="panel-solid rounded-2xl px-4 py-1">
        {facts.map(([k, v], i) => (
          <div key={k} className="flex items-center justify-between py-3" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
            <span className="text-[13px]" style={{ color: 'var(--ink-3)' }}>{k}</span>
            <span className="text-[13.5px]" style={{ color: 'var(--ink)' }}>{v}</span>
          </div>
        ))}
      </div>
      <section>
        <PanelTitle>Stagione</PanelTitle>
        <div className="panel-solid grid grid-cols-4 rounded-2xl px-2 py-4 text-center">
          {season.map(([k, v]) => (
            <div key={k}>
              <p className="tnum text-[22px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
              <p style={L}>{k}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <PanelTitle>Radar</PanelTitle>
        <div className="panel-solid rounded-2xl px-2 py-4"><Radar items={pc} color="var(--accent)" /></div>
        <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Percentile per 90&apos; tra i {POS_IT[player.position] ? POS_IT[player.position].toLowerCase() + 'i' : 'giocatori'} dei campionati</p>
      </section>
    </div>
  );
}

/* ---------- PARTITE ---------- */
export function PartitePanel({ player, concept }) {
  const rows = player.recent || [];
  if (!rows.length) {
    return <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessuna partita disponibile</p>;
  }
  return (
    <div className="px-5 pb-8 pt-5">
      <div className={concept === 'b' ? 'flex flex-col gap-2.5' : 'panel-solid rounded-2xl px-4 py-1'}>
        {rows.map((m, i) => {
          const opp = teamByName(m.opp);
          const body = (
            <>
              <Crest team={opp} size={26} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
                  {m.home ? 'vs' : '@'} {m.opp}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {dateIt(m.date)} · {m.minutes}&apos;
                  {m.goals ? ` · ⚽ ${m.goals}` : ''}
                  {m.assists ? ` · 🅰 ${m.assists}` : ''}
                </p>
              </div>
              <RatingPill r={m.rating} big={concept === 'c'} />
            </>
          );
          const cls = 'flex items-center gap-3 py-3 active:opacity-60';
          const st = concept === 'b'
            ? { background: 'var(--panel-solid, rgba(255,255,255,.04))', borderRadius: 16, padding: '12px 14px' }
            : { borderTop: i ? '1px solid var(--hair-2)' : 'none' };
          return m.matchId ? (
            <Link key={i} to={`/match/${m.matchId}`} className={cls} style={st}>{body}</Link>
          ) : (
            <div key={i} className={cls} style={st}>{body}</div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- STATISTICHE ---------- */
export function StatistichePanel({ player, concept }) {
  const pc = percentiles(player);
  const p = player;
  const totals = [
    ['Gol', p.goals], ['Assist', p.assists], ['Tiri', p.shots], ['In porta', p.shotsOnTarget],
    ['xG', p.xg === null || p.xg === undefined ? '—' : comma(p.xg, 2)], ['Falli fatti', p.foulsCommitted],
    ['Falli subiti', p.foulsDrawn], ['Fuorigioco', p.offsides], ['Gialli', p.yellows], ['Rossi', p.reds],
  ];
  return (
    <div className="flex flex-col gap-6 px-5 pb-8 pt-5">
      <section>
        <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{p.minutes} min</span>}>Per 90&apos;</PanelTitle>
        <div className={concept === 'b' ? 'flex flex-col gap-2.5' : 'panel-solid rounded-2xl px-4 py-2'}>
          {pc.map((x, i) => (
            <div
              key={x.key}
              className="py-2.5"
              style={concept === 'b' ? { background: 'rgba(127,160,200,.08)', borderRadius: 14, padding: '12px 14px' } : { borderTop: i ? '1px solid var(--hair-2)' : 'none' }}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[13px]" style={{ color: 'var(--ink-2)' }}>{x.label}</span>
                <span className="tnum text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
                  {comma(x.value, 2)} <span className="text-[10.5px] font-normal" style={{ color: 'var(--ink-3)' }}>({x.total === 0 ? 0 : comma(x.total, x.key === 'xg' ? 1 : 0)})</span>
                </span>
              </div>
              {x.pct !== null ? (
                concept === 'c' ? (
                  <div className="mt-2 flex items-center gap-[3px]">
                    {Array.from({ length: 20 }).map((_, k) => (
                      <span key={k} className="h-[8px] flex-1 rounded-[3px]" style={{ background: k < Math.round(x.pct / 5) ? 'var(--accent)' : 'var(--hair-2)' }} />
                    ))}
                    <span className="tnum ml-2 w-8 text-right text-[11px]" style={{ color: 'var(--ink-3)' }}>{x.pct}°</span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.max(3, x.pct)}%`, background: concept === 'b' ? ratingColor(5.5 + x.pct / 25) : 'var(--accent)' }} />
                    </div>
                    <span className="tnum w-8 text-right text-[11px]" style={{ color: 'var(--ink-3)' }}>{x.pct}°</span>
                  </div>
                )
              ) : null}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>Il percentile confronta il giocatore con chi ha lo stesso ruolo (almeno 270 minuti).</p>
      </section>
      <section>
        <PanelTitle>Totali stagione</PanelTitle>
        <div className="grid grid-cols-5 gap-y-4 rounded-2xl px-1 py-2 text-center panel-solid">
          {totals.map(([k, v]) => (
            <div key={k}>
              <p className="tnum text-[17px] font-light" style={{ color: 'var(--ink)' }}>{v}</p>
              <p style={{ ...L, fontSize: 8.5 }}>{k}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ---------- CARRIERA ---------- */
export function CarrieraPanel({ player }) {
  const c = carriereOf(player.id);
  const rows = (c && c.car) || [];
  if (!rows.length) {
    return <p className="px-5 py-16 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Carriera non disponibile per questo giocatore</p>;
  }
  return (
    <div className="px-5 pb-8 pt-5">
      <div className="flex flex-col gap-2.5">
        {rows.map((r, i) => {
          const t = teamByName(r[0]);
          return (
            <div key={i} className="flex items-center gap-3 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(127,160,200,.08)' }}>
              <Crest team={t || { name: r[0], initials: String(r[0] || '').slice(0, 2).toUpperCase(), colors: ['#37507a', '#5a7bb0'] }} size={30} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[14px]" style={{ color: 'var(--ink)' }}>
                  <span className="truncate">{r[0]}</span>{r[6] ? <span className="shrink-0 rounded-full px-1.5 text-[9.5px]" style={{ color: 'var(--ink-3)', border: '1px solid var(--hair-2)' }}>PRESTITO</span> : null}
                </p>
                <p className="mt-0.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                  {monthIt(r[1])} – {r[7] ? 'oggi' : monthIt(r[2]) || '—'}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                {[['Pres.', r[3]], ['Gol', r[4]], ['Ass.', r[5]]].map(([k, v]) => (
                  <div key={k} className="w-8">
                    <p className="tnum text-[14px]" style={{ color: 'var(--ink)' }}>{v || '0'}</p>
                    <p style={{ ...L, fontSize: 8 }}>{k}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

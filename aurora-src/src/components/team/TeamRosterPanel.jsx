import PlayerPhoto from '@/components/PlayerPhoto';
import { teamGrad } from '@/lib/tint';
import { teamById } from '@/data/teams';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import FlagDot from '@/components/FlagDot';
import { loadCarriere, carriereOf, countryIt, ageOf } from '@/data/carriere';
import { playersByTeam } from '@/data/players';
import { loadRose, roseOf, rosePoor, seasonRoster } from '@/data/rose';
import { FM_ID, currentSeason, playerFace } from '@/data/archive';
import { archiveId } from '@/data/archivePlayer';
import useAsync from '@/hooks/useAsync';

const GROUPS = [
  { key: 'GK', title: 'Portieri', color: '#E8B923', pos: ['GK'] },
  { key: 'DEF', title: 'Difensori', color: '#38A2FF', pos: ['DEF'] },
  { key: 'MID', title: 'Centrocampisti', color: '#3FCF8E', pos: ['MID'] },
  { key: 'ATT', title: 'Attaccanti', color: '#EF5B5B', pos: ['WNG', 'ATT'] },
  { key: 'UNK', title: 'Giocatori', color: '#8EA0BD', pos: ['UNK'] }, // ruolo non fornito dalla fonte (rosa ricavata dalle presenze)
];

// Allenatore: ultimo gruppo della rosa, stessa riga dei giocatori.
const COACH = '#B48CFF';
function CoachSection({ name, id, team }) {
  return (
    <section className="glass overflow-hidden rounded-[22px]" style={{ borderLeft: `3px solid ${COACH}` }}>
      <div className="flex items-center px-4 py-2.5" style={{ background: `${COACH}1f` }}>
        <b className="text-[12.5px] uppercase tracking-[.07em]" style={{ color: COACH }}>Allenatore</b>
      </div>
      <div className="h-1.5" />
      <div className="mx-2 mb-1.5 flex items-center gap-3 rounded-[18px] px-3 py-2" style={{ background: teamGrad(team, 0x55) }}>
        <span className="avatar h-[38px] w-[38px] text-[11px]"><PlayerPhoto src={id ? playerFace(id) : null} alt={name} /></span>
        <span className="block min-w-0 flex-1 truncate text-[14px] font-bold">{name}</span>
      </div>
    </section>
  );
}

// Rosa della squadra divisa per ruolo.
export default function TeamRosterPanel({ teamId }) {
  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    Promise.all([loadCarriere(), loadRose()]).then(() => on && bump((n) => n + 1));
    return () => { on = false; };
  }, []);
  const all = playersByTeam(teamId);
  const team = teamById(teamId);
  const rose = roseOf(team);
  const nk = (x) => String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const mine = {};
  all.forEach((p) => { mine[nk(p.name)] = p; });
  const fmR = rose ? FM_ID[rose.lg] : null;
  const { data: skR0 } = useAsync(() => (fmR ? currentSeason(fmR) : Promise.resolve(null)), [fmR]);
  // nessuna rosa (rose.json vuota o squadra di una competizione dell'archivio) e nessun giocatore dell'app: chi ha giocato la stagione in corso
  // anche con rose.json insufficiente (pochi giocatori o senza ruoli): si guarda la rosa completa di rosa/
  const noRose = (!(rose && rose.p && rose.p.length) || rosePoor(rose)) && !all.length;
  // allenatore e rosa completa si leggono sempre da rosa/ quando rose.json non ha la squadra
  const { data: sr } = useAsync(() => ((noRose || !(rose && rose.co)) && team ? seasonRoster(team) : Promise.resolve(null)), [noRose, teamId]);
  const roseOk = rose && rose.p && rose.p.length;
  const srBetter = noRose && sr && (!roseOk || (sr.p.length >= rose.p.length && sr.p.some((x) => x[2] !== 'UNK')));
  const R = srBetter ? { ...sr, fm: sr.fm || fmR, sk: sr.sk || skR0 } : roseOk ? { p: rose.p, fm: fmR, sk: skR0 } : null;
  const coachName = (rose && rose.co) || (sr && sr.co) || null;
  const coachId = (rose && rose.ci) || (sr && sr.ci) || null;
  const skR = R && R.sk;
  if (R) {
    const fmR2 = R.fm;
    // stesse righe: ruolo noto dalla rosa, altrimenti "Giocatori" ordinati per minuti giocati
    const grp = GROUPS.map((g) => ({ ...g, list: R.p.filter((r) => g.pos.includes(r[2]) || (g.key === 'ATT' && r[2] === 'ATT')).sort((a, b) => (b[7] || 0) - (a[7] || 0) || (b[11] || 0) - (a[11] || 0) || (a[3] || 99) - (b[3] || 99)) }));
    return (
      <div className="flex flex-col gap-3.5 px-4 pb-8 pt-4">
        {grp.filter((g) => g.list.length).map((g) => (
          <section key={g.key} className="glass overflow-hidden rounded-[22px]" style={{ borderLeft: `3px solid ${g.color}` }}>
            <div className="flex items-center px-4 py-2.5" style={{ background: `${g.color}1f` }}>
              <b className="text-[12.5px] uppercase tracking-[.07em]" style={{ color: g.color }}>{g.title}</b>
              <span className="ml-auto text-[12px]" style={{ color: 'var(--ink-3)' }}>{g.list.length}</span>
            </div>
            <div className="h-1.5" />
            {g.list.map((r) => {
              const bits = [r[4] ? countryIt(r[4]) : null, r[6] ? `${r[6]} cm` : null, r[5] ? `${r[5]} anni` : null].filter(Boolean);
              const to = mine[nk(r[1])] ? `/giocatore/${mine[nk(r[1])].id}` : skR && fmR2 && r[0] > 0 ? `/giocatore/${archiveId(fmR2, skR, r[0])}` : null;
              const Row = to ? Link : 'div'; // giocatore di una fonte esterna senza id FotMob: riga senza collegamento
              return (
                <Row key={r[0]} {...(to ? { to } : {})} className="press mx-2 mb-1.5 flex items-center gap-3 rounded-[18px] px-3 py-2" style={{ background: teamGrad(team, 0x55) }}>
                  <span className="avatar h-[38px] w-[38px] text-[11px]">
                    <PlayerPhoto src={r[0] > 0 ? playerFace(r[0]) : null} alt={r[1]} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold">{r[3] ? <span style={{ color: 'var(--accent)' }}>{r[3]} </span> : null}{r[1]}{r[10] ? <> <InjuryIcon size={15} /></> : null}</span>
                    {bits.length ? <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>{r[4] ? <FlagDot name={r[4]} size={14} /> : null}<span className="min-w-0 truncate">{bits.join(' · ')}</span></span> : null}
                  </span>
                </Row>
              );
            })}
          </section>
        ))}
        {coachName ? <CoachSection name={coachName} id={coachId} team={team} /> : null}
      </div>
    );
  }
  const grouped = GROUPS.map((g) => ({ ...g, list: all.filter((p) => g.pos.includes(p.position)).sort((a, b) => (b.minutes || 0) - (a.minutes || 0)) }));
  const other = all.filter((p) => !GROUPS.some((g) => g.pos.includes(p.position)));
  if (other.length) grouped.push({ key: 'OT', title: 'Altri', color: '#8EA0BD', list: other });
  if (!all.length) return null;

  return (
    <div className="flex flex-col gap-3.5 px-4 pb-8 pt-4">
      {grouped.filter((g) => g.list.length).map((g) => (
        <section key={g.key} className="glass overflow-hidden rounded-[22px]" style={{ borderLeft: `3px solid ${g.color}` }}>
          <div className="flex items-center px-4 py-2.5" style={{ background: `${g.color}1f` }}>
            <b className="text-[12.5px] uppercase tracking-[.07em]" style={{ color: g.color }}>{g.title}</b>
            <span className="ml-auto text-[12px]" style={{ color: 'var(--ink-3)' }}>{g.list.length}</span>
          </div>
          <div className="h-1.5" />
          {g.list.map((p) => (
            <Link key={p.id} to={`/giocatore/${p.id}`} className="press mx-2 mb-1.5 flex items-center gap-3 rounded-[18px] px-3 py-2" style={{ background: teamGrad(teamById(teamId), 0x55) }}>
              <span className="avatar h-[38px] w-[38px] text-[11px]">
                <PlayerPhoto src={p.photo} alt={p.name} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-bold">{(() => { const n = (carriereOf(p.id) || {}).n; return n ? <span style={{ color: 'var(--accent)' }}>{n} </span> : null; })()}{p.name}{injuryOf(p.id) ? <> <InjuryIcon size={15} /></> : null}</span>
                {(() => {
                  const c = carriereOf(p.id) || {};
                  const age = ageOf(c.b);
                  const bits = [c.c ? countryIt(c.c) : null, c.h ? `${c.h} cm` : null, age ? `${age} anni` : null].filter(Boolean);
                  return bits.length ? <span className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>{c.c ? <FlagDot name={c.c} size={14} /> : null}<span className="min-w-0 truncate">{bits.join(' · ')}</span></span> : null;
                })()}
              </span>
            </Link>
          ))}
        </section>
      ))}
      {coachName ? <CoachSection name={coachName} id={coachId} team={team} /> : null}
    </div>
  );
}

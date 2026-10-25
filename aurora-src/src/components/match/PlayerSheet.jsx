import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import Crest from '@/components/Crest';
import TextFilter from '@/components/TextFilter';
import MatchShotMap from './MatchShotMap';
import { CardIcon, SubIcon, BallIcon } from './EventIcons';
import { closePlayer, findInMatch, matchOf, ourPlayerId, usePlayerSheet } from '@/data/playerSheet';
import { useConcept } from '@/lib/concept';
import { comma } from '@/lib/format';
import { norm } from '@/data/util';

const IT = {
  rating_title: 'Voto', minutes_played: 'Minuti giocati', goals: 'Gol', assists: 'Assist', expected_assists: 'Assist previsti (xA)',
  xg_and_xa: 'xG + xA', accurate_passes: 'Passaggi riusciti', chances_created: 'Occasioni create', defensive_actions: 'Azioni difensive',
  touches: 'Tocchi', touches_opp_box: 'Tocchi in area avversaria', passes_into_final_third: 'Passaggi nell\'ultimo terzo',
  accurate_crosses: 'Cross riusciti', long_balls_accurate: 'Lanci lunghi riusciti', dispossessed: 'Palle perse', Offsides: 'Fuorigioco',
  'matchstats.headers.tackles': 'Contrasti', shot_blocks: 'Tiri bloccati', clearances: 'Respinte', headed_clearance: 'Respinte di testa',
  interceptions: 'Intercetti', recoveries: 'Palle recuperate', dribbled_past: 'Dribblato', ground_duels_won: 'Duelli a terra vinti',
  aerials_won: 'Duelli aerei vinti', fouls: 'Falli commessi', duel_won: 'Duelli vinti', duel_lost: 'Duelli persi',
  expected_goals: 'Gol attesi (xG)', expected_goals_on_target_variant: 'xG in porta (xGOT)', total_shots: 'Tiri totali',
  big_chance_created_team_title: 'Grandi occasioni create', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori',
  blocked_shots: 'Tiri murati', shot_accuracy: 'Precisione di tiro', dribbles_succeeded: 'Dribbling riusciti', corners: 'Calci d\'angolo',
  expected_goals_non_penalty: 'xG senza rigori', was_fouled: 'Falli subiti', big_chance_missed_title: 'Grandi occasioni mancate',
  errors_led_to_goal: 'Errori che portano a gol', saves: 'Parate', goals_conceded: 'Gol subiti', expected_goals_on_target_faced: 'xGOT subiti',
  goals_prevented: 'Gol evitati', keeper_diving_save: 'Parate in tuffo', saves_inside_box: 'Parate in area', keeper_sweeper: 'Uscite da libero',
  punches: 'Pugni', player_throws: 'Rimesse con le mani', keeper_high_claim: 'Uscite alte', clearance_off_the_line: 'Respinte sulla linea',
  conceded_penalties: 'Rigori concessi',
};
const GROUP = { top_stats: 'Statistiche top', attack: 'Attacco', defense: 'Difesa', duels: 'Duelli' };
const pct = (a, b) => (b ? ` (${Math.round((a / b) * 100)}%)` : '');
const fmt = (v, tot, type) => {
  if (v == null) return '—';
  if (type === 'fractionWithPercentage' || type === 'integerWithPercentage') return tot != null ? `${comma(v, 0)}/${comma(tot, 0)}${pct(v, tot)}` : comma(v, 0);
  if (type === 'percent') return `${comma(v, 0)}%`;
  return Number.isInteger(v) ? String(v) : comma(v, 2);
};
const tone = (v) => (v == null ? 'var(--hair)' : v >= 7.5 ? '#1FA45B' : v >= 7 ? '#5DBB3F' : v >= 6.5 ? '#E0B400' : v >= 6 ? '#E8892B' : '#E5484D');

function useCard(sheet) {
  return useMemo(() => {
    if (!sheet) return null;
    const match = matchOf(sheet.matchId);
    if (!match) return null;
    const f = findInMatch(match, sheet.name, sheet.fmId);
    const fmId = (f && f.fmId) || sheet.fmId || null;
    const raw = fmId && match.playerStats ? match.playerStats[fmId] : null;
    const groups = raw
      ? raw[3].map(([key, title, rows]) => ({
          key,
          title: GROUP[key] || title,
          rows: rows.map(([k, lab, v, tot, type]) => ({ k, label: IT[k] || lab, v, tot, type, text: fmt(v, tot, type) })),
        }))
      : [];
    const flat = {};
    groups.forEach((g) => g.rows.forEach((r) => { if (!(r.k in flat)) flat[r.k] = r; }));
    const n = norm(sheet.name);
    const shots = (match.shots || []).filter((s) => norm(s.playerName) === n);
    const evs = (match.events || []).filter((e) => norm(e.name) === n || (e.type === 'sub' && norm(e.inName) === n) || (e.type === 'goal' && e.assist && norm(e.assist) === n));
    const rating = (flat.rating_title && flat.rating_title.v) || (f && f.entry.rating) || null;
    const photo = (f && f.entry.photo) || (fmId ? `https://images.fotmob.com/image_resources/playerimages/${fmId}.png` : null);
    return { match, f, fmId, groups, flat, shots, evs, rating, photo, team: f && f.team, side: f && f.side, ourId: ourPlayerId(match, sheet.name, fmId), name: sheet.name };
  }, [sheet]);
}

function Face({ c, size = 76 }) {
  const t = c.team;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="block h-full w-full overflow-hidden rounded-full" style={{ background: t ? `linear-gradient(150deg, ${t.colors[0]}, ${t.colors[1]})` : 'var(--hair)' }}>
        {c.photo ? <img src={c.photo} alt={c.name} className="h-full w-full object-cover" decoding="async" /> : null}
      </span>
      {c.rating != null ? (
        <span className="tnum absolute -bottom-1 -right-2 rounded-full px-[7px] py-[2px] text-[12px] font-extrabold text-white" style={{ background: tone(c.rating), border: '2px solid var(--sky-2)' }}>{comma(c.rating, 1)}</span>
      ) : null}
    </span>
  );
}

function Badges({ c }) {
  const items = [];
  const goals = c.evs.filter((e) => e.type === 'goal' && norm(e.name) === norm(c.name));
  if (goals.length) items.push(<span key="g" className="flex items-center gap-1"><BallIcon size={15} />{goals.map((g) => `${g.minute}'`).join(' ')}</span>);
  const ass = c.evs.filter((e) => e.type === 'goal' && e.assist && norm(e.assist) === norm(c.name));
  if (ass.length) items.push(<span key="a" className="flex items-center gap-1">Assist {ass.map((g) => `${g.minute}'`).join(' ')}</span>);
  c.evs.filter((e) => (e.type === 'yellow' || e.type === 'red') && norm(e.name) === norm(c.name)).forEach((e, i) => items.push(<span key={`c${i}`} className="flex items-center gap-1"><CardIcon red={e.type === 'red'} size={15} />{e.minute}&apos;</span>));
  c.evs.filter((e) => e.type === 'sub').forEach((e, i) => items.push(<span key={`s${i}`} className="flex items-center gap-1"><SubIcon size={15} />{norm(e.inName) === norm(c.name) ? 'Entra' : 'Esce'} {e.minute}&apos;</span>));
  if (!items.length) return null;
  return <div className="flex flex-wrap gap-2">{items.map((it, i) => <span key={i} className="glass-flat rounded-full px-3 py-1.5 text-[12px] font-bold">{it}</span>)}</div>;
}

const Row = ({ r }) => (
  <div className="flex items-center justify-between py-[9px]" style={{ borderTop: '1px solid var(--hair-2)' }}>
    <span className="text-[13.5px]" style={{ color: 'var(--ink-2)' }}>{r.label}</span>
    <span className="tnum text-[13.5px] font-bold">{r.text}</span>
  </div>
);

const Lists = ({ groups, skip = [] }) => (
  <div className="flex flex-col gap-6">
    {groups.map((g) => {
      const rows = g.rows.filter((r) => !skip.includes(r.k));
      if (!rows.length) return null;
      return (
        <section key={g.key}>
          <h4 className="mb-1 text-[15px] font-extrabold">{g.title}</h4>
          {rows.map((r) => <Row key={g.key + r.k} r={r} />)}
        </section>
      );
    })}
  </div>
);

const TILE_KEYS = ['minutes_played', 'goals', 'assists', 'expected_goals', 'expected_assists', 'chances_created', 'accurate_passes', 'touches', 'defensive_actions'];
const Tiles = ({ c }) => {
  const tiles = TILE_KEYS.map((k) => c.flat[k]).filter(Boolean).slice(0, 9);
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {tiles.map((r) => (
        <div key={r.k} className="glass-flat rounded-[18px] px-2 py-3 text-center">
          <p className="tnum text-[19px] font-extrabold leading-none">{r.text.replace(/ \(\d+%\)/, '')}</p>
          <p className="mt-1.5 text-[10.5px] leading-tight" style={{ color: 'var(--ink-3)' }}>{r.label}</p>
        </div>
      ))}
    </div>
  );
};

const Shots = ({ c }) => (c.shots.length ? (
  <section>
    <h4 className="mb-2 text-[15px] font-extrabold">Mappa tiri</h4>
    <MatchShotMap shots={c.shots} match={c.match} home={null} away={null} linkNames={false} single />
  </section>
) : null);

function Body({ c, concept }) {
  const [tab, setTab] = useState('over');
  const noStats = !c.groups.length;
  const empty = noStats ? <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Statistiche del giocatore non disponibili per questa partita</p> : null;

  if (concept === 'b') {
    return (
      <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
        <Badges c={c} />
        {noStats ? empty : <Tiles c={c} />}
        <Shots c={c} />
        {!noStats ? <Lists groups={c.groups} skip={TILE_KEYS.concat('rating_title')} /> : null}
      </div>
    );
  }
  if (concept === 'c') {
    return (
      <div className="px-5 pb-6 pt-3">
        <TextFilter options={[{ value: 'over', label: 'Riepilogo' }, { value: 'stat', label: 'Statistiche' }, { value: 'shot', label: 'Tiri' }]} value={tab} onChange={setTab} />
        <div className="mt-5 flex flex-col gap-6">
          {tab === 'over' ? <><Badges c={c} />{noStats ? empty : <Tiles c={c} />}</> : null}
          {tab === 'stat' ? (noStats ? empty : <Lists groups={c.groups} skip={['rating_title']} />) : null}
          {tab === 'shot' ? (c.shots.length ? <Shots c={c} /> : <p className="py-8 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun tiro in questa partita</p>) : null}
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-6 px-5 pb-6 pt-4">
      <Badges c={c} />
      {noStats ? empty : <Lists groups={c.groups} skip={['rating_title']} />}
      <Shots c={c} />
    </div>
  );
}

function Header({ c, concept }) {
  const t = c.team;
  const col = t ? t.colors[0] : '#2a3a66';
  if (concept === 'b') {
    return (
      <div className="flex items-center gap-4 px-5 pb-1 pt-1">
        <Face c={c} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[20px] font-extrabold leading-tight">{c.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>{t ? <Crest team={t} size={16} /> : null}{t ? t.name : ''}{c.f && c.f.entry.number ? ` · n. ${c.f.entry.number}` : ''}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative px-5 pb-4 pt-2 text-center" style={{ background: concept === 'c' ? 'transparent' : `linear-gradient(180deg, ${col}88, transparent)` }}>
      <div className="flex justify-center"><Face c={c} size={concept === 'c' ? 64 : 78} /></div>
      <p className="mt-3 text-[19px] font-extrabold">{c.name}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>{t ? <Crest team={t} size={16} /> : null}{t ? t.name : ''}{c.f && c.f.entry.number ? ` · n. ${c.f.entry.number}` : ''}</p>
    </div>
  );
}

export default function PlayerSheetHost() {
  const sheet = usePlayerSheet();
  const c = useCard(sheet);
  const [concept] = useConcept('playersheet');
  const controls = useDragControls();
  const navigate = useNavigate();

  useEffect(() => {
    if (!sheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheet]);

  return createPortal(
    <AnimatePresence>
      {sheet && c ? (
        <motion.div key="ps" className="fixed inset-0 z-[80]" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.button type="button" aria-label="Chiudi" className="absolute inset-0" style={{ background: 'rgba(0,0,0,.55)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePlayer} />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px]"
            style={{ height: concept === 'b' ? '78dvh' : '92dvh', background: 'var(--sky-2)', border: '1px solid var(--glass-border)', boxShadow: '0 -20px 60px rgba(0,0,0,.5)' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(e, info) => { if (info.offset.y > 110 || info.velocity.y > 700) closePlayer(); }}
          >
            <div className="shrink-0 cursor-grab touch-none pb-1 pt-2.5" style={{ touchAction: 'none' }} onPointerDown={(e) => controls.start(e)}>
              <span className="mx-auto block h-[5px] w-10 rounded-full" style={{ background: 'var(--hair)' }} />
              <Header c={c} concept={concept} />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <Body c={c} concept={concept} />
              <div style={{ height: 84 }} />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3" style={{ background: 'linear-gradient(to top, var(--sky-2) 70%, transparent)' }}>
              <button type="button" onClick={closePlayer} aria-label="Chiudi" className="press flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--pill-bg)', border: '1px solid var(--glass-border)' }}><X size={20} /></button>
              <span className="flex-1" />
              {c.ourId ? (
                <button type="button" className="press rounded-full px-6 py-3 text-[14px] font-extrabold" style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => { closePlayer(); navigate(`/giocatore/${c.ourId}`); }}>Profilo</button>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useAnimationControls, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';
import Crest from '@/components/Crest';
import TextFilter from '@/components/TextFilter';
import MiniShotMap from './MiniShotMap';
import { CardIcon, SubIcon, BallIcon } from './EventIcons';
import { closePlayer, openPlayer, findInMatch, matchOf, ourPlayerId, usePlayerSheet } from '@/data/playerSheet';
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
    const lu = f && match.lineup ? match.lineup[f.side] : null;
    const roster = lu ? [...(lu.xi || []), ...(lu.bench || [])].filter((p) => p && p.name) : [];
    const idx = roster.findIndex((p) => norm(p.name) === norm(sheet.name) || (fmId && String(p.fmId) === String(fmId)));
    return { match, f, fmId, groups, flat, shots, evs, rating, photo, roster, idx, team: f && f.team, side: f && f.side, ourId: ourPlayerId(match, sheet.name, fmId), name: sheet.name };
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


const CATS = [
  ['Principali', ['total_shots', 'ShotsOnTarget', 'ShotsOffTarget', 'blocked_shots', 'shot_accuracy', 'chances_created', 'big_chance_created_team_title', 'expected_goals_non_penalty']],
  ['Passaggi', ['accurate_passes', 'passes_into_final_third', 'accurate_crosses', 'long_balls_accurate', 'line_breaking_passes']],
  ['Attacco', ['big_chance_missed_title', 'touches', 'touches_opp_box', 'dribbles_succeeded', 'dispossessed', 'Offsides', 'corners', 'shots_woodwork']],
  ['Difesa', ['defensive_actions', 'matchstats.headers.tackles', 'shot_blocks', 'clearances', 'headed_clearance', 'interceptions', 'recoveries', 'dribbled_past', 'saves', 'goals_conceded', 'goals_prevented', 'keeper_diving_save', 'saves_inside_box', 'keeper_sweeper', 'keeper_high_claim', 'punches', 'expected_goals_on_target_faced']],
  ['Duelli', ['duel_won', 'duel_lost', 'ground_duels_won', 'aerials_won']],
  ['Disciplina', ['fouls', 'was_fouled']],
];
const KPI_KEYS = ['minutes_played', 'goals', 'assists', 'expected_goals'];
const KPI_FALLBACK = { minutes_played: 'Minuti giocati', goals: 'Gol', assists: 'Assist', expected_goals: 'xG' };

function build(c) {
  const used = new Set(['rating_title', ...KPI_KEYS, 'expected_goals_on_target_variant', 'expected_assists', 'xg_and_xa']);
  const extra = ['expected_goals_on_target_variant', 'expected_assists'].map((k) => c.flat[k]).filter(Boolean);
  const kpi = KPI_KEYS.map((k) => ({ k, label: (c.flat[k] && c.flat[k].label) || KPI_FALLBACK[k], text: c.flat[k] ? c.flat[k].text : '—' }));
  const cats = CATS.map(([title, keys], i) => {
    const rows = keys.map((k) => { used.add(k); return c.flat[k]; }).filter(Boolean);
    if (i === 0) rows.unshift(...extra);
    if (title === 'Disciplina') {
      const y = c.evs.filter((e) => e.type === 'yellow' && norm(e.name) === norm(c.name)).length;
      const r = c.evs.filter((e) => e.type === 'red' && norm(e.name) === norm(c.name)).length;
      rows.push({ k: 'y', label: 'Gialli', text: String(y) }, { k: 'r', label: 'Rossi', text: String(r) });
    }
    return { title, rows };
  });
  const rest = [];
  c.groups.forEach((g) => g.rows.forEach((r) => { if (!used.has(r.k)) { used.add(r.k); rest.push(r); } }));
  if (rest.length) cats.push({ title: 'Altro', rows: rest });
  return { kpi, cats: cats.filter((x) => x.rows.length) };
}

const Rows = ({ rows }) => rows.map((r, i) => (
  <div key={r.k} className="flex items-center justify-between py-[9px]" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
    <span className="text-[13.5px]" style={{ color: 'var(--ink-2)' }}>{r.label}</span>
    <span className="tnum text-[13.5px] font-bold">{r.text}</span>
  </div>
));

const MapBlock = ({ c }) => (c.shots.length ? <MiniShotMap shots={c.shots} /> : (
  <p className="rounded-[16px] py-5 text-center text-[12.5px]" style={{ background: 'var(--hair-2)', color: 'var(--ink-3)' }}>Nessun tiro in questa partita</p>
));

function Body({ c, concept }) {
  const [chip, setChip] = useState(0);
  const noStats = !c.groups.length;
  const { kpi, cats } = useMemo(() => build(c), [c]);
  if (noStats) {
    return (
      <div className="flex flex-col gap-5 px-5 pb-6 pt-3">
        <Badges c={c} />
        <MapBlock c={c} />
        <p className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Statistiche del giocatore non disponibili per questa partita</p>
      </div>
    );
  }
  const Kpi4 = ({ tiles }) => (
    tiles ? (
      <div className="grid grid-cols-2 gap-2.5">
        {kpi.map((r) => (
          <div key={r.k} className="glass-flat rounded-[18px] px-4 py-3.5">
            <p className="tnum text-[26px] font-light leading-none">{r.text.replace(/ \(\d+%\)/, '')}</p>
            <p className="mt-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>{r.label}</p>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-4 text-center">
        {kpi.map((r) => (
          <div key={r.k}>
            <p className="tnum text-[22px] font-light leading-none">{r.text.replace(/ \(\d+%\)/, '')}</p>
            <p className="mt-1.5 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{r.label}</p>
          </div>
        ))}
      </div>
    )
  );

  if (concept === 'b') {
    return (
      <div className="flex flex-col gap-4 px-5 pb-6 pt-3">
        <Badges c={c} />
        <MapBlock c={c} />
        <Kpi4 tiles />
        {cats.map((g) => (
          <section key={g.title} className="rounded-[22px] px-4 pb-3 pt-3.5" style={{ background: 'var(--hair-2)' }}>
            <h4 className="mb-2 text-[14px] font-extrabold">{g.title}</h4>
            <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
              {g.rows.map((r) => (
                <div key={r.k}>
                  <p className="tnum text-[17px] font-semibold leading-none">{r.text}</p>
                  <p className="mt-1 text-[10.5px] leading-tight" style={{ color: 'var(--ink-3)' }}>{r.label}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }
  if (concept === 'c') {
    const cur = cats[Math.min(chip, cats.length - 1)];
    return (
      <div className="flex flex-col gap-4 px-5 pb-6 pt-3">
        <Badges c={c} />
        <MapBlock c={c} />
        <Kpi4 />
        <div className="hide-sb -mx-5 flex gap-2 overflow-x-auto px-5" data-no-swipe>
          {cats.map((g, i) => (
            <button key={g.title} type="button" onClick={() => setChip(i)} className="press shrink-0 rounded-full px-4 py-2 text-[12.5px] font-bold" style={{ background: i === chip ? 'var(--accent)' : 'var(--pill-bg)', color: i === chip ? '#fff' : 'var(--ink-2)', border: '1px solid var(--glass-border)' }}>{g.title}</button>
          ))}
        </div>
        <section><Rows rows={cur.rows} /></section>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-5 px-5 pb-6 pt-3">
      <Badges c={c} />
      <MapBlock c={c} />
      <div className="rounded-[20px] py-4" style={{ background: 'var(--hair-2)' }}><Kpi4 /></div>
      {cats.map((g) => (
        <section key={g.title}>
          <h4 className="mb-1 text-[15px] font-extrabold">{g.title}</h4>
          <Rows rows={g.rows} />
        </section>
      ))}
    </div>
  );
}

function Header({ c, concept }) {
  const t = c.team;
  const col = t ? t.colors[0] : '#2a3a66';
  const pos = c.idx >= 0 && c.roster.length ? `${c.idx + 1}/${c.roster.length}` : null;
  if (concept === 'b') {
    return (
      <div className="flex items-center gap-4 px-5 pb-1 pt-1">
        <Face c={c} size={64} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[20px] font-extrabold leading-tight">{c.name}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>{t ? <Crest team={t} size={16} /> : null}{t ? t.name : ''}{c.f && c.f.entry.number ? ` · n. ${c.f.entry.number}` : ''}{pos ? ` · ${pos}` : ''}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="relative px-5 pb-3 pt-2 text-center" style={{ background: concept === 'c' ? 'transparent' : `linear-gradient(180deg, ${col}88, transparent)` }}>
      <div className="flex justify-center"><Face c={c} size={concept === 'c' ? 64 : 78} /></div>
      <p className="mt-3 text-[19px] font-extrabold">{c.name}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>{t ? <Crest team={t} size={16} /> : null}{t ? t.name : ''}{c.f && c.f.entry.number ? ` · n. ${c.f.entry.number}` : ''}{pos ? ` · ${pos}` : ''}</p>
    </div>
  );
}

export default function PlayerSheetHost() {
  const sheet = usePlayerSheet();
  const c = useCard(sheet);
  const [concept] = useConcept('sheet2');
  const controls = useDragControls();
  const slide = useAnimationControls();
  const scroller = useRef(null);
  const busy = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheet]);

  const go = async (d) => {
    if (!c || busy.current) return false;
    const to = c.roster[c.idx + d];
    if (c.idx < 0 || !to) return false;
    busy.current = true;
    await slide.start({ x: d > 0 ? -420 : 420, opacity: 0, transition: { duration: 0.16, ease: 'easeIn' } });
    openPlayer({ matchId: sheet.matchId, name: to.name, fmId: to.fmId });
    if (scroller.current) scroller.current.scrollTop = 0;
    slide.set({ x: d > 0 ? 420 : -420, opacity: 0 });
    await slide.start({ x: 0, opacity: 1, transition: { duration: 0.24, ease: [0.22, 0.8, 0.24, 1] } });
    busy.current = false;
    return true;
  };

  const onSwipeEnd = async (e, info) => {
    const dx = info.offset.x;
    const v = info.velocity.x;
    if (Math.abs(dx) > 70 || Math.abs(v) > 500) {
      const ok = await go(dx < 0 ? 1 : -1);
      if (ok) return;
    }
    slide.start({ x: 0, opacity: 1, transition: { type: 'spring', stiffness: 420, damping: 34 } });
  };

  return createPortal(
    <AnimatePresence>
      {sheet && c ? (
        <motion.div key="ps" className="fixed inset-0 z-[80]" initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 1 }}>
          <motion.button type="button" aria-label="Chiudi" className="absolute inset-0" style={{ background: 'rgba(0,0,0,.55)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closePlayer} />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[430px] flex-col overflow-hidden rounded-t-[28px]"
            style={{ height: '92dvh', background: 'var(--sky-2)', border: '1px solid var(--glass-border)', boxShadow: '0 -20px 60px rgba(0,0,0,.5)' }}
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
            </div>
            <motion.div className="flex min-h-0 flex-1 flex-col" animate={slide} drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={0.35} onDragEnd={onSwipeEnd} style={{ touchAction: 'pan-y' }}>
              <div className="shrink-0"><Header c={c} concept={concept} /></div>
              <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}>
                <Body c={c} concept={concept} />
                <div style={{ height: 84 }} />
              </div>
            </motion.div>
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

import PlayerPhoto from '@/components/PlayerPhoto';
import { useModalLock } from '@/lib/modal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { X, ChevronRight } from 'lucide-react';
import Crest from '@/components/Crest';
import TextFilter from '@/components/TextFilter';
import ShotExplorer from './ShotExplorer';
import StatTabs from './StatTabs';
import { CardIcon, SubIcon, BallIcon } from './EventIcons';
import { closePlayer, openPlayer, findInMatch, matchOf, ourPlayerId, usePlayerSheet } from '@/data/playerSheet';
import { comma } from '@/lib/format';
import { shortName } from './Riassunto';
import { carousel, finishCarousel } from '@/lib/carousel';
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
    // minuti giocati dal cronometro della partita live: titolare = minuto attuale, subentrato = minuto attuale - minuto di ingresso,
    // sostituito = minuto di uscita - ingresso, espulso = minuto del rosso (solo se la fonte non da' gia' i minuti)
    let liveMins = null;
    if (match.status === 'live' && !flat.minutes_played && idx >= 0) {
      const mn = (x) => String(x == null ? '' : x).split('+').reduce((t, q) => t + (parseInt(q, 10) || 0), 0);
      const now = match.liveHalf ? 45 : (Number(match.liveMinute) || 0);
      const nxi = lu && lu.xi ? lu.xi.length : 0;
      const inEv = (match.events || []).find((e) => e.type === 'sub' && norm(e.inName) === n);
      const outEv = (match.events || []).find((e) => e.type === 'sub' && norm(e.name) === n);
      const redEv = (match.events || []).find((e) => e.type === 'red' && norm(e.name) === n);
      let start = null;
      if (idx < nxi) start = 0; else if (inEv) start = mn(inEv.minute);
      if (start != null) {
        let end = now;
        if (outEv) end = Math.min(end, mn(outEv.minute));
        if (redEv) end = Math.min(end, mn(redEv.minute));
        liveMins = Math.max(0, end - start);
      }
    }
    return { liveMins, match, f, fmId, groups, flat, shots, evs, rating, photo, roster, idx, team: f && f.team, side: f && f.side, ourId: ourPlayerId(match, sheet.name, fmId), name: sheet.name };
  }, [sheet]);
}

function Face({ c, size = 76 }) {
  const t = c.team;
  return (
    <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
      <span className="block h-full w-full overflow-hidden rounded-full" style={{ background: t ? `linear-gradient(150deg, ${t.colors[0]}, ${t.colors[1]})` : 'var(--hair)' }}>
        <PlayerPhoto src={c.photo} alt={c.name} />
      </span>
      {c.rating != null ? (
        <span className="tnum absolute -bottom-1 -right-2 rounded-full px-[7px] py-[2px] text-[12px] font-extrabold text-white" style={{ background: tone(c.rating), border: '2px solid var(--sky-2)' }}>{comma(c.rating, 1)}</span>
      ) : null}
    </span>
  );
}

function Badges({ c, onOpen }) {
  const items = [];
  const goals = c.evs.filter((e) => e.type === 'goal' && norm(e.name) === norm(c.name));
  if (goals.length) items.push(<span key="g" className="flex items-center gap-1"><BallIcon size={15} />{goals.map((g) => `${g.minute}'`).join(' ')}</span>);
  const ass = c.evs.filter((e) => e.type === 'goal' && e.assist && norm(e.assist) === norm(c.name));
  if (ass.length) items.push(<span key="a" className="flex items-center gap-1">Assist {ass.map((g) => `${g.minute}'`).join(' ')}</span>);
  c.evs.filter((e) => (e.type === 'yellow' || e.type === 'red') && norm(e.name) === norm(c.name)).forEach((e, i) => items.push(<span key={`c${i}`} className="flex items-center gap-1"><CardIcon red={e.type === 'red'} size={15} />{e.minute}&apos;</span>));
  const subs = c.evs.filter((e) => e.type === 'sub');
  const outs = subs.filter((e) => norm(e.inName) !== norm(c.name));
  const ins = subs.filter((e) => norm(e.inName) === norm(c.name));
  if (!items.length && !outs.length && !ins.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => <span key={i} className="glass-flat rounded-full px-3 py-1.5 text-[12px] font-bold">{it}</span>)}
      {[...ins.map((e) => ({ e, who: e.name, label: 'Entra', d: -1 })), ...outs.map((e) => ({ e, who: e.inName, label: 'Esce', d: 1 }))].map(({ e, who, label, d }, i) => {
        const f = findInMatch(c.match, who, null);
        const fm = f && f.fmId;
        const photo = (f && f.entry && f.entry.photo) || (fm ? `https://images.fotmob.com/image_resources/playerimages/${fm}.png` : null);
        return (
          <button key={`o${i}`} type="button" data-no-swipe onClick={() => onOpen({ matchId: c.match.id, name: who, fmId: fm || undefined }, d)} className="glass-flat press flex min-w-0 basis-full items-center gap-2 rounded-full py-1.5 pl-3 pr-2 text-left text-[12px] font-bold">
            <SubIcon size={15} />
            <span className="shrink-0">{label} {e.minute}&apos;</span>
            <span className="mx-0.5 h-4 w-px shrink-0" style={{ background: 'var(--hair)' }} />
            <span className="h-[26px] w-[26px] shrink-0 overflow-hidden rounded-full" style={{ background: 'var(--hair)' }}>{photo ? <img src={photo} alt="" className="h-full w-full object-cover" decoding="async" /> : null}</span>
            <span className="min-w-0 flex-1 truncate">{shortName(who)}</span>
            <ChevronRight size={15} className="shrink-0" style={{ color: 'var(--ink-3)' }} />
          </button>
        );
      })}
    </div>
  );
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
  const kpi = KPI_KEYS.map((k) => ({ k, label: (c.flat[k] && c.flat[k].label) || KPI_FALLBACK[k], text: c.flat[k] ? c.flat[k].text : (k === 'minutes_played' && c.liveMins != null ? String(c.liveMins) : '—') }));
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
  <p className="rounded-[16px] py-5 text-center text-[12.5px]" style={{ background: 'var(--hair-2)', color: 'var(--ink-3)' }}>Nessun tiro del giocatore</p>
));

function Body({ c, concept, onOpen }) {
  const noStats = !c.groups.length;
  const kpi = useMemo(() => build(c).kpi, [c]);
  return (
    <div className="flex flex-col gap-4 px-5 pb-6 pt-3">
      <Badges c={c} onOpen={onOpen} />
      {!noStats ? (
        <div className="grid grid-cols-4 text-center">
          {kpi.map((r) => (
            <div key={r.k}>
              <p className="tnum text-[22px] font-light leading-none">{r.text.replace(/ \(\d+%\)/, '')}</p>
              <p className="mt-1.5 text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{r.label}</p>
            </div>
          ))}
        </div>
      ) : null}
      <ShotExplorer key={c.name} shots={c.shots} concept={concept} />
      {noStats ? (
        null
      ) : (
        <StatTabs key={c.name + 't'} c={c} concept={concept} />
      )}
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
    <div className="relative px-5 pb-3 pt-2 text-center" >
      <div className="flex justify-center"><Face c={c} size={concept === 'c' ? 64 : 78} /></div>
      <p className="mt-3 text-[19px] font-extrabold">{c.name}</p>
      <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>{t ? <Crest team={t} size={16} /> : null}{t ? t.name : ''}{c.f && c.f.entry.number ? ` · n. ${c.f.entry.number}` : ''}{pos ? ` · ${pos}` : ''}</p>
    </div>
  );
}

export default function PlayerSheetHost() {
  const sheet = usePlayerSheet();
  const c = useCard(sheet);
  const concept = 'a'; // scelto: mappa tiri A + statistiche A
  const navigate = useNavigate();
  const sheetRef = useRef(null);
  const slideRef = useRef(null);
  const scroller = useRef(null);
  const backdropRef = useRef(null);
  const busy = useRef(false);
  const live = useRef({});
  live.current = { c, sheet };
  useModalLock(!!sheet); // pagina sotto immobile, niente swipe di giorni/schede/indietro mentre la finestra e' aperta

  useEffect(() => {
    if (!sheet) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [sheet]);

  const close = () => {
    const el = sheetRef.current;
    const bd = backdropRef.current;
    if (!el || busy.current) { closePlayer(); return; }
    busy.current = true;
    el.style.transition = 'transform .3s cubic-bezier(.4,0,.6,1)';
    el.style.transform = 'translate3d(0,105%,0)';
    if (bd) { bd.style.transition = 'opacity .3s ease'; bd.style.opacity = '0'; }
    setTimeout(() => { busy.current = false; closePlayer(); }, 300);
  };
  live.current.close = close;

  const go = (d) => {
    const { c: cc } = live.current;
    if (!cc || cc.idx < 0) return false;
    const to = cc.roster[cc.idx + d];
    if (!to) return false;
    return switchTo({ name: to.name, fmId: to.fmId }, d);
  };

  function switchTo(to, d) {
    const { sheet: sh } = live.current;
    if (busy.current || !sh) return false;
    const dx0 = live.current.dragDx || 0;
    live.current.dragDx = 0;
    busy.current = true;
    carousel(slideRef.current, dx0, d, () => {
      openPlayer({ matchId: sh.matchId, name: to.name, fmId: to.fmId });
      if (scroller.current) scroller.current.scrollTop = 0;
    }, () => { busy.current = false; }, 300, sheetRef.current);
    return true;
  }

  // gesti con eventi touch nativi: swipe laterale tra compagni, trascinamento verso il basso per chiudere
  useEffect(() => {
    const root = sheetRef.current;
    if (!root || !sheet) return undefined;
    let st = null;
    const onStart = (e) => {
      finishCarousel();
      if (busy.current || e.touches.length !== 1) { st = null; return; }
      const tgt = e.target;
      const inScroller = scroller.current && scroller.current.contains(tgt);
      st = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        t: Date.now(),
        axis: null,
        noH: !!(tgt.closest && tgt.closest('[data-no-swipe]')),
        top: !inScroller || scroller.current.scrollTop <= 0,
      };
    };
    const onMove = (e) => {
      if (!st) return;
      const dx = e.touches[0].clientX - st.x;
      const dy = e.touches[0].clientY - st.y;
      if (!st.axis) {
        if (Math.abs(dx) < 9 && Math.abs(dy) < 9) return;
        if (Math.abs(dx) > Math.abs(dy) * 1.2) st.axis = st.noH ? 'none' : 'x';
        else if (dy > 0 && st.top) st.axis = 'y';
        else st.axis = 'none';
      }
      if (st.axis === 'none') return;
      if (e.cancelable) e.preventDefault();
      if (st.axis === 'x') {
        const el = slideRef.current;
        const cc = live.current.c;
        const edge = !cc || cc.idx < 0 || (dx > 0 && cc.idx === 0) || (dx < 0 && cc.idx === cc.roster.length - 1);
        live.current.dragDx = edge ? dx * 0.25 : dx;
        if (el) {
          el.style.transition = 'none';
          el.style.transform = `translate3d(${edge ? dx * 0.25 : dx}px,0,0)`;
          el.style.opacity = String(Math.max(0.5, 1 - Math.abs(dx) / 600));
        }
      } else {
        root.style.transition = 'none';
        root.style.transform = `translate3d(0,${Math.max(0, dy) * 0.95}px,0)`;
        if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0.3, 1 - dy / 500));
      }
    };
    const onEnd = (e) => {
      const d = st;
      st = null;
      if (!d || !d.axis || d.axis === 'none') return;
      const t = (e.changedTouches && e.changedTouches[0]) || { clientX: d.x, clientY: d.y };
      const dx = t.clientX - d.x;
      const dy = t.clientY - d.y;
      const v = Math.max(80, Date.now() - d.t);
      if (d.axis === 'x') {
        const el = slideRef.current;
        if ((Math.abs(dx) > 70 || Math.abs(dx) / v > 0.45) && go(dx < 0 ? 1 : -1)) return;
        live.current.dragDx = 0;
        if (el) {
          el.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1), opacity .25s ease';
          el.style.transform = 'translate3d(0,0,0)';
          el.style.opacity = '1';
          setTimeout(() => { el.style.transition = ''; el.style.transform = ''; }, 270);
        }
      } else if (dy > 110 || dy / v > 0.6) {
        live.current.close();
      } else {
        root.style.transition = 'transform .28s cubic-bezier(.22,.8,.24,1)';
        root.style.transform = 'translate3d(0,0,0)';
        if (backdropRef.current) backdropRef.current.style.opacity = '1';
        setTimeout(() => { root.style.transition = ''; root.style.transform = ''; }, 300);
      }
    };
    root.addEventListener('touchstart', onStart, { passive: true });
    root.addEventListener('touchmove', onMove, { passive: false });
    root.addEventListener('touchend', onEnd, { passive: true });
    root.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      root.removeEventListener('touchstart', onStart);
      root.removeEventListener('touchmove', onMove);
      root.removeEventListener('touchend', onEnd);
      root.removeEventListener('touchcancel', onEnd);
    };
  }, [!!sheet && !!c]);

  return createPortal(
    sheet && c ? (
      <div data-no-back="1" role="dialog" aria-modal="true" className="fixed inset-0 z-[80]" style={{ touchAction: 'none' }}>
        <div ref={backdropRef} aria-hidden="true" className="absolute inset-0" style={{ background: 'rgba(0,0,0,.55)', animation: 'slfade .25s ease' }} onClick={close} onTouchMove={(e) => { if (e.cancelable) e.preventDefault(); }} />
        <div
          ref={sheetRef}
          className="absolute inset-x-0 bottom-0 mx-auto flex w-full max-w-[var(--sheet-w)] flex-col overflow-hidden rounded-t-[28px]"
          style={{ height: '92dvh', background: `linear-gradient(180deg, ${c.team ? c.team.colors[0] : '#2a3a66'}88, transparent 230px), var(--sky-2)`, border: '1px solid var(--glass-border)', boxShadow: '0 -20px 60px rgba(0,0,0,.5)', animation: 'slup .34s cubic-bezier(.22,.8,.24,1)', touchAction: 'pan-y' }}
        >
          <div className="shrink-0 pb-1 pt-2.5">
            <span className="mx-auto block h-[5px] w-10 rounded-full" style={{ background: 'var(--hair)' }} />
          </div>
          <div ref={slideRef} className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0"><Header c={c} concept={concept} /></div>
            <div ref={scroller} className="min-h-0 flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-y', overscrollBehavior: 'contain' }}>
              <Body c={c} concept={concept} onOpen={(to, d) => switchTo(to, d)} />
              <div style={{ height: 84 }} />
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3" style={{ background: 'linear-gradient(to top, var(--sky-2) 70%, transparent)' }}>
            <button type="button" onClick={close} aria-label="Chiudi" className="press flex h-12 w-12 items-center justify-center rounded-full" style={{ background: 'var(--pill-bg)', border: '1px solid var(--glass-border)' }}><X size={20} /></button>
            <span className="flex-1" />
            {c.ourId ? (
              <button type="button" className="press rounded-full px-6 py-3 text-[14px] font-extrabold" style={{ background: 'var(--accent)', color: '#fff' }} onClick={() => { closePlayer(); navigate(`/giocatore/${c.ourId}`); }}>Profilo</button>
            ) : null}
          </div>
        </div>
      </div>
    ) : null,
    document.body,
  );
}

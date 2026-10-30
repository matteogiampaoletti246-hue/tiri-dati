import { modalOpen } from '@/lib/modal';
import { memo, useEffect, useRef, useState } from 'react';
import { growBox } from '@/components/DayPager';
import { flushSync } from 'react-dom';
import { CalendarDays } from 'lucide-react';
import { useNavigationType } from 'react-router-dom';
import { primeKeyboard } from '@/lib/keyboard';
import { carousel, finishCarousel } from '@/lib/carousel';
import PageShell from '@/components/PageShell';
import HomeHeader from '@/components/HomeHeader';
import DayStrip, { dragDays } from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import LeagueGroup, { CountryGroup } from '@/components/LeagueGroup';
import { useEntityScope } from '@/components/past/PastBits';
import MatchRowSkeleton from '@/components/MatchRowSkeleton';
import Skeleton from '@/components/Skeleton';
import SearchOverlay from '@/components/SearchOverlay';
import useInitialLoad from '@/hooks/useInitialLoad';
import useTicker from '@/hooks/useTicker';
import { syncDayTimes, refreshStatus } from '@/data/fotmob';
import { loadDayFeed } from '@/data/dayFeed';
import { DATES, TODAY_INDEX, isoDate, matchesByDate, MATCHES } from '@/data/matches';
import { LEAGUES, leagueById } from '@/data/leagues';
import { countryCode, importance } from '@/data/countries';

// giorno scelto: resta in memoria mentre si naviga, cosi' tornando indietro si ritrova lo stesso giorno
const KEEP = { iso: null, filter: 'all', stamp: '' };

const addDays = (iso, k) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + k);
  return isoDate(d);
};
// il giorno si mostra solo quando orari e ordine sono definitivi (max 1,5 s di attesa): niente righe che si spostano dopo
// (anche le partite delle competizioni dell'archivio, giorni/<data>.json)
const dayReady = (iso) => Promise.race([Promise.all([syncDayTimes(iso).catch(() => 0), loadDayFeed(iso).catch(() => 0)]), new Promise((r) => setTimeout(r, 1500))]);
const ISO_LIST = DATES.map((d) => isoDate(d));
let TOUCHING = false;
let GLIDE = false;
// giorni gia' montati per intero (iso|filtro): il giorno vicino completo non fa ridisegnare la Home a inizio swipe
const BUILT = new Map();
// giorni con almeno le prime finestre montate (quanto serve per vederli durante lo scorrimento)
const BUILT_FIRST = new Map();
// aggiornamenti dalla rete: mai mentre il dito e' sullo schermo o il giorno sta scorrendo (si ridisegna appena la pagina e' ferma)
const later = (fn) => { const go = () => { if (TOUCHING || GLIDE) setTimeout(go, 200); else fn(); }; go(); };

// In alto, da soli: top campionati (i 5 aperti, gli altri 4 chiusi), coppe europee, competizioni internazionali.
// Tutte le altre competizioni stanno nella finestra del loro paese (paesi in ordine alfabetico italiano; dentro, in ordine di importanza).
const TOP_SOLO = ['serie-a', 'premier-league', 'la-liga', 'bundesliga', 'ligue-1', 'pro-league', 'eredivisie', 'liga-portugal', 'super-lig', 'champions-league', 'europa-league', 'conference-league'];
let LAYOUT = null;
const layout = () => {
  if (LAYOUT && LAYOUT.n === LEAGUES.length) return LAYOUT;
  const solo = new Map();
  TOP_SOLO.forEach((id, k) => solo.set(id, k));
  const pos = new Map(LEAGUES.map((L, i) => [L.id, i]));
  // internazionali (senza paese) subito dopo i top, nell'ordine dell'indice
  LEAGUES.forEach((L) => { if (!solo.has(L.id) && !countryCode(L)) solo.set(L.id, TOP_SOLO.length + pos.get(L.id)); });
  const rank = new Map(LEAGUES.map((L) => [L.id, importance(L) * 1e5 + pos.get(L.id)]));
  LAYOUT = { n: LEAGUES.length, solo, rank };
  return LAYOUT;
};
// un calcolo per giorno/filtro/versione: i ridisegni (minuto live, giorni vicini) non rifanno raggruppamenti e ordinamenti
const GROUPS = new Map();
// firma di un giorno: cambia solo se cambiano le sue partite (stato, risultato, orario); gli altri giorni non si ridisegnano
const daySig = (iso) => matchesByDate(iso).map((m) => `${m.id}${m.status[0]}${m.score ? m.score.join('-') : ''}${m.ts}`).join('|');
function groupsOf(iso, filter, ver) {
  const key = `${iso}|${filter}`;
  const hit = GROUPS.get(key);
  if (hit && hit.ver === ver && hit.lg === LEAGUES.length) return hit.list;
  const dm = matchesByDate(iso);
  const { solo, rank } = layout();
  const sh = filter === 'live' ? dm.filter((m) => m.status === 'live') : dm;
  const by = new Map();
  sh.forEach((m) => { if (!by.has(m.leagueId)) by.set(m.leagueId, []); by.get(m.leagueId).push(m); });
  const top = [];
  const countries = new Map();
  by.forEach((ms, id) => {
    const league = leagueById(id);
    if (!league) return;
    const g = { league, matches: ms.sort((a, b) => a.ts - b.ts) };
    if (solo.has(id)) { top.push(g); return; }
    const cc = countryCode(league);
    if (!countries.has(cc)) countries.set(cc, { cc, name: league.country || '', comps: [] });
    countries.get(cc).comps.push(g);
  });
  top.sort((a, b) => solo.get(a.league.id) - solo.get(b.league.id));
  const cs = [...countries.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'));
  cs.forEach((c) => c.comps.sort((a, b) => rank.get(a.league.id) - rank.get(b.league.id)));
  const list = [...top.map((g) => ({ key: g.league.id, g })), ...cs.map((c) => ({ key: `paese:${c.cc}`, c }))];
  GROUPS.set(key, { ver, lg: LEAGUES.length, list });
  if (GROUPS.size > 24) GROUPS.delete(GROUPS.keys().next().value);
  return list;
}

// Un giorno. Il giorno aperto si costruisce per intero (a pezzi se ci si arriva con uno swipe); i vicini mostrano solo le prime
// finestre (quello che si vede durante lo scorrimento) e si completano solo se la pagina e' scorsa in basso. Cosi' ogni swipe
// monta poche righe e non ne smonta centinaia; mai un pezzo costruito mentre il dito e' sullo schermo.
const FIRST = 8;
const STEP = 8;
const DayPane = memo(DayPaneBody, (a, b) => a.iso === b.iso && a.filter === b.filter && a.ver === b.ver
  // giorno gia' completo: diventare centrale o vicino non cambia nulla, niente ridisegno delle sue righe
  && ((a.lead === b.lead && a.need === b.need) || BUILT.get(`${b.iso}|${b.filter}`) === true)
  // il minuto live ridisegna solo il giorno centrale (tick 0 = giorno non centrale)
  && (a.tick === b.tick || a.tick === 0 || b.tick === 0));
function DayPaneBody({ iso, filter, ver, lead, need }) {
  const items = groupsOf(iso, filter, ver);
  // un giorno vicino appena arrivato parte vuoto (cambiare giorno non monta righe) e mostra le prime finestre a riposo
  const [cnt, setCnt] = useState(lead ? Infinity : 0);
  const eff = Math.max(cnt, need || 0);
  const key = `${iso}|${filter}`;
  BUILT.set(key, eff >= items.length);
  BUILT_FIRST.set(key, eff >= Math.min(FIRST, items.length));
  if (BUILT.size > 40) { BUILT.delete(BUILT.keys().next().value); BUILT_FIRST.delete(BUILT_FIRST.keys().next().value); }
  // richiesto (inizio swipe): il numero richiesto resta montato anche quando la richiesta finisce
  useEffect(() => { if (need && cnt < need) setCnt(need); }, [need, cnt]);
  useEffect(() => {
    // il giorno vicino si riempie a riposo (prime finestre), quello che diventa centrale con uno swipe si completa a pezzi;
    // mai con il dito o lo scorrimento in corso
    const goal = lead ? Infinity : FIRST;
    if (cnt >= Math.min(goal, items.length)) return undefined;
    let id;
    const go = () => { if (TOUCHING || GLIDE) { id = setTimeout(go, 120); return; } setCnt((c) => Math.min(goal, c + (lead ? STEP : 4))); };
    id = setTimeout(go, lead ? 50 : 70);
    return () => clearTimeout(id);
  }, [cnt, lead, items.length]);
  if (!items.length) {
    return (
      <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
        Nessuna partita
      </p>
    );
  }
  const live = filter === 'live';
  return items.slice(0, eff).map((it) => (it.g
    ? <LeagueGroup key={`${iso}|${it.key}`} league={it.g.league} matches={it.g.matches} iso={iso} forceOpen={live} />
    : <CountryGroup key={`${iso}|${it.key}`} cc={it.c.cc} name={it.c.name} comps={it.c.comps} iso={iso} forceOpen={live} />));
}

export default function Home() {
  useEntityScope('home');
  const keep = KEEP.iso !== null && KEEP.stamp === isoDate(new Date());
  const [iso, setIso] = useState(keep ? KEEP.iso : ISO_LIST[TODAY_INDEX]);
  const [filter, setFilter] = useState(keep ? KEEP.filter : 'all');
  KEEP.stamp = isoDate(new Date());
  KEEP.iso = iso;
  KEEP.filter = filter;
  const dayIdx = ISO_LIST.indexOf(iso);
  const custom = dayIdx < 0 ? iso : null;
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();
  // il minuto live si aggiorna ogni 10 s solo se c'e' una partita live; altrimenti ogni minuto (niente ridisegno di centinaia di righe per nulla)
  const tick = useTicker(MATCHES.some((m) => m.status === 'live') ? 10000 : 60000);

  const [ver, bump] = useState(0);
  // orari reali: prima il giorno aperto, poi gli altri in sottofondo
  const firstFx = useRef(true);
  useEffect(() => {
    let on = true;
    const again = () => later(() => on && bump((x) => x + 1));
    const run = () => {
      syncDayTimes(iso).then((n) => on && n && again());
      // competizioni dell'archivio del giorno aperto e dei due vicini (lo swipe tra giorni li trova gia' pronti)
      Promise.all([iso, addDays(iso, -1), addDays(iso, 1)].map((d) => loadDayFeed(d).catch(() => 0)))
        .then((ns) => { if (on && ns.some(Boolean)) again(); return refreshStatus(); })
        .then((n) => on && n && again());
    };
    // cambiando giorno la rete parte solo se ci si ferma (piu' swipe di fila = una sola richiesta, niente ridisegni in mezzo allo scorrimento)
    let tm = 0;
    if (firstFx.current) { firstFx.current = false; run(); } else tm = setTimeout(run, 280);
    return () => { on = false; clearTimeout(tm); };
  }, [iso]);
  // l'app torna in primo piano: stato e risultati di nuovo dalla fonte, poi la Home si ridisegna
  useEffect(() => {
    const vis = () => { if (!document.hidden) refreshStatus().then((n) => n && later(() => bump((x) => x + 1))); };
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pageshow', vis);
    const t = setInterval(vis, 30000);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', vis); window.removeEventListener('pageshow', vis); };
  }, []);
  useEffect(() => {
    let on = true;
    (async () => {
      for (const d of DATES) {
        if (!on) return;
        const n = await syncDayTimes(isoDate(d));
        const f = await loadDayFeed(isoDate(d)).catch(() => 0);
        // un giorno lontano da quello aperto non si ridisegna: quando lo si apre legge i dati gia' aggiornati
        if ((n || f) && on && Math.abs(ISO_LIST.indexOf(isoDate(d)) - ISO_LIST.indexOf(live.current.iso)) <= 1) later(() => on && bump((x) => x + 1));
      }
    })();
    return () => { on = false; };
  }, []);

  // giorni vicini (nessuno oltre i bordi della barra dei giorni)
  const prevIso = dayIdx === 0 ? null : addDays(iso, -1);
  const nextIso = dayIdx === ISO_LIST.length - 1 ? null : addDays(iso, 1);
  const [peek, setPeek] = useState(null);
  const peekRef = useRef(null);
  const showPeek = (v) => {
    if (peekRef.current === v) return;
    peekRef.current = v;
    // il giorno vicino si completa solo se la pagina e' scorsa in basso (si vedrebbe tagliato); in cima bastano le prime finestre
    if (v && (live.current.deep ? BUILT : BUILT_FIRST).get(`${v}|${live.current.filter}`)) return;
    setPeek(v);
  };
  const listRef = useRef(null);
  const busy = useRef(false);
  const finishRef = useRef(null);
  const moved = useRef(false);

  // cambio giorno vicino con scorrimento: i due giorni sono gia' affiancati, si muove solo la striscia
  const glide = (target, dx = 0) => {
    const el = listRef.current;
    if (!el) { setIso(target); return; }
    const w = Math.min(window.innerWidth, el.offsetWidth || 430);
    const dir = target === nextIso ? -1 : 1;
    busy.current = true;
    GLIDE = true;
    live.current.deep = true;
    showPeek(target);
    growBox(el);
    dragDays(-dir, true);
    let ended = false;
    let tm = 0;
    const end = () => {
      if (ended) return;
      ended = true;
      clearTimeout(tm);
      finishRef.current = null;
      // stili e cambio giorno nello stesso passaggio (nessun fotogramma in mezzo): un solo calcolo di stile e layout
      el.style.transition = 'none';
      el.style.height = '';
      el.style.transform = '';
      el.style.willChange = '';
      flushSync(() => { setIso(target); setPeek(null); peekRef.current = null; });
      busy.current = false;
      GLIDE = false;
    };
    finishRef.current = end;
    el.style.willChange = 'transform';
    requestAnimationFrame(() => {
      if (ended) return;
      el.style.transition = 'transform .26s cubic-bezier(.22,.8,.24,1)';
      el.style.transform = `translate3d(${dir * w}px,0,0)`;
      tm = setTimeout(end, 290);
    });
  };

  const goDay = (i) => {
    const target = ISO_LIST[i];
    if (target === iso) return;
    if (target === nextIso || target === prevIso) { finishCarousel(); glide(target); return; }
    const el = listRef.current;
    if (!el) { setIso(target); return; }
    const dir = i > dayIdx && dayIdx >= 0 ? -1 : 1;
    finishCarousel();
    busy.current = true;
    dayReady(target).then(() => carousel(el, 0, -dir, () => { setIso(target); }, () => { busy.current = false; }));
  };

  // Swipe laterale tra i giorni: eventi touch nativi su tutta la pagina (affidabili su iPhone).
  const live = useRef({});
  live.current = { iso, prevIso, nextIso, search: searchOpen, glide, filter, deep: live.current.deep };
  useEffect(() => {
    let st = null;
    const blocked = (t) => t.closest && t.closest('[data-no-swipe], input, select, textarea, [role="dialog"]');
    const onStart = (e) => {
      TOUCHING = true;
      live.current.deep = window.scrollY > 120;
      if (finishRef.current) finishRef.current();
      finishCarousel();
      if (e.touches.length !== 1 || busy.current || live.current.search || modalOpen() || blocked(e.target)) { st = null; return; }
      const t = e.touches[0];
      st = { x: t.clientX, y: t.clientY, t: Date.now(), on: false };
      moved.current = false;
    };
    const onMove = (e) => {
      if (!st) return;
      const t = e.touches[0];
      const dx = t.clientX - st.x;
      const dy = t.clientY - st.y;
      if (!st.on) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { st = null; return; }
        if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        st.on = true;
        moved.current = true;
      }
      if (e.cancelable) e.preventDefault();
      st.dx = dx;
      if (!st.raf) {
        st.raf = requestAnimationFrame(() => {
          if (!st) return;
          st.raf = 0;
          const el = listRef.current;
          const { prevIso: p, nextIso: n } = live.current;
          const nb = st.dx > 0 ? p : n;
          // altezza del riquadro misurata solo quando cambia il giorno affiancato (e il fotogramma dopo, a giorno costruito):
          // una misura a ogni fotogramma forzava il ricalcolo di tutta la pagina
          if (st.nb !== nb) { st.nb = nb; st.grow = 2; }
          showPeek(nb);
          if (el && st.grow > 0) { st.grow -= 1; growBox(el); }
          dragDays(nb ? -st.dx / Math.min(window.innerWidth, (el && el.offsetWidth) || 430) : 0);
          if (el) {
            el.style.transition = 'none';
            el.style.willChange = 'transform';
            el.style.transform = `translate3d(${nb ? st.dx : st.dx * 0.28}px,0,0)`;
          }
        });
      }
    };
    const onEnd = (e) => {
      TOUCHING = false;
      const d = st;
      st = null;
      if (d && d.raf) cancelAnimationFrame(d.raf);
      if (!d || !d.on) return;
      const t = (e.changedTouches && e.changedTouches[0]) || { clientX: d.x };
      const dx = t.clientX - d.x;
      const v = Math.abs(dx) / Math.max(80, Date.now() - d.t);
      const el = listRef.current;
      const { prevIso: p, nextIso: n, glide: gl } = live.current;
      // dito verso destra → giorno precedente (Ieri); dito verso sinistra → giorno successivo (Domani)
      const target = dx > 0 ? p : n;
      if ((Math.abs(dx) > 60 || v > 0.45) && target) {
        gl(target, dx);
      } else if (el) {
        el.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1)';
        el.style.transform = 'translate3d(0,0,0)';
        dragDays(0, true);
        setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.willChange = ''; el.style.height = ''; showPeek(null); }, 280);
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      TOUCHING = false;
      GLIDE = false;
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  // 3 caselle fisse a rotazione: cambiando giorno la casella che esce a sinistra rientra a destra con il giorno nuovo; le altre due restano
  // com'erano e cambia solo la loro posizione (nessuna proprieta' ereditata cambia: niente ricalcolo di stile sulle righe)
  const epoch = Math.floor(Date.parse(`${iso}T12:00:00Z`) / 864e5);
  const c0 = ((epoch % 3) + 3) % 3;
  const deepPeek = !!live.current.deep;
  const sigs = {};
  const panes = [0, 1, 2].map((sl) => {
    const role = (((sl - c0 + 1) % 3) + 3) % 3 - 1;
    const k = role === 0 ? iso : role === -1 ? prevIso : nextIso;
    if (k) sigs[k] = `${LEAGUES.length}#${daySig(k)}`;
    return { sl, k, role };
  });

  return (
    <PageShell swipeBack={false}>
      <div className="glass-head sticky top-0 z-30">
        <HomeHeader onSearch={() => { primeKeyboard(); setSearchOpen(true); }} />
        <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={custom ? -1 : dayIdx}
          onChange={goDay}
        />
      </div>

      <div className="flex items-center px-5 pb-1 pt-1">
        <TextFilter
          options={[
            { value: 'all', label: 'Tutte' },
            {
              value: 'live',
              label: (
                <span className="flex items-center gap-1.5">
                  <span className="live-dot" />
                  Live
                </span>
              ),
            },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <div className="ml-auto" />
        <label className="glass press relative flex h-9 w-9 items-center justify-center rounded-full" aria-label="Calendario">
          <CalendarDays size={16} strokeWidth={1.9} style={{ color: custom ? 'var(--accent)' : 'var(--ink)' }} />
          <input
            type="date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={iso}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              e.target.blur();
              dayReady(v).then(() => setIso(v));
            }}
            aria-label="Scegli data"
          />
        </label>
      </div>

      <div style={{ overflow: 'clip' }}>
      <div
        ref={listRef}
        style={{ minHeight: '55vh', position: 'relative', display: 'grid' }}
        onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}
      >
        {loading ? (
          <>
            {[0, 1].map((i) => (
              <div key={i} className="pt-4">
                <div className="flex items-center gap-2.5 px-5 pb-2">
                  <Skeleton className="h-[22px] w-[22px] rounded-full" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
                {[0, 1, 2].map((j) => (
                  <MatchRowSkeleton key={j} />
                ))}
              </div>
            ))}
          </>
        ) : (
          panes.map(({ sl, k, role }) => (
            <div
              key={sl}
              style={{ gridArea: '1 / 1', minWidth: 0, display: 'flow-root', ...(role ? { transform: `translateX(${role * 100}%)`, height: 0 } : null) }}
            >
              {k ? <DayPane key={k} iso={k} filter={filter} ver={sigs[k]} tick={role === 0 ? tick + 1 : 0} lead={role === 0} need={peek === k ? (deepPeek ? Infinity : FIRST) : 0} /> : null}
            </div>
          ))
        )}
      </div>
      </div>
      <div aria-hidden="true" style={{ height: 'calc(56px + env(safe-area-inset-bottom))' }} />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}

import { memo, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { CalendarDays } from 'lucide-react';
import { useNavigationType } from 'react-router-dom';
import { primeKeyboard } from '@/lib/keyboard';
import { carousel, finishCarousel } from '@/lib/carousel';
import PageShell from '@/components/PageShell';
import HomeHeader from '@/components/HomeHeader';
import DayStrip, { dragDays } from '@/components/DayStrip';
import TextFilter from '@/components/TextFilter';
import LeagueGroup from '@/components/LeagueGroup';
import MatchRowSkeleton from '@/components/MatchRowSkeleton';
import Skeleton from '@/components/Skeleton';
import SearchOverlay from '@/components/SearchOverlay';
import useInitialLoad from '@/hooks/useInitialLoad';
import useTicker from '@/hooks/useTicker';
import { syncDayTimes } from '@/data/fotmob';
import { DATES, TODAY_INDEX, isoDate, matchesByDate } from '@/data/matches';
import { LEAGUES } from '@/data/leagues';

// giorno scelto: resta in memoria mentre si naviga, cosi' tornando indietro si ritrova lo stesso giorno
const KEEP = { iso: null, filter: 'all', stamp: '' };

const addDays = (iso, k) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + k);
  return isoDate(d);
};
const ISO_LIST = DATES.map((d) => isoDate(d));
let TOUCHING = false;

function groupsOf(iso, filter) {
  const dm = matchesByDate(iso);
  const sh = filter === 'live' ? dm.filter((m) => m.status === 'live') : dm;
  return LEAGUES.map((league) => ({
    league,
    matches: sh.filter((m) => m.leagueId === league.id).sort((a, b) => a.ts - b.ts),
  })).filter((g) => g.matches.length);
}

// Un giorno intero. I giorni vicini sono gia' pronti accanto a quello aperto: durante lo swipe non c'e' nulla da costruire.
const DayPane = memo(function DayPane({ iso, filter, ver, tick, active }) {
  const groups = groupsOf(iso, filter);
  const total = groups.reduce((n, g) => n + g.matches.length, 0);
  // il giorno aperto si disegna subito; quelli vicini si preparano a piccoli passi mentre l'app e' ferma
  const [cnt, setCnt] = useState(active ? Infinity : 0);
  const eff = active ? Infinity : cnt;
  useEffect(() => {
    if (active) { if (cnt !== Infinity) setCnt(Infinity); return undefined; }
    if (cnt >= total) return undefined;
    let id;
    const go = () => { if (TOUCHING) { id = setTimeout(go, 120); return; } setCnt((c) => c + 12); };
    id = setTimeout(go, cnt === 0 ? 140 : 60);
    return () => clearTimeout(id);
  }, [cnt, active, total]);
  if (!groups.length) {
    return (
      <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
        Nessuna partita
      </p>
    );
  }
  if (eff === 0) return <div style={{ minHeight: '40vh' }} />;
  let seen = 0;
  const shown = [];
  for (const g of groups) {
    if (seen >= eff) break;
    shown.push(g);
    seen += g.matches.length;
  }
  return shown.map((g) => <LeagueGroup key={`${iso}|${g.league.id}`} league={g.league} matches={g.matches} forceOpen={filter === 'live'} />);
});

export default function Home() {
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
  const tick = useTicker(10000);

  const [ver, bump] = useState(0);
  // orari reali: prima il giorno aperto, poi gli altri in sottofondo
  useEffect(() => {
    let on = true;
    syncDayTimes(iso).then((n) => on && n && bump((x) => x + 1));
    return () => { on = false; };
  }, [iso]);
  useEffect(() => {
    let on = true;
    (async () => {
      for (const d of DATES) {
        if (!on) return;
        const n = await syncDayTimes(isoDate(d));
        if (n && on) bump((x) => x + 1);
      }
    })();
    return () => { on = false; };
  }, []);

  // giorni vicini (nessuno oltre i bordi della barra dei giorni)
  const prevIso = dayIdx === 0 ? null : addDays(iso, -1);
  const nextIso = dayIdx === ISO_LIST.length - 1 ? null : addDays(iso, 1);
  const [peek, setPeek] = useState(null);
  const peekRef = useRef(null);
  const showPeek = (v) => { if (peekRef.current !== v) { peekRef.current = v; setPeek(v); } };

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
    showPeek(target);
    dragDays(-dir, true);
    let ended = false;
    let tm = 0;
    const end = () => {
      if (ended) return;
      ended = true;
      clearTimeout(tm);
      finishRef.current = null;
      el.style.transition = 'none';
      flushSync(() => { setIso(target); setPeek(null); peekRef.current = null; });
      el.style.transform = '';
      el.style.willChange = '';
      busy.current = false;
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
    carousel(el, 0, -dir, () => { setIso(target); }, () => { busy.current = false; });
  };

  // Swipe laterale tra i giorni: eventi touch nativi su tutta la pagina (affidabili su iPhone).
  const live = useRef({});
  live.current = { iso, prevIso, nextIso, search: searchOpen, glide };
  useEffect(() => {
    let st = null;
    const blocked = (t) => t.closest && t.closest('[data-no-swipe], input, select, textarea, [role="dialog"]');
    const onStart = (e) => {
      TOUCHING = true;
      if (finishRef.current) finishRef.current();
      finishCarousel();
      if (e.touches.length !== 1 || busy.current || live.current.search || blocked(e.target)) { st = null; return; }
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
          showPeek(nb);
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
        setTimeout(() => { el.style.transition = ''; el.style.transform = ''; el.style.willChange = ''; showPeek(null); }, 280);
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      TOUCHING = false;
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  const panes = [];
  if (prevIso) panes.push({ k: prevIso, role: -1 });
  panes.push({ k: iso, role: 0 });
  if (nextIso) panes.push({ k: nextIso, role: 1 });

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
              setIso(v);
            }}
            aria-label="Scegli data"
          />
        </label>
      </div>

      <div style={{ overflow: 'clip' }}>
      <div
        ref={listRef}
        style={{ minHeight: '55vh', position: 'relative' }}
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
          panes.map(({ k, role }) => (
            <div
              key={k}
                            style={role ? { position: 'absolute', top: 0, width: '100%', left: `${role * 100}%`, display: 'flow-root' } : { display: 'flow-root' }}
            >
              <DayPane iso={k} filter={filter} ver={ver} tick={role === 0 ? tick : 0} active={role === 0 || peek === k} />
            </div>
          ))
        )}
      </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}

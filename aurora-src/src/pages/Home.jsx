import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { useNavigationType } from 'react-router-dom';
import { primeKeyboard } from '@/lib/keyboard';
import { carousel, finishCarousel } from '@/lib/carousel';
import PageShell from '@/components/PageShell';
import HomeHeader from '@/components/HomeHeader';
import DayStrip from '@/components/DayStrip';
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
const KEEP = { day: null, custom: null, filter: 'all', stamp: '' };

export default function Home() {
  const keep = KEEP.day !== null && KEEP.stamp === isoDate(new Date());
  const [dayIdx, setDayIdx] = useState(keep ? KEEP.day : TODAY_INDEX);
  const [filter, setFilter] = useState(keep ? KEEP.filter : 'all');
  const [custom, setCustom] = useState(keep ? KEEP.custom : null);
  KEEP.stamp = isoDate(new Date());
  KEEP.day = dayIdx;
  KEEP.custom = custom;
  KEEP.filter = filter;
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();
  useTicker(10000);
  const drag = useRef(null);

  const date = DATES[dayIdx];
  const [, bump] = useState(0);
  // orari reali: prima il giorno aperto, poi gli altri in sottofondo
  useEffect(() => {
    let on = true;
    const iso = custom || isoDate(DATES[dayIdx]);
    syncDayTimes(iso).then((n) => on && n && bump((x) => x + 1));
    return () => { on = false; };
  }, [dayIdx, custom]);
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
  const groupsOf = (iso) => {
    const dm = matchesByDate(iso);
    const sh = filter === 'live' ? dm.filter((m) => m.status === 'live') : dm;
    return LEAGUES.map((league) => ({
      league,
      matches: sh.filter((m) => m.leagueId === league.id).sort((a, b) => a.ts - b.ts),
    })).filter((g) => g.matches.length);
  };
  const groups = groupsOf(custom || isoDate(date));
  const [peek, setPeek] = useState(null);
  const peekRef = useRef(null);
  const showPeek = (v) => { if (peekRef.current !== v) { peekRef.current = v; setPeek(v); } };

  const listRef = useRef(null);
  const busy = useRef(false);
  const moved = useRef(false);

  // Scorrimento del contenuto: esce da un lato, il nuovo giorno entra dal lato opposto.
  const slide = (apply, exitDir) => {
    const el = listRef.current;
    if (!el) { apply(); return; }
    finishCarousel();
    busy.current = true;
    carousel(el, 0, -exitDir, apply, () => { busy.current = false; });
  };

  const goDay = (i) => {
    if (i === dayIdx && !custom) return;
    const dir = i > (custom ? -1 : dayIdx) ? -1 : 1;
    slide(() => { setCustom(null); setDayIdx(i); }, dir);
  };

  // Swipe laterale tra i giorni: eventi touch nativi su tutta la pagina (affidabili su iPhone).
  const live = useRef({});
  live.current = { dayIdx, slide, search: searchOpen };
  useEffect(() => {
    let st = null;
    const blocked = (t) => t.closest && t.closest('[data-no-swipe], input, select, textarea, [role="dialog"]');
    const onStart = (e) => {
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
      const el = listRef.current;
      const cd = live.current.dayIdx;
      const nd = cd + (dx > 0 ? -1 : 1);
      showPeek(nd >= 0 && nd <= DATES.length - 1 ? nd : null);
      if (el) {
        el.style.transition = 'none';
        el.style.transform = `translate3d(${dx}px,0,0)`;
      }
    };
    const onEnd = (e) => {
      const d = st;
      st = null;
      if (!d || !d.on) return;
      const t = (e.changedTouches && e.changedTouches[0]) || { clientX: d.x };
      const dx = t.clientX - d.x;
      const v = Math.abs(dx) / Math.max(80, Date.now() - d.t);
      const el = listRef.current;
      const { dayIdx: cur, slide: sl } = live.current;
      // dito verso destra → giorno precedente (Ieri); dito verso sinistra → giorno successivo (Domani)
      const next = cur + (dx > 0 ? -1 : 1);
      if ((Math.abs(dx) > 60 || v > 0.45) && next >= 0 && next <= DATES.length - 1) {
        busy.current = true;
        carousel(el, dx, dx > 0 ? -1 : 1, () => { peekRef.current = null; setPeek(null); setCustom(null); setDayIdx(next); }, () => { busy.current = false; });
      } else if (el) {
        el.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1), opacity .25s ease';
        el.style.transform = 'translate3d(0,0,0)';
        el.style.opacity = '1';
        setTimeout(() => showPeek(null), 280);
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: true });
    document.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  return (
    <PageShell>
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
        <label className="glass press relative ml-auto flex h-9 w-9 items-center justify-center rounded-full" aria-label="Calendario">
          <CalendarDays size={16} strokeWidth={1.9} style={{ color: custom ? 'var(--accent)' : 'var(--ink)' }} />
          <input
            type="date"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            value={custom || isoDate(date)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              e.target.blur();
              const idx = DATES.findIndex((d) => isoDate(d) === v);
              if (idx >= 0) {
                setCustom(null);
                setDayIdx(idx);
              } else setCustom(v);
            }}
            aria-label="Scegli data"
          />
        </label>
      </div>

      <div style={{ overflowX: 'clip' }}>
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
        ) : groups.length ? (
          groups.map((g) => <LeagueGroup key={g.league.id} league={g.league} matches={g.matches} />)
        ) : (
          <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>
            Nessuna partita
          </p>
        )}
        {peek !== null && peek !== dayIdx && !custom ? (
          <div aria-hidden="true" style={{ position: 'absolute', top: 0, width: '100%', left: peek > dayIdx ? '100%' : '-100%', pointerEvents: 'none' }}>
            {groupsOf(isoDate(DATES[peek])).map((g) => <LeagueGroup key={g.league.id} league={g.league} matches={g.matches} />)}
          </div>
        ) : null}
      </div>
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}

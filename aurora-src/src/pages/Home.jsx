import { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
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

export default function Home() {
  const [dayIdx, setDayIdx] = useState(TODAY_INDEX);
  const [filter, setFilter] = useState('all');
  const [custom, setCustom] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const loading = useInitialLoad();
  useTicker(30000);
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
  const dayMatches = matchesByDate(custom || isoDate(date));
  const liveMatches = dayMatches.filter((m) => m.status === 'live');
  const shown = filter === 'live' ? liveMatches : dayMatches;
  const groups = LEAGUES.map((league) => ({
    league,
    matches: shown.filter((m) => m.leagueId === league.id).sort((a, b) => a.ts - b.ts),
  })).filter((g) => g.matches.length);

  const listRef = useRef(null);
  const busy = useRef(false);
  const moved = useRef(false);

  // Scorrimento del contenuto: esce da un lato, il nuovo giorno entra dal lato opposto.
  const slide = (apply, exitDir, from = 0) => {
    const el = listRef.current;
    if (!el || busy.current) {
      apply();
      return;
    }
    busy.current = true;
    el.style.transition = 'transform .17s ease-in, opacity .17s ease-in';
    el.style.transform = `translate3d(${exitDir * 55}%,0,0)`;
    el.style.opacity = '0';
    setTimeout(() => {
      apply();
      el.style.transition = 'none';
      el.style.transform = `translate3d(${-exitDir * 55}%,0,0)`;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.style.transition = 'transform .3s cubic-bezier(.22,.8,.24,1), opacity .3s ease';
        el.style.transform = 'translate3d(0,0,0)';
        el.style.opacity = '1';
        setTimeout(() => { busy.current = false; }, 300);
      }));
    }, 170);
  };

  const goDay = (i) => {
    if (i === dayIdx && !custom) return;
    const dir = i > (custom ? -1 : dayIdx) ? -1 : 1;
    slide(() => { setCustom(null); setDayIdx(i); }, dir);
  };

  const onPointerDown = (e) => {
    if (busy.current) return;
    drag.current = { x: e.clientX, y: e.clientY, t: Date.now(), on: false };
    moved.current = false;
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dx) < 10 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
      d.on = true;
      moved.current = true;
    }
    const el = listRef.current;
    if (el) {
      el.style.transition = 'none';
      el.style.transform = `translate3d(${dx * 0.8}px,0,0)`;
      el.style.opacity = String(Math.max(0.45, 1 - Math.abs(dx) / 500));
    }
  };

  const onPointerUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.on) return;
    const dx = e.clientX - d.x;
    const v = Math.abs(dx) / Math.max(80, Date.now() - d.t);
    const el = listRef.current;
    // il contenuto segue il dito: verso destra si torna ai giorni precedenti, verso sinistra si va avanti
    const next = dayIdx + (dx > 0 ? -1 : 1);
    if ((Math.abs(dx) > 70 || v > 0.5) && next >= 0 && next <= DATES.length - 1) {
      const dir = dx > 0 ? 1 : -1;
      busy.current = false;
      slide(() => { setCustom(null); setDayIdx(next); }, dir);
    } else if (el) {
      el.style.transition = 'transform .25s cubic-bezier(.22,.8,.24,1), opacity .25s ease';
      el.style.transform = 'translate3d(0,0,0)';
      el.style.opacity = '1';
    }
  };

  return (
    <PageShell>
      <HomeHeader onSearch={() => setSearchOpen(true)} />

      <DayStrip dates={DATES} todayIndex={TODAY_INDEX} value={custom ? -1 : dayIdx}
        onChange={goDay}
      />

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

      <div
        ref={listRef}
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
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
      </div>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </PageShell>
  );
}

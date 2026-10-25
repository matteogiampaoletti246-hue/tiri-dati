import { useEffect, useRef, useState } from 'react';
import Crest from '@/components/Crest';
import LeagueBadge from '@/components/LeagueBadge';
import { teamById } from '@/data/teams';
import { leagueById } from '@/data/leagues';
import { matchKeyNumbers } from '@/data/extras';
import { comma } from '@/lib/format';

const EASE = 'transform .42s cubic-bezier(.22,.8,.24,1)';
const GAP = 12;

export default function MatchKeyNumbers({ match }) {
  const cards = matchKeyNumbers(match);
  const league = leagueById(match.leagueId);
  const home = teamById(match.homeId);
  const away = teamById(match.awayId);

  const wrapRef = useRef(null);
  const drag = useRef(null);
  const [width, setWidth] = useState(0);
  const [idx, setIdx] = useState(0);
  const [dx, setDx] = useState(0);
  const [held, setHeld] = useState(false);
  const n = cards.length;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (i) => setIdx(((i % n) + n) % n);

  const onDown = (e) => {
    drag.current = { x: e.clientX, moved: false };
    setHeld(true);
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const delta = e.clientX - d.x;
    if (Math.abs(delta) > 6) d.moved = true;
    setDx(delta);
  };

  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    setHeld(false);
    const w = (width || 1) + GAP;
    if (d && d.moved) {
      const delta = e.clientX - d.x;
      if (Math.abs(delta) > w * 0.25) go(delta < 0 ? idx + 1 : idx - 1);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const local = e.clientX - rect.left - idx * w;
      go(local < (width || 1) / 2 ? idx - 1 : idx + 1);
    }
    setDx(0);
  };

  const artFor = (side) => {
    const team = side === 'home' ? home : side === 'away' ? away : null;
    return team ? <Crest team={team} size={148} /> : league ? <LeagueBadge league={league} size={148} /> : null;
  };

  const colorsFor = (side) => {
    const team = side === 'home' ? home : side === 'away' ? away : null;
    if (team) return team.colors;
    return league ? league.colors : ['#1E4BD8', '#7FB6E8'];
  };

  if (!n) return null;

  return (
    <div className="px-5">
      <div ref={wrapRef} className="overflow-hidden">
        <div
          className="flex"
          data-no-swipe
          style={{
            gap: GAP,
            transform: `translate3d(${-(idx * ((width || 1) + GAP)) + dx}px,0,0)`,
            transition: drag.current ? 'none' : EASE,
            touchAction: 'pan-y',
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          {cards.map((card, i) => {
            const colors = colorsFor(card.side);
            return (
              <article
                key={`${card.side}-${i}`}
                className="relative h-[186px] flex-none overflow-hidden rounded-[22px]"
                style={{
                  width: width || '100%',
                  background: `linear-gradient(150deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
                  boxShadow: '0 22px 46px -30px rgba(12,38,84,.55)',
                }}
              >
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{ background: 'radial-gradient(78% 68% at 86% 6%, rgba(255,255,255,.22), transparent 64%)' }}
                />
                <span
                  className="pointer-events-none absolute inset-0"
                  style={{ background: 'linear-gradient(150deg, rgba(8,14,28,.30) 0%, rgba(8,14,28,.08) 62%, rgba(8,14,28,0) 100%)' }}
                />
                <span className="pointer-events-none absolute" style={{ right: '-14%', bottom: '-22%', opacity: 0.16 }} aria-hidden="true">
                  {artFor(card.side)}
                </span>

                <div className="relative flex h-full flex-col px-4 pb-4 pt-3">
                  <div className="flex gap-1.5">
                    {cards.map((_, j) => (
                      <span
                        key={j}
                        className="h-[2px] flex-1 overflow-hidden rounded-full"
                        style={{ background: 'rgba(255,255,255,.32)' }}
                      >
                        {j < i ? (
                          <span className="block h-full w-full" style={{ background: 'rgba(255,255,255,.92)' }} />
                        ) : null}
                        {j === i ? (
                          <span
                            className="km-fill block h-full w-full"
                            style={{
                              background: 'rgba(255,255,255,.92)',
                              animationPlayState: held || drag.current ? 'paused' : 'running',
                            }}
                            onAnimationEnd={() => go(idx + 1)}
                          />
                        ) : null}
                      </span>
                    ))}
                  </div>

                  <span className="title-xl tnum mt-7 text-[40px] leading-none" style={{ color: '#fff' }}>
                    {comma(card.value, card.digits)}
                    {card.unit || ''}
                  </span>
                  <span className="mt-2 text-[13px]" style={{ color: 'rgba(255,255,255,.88)' }}>
                    {card.label}
                  </span>
                  <span className="mt-auto text-[10.5px] uppercase tracking-[.12em]" style={{ color: 'rgba(255,255,255,.72)' }}>
                    {card.note}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

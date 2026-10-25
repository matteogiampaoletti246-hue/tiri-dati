import { useEffect, useRef, useState } from 'react';

const EASE = 'transform .42s cubic-bezier(.22,.8,.24,1)';

export default function SwipeTabs({ tabs, index, onChange, panels, gap = 14, className = '' }) {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  const barRef = useRef(null);
  const tabRefs = useRef([]);
  const drag = useRef(null);
  const dragging = useRef(false);
  const [width, setWidth] = useState(0);
  const [mounted, setMounted] = useState([0, 1]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setMounted((prev) => {
      const next = new Set(prev);
      [index - 1, index, index + 1].forEach((i) => {
        if (i >= 0 && i < tabs.length) next.add(i);
      });
      return Array.from(next);
    });
  }, [index, tabs.length]);

  const posBar = (from, to, t, animate) => {
    const a = tabRefs.current[from];
    const b = tabRefs.current[to] || a;
    const bar = barRef.current;
    if (!a || !bar) return;
    bar.style.transition = animate ? 'transform .34s cubic-bezier(.22,.8,.24,1), width .34s cubic-bezier(.22,.8,.24,1)' : 'none';
    const left = a.offsetLeft + (b.offsetLeft - a.offsetLeft) * t;
    const w = a.offsetWidth + (b.offsetWidth - a.offsetWidth) * t;
    bar.style.transform = `translate3d(${left}px,0,0)`;
    bar.style.width = `${w}px`;
  };

  useEffect(() => {
    if (dragging.current) return;
    const track = trackRef.current;
    if (track && width) {
      track.style.transition = EASE;
      track.style.transform = `translate3d(${-(index * (width + gap))}px,0,0)`;
    }
    posBar(index, index, 0, true);
  }, [index, width, gap]);

  const onDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.target.closest && e.target.closest('input, select, textarea, [data-no-swipe]')) return;
    drag.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onMove = (e) => {
    const d = drag.current;
    if (!d || !width) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!dragging.current) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      dragging.current = true;
    }
    const w = width + gap;
    let off = dx;
    if ((index === 0 && dx > 0) || (index === tabs.length - 1 && dx < 0)) off = dx * 0.3;
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform = `translate3d(${-(index * w) + off}px,0,0)`;
    }
    const p = Math.max(0, Math.min(tabs.length - 1, index - off / w));
    const from = Math.floor(p);
    posBar(from, Math.min(tabs.length - 1, from + 1), p - from, false);
  };

  const onUp = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !dragging.current) return;
    dragging.current = false;
    const dx = e.clientX - d.x;
    const dt = Math.max(120, Date.now() - d.t);
    const v = dx / dt;
    const w = width + gap;
    let next = index;
    if (Math.abs(dx) > w * 0.22 || Math.abs(v) > 0.45) next = dx < 0 ? index + 1 : index - 1;
    next = Math.max(0, Math.min(tabs.length - 1, next));
    if (trackRef.current) {
      trackRef.current.style.transition = EASE;
      trackRef.current.style.transform = `translate3d(${-(next * w)}px,0,0)`;
    }
    posBar(next, next, 0, true);
    if (next !== index) onChange(next);
  };

  return (
    <div className={className}>
      <div className="hide-sb relative overflow-x-auto px-5">
        <div className="relative flex items-center gap-6" style={{ width: 'max-content' }}>
          {tabs.map((tab, i) => (
            <button
              key={tab.key}
              type="button"
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              className={`tab-btn ${i === index ? 'is-on' : ''}`}
              onClick={() => onChange(i)}
            >
              {tab.label}
            </button>
          ))}
          <span
            ref={barRef}
            className="absolute bottom-0 left-0 h-px rounded-full"
            style={{ background: 'var(--accent)', transform: 'translate3d(0,0,0)' }}
          />
        </div>
      </div>

      <div ref={wrapRef} className="relative overflow-hidden" style={{ touchAction: 'pan-y' }} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div ref={trackRef} className="flex items-start">
          {panels.map((panel, i) => (
            <div key={tabs[i].key} style={{ width: width || '100%', marginRight: gap, flex: '0 0 auto' }}>
              {mounted.includes(i) ? panel : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

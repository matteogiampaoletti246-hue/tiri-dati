import React, { useRef, useState, useEffect } from 'react';

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  badge?: string;
}

interface SwipeableTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const SwipeableTabs: React.FC<SwipeableTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  children,
  className = '',
  headerClassName = ''
}) => {
  const tabHeaderRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  // Auto-scroll the active tab into view in header
  useEffect(() => {
    if (tabHeaderRef.current) {
      const activeBtn = tabHeaderRef.current.querySelector<HTMLButtonElement>(`[data-tab-id="${activeTab}"]`);
      if (activeBtn) {
        const container = tabHeaderRef.current;
        const scrollLeft = activeBtn.offsetLeft - (container.offsetWidth / 2) + (activeBtn.offsetWidth / 2);
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
      }
    }
  }, [activeTab]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchDeltaX(0);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - touchStart.x;
    const deltaY = currentY - touchStart.y;

    // Only swipe if mostly horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      setTouchDeltaX(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStart) return;
    const swipeThreshold = 50;

    if (touchDeltaX < -swipeThreshold && activeIndex < tabs.length - 1) {
      // Swiped left -> next tab
      onChange(tabs[activeIndex + 1].id);
    } else if (touchDeltaX > swipeThreshold && activeIndex > 0) {
      // Swiped right -> prev tab
      onChange(tabs[activeIndex - 1].id);
    }

    setTouchStart(null);
    setTouchDeltaX(0);
    setIsSwiping(false);
  };

  return (
    <div className={`flex flex-col w-full ${className}`}>
      {/* Sticky Tab Header with Animated Underline */}
      <div className={`sticky top-12 z-20 bg-slate-950/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 ${headerClassName}`}>
        <div
          ref={tabHeaderRef}
          className="flex items-center gap-1 px-4 overflow-x-auto no-scrollbar scroll-smooth"
        >
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                data-tab-id={tab.id}
                onClick={() => onChange(tab.id)}
                className={`relative py-3 px-3 text-xs md:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {/* Active Underline Indicator */}
                {isActive && (
                  <div
                    className="absolute bottom-0 left-1 right-1 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Swipeable Content Container */}
      <div
        className="w-full flex-1 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isSwiping && Math.abs(touchDeltaX) > 15 ? `translateX(${touchDeltaX * 0.15}px)` : undefined,
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out'
        }}
      >
        {children}
      </div>
    </div>
  );
};

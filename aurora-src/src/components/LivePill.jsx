// Pillola unica Tutte | Live: l'indicatore scorre da meta' a meta' con la stessa pillola e lo stesso contorno di tutti i selettori (come nell'app nativa).
export default function LivePill({ value, onChange, className = '' }) {
  const live = value === 'live';
  const txt = (on) => ({ color: on ? '#fff' : 'var(--ink-3)', transition: 'color .35s ease' });
  return (
    <div className={`halo-trigger w-fit rounded-full ${className}`}>
    <div className="relative flex h-[38px] w-[160px] overflow-hidden rounded-full" style={{ background: 'rgba(128,138,150,.14)', isolation: 'isolate' }}>
      <span aria-hidden="true" className="lg-thumb lg-move absolute bottom-0 left-0 top-0 rounded-full" style={{ width: '50%', transform: `translate3d(${live ? '100%' : '0'},0,0)`, zIndex: 0 }} />
      <button type="button" onClick={() => onChange('all')} className="relative flex-1 text-[13.5px] font-semibold" style={{ ...txt(!live), zIndex: 1 }}>Tutte</button>
      <button type="button" onClick={() => onChange('live')} className="relative flex flex-1 items-center justify-center gap-[6px] text-[13.5px] font-semibold" style={{ ...txt(live), zIndex: 1 }}>
        <span className="rounded-full" style={{ width: 7, height: 7, background: live ? '#fff' : 'var(--live)', transition: 'background-color .35s ease' }} />
        Live
      </button>
    </div>
    </div>
  );
}

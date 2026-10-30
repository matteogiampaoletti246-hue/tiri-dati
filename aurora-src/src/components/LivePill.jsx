// Pillola unica Tutte | Live: l'indicatore scorre da meta' a meta' e passa dal blu al rosso (stesso disegno dell'app nativa).
export default function LivePill({ value, onChange, className = '' }) {
  const live = value === 'live';
  const txt = (on) => ({ color: on ? '#fff' : 'var(--ink-3)', transition: 'color .35s ease' });
  return (
    <div className={`relative flex h-[38px] w-[160px] overflow-hidden rounded-full ${className}`} style={{ background: 'rgba(128,138,150,.14)', border: '1px solid var(--hair)', isolation: 'isolate' }}>
      <span aria-hidden="true" className="absolute bottom-0 left-0 top-0 rounded-full" style={{ width: '50%', transform: `translate3d(${live ? '100%' : '0'},0,0)`, background: live ? 'var(--live)' : 'var(--accent)', transition: 'transform .42s cubic-bezier(.4,0,.2,1), background-color .42s ease', zIndex: 0 }} />
      <button type="button" onClick={() => onChange('all')} className="relative flex-1 text-[13.5px] font-semibold" style={{ ...txt(!live), zIndex: 1 }}>Tutte</button>
      <button type="button" onClick={() => onChange('live')} className="relative flex flex-1 items-center justify-center gap-[6px] text-[13.5px] font-semibold" style={{ ...txt(live), zIndex: 1 }}>
        <span className="rounded-full" style={{ width: 7, height: 7, background: live ? '#fff' : 'var(--live)', transition: 'background-color .35s ease' }} />
        Live
      </button>
    </div>
  );
}

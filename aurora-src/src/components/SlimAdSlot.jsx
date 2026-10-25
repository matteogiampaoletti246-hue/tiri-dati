export default function SlimAdSlot({ label = 'Pubblicità' }) {
  return (
    <div className="mx-5 flex items-center gap-3 panel-flat px-4 py-2.5">
      <span className="text-[9.5px] font-medium uppercase tracking-[.2em]" style={{ color: 'var(--ink-3)' }}>
        {label}
      </span>
      <span className="h-px flex-1" style={{ background: 'var(--hair-2)' }} />
    </div>
  );
}

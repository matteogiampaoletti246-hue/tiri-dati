// Riquadro di riepilogo: casa / trasferta / ultime partite.
export default function StatBox({ label, value }) {
  return (
    <div className="panel-flat flex-1 px-3 py-2.5">
      <p className="label-sm">{label}</p>
      <p className="tnum mt-1 text-[15px]" style={{ color: 'var(--ink)' }}>
        {value}
      </p>
    </div>
  );
}

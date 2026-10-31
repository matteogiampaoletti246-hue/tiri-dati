// Pillola del risultato provvisorio nelle classifiche (concept A): rossa, lampeggia piano. `lv` = { us, them, min } dalla riga di classifica.
export default function LiveScorePill({ lv }) {
  if (!lv) return null;
  return (
    <span className="live-pill tnum ml-auto inline-flex shrink-0 items-center gap-[5px] rounded-full px-2 py-[2px] text-[11.5px] font-extrabold text-white" style={{ background: 'var(--live)' }} title={lv.min ? `In diretta · ${lv.min}` : 'In diretta'}>
      <span aria-hidden="true" className="h-[5px] w-[5px] rounded-full bg-white" />
      {lv.us}-{lv.them}
    </span>
  );
}

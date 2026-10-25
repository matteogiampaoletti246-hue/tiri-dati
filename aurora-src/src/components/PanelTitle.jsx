export default function PanelTitle({ children, right }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <p className="label-sm">{children}</p>
      {right ? <div className="ml-auto">{right}</div> : null}
    </div>
  );
}

const CLASS = { V: 'badge-v', P: 'badge-p', S: 'badge-s' };

export default function FormDots({ form = [], size = 16 }) {
  return (
    <div className="flex items-center gap-1.5">
      {form.map((r, i) => (
        <span
          key={i}
          className={`badge tnum ${CLASS[r] || 'badge-s'}`}
          style={{ width: size, height: size, fontSize: Math.round(size * 0.62) }}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

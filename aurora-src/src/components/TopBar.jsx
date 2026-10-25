import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function TopBar({ title, subtitle, right, back = true, bare = false }) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30">
      <div
        className={bare ? 'flex items-center gap-3 px-5 py-3' : 'flex items-center gap-3 px-5 py-3.5'}
        style={{
          background: bare ? 'transparent' : 'color-mix(in srgb, var(--sky-2) 70%, transparent)',
          backdropFilter: bare ? 'none' : 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: bare ? 'none' : 'blur(20px) saturate(160%)',
        }}
      >
        {back ? (
          <button type="button" className="icon-btn -ml-1" aria-label="Indietro" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} strokeWidth={1.25} />
          </button>
        ) : null}
        <div className="min-w-0">
          {title ? (
            <h1 className="title-lg truncate text-[17px] tracking-[-.03em]" style={{ color: 'var(--ink)' }}>
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="truncate text-[11px] font-normal" style={{ color: 'var(--ink-3)' }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {right ? <div className="ml-auto flex items-center gap-4">{right}</div> : null}
      </div>
    </header>
  );
}

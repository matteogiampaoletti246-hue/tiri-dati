import { Check, X } from 'lucide-react';
import { seasonLabel } from '@/data/archive';

// Scelta della stagione: foglio che sale dal basso con tutte le stagioni disponibili.
export default function SeasonSheet({ open, seasons, value, currentLabel, onSelect, onClose }) {
  if (!open) return null;
  return (
    <div className="fade-in fixed inset-0 z-[70]" style={{ background: 'rgba(0,0,0,.5)' }} onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[var(--sheet-w)] rounded-t-[28px] pb-8 pt-3" style={{ background: 'var(--sky-2)', border: '1px solid var(--hair)', boxShadow: '0 -20px 50px rgba(0,0,0,.45)' }} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1 w-10 rounded-full" style={{ background: 'var(--hair)' }} />
        <div className="flex items-center justify-between px-6 pb-2">
          <p className="title-sora text-[20px]">Stagione</p>
          <button type="button" className="icon-btn" aria-label="Chiudi" onClick={onClose}><X size={20} strokeWidth={1.5} /></button>
        </div>
        <div className="hide-sb max-h-[56vh] overflow-y-auto px-3">
          {seasons.map((s) => {
            const on = s === value;
            return (
              <button key={s} type="button" onClick={() => onSelect(s)} className="press flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left" style={{ background: on ? 'var(--accent-soft)' : 'transparent' }}>
                <span className="tnum flex-1 text-[16px] font-bold" style={{ color: on ? 'var(--accent)' : 'var(--ink)' }}>{s === 'live' ? currentLabel : seasonLabel(s)}</span>
                {s === 'live' ? <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>in corso</span> : null}
                {on ? <Check size={17} strokeWidth={2.2} style={{ color: 'var(--accent)' }} /> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

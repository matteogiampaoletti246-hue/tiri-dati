import TintSweep, { ringStyle } from './TintSweep';
import RoleBadge from './RoleBadge';
import { useEffect, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import Crest from '@/components/Crest';
import PanelTitle from '@/components/PanelTitle';
import PlayerPhoto from '@/components/PlayerPhoto';
import { playerFace } from '@/data/archive';
import { comma } from '@/lib/format';

const MAX = 3;
const lum = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
};

// Duello avversario (concept A): elenco della rosa avversaria con volto, minuti e media a 90' su ogni riga; fino a 3 giocatori.
export default function DuelPicker({ team, roster, picked, onChange, statLabel, tint, roles }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [team && team.id]);
  const c0 = (team && team.colors && team.colors[0]) || '#2C3E66';
  const c1 = (team && team.colors && team.colors[1]) || '#F2B705';
  const tc = lum(c0) > 0.62 ? '#0b1220' : '#fff';
  const sel = picked.map((id) => roster.find((r) => r.id === id)).filter(Boolean);
  const avg = sel.length ? sel.reduce((s, r) => s + r.avg90, 0) / sel.length : null;
  const toggle = (id) => {
    if (picked.includes(id)) onChange(picked.filter((x) => x !== id));
    else if (picked.length < MAX) onChange([...picked, id]);
  };
  const Face = ({ id, size }) => (
    <span className="grid shrink-0 place-items-center overflow-hidden rounded-full" style={{ width: size, height: size, background: c0, border: `2px solid ${c1}` }}>
      <PlayerPhoto src={playerFace(id)} className="h-full w-full" />
    </span>
  );
  return (
    <section data-no-swipe="true">
      <PanelTitle>Duello avversario</PanelTitle>
      <div className="panel has-tint overflow-hidden" style={ringStyle(tint)}>
        <TintSweep tint={tint} />
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="press flex w-full items-center gap-3 px-4 py-3.5 text-left">
          {sel.length ? (
            <span className="flex shrink-0">
              {sel.map((r, i) => <span key={r.id} style={{ marginLeft: i ? -10 : 0 }}><Face id={r.id} size={28} /></span>)}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 truncate text-[14.5px]" style={{ color: sel.length ? 'var(--ink)' : 'var(--ink-3)', fontWeight: sel.length ? 700 : 400 }}>
            {sel.length === 0 ? 'Scegli avversario' : sel.length === 1 ? sel[0].name : `${sel.length} avversari`}
          </span>
          {avg !== null ? <span className="tnum text-[15px] font-extrabold">{comma(avg, 2)}</span> : null}
          <ChevronDown size={16} strokeWidth={1.75} style={{ color: 'var(--ink-3)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
        </button>
        {open ? (
          <div style={{ borderTop: '1px solid var(--hair-2)' }}>
            <div className="flex items-center gap-2 px-4 py-2.5 text-[12px] font-extrabold tracking-wide" style={{ background: c0, color: tc, borderBottom: `3px solid ${c1}` }}>
              {team ? <Crest team={team} size={18} /> : null}
              <span className="truncate uppercase">{team ? team.name : ''}</span>
              <span className="ml-auto whitespace-nowrap font-semibold opacity-80">{statLabel} a 90&apos;</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto overscroll-contain">
              {roster.map((r) => {
                const on = picked.includes(r.id);
                const dis = !on && picked.length >= MAX;
                return (
                  <button key={r.id} type="button" disabled={dis} onClick={() => toggle(r.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left" style={{ borderBottom: '1px solid var(--hair-2)', opacity: dis ? 0.4 : 1, background: on ? `linear-gradient(90deg, ${c1}29, transparent)` : 'transparent' }}>
                    <span className="relative shrink-0">
                      <Face id={r.id} size={40} />
                      <RoleBadge role={roles && roles[r.id]} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-bold">{r.name}</span>
                      <span className="block text-[11px]" style={{ color: 'var(--ink-3)' }}>{r.n} partite · {Math.round(r.min)}&apos;</span>
                    </span>
                    <span className="tnum text-[15px] font-extrabold">{comma(r.avg90, 2)}</span>
                    <span className="grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full" style={{ background: on ? c1 : 'transparent', border: `2px solid ${on ? c1 : 'var(--hair)'}` }}>
                      {on ? <Check size={13} strokeWidth={3.2} color="#000" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1 text-[12px] font-bold" style={{ color: 'var(--ink-3)' }}>{picked.length}/{MAX} selezionati{avg !== null ? ` · media ${comma(avg, 2)}` : ''}</span>
              <button type="button" disabled={!picked.length} onClick={() => setOpen(false)} className="press rounded-xl px-5 py-2.5 text-[14px] font-extrabold text-white" style={{ background: 'var(--accent)', opacity: picked.length ? 1 : 0.4 }}>Fatto</button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

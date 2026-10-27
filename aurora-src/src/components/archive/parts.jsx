import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import useAsync from '@/hooks/useAsync';
import TextFilter from '@/components/TextFilter';
import { TeamLogo } from '@/components/FmImg';
import { loadColors } from '@/data/archive';
import { teamByName } from '@/data/teams';
import { teamGrad } from '@/lib/tint';
import { useState } from 'react';

export const fmtDate = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Rome' }).replace('.', '');
};
export const fmtTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
};
export const dayKey = (iso) => String(iso || '').slice(0, 10);

const shade = (hex, k) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return '#1B2C4E';
  const n = parseInt(m[1], 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${((1 << 24) | (ch((n >> 16) & 255) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1)}`;
};

// colori sociali: dal file generato dagli stemmi; se manca, dalla squadra gia' presente nell'app; altrimenti un blu neutro
export function useTeamColors() {
  const { data } = useAsync(() => loadColors(), []);
  return useMemo(() => {
    const map = data || {};
    return (id, name) => {
      const t = name ? teamByName(name) : null;
      const c = (t && t.colors && t.colors[0]) || map[String(id)] || '#2C3E66';
      return { colors: [c, shade(c, 0.55)] };
    };
  }, [data]);
}
export const rowBg = (col, id, name, a = 0x55) => teamGrad(col(id, name), a);

export function ArchRow({ m, names, fm, sk }) {
  const hn = names[m[2]] || '—';
  const an = names[m[3]] || '—';
  const played = !!m[6];
  const sc = String(m[5] || '').split(' - ');
  const hasScore = played && sc.length === 2;
  return (
    <Link to={`/storico/${fm}/${sk}/${m[0]}`} className="press flex items-center gap-2 px-4 py-3">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
        <span className="truncate text-right text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{hn}</span>
        <TeamLogo id={m[2]} name={hn} size={24} />
      </div>
      <div className="w-[64px] shrink-0 text-center">
        {hasScore ? (
          <span className="tnum text-[15.5px] font-extrabold" style={{ color: 'var(--ink)' }}>
            {sc[0]}<span className="mx-0.5 font-medium" style={{ color: 'var(--ink-3)' }}>–</span>{sc[1]}
          </span>
        ) : played ? (
          <span className="text-[12px] font-semibold" style={{ color: 'var(--ink-3)' }}>Finita</span>
        ) : (
          <span className="tnum text-[13.5px] font-semibold" style={{ color: 'var(--ink-3)' }}>{m[8] ? 'Annull.' : fmtTime(m[4])}</span>
        )}
        {played ? <span className="tnum mt-[2px] block text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{fmtTime(m[4])}</span> : null}
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <TeamLogo id={m[3]} name={an} size={24} />
        <span className="truncate text-[14px] font-semibold" style={{ color: 'var(--ink)' }}>{an}</span>
      </div>
    </Link>
  );
}

const COLS = '18px 1fr 22px 20px 20px 20px 36px 28px';
export function StandingsPanel({ season, fm, sk, highlight = null }) {
  const [mode, setMode] = useState('all');
  const t = season && season.table;
  if (!t) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Classifica non disponibile per questa stagione</p>;
  const rows = t[mode] || t.all || [];
  const legend = season.legend || [];
  const forma = mode === 'form';
  const cols = COLS;
  const head = ['#', 'Squadra', 'PG', 'V', 'N', 'P', 'GF:GS', 'Pt'];
  return (
    <div className="pt-3">
      <div className="px-4">
        <TextFilter options={[{ value: 'all', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }, { value: 'form', label: 'Forma' }]} value={mode} onChange={setMode} />
      </div>
      <div className="mt-3">
        <div className="grid items-center gap-2 px-4 pb-2 text-[9.5px] font-bold uppercase tracking-[.1em]" style={{ gridTemplateColumns: cols, color: 'var(--ink-3)' }}>
          {head.map((h, i) => <span key={h} className={i === 1 ? '' : 'text-right'}>{h}</span>)}
        </div>
        {rows.map((r, i) => {
          const on = highlight != null && String(highlight) === String(r.id);
          return (
            <Link key={r.id} to={`/storico/${fm}/${sk}/squadra/${r.id}`} className="press relative grid items-center gap-2 px-4 py-2.5" style={{ gridTemplateColumns: cols, borderTop: '1px solid var(--hair-2)', background: on ? 'var(--accent-soft)' : 'transparent' }}>
              {r.qualColor && !forma ? <span aria-hidden="true" className="absolute bottom-1.5 left-0 top-1.5 w-[3.5px] rounded-r-full" style={{ background: r.qualColor }} /> : null}
              <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{r.idx || i + 1}</span>
              <span className="flex min-w-0 items-center gap-2"><TeamLogo id={r.id} name={r.shortName || r.name} size={22} /><span className="truncate text-[13px] font-semibold">{r.shortName || r.name}</span></span>
              <>
                  <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.played}</span>
                  <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.wins}</span>
                  <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.draws}</span>
                  <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.losses}</span>
                  <span className="tnum text-right text-[11px]" style={{ color: 'var(--ink-2)' }}>{String(r.scoresStr || '').replace('-', ':')}</span>
              </>
              <span className="tnum text-right text-[13.5px] font-extrabold">{r.pts}</span>
            </Link>
          );
        })}
        {legend.length && !forma ? (
          <div className="flex flex-wrap gap-x-4 gap-y-2 px-5 pb-6 pt-4">
            {legend.map((l) => (
              <span key={l.tKey || l.title} className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                <span className="h-[9px] w-[9px] rounded-full" style={{ background: l.color }} />{l.title}
              </span>
            ))}
          </div>
        ) : <div className="h-6" />}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import TextFilter from '@/components/TextFilter';
import { Image } from '@/components/ui/image';
import { refereesOf } from '@/data/referees';
import { bandColor } from '@/components/player/playerCalc';
import { comma } from '@/lib/format';

const METRICS = [
  { key: 'y', label: 'Gialli', tot: 'yellows', avg: 'yellowsAvg', d: 1 },
  { key: 'r', label: 'Rossi', tot: 'reds', avg: 'redsAvg', d: 2 },
  { key: 'f', label: 'Falli', tot: 'fouls', avg: 'foulsAvg', d: 1 },
  { key: 'p', label: 'Rigori', tot: 'penalties', avg: 'penaltiesAvg', d: 2 },
  { key: 'g', label: 'Partite', tot: 'games', avg: 'games', d: 0 },
];
const cptOf = () => { try { return localStorage.getItem('sl-concept-refrank') || 'a'; } catch { return 'a'; } };

// Classifica arbitri: si sceglie la statistica, la lista si ordina e la sua colonna e' evidenziata.
export default function LeagueRefereesPanel({ leagueId, concept = cptOf() }) {
  const [mode, setMode] = useState('avg');
  const [sel, setSel] = useState('y');
  const list = refereesOf(leagueId);
  if (!list.length) return <p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun arbitro disponibile</p>;
  const val = (r, m) => (mode === 'avg' ? r[m.avg] : r[m.tot]);
  const fmt = (v, m) => (m.key === 'g' || (mode === 'tot' && Number.isInteger(v)) ? String(v) : comma(v, m.d));
  const cur = METRICS.find((m) => m.key === sel);
  const rows = [...list].sort((a, b) => val(b, cur) - val(a, cur));
  const max = Math.max(...rows.map((r) => val(r, cur)), 0.0001);
  const grid = '18px 1fr repeat(5, 40px)';

  const tabs = (
    <div className="flex items-center gap-5 overflow-x-auto px-5 hide-sb">
      {METRICS.map((m) => (
        <button key={m.key} type="button" onClick={() => setSel(m.key)} className="press relative shrink-0 pb-1.5 text-[13.5px]" style={{ fontWeight: m.key === sel ? 800 : 500, color: m.key === sel ? 'var(--ink)' : 'var(--ink-3)' }}>
          {m.label}
          {m.key === sel ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full" style={{ background: 'var(--accent)' }} /> : null}
        </button>
      ))}
    </div>
  );

  const cell = (r, m, i) => {
    const v = val(r, m);
    const on = m.key === sel;
    if (!on) return <span key={m.key} className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{fmt(v, m)}</span>;
    if (concept === 'c') {
      return (
        <span key={m.key} className="flex justify-end">
          <span className="tnum rounded-full px-1.5 py-[2px] text-[12px] font-extrabold text-white" style={{ background: bandColor(rows.length > 1 ? (rows.length - 1 - i) / (rows.length - 1) : 1) }}>{fmt(v, m)}</span>
        </span>
      );
    }
    return <span key={m.key} className="tnum text-right text-[13.5px] font-extrabold" style={{ color: 'var(--accent)' }}>{fmt(v, m)}</span>;
  };

  const heads = (
    <div className="grid items-center gap-1.5 px-4 pb-1 pt-3 text-[9px] font-bold uppercase tracking-[.08em]" style={{ gridTemplateColumns: grid, color: 'var(--ink-3)' }}>
      <span />
      <span>Arbitro</span>
      {METRICS.map((m) => (
        <button key={m.key} type="button" onClick={() => setSel(m.key)} className="press text-right font-bold uppercase" style={{ color: m.key === sel ? 'var(--accent)' : 'inherit', letterSpacing: 'inherit', fontSize: 'inherit' }}>{m.label}</button>
      ))}
    </div>
  );

  const body = rows.map((r, i) => (
    <Link
      key={r.id}
      to={`/arbitro/${r.id}`}
      className="press relative grid items-center gap-1.5 px-4 py-2.5"
      style={{ gridTemplateColumns: grid, borderTop: '1px solid var(--hair-2)' }}
    >
      <span className="tnum text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{i + 1}</span>
      <span className="flex min-w-0 items-center gap-2">
        {concept !== 'a' ? (
          <span className="avatar h-[26px] w-[26px] shrink-0 text-[10px]">{r.photo ? <Image src={r.photo} alt={r.name} className="h-full w-full" fittingType="fill" /> : r.name.slice(0, 1)}</span>
        ) : null}
        <span className="min-w-0">
          <span className="block truncate text-[12.5px] font-semibold">{r.name}</span>
          <span className="block truncate text-[9px] uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{r.country || ''}</span>
          {concept === 'c' ? <span className="mt-[3px] block h-[3px] overflow-hidden rounded-full" style={{ background: 'var(--hair-2)' }}><i className="block h-full rounded-full" style={{ width: `${(val(r, cur) / max) * 100}%`, background: 'var(--accent)' }} /></span> : null}
        </span>
      </span>
      {METRICS.map((m) => cell(r, m, i))}
    </Link>
  ));

  return (
    <div className="pb-6 pt-2">
      <div className="mb-3 px-4"><TextFilter options={[{ value: 'avg', label: 'A partita' }, { value: 'tot', label: 'Totale' }]} value={mode} onChange={setMode} /></div>
      <div className="mt-1">{tabs}</div>
      {concept === 'b' ? (
        <div className="glass mx-4 mt-3 overflow-hidden rounded-[24px]">
          {heads}
          <div className="relative">
            <span aria-hidden="true" className="pointer-events-none absolute bottom-0 top-0 rounded-[12px]" style={{ background: 'var(--accent-soft)', width: 44, right: `${14 + (4 - METRICS.findIndex((m) => m.key === sel)) * 46}px` }} />
            {body}
          </div>
        </div>
      ) : (
        <div className="mt-2">{heads}{body}</div>
      )}
    </div>
  );
}

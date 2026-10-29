import { Link } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import useAsync from '@/hooks/useAsync';
import TextFilter from '@/components/TextFilter';
import { TeamLogo } from '@/components/FmImg';
import { loadColors, loadSeasonMatches } from '@/data/archive';
import { prepareMatch } from '@/data/prepare';
import { teamByName } from '@/data/teams';
import { fixedColors } from '@/data/teamColorFix';
import { teamGrad } from '@/lib/tint';
import { useState } from 'react';
import FormDots from '@/components/FormDots';

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
      const fx = fixedColors(name);
      if (fx) return { colors: fx };
      const t = name ? teamByName(name) : null;
      let c = t && t.colors && t.colors[0];
      if (!c || c === '#2C3E66') c = map[String(id)] || c || '#2C3E66';
      return { colors: [c, shade(c, 0.55)] };
    };
  }, [data]);
}
export const rowBg = (col, id, name, a = 0x55) => teamGrad(col(id, name), a);

// partite archiviate: il file della stagione (partite/<fm>/<stagione>.json.gz, ~1 MB) si scarica a riposo appena compare la lista,
// e al tocco della riga si prepara la partita (come MatchRow): aprendola i dati ci sono gia', niente spinner lungo
const idle = (f) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 600));
const WARMED = new Set();
const warmSeason = (fm, sk) => { const k = `${fm}/${sk}`; if (WARMED.has(k)) return; WARMED.add(k); idle(() => loadSeasonMatches(fm, sk).catch(() => null)); };
let pfa = 0;
export function ArchRow({ m, names, fm, sk, tid = null }) {
  useEffect(() => { if (m[6]) warmSeason(fm, sk); }, [fm, sk]); // eslint-disable-line react-hooks/exhaustive-deps
  const hn = names[m[2]] || '—';
  const an = names[m[3]] || '—';
  const played = !!m[6];
  const sc = String(m[5] || '').split(' - ');
  const hasScore = played && sc.length === 2;
  return (
    <Link to={`/match/a-${fm}-${sk}-${m[0]}`} onPointerDown={() => { clearTimeout(pfa); pfa = setTimeout(() => prepareMatch(`a-${fm}-${sk}-${m[0]}`), 90); }} onPointerCancel={() => clearTimeout(pfa)} className="press flex items-center gap-2 px-4 py-3">
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
      {tid != null ? (() => {
        // V / S / P dal punto di vista della squadra (come nelle partite della stagione in corso)
        let res = null;
        if (hasScore) {
          const h = Number(sc[0]); const a = Number(sc[1]);
          const mine = String(m[2]) === String(tid) ? [h, a] : [a, h];
          res = mine[0] > mine[1] ? 'V' : mine[0] === mine[1] ? 'S' : 'P';
        }
        const col = { V: '#1FA45B', S: '#8A93A6', P: '#E0443A' }[res];
        return <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full text-[10.5px] font-extrabold" style={{ background: col || 'transparent', color: '#fff' }}>{res || ''}</span>;
      })() : null}
    </Link>
  );
}

const COLS = '18px 1fr 22px 20px 20px 20px 36px 28px';
const COLS_F = '18px 1fr 92px 30px';

// ultime 5 partite di ogni squadra (V/S/P) dal calendario della stagione
const formOf = (season) => {
  const res = {};
  [...season.fix].filter((m) => m[6] && !m[8]).sort((a, b) => String(a[4]).localeCompare(String(b[4]))).forEach((m) => {
    const sc = String(m[5] || '').split(' - ').map(Number);
    if (sc.length !== 2 || sc.some(Number.isNaN)) return;
    const [h, a] = sc;
    (res[m[2]] = res[m[2]] || []).push(h > a ? 'V' : h === a ? 'S' : 'P');
    (res[m[3]] = res[m[3]] || []).push(a > h ? 'V' : h === a ? 'S' : 'P');
  });
  return res;
};
// Una tabella (classifica unica o un girone/conference): righe con lineette delle zone e leggenda sotto, solo se le righe hanno i colori.
function StandingsTable({ t, legendSrc, title, mode, fm5, fm, sk, highlight }) {
  const forma = mode === 'form';
  const rows = forma
    ? (t.all || []).map((r) => { const f = (fm5[r.id] || []).slice(-5); return { ...r, f, fp: f.reduce((x, c) => x + (c === 'V' ? 3 : c === 'S' ? 1 : 0), 0) }; }).sort((a, b) => b.fp - a.fp || b.pts - a.pts)
    : (t[mode] || t.all || []);
  if (!rows.length) return null;
  // la leggenda c'e' solo se le righe hanno davvero le lineette colorate
  const legend = (t.all || []).some((r) => r.qualColor) ? (legendSrc || []) : [];
  const cols = forma ? COLS_F : COLS;
  const head = forma ? ['#', 'Squadra', 'Ultime 5', 'Pt'] : ['#', 'Squadra', 'PG', 'V', 'N', 'P', 'GF:GS', 'Pt'];
  return (
    <div className="mt-3">
      {title ? <p className="px-5 pb-2 pt-2 text-[12px] font-extrabold uppercase tracking-wider">{title}</p> : null}
      <div className="grid items-center gap-2 px-4 pb-2 text-[9.5px] font-bold uppercase tracking-[.1em]" style={{ gridTemplateColumns: cols, color: 'var(--ink-3)' }}>
        {head.map((h, i) => <span key={h} className={i === 1 ? '' : 'text-right'}>{h}</span>)}
      </div>
      {rows.map((r, i) => {
        const on = highlight != null && (Array.isArray(highlight) ? highlight : [highlight]).some((h) => String(h) === String(r.id));
        return (
          <Link key={r.id} to={`/storico/${fm}/${sk}/squadra/${r.id}`} className="press relative grid items-center gap-2 px-4 py-2.5" style={{ gridTemplateColumns: cols, borderTop: '1px solid var(--hair-2)', background: on ? 'var(--accent-soft)' : 'transparent' }}>
            {r.qualColor && !forma ? <span aria-hidden="true" className="absolute bottom-1.5 left-0 top-1.5 w-[3.5px] rounded-r-full" style={{ background: r.qualColor }} /> : null}
            <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{forma ? i + 1 : (r.idx || i + 1)}</span>
            <span className="flex min-w-0 items-center gap-2"><TeamLogo id={r.id} name={r.shortName || r.name} size={22} /><span className="truncate text-[13px] font-semibold">{r.shortName || r.name}</span></span>
            {forma ? <span className="flex justify-end"><FormDots form={r.f} size={15} /></span> : <>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.played}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.wins}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.draws}</span>
                <span className="tnum text-right text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{r.losses}</span>
                <span className="tnum text-right text-[11px]" style={{ color: 'var(--ink-2)' }}>{String(r.scoresStr || '').replace('-', ':')}</span>
            </>}
            <span className="tnum text-right text-[13.5px] font-extrabold">{forma ? r.fp : r.pts}</span>
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
  );
}

// Classifica della stagione: unica, oppure a gironi/conference (FotMob `tables`, tabelle_gironi.py) con zone e leggenda di ciascun gruppo.
export function StandingsPanel({ season, fm, sk, highlight = null }) {
  const [mode, setMode] = useState('all');
  const groups = season && Array.isArray(season.groups) && season.groups.length ? season.groups : null;
  const t = season && season.table;
  // gli hook vanno sempre prima di qualunque uscita anticipata (altrimenti React si blocca cambiando stagione)
  const fm5 = useMemo(() => (t || groups ? formOf(season) : {}), [season, t, groups]);
  if (!t && !groups) return null;
  return (
    <div className="pt-3">
      <div className="px-4">
        <TextFilter options={[{ value: 'all', label: 'Totale' }, { value: 'home', label: 'Casa' }, { value: 'away', label: 'Trasferta' }, { value: 'form', label: 'Forma' }]} value={mode} onChange={setMode} />
      </div>
      {groups
        ? groups.map((g, i) => <StandingsTable key={g.n || i} t={g.table} legendSrc={g.legend} title={g.n} mode={mode} fm5={fm5} fm={fm} sk={sk} highlight={highlight} />)
        : <StandingsTable t={t} legendSrc={season.legend} mode={mode} fm5={fm5} fm={fm} sk={sk} highlight={highlight} />}
    </div>
  );
}

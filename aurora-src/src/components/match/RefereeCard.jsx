import { Link } from 'react-router-dom';
import FlagDot from '@/components/FlagDot';
import { refereeById, findRefereeByName, refStatsIn, leagueRefAvg, flagCodeOf } from '@/data/referees';
import { Image } from '@/components/ui/image';
import { WhistleIcon } from '@/components/LineIcons';
import { conceptOf } from '@/components/match/FormCard';
import { leagueById } from '@/data/leagues';
import { BAND_COLORS, bandColor, bandOf } from '@/components/player/playerCalc';

const f1 = (v) => (v == null ? '—' : (Math.round(v * 10) / 10).toString().replace('.', ','));

export const fracIn = (sorted, v) => {
  if (!sorted || sorted.length < 2) return null;
  let below = 0;
  sorted.forEach((x) => { if (x <= v) below += 1; });
  return Math.max(0, Math.min(1, (below - 1) / (sorted.length - 1)));
};

export function RefBar({ label, v, avg, sorted, concept }) {
  const top = Math.max(avg * 1.7, v * 1.05, 0.0001);
  const frac = fracIn(sorted, v);
  const col = bandColor(frac);
  const w = Math.max(3, Math.min(100, (v / top) * 100));
  const ax = Math.min(100, (avg / top) * 100);
  const lx = Math.min(88, Math.max(12, ax));
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-baseline justify-between">
        <p className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{label}</p>
        <p className="tnum text-[22px] font-extrabold leading-none" style={concept === 'b' && frac !== null ? { color: col, background: `${col}26`, padding: '3px 10px', borderRadius: 999, fontSize: 19 } : { color: frac !== null ? col : 'var(--ink)' }}>{f1(v)}</p>
      </div>
      <div className="relative" style={{ marginTop: 22, height: concept === 'b' ? 9 : 6 }}>
        {concept === 'c' ? (
          <div className="absolute inset-0 flex gap-[2px] overflow-hidden rounded-full">
            {BAND_COLORS.map((c, k) => <span key={c} className="h-full flex-1" style={{ background: c, opacity: frac !== null && k <= bandOf(frac) ? 0.95 : 0.16 }} />)}
          </div>
        ) : (
          <div className="absolute inset-0 rounded-full" style={{ background: 'var(--hair-2)' }}>
            <div className="h-full rounded-full" style={{ width: `${w}%`, background: concept === 'b' ? `linear-gradient(90deg, ${col}88, ${col})` : col }} />
          </div>
        )}
        {concept === 'c' ? <span className="absolute top-1/2 h-[12px] w-[12px] rounded-full" style={{ left: `${w}%`, transform: 'translate(-50%,-50%)', background: '#fff', border: `3px solid ${col}` }} /> : null}
        <span className="absolute" style={{ left: `${ax}%`, top: -4, bottom: -4, borderLeft: concept === 'b' ? '2px dashed var(--ink)' : '2px solid var(--ink)', opacity: 0.85 }} />
        <span className="tnum absolute whitespace-nowrap text-[9.5px] font-bold leading-none" style={{ left: `${lx}%`, top: concept === 'b' ? -22 : -18, transform: 'translateX(-50%)', color: 'var(--ink-2)', ...(concept === 'b' ? { background: 'var(--hair-2)', padding: '2px 5px', borderRadius: 6 } : {}) }}>
          {concept === 'c' ? '▼ ' : ''}media {f1(avg)}
        </span>
      </div>
    </div>
  );
}

// Arbitro: nome, bandiera, ammonizioni e falli a partita (stagione) a confronto con la media degli altri arbitri del campionato.
export default function RefereeCard({ match, concept = 'b' }) {
  const r = (match.refereeId && refereeById(match.refereeId)) || findRefereeByName(match.refereeName);
  const name = r ? r.name : match.refereeName;
  if (!name) return null;
  // campionati senza arbitri in archivio: medie dell'arbitro da FotMob (o dalla stagione archiviata) contro la media del campionato
  const fmRef = match.refFm;
  const ex = match.refExtra;
  // prima le ultime due stagioni in questa competizione (arbitri2/); senza, le altre fonti della stagione
  const two = match.refTwo;
  const st = two || (r ? refStatsIn(r, match.leagueId) : fmRef && fmRef.ya != null ? { n: fmRef.mt || 0, y: fmRef.ya, fo: fmRef.foa || 0 } : ex ? { n: ex.n, y: ex.y, fo: ex.fo } : null);
  const lg = (two && two.lg) || (r ? leagueRefAvg(match.leagueId) : null) || match.refLg || null;
  const when = two ? (two.seasons > 1 ? 'nelle ultime 2 stagioni' : "nell'ultima stagione") : 'questa stagione';
  const barY = st && lg && st.y != null && lg.y != null;
  const barF = st && lg && st.fo != null && lg.fo != null;
  const flag = r && r.cc ? flagCodeOf(r.cc) : fmRef && fmRef.cc ? flagCodeOf(fmRef.cc) : '';
  const inner = (
    <>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="avatar h-[46px] w-[46px]">
          {r && r.photo ? <Image src={r.photo} alt={name} className="h-full w-full" fittingType="fill" /> : <WhistleIcon size={20} />}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 truncate text-[15px] font-extrabold">{flag ? <FlagDot code={flag} size={18} /> : null}<span className="truncate">{name}</span></p>
          <p className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{st ? `${st.n} ${st.n === 1 ? 'gara' : 'gare'} ${when}` : 'Arbitro'}</p>
        </div>
      </div>
      {barY || barF ? (
        <div style={{ borderTop: '1px solid var(--hair-2)' }}>
          {barY ? <RefBar label={two ? 'Cartellini / partita' : 'Ammonizioni / partita'} v={st.y} avg={lg.y} sorted={lg.ys} concept={concept} /> : null}
          {barF ? <div style={barY ? { borderTop: '1px solid var(--hair-2)' } : undefined}><RefBar label="Falli fischiati / partita" v={st.fo} avg={lg.fo} sorted={lg.fos} concept={concept} /></div> : null}
          <p className="flex items-center gap-2 px-4 pb-3 text-[10.5px]" style={{ color: 'var(--ink-3)' }}><span style={{ display: 'inline-block', height: 12, borderLeft: concept === 'b' ? '2px dashed var(--ink)' : '2px solid var(--ink)', opacity: 0.85 }} />{two ? `media ${two.seasons > 1 ? 'ultime 2 stagioni' : 'stagione'} arbitri` : 'media stagionale arbitri'} {(leagueById(match.leagueId) || match.leagueObj || {}).name || ''}</p>
        </div>
      ) : null}
    </>
  );
  return r ? <Link to={`/arbitro/${r.id}`} className="glass tint-card press mx-4 block overflow-hidden rounded-[24px]">{inner}</Link> : <div className="glass mx-4 overflow-hidden rounded-[24px]">{inner}</div>;
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import Crest from '@/components/Crest';
import TextFilter from '@/components/TextFilter';
import { Image } from '@/components/ui/image';
import { playersByTeam } from '@/data/players';
import { playerReliability } from '@/data/topPlayers';
import { comma } from '@/lib/format';

export const voteColor = (v) => (v >= 7.75 ? '#1FA45B' : v >= 6.5 ? '#8CCB5E' : v >= 5 ? '#E8C23A' : v >= 3.5 ? '#F08A5B' : '#E0443A');

function top3(teamId, date, line) {
  const list = playersByTeam(teamId);
  const rel = list.map((p) => ({ p, v: (playerReliability(p, date, line) || {}).voto })).filter((x) => x.v != null).sort((a, b) => b.v - a.v).slice(0, 3);
  if (rel.length) return { rows: rel, kind: 'aff' };
  const r = list.filter((p) => p.rating).sort((a, b) => b.rating - a.rating).slice(0, 3).map((p) => ({ p, v: p.rating }));
  return { rows: r, kind: 'rating' };
}

const Avatar = ({ p, size = 44, ring }) => (
  <span className="avatar relative shrink-0" style={{ width: size, height: size, boxShadow: ring ? `0 0 0 3px ${ring}` : undefined }}>
    {p.photo ? <Image src={p.photo} alt={p.name} className="h-full w-full" fittingType="fill" /> : p.initials}
  </span>
);
const sur = (p) => p.name.split(' ').slice(-1)[0];

export default function BestPlayers({ match, home, away, concept = 'a' }) {
  const [line, setLine] = useState(1.5);
  const H = top3(match.homeId, match.date, line);
  const A = top3(match.awayId, match.date, line);
  const aff = H.kind === 'aff' || A.kind === 'aff';
  const fmt = (v) => comma(v, aff ? 1 : 2);
  const n = Math.max(H.rows.length, A.rows.length);
  if (!n) return <p className="py-4 text-center text-[12px]" style={{ color: 'var(--ink-3)' }}>Dati non ancora disponibili</p>;

  const tabs = aff ? (
    <div className="mb-3"><TextFilter options={[{ value: 0.5, label: 'Over 0,5' }, { value: 1.5, label: 'Over 1,5' }, { value: 2.5, label: 'Over 2,5' }]} value={line} onChange={setLine} /></div>
  ) : null;
  const foot = <p className="mt-2 text-center text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{aff ? `Affidabilità tiri · Over ${comma(line, 1)}` : 'Voto medio stagione'}</p>;

  if (concept === 'b') {
    return (
      <div>
        {tabs}
        <div className="mb-1 flex items-center justify-between px-1"><Crest team={home} size={20} /><Crest team={away} size={20} /></div>
        {Array.from({ length: n }).map((_, i) => {
          const a = H.rows[i]; const b = A.rows[i];
          const tot = ((a && a.v) || 0) + ((b && b.v) || 0) || 1;
          return (
            <div key={i} className="py-2" style={{ borderTop: i ? '1px solid var(--hair-2)' : 'none' }}>
              <div className="flex items-center">
                <div className="flex min-w-0 flex-1 items-center gap-2">{a ? <Link to={`/giocatore/${a.p.id}`} className="press flex min-w-0 items-center gap-2"><Avatar p={a.p} size={36} /><span className="truncate text-[12.5px] font-bold">{sur(a.p)}</span></Link> : null}</div>
                <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{b ? <Link to={`/giocatore/${b.p.id}`} className="press flex min-w-0 items-center gap-2"><span className="truncate text-[12.5px] font-bold">{sur(b.p)}</span><Avatar p={b.p} size={36} /></Link> : null}</div>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="tnum w-[34px] text-[14px] font-extrabold" style={{ color: a ? voteColor(a.v) : 'inherit' }}>{a ? fmt(a.v) : ''}</span>
                <span className="flex h-[7px] flex-1 gap-[3px]">
                  <span className="h-full rounded-l-full" style={{ width: `${(((a && a.v) || 0) / tot) * 100}%`, background: a ? voteColor(a.v) : 'transparent' }} />
                  <span className="h-full flex-1 rounded-r-full" style={{ background: b ? voteColor(b.v) : 'transparent' }} />
                </span>
                <span className="tnum w-[34px] text-right text-[14px] font-extrabold" style={{ color: b ? voteColor(b.v) : 'inherit' }}>{b ? fmt(b.v) : ''}</span>
              </div>
            </div>
          );
        })}
        {foot}
      </div>
    );
  }

  if (concept === 'c') {
    const Col = ({ rows, team, right }) => (
      <div className="flex flex-1 flex-col items-center gap-2">
        <Crest team={team} size={22} />
        <div className="flex w-full flex-col gap-2">
          {rows.map((r, i) => (
            <Link key={r.p.id} to={`/giocatore/${r.p.id}`} className="press flex flex-col items-center rounded-[16px] py-2" style={{ background: `${voteColor(r.v)}1A`, border: `1px solid ${voteColor(r.v)}40` }}>
              <span className="relative">
                <Avatar p={r.p} size={i === 0 ? 52 : 42} ring={voteColor(r.v)} />
                <span className="tnum absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full px-1.5 text-[11px] font-extrabold text-white" style={{ background: voteColor(r.v) }}>{fmt(r.v)}</span>
              </span>
              <span className="mt-2.5 max-w-full truncate px-1 text-[11.5px] font-bold">{sur(r.p)}</span>
            </Link>
          ))}
        </div>
      </div>
    );
    return (
      <div>
        {tabs}
        <div className="flex gap-3"><Col rows={H.rows} team={home} /><Col rows={A.rows} team={away} /></div>
        {foot}
      </div>
    );
  }

  // A
  const Col = ({ rows, team }) => (
    <div className="flex-1">
      <div className="mb-1.5 flex items-center justify-center gap-1.5"><Crest team={team} size={18} /><span className="text-[11px] font-extrabold uppercase tracking-wider" style={{ color: 'var(--ink-3)' }}>{team ? team.short || team.name : ''}</span></div>
      {rows.map((r, i) => (
        <Link key={r.p.id} to={`/giocatore/${r.p.id}`} className="press flex items-center gap-2 py-1.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
          <Avatar p={r.p} size={34} />
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold">{sur(r.p)}</span>
          <span className="tnum rounded-full px-2 py-[2px] text-[12.5px] font-extrabold text-white" style={{ background: voteColor(r.v) }}>{fmt(r.v)}</span>
        </Link>
      ))}
    </div>
  );
  return (
    <div>
      {tabs}
      <div className="flex gap-3"><Col rows={H.rows} team={home} /><Col rows={A.rows} team={away} /></div>
      {foot}
    </div>
  );
}

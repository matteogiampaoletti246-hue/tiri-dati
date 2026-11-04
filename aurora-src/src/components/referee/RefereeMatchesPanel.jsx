import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PanelTitle from '@/components/PanelTitle';
import { TeamLogo } from '@/components/FmImg';
import { WhistleIcon } from '@/components/LineIcons';
import { refGames } from '@/data/referees';
import { archIndex } from '@/data/archive';

const dateOf = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: '2-digit' });

// Cartellino disegnato con il moltiplicatore (x2, x3...); a zero non compare niente.
function Cards({ n, big = false }) {
  if (!n) return null;
  const w = big ? 15 : 11;
  return (
    <span className="inline-flex items-center">
      <i style={{ display: 'inline-block', width: w, height: w * 1.4, borderRadius: big ? 3 : 2, background: 'var(--yellow-card)', boxShadow: '0 0 0 1px rgba(0,0,0,.2)' }} />
      <b className="tnum" style={{ marginLeft: 3, fontSize: big ? 14 : 11, color: 'var(--ink)' }}>x{n}</b>
    </span>
  );
}

function Row({ m, comp }) {
  const [date, fm, sk, mid, home, away, hg, ag, tot, c1, c2, hid, aid] = m;
  return (
    <Link to={`/storico/${fm}/${sk}/${mid}`} className="press block px-5 py-3 text-center" style={{ borderTop: '1px solid var(--hair-2)' }}>
      <p className="text-[10.5px]" style={{ color: 'var(--ink-3)' }}>{dateOf(date)}{comp ? ` · ${comp}` : ''}</p>
      <div className="mt-1.5 flex items-center justify-center gap-2 text-[13px]" style={{ color: 'var(--ink)' }}>
        <span className="min-w-0 flex-1 truncate text-right">{home}</span>
        <TeamLogo id={hid} name={home} size={20} />
        <b className="tnum min-w-[38px] text-center">{hg}–{ag}</b>
        <TeamLogo id={aid} name={away} size={20} />
        <span className="min-w-0 flex-1 truncate text-left">{away}</span>
      </div>
      {tot ? (
        <div className="mt-2.5 flex items-center justify-center gap-3.5">
          <WhistleIcon size={13} style={{ color: 'var(--ink-3)' }} />
          {c1 ? <span className="inline-flex items-center gap-1"><span className="text-[9.5px]" style={{ color: 'var(--ink-3)' }}>1T</span><Cards n={c1} /></span> : null}
          {c2 ? <span className="inline-flex items-center gap-1"><span className="text-[9.5px]" style={{ color: 'var(--ink-3)' }}>2T</span><Cards n={c2} /></span> : null}
          <span className="inline-flex items-center gap-1"><span className="text-[9.5px]" style={{ color: 'var(--ink-3)' }}>Tot</span><Cards n={tot} big /></span>
        </div>
      ) : null}
    </Link>
  );
}

// Tutte le gare arbitrate nelle ultime due stagioni (di ogni competizione), con i cartellini di primo e secondo tempo.
export default function RefereeMatchesPanel({ referee }) {
  const [g, setG] = useState(undefined);
  const [idx, setIdx] = useState(null);
  useEffect(() => {
    let on = true;
    refGames(referee.name).then((d) => on && setG(d));
    archIndex().then((i) => on && setIdx(i));
    return () => { on = false; };
  }, [referee.name]);
  if (!g || !g.m || !g.m.length) return null;
  return (
    <div>
      <div className="px-5 pt-3">
        <PanelTitle right={<span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{g.n}</span>}>Partite arbitrate · ultime 2 stagioni</PanelTitle>
      </div>
      {g.m.map((m) => <Row key={`${m[1]}-${m[3]}`} m={m} comp={idx && idx[m[1]] ? idx[m[1]].n : ''} />)}
    </div>
  );
}

import { EventIcon, BootIcon } from './EventIcons';
import PlayerLink from './PlayerLink';

// "Giacomo Raspadori" -> "G. Raspadori"; gia' abbreviato resta com'e'
export const shortName = (n) => {
  // nome mancante o segnaposto (TBD...): niente testo, restano solo icona e minuto
  if (/^\(?\s*(tbd|tba|n\/a|unknown)\s*\)?$/i.test(String(n || '').trim())) return '';
  const t = String(n || '').trim().split(/\s+/);
  if (t.length < 2) return t[0] || '';
  if (/^[A-Za-zÀ-ÿ]\.$/.test(t[0])) return t.join(' ');
  return `${t[0][0].toUpperCase()}. ${t.slice(1).join(' ')}`;
};

const minNum = (m) => parseInt(String(m), 10) || 0;

// righe con separatori PT / FT
function withMarks(events, finished) {
  const out = [];
  let gh = 0;
  let ga = 0;
  let htDone = false;
  const htScore = () => [events.filter((e) => e.type === 'goal' && e.team === 'home' && minNum(e.minute) <= 45).length, events.filter((e) => e.type === 'goal' && e.team === 'away' && minNum(e.minute) <= 45).length];
  const hasSecond = events.some((e) => minNum(e.minute) > 45);
  events.forEach((e) => {
    if (!htDone && minNum(e.minute) > 45) {
      out.push({ mark: `PT ${htScore().join(' – ')}` });
      htDone = true;
    }
    if (e.type === 'goal') e.team === 'home' ? gh++ : ga++;
    out.push(e);
  });
  if (!hasSecond && events.length && (finished || events.some((e) => minNum(e.minute) >= 45))) out.push({ mark: `PT ${htScore().join(' – ')}` });
  if (finished) out.push({ mark: `FT ${gh} – ${ga}` });
  return out;
}

const Mark = ({ text }) => (
  <div className="my-1 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-[.14em]" style={{ background: 'var(--hair-2)', color: 'var(--ink-3)' }}>{text}</div>
);

const Lines = ({ e, align, match }) => (
  <span className={`min-w-0 ${align === 'right' ? 'text-right' : 'text-left'}`}>
    <span className="block break-words text-[13px] font-bold leading-tight">
      <PlayerLink match={match} name={e.type === 'sub' ? e.inName : e.name}>{shortName(e.type === 'sub' ? e.inName : e.name)}</PlayerLink>
      {e.pen ? ' (rig.)' : ''}
      {e.og ? ' (aut.)' : ''}
    </span>
    {e.type === 'sub' ? <span className="block break-words text-[11px] leading-tight" style={{ color: 'var(--ink-3)' }}><PlayerLink match={match} name={e.name}>{shortName(e.name)}</PlayerLink></span> : null}
    {e.type === 'goal' ? (
      <span className="block break-words text-[11px] leading-tight" style={{ color: 'var(--ink-3)' }}>
        {e.assist ? <><span className="inline-flex align-middle"><BootIcon size={13} /></span> <PlayerLink match={match} name={e.assist}>{shortName(e.assist)}</PlayerLink> · </> : null}
        {e.score ? `${e.score[0]} – ${e.score[1]}` : ''}
      </span>
    ) : null}
  </span>
);

export default function Riassunto({ events = [], finished, concept, match }) {
  const rows = withMarks(events, finished);
  if (concept === 'c') return <Verticale rows={rows} match={match} />;

  return (
    <div>
      {rows.map((r, i) => {
        if (r.mark) return <Mark key={i} text={r.mark} />;
        const home = r.team === 'home';
        if (concept === 'b') {
          return (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5" style={{ flexDirection: home ? 'row' : 'row-reverse' }}>
              <span className="tnum w-[38px] shrink-0 text-[12px] font-bold" style={{ color: 'var(--ink-3)', textAlign: home ? 'left' : 'right' }}>{r.minute}&apos;</span>
              <EventIcon e={r} />
              <div className="min-w-0 flex-1" style={{ textAlign: home ? 'left' : 'right' }}><Lines match={match} e={r} align={home ? 'left' : 'right'} /></div>
            </div>
          );
        }
        return (
          <div key={i} className="grid items-center gap-2 px-4 py-2.5" style={{ gridTemplateColumns: '1fr 46px 1fr' }}>
            <div className="flex items-center justify-end gap-2.5 ">{home ? <><Lines match={match} e={r} align="right" /><EventIcon e={r} /></> : null}</div>
            <span className="tnum text-center text-[12px] font-extrabold" style={{ color: 'var(--ink-2)' }}>{r.minute}&apos;</span>
            <div className="flex items-center gap-2.5 ">{!home ? <><EventIcon e={r} /><Lines match={match} e={r} align="left" /></> : null}</div>
          </div>
        );
      })}
    </div>
  );
}

// C: linea verticale al centro, gol in evidenza, il resto più discreto
function Verticale({ rows, match }) {
  return (
    <div className="relative px-4 py-2">
      <span className="absolute bottom-2 left-1/2 top-2 w-px" style={{ background: 'var(--hair)' }} />
      {rows.map((r, i) => {
        if (r.mark) return <div key={i} className="relative my-2 text-center"><span className="glass-flat inline-block rounded-full px-3 py-1 text-[10.5px] font-extrabold tracking-wider" style={{ color: 'var(--ink-2)' }}>{r.mark}</span></div>;
        const home = r.team === 'home';
        const big = r.type === 'goal';
        return (
          <div key={i} className="relative my-2 grid items-center" style={{ gridTemplateColumns: '1fr 30px 1fr' }}>
            <div className={`flex ${home ? 'justify-end' : ''} pr-2`}>
              {home ? <div className={big ? 'glass-flat rounded-2xl px-3 py-2 text-right' : 'text-right opacity-75'}><Lines match={match} e={r} align="right" /></div> : null}
            </div>
            <span className="z-10 flex flex-col items-center gap-0.5 rounded-full py-1" style={{ background: 'hsl(var(--background))' }}>
              <EventIcon e={r} size={big ? 20 : 16} />
              <span className="tnum text-[9.5px] font-bold" style={{ color: 'var(--ink-3)' }}>{r.minute}&apos;</span>
            </span>
            <div className="pl-2">
              {!home ? <div className={big ? 'glass-flat inline-block rounded-2xl px-3 py-2' : 'opacity-75'}><Lines match={match} e={r} align="left" /></div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

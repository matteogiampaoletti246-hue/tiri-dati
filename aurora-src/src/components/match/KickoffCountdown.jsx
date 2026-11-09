import { useEffect, useState } from 'react';

// Countdown concept B (21st, Hirael "Countdown Timer"): solo il tempo che manca, le cifre scorrono in verticale (transform).
// Si vede dalla mezzanotte del giorno della partita fino al calcio d'inizio; prima resta l'orario con la data (lo decide chi lo usa
// con `showCountdown`). Allo zero torna l'orario finche' la partita non risulta iniziata.
export const showCountdown = (ts, now = Date.now()) => {
  if (!ts || now >= ts) return false;
  const d0 = new Date(ts); d0.setHours(0, 0, 0, 0);
  return now >= d0.getTime();
};

const pad = (n) => String(n).padStart(2, '0');
const DIGITS = '0123456789';

function Digit({ d }) {
  return (
    <span className="cd-digit">
      <span className="cd-col" style={{ transform: `translate3d(0,-${Number(d) * 10}%,0)` }}>
        {DIGITS.split('').map((x) => <span key={x}>{x}</span>)}
      </span>
    </span>
  );
}

export default function KickoffCountdown({ ts, onDone }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, Math.floor((ts - now) / 1000));
  useEffect(() => { if (!left && onDone) onDone(); }, [left, onDone]);
  const parts = [pad(Math.floor(left / 3600)), pad(Math.floor(left / 60) % 60), pad(left % 60)];
  return (
    <span className="title-xl tnum flex items-center text-[25px]" role="timer" aria-label={`Calcio d'inizio tra ${+parts[0]} ore e ${+parts[1]} minuti`}>
      {parts.map((p, i) => (
        <span key={i} className="flex items-center">
          {i ? <span className="cd-sep">:</span> : null}
          <Digit d={p[0]} /><Digit d={p[1]} />
        </span>
      ))}
    </span>
  );
}

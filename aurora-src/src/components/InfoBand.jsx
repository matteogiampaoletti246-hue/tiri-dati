import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadWeather } from '@/data/weather';
import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { StadiumIcon, WhistleIcon } from '@/components/LineIcons';
import { refereeById } from '@/data/referees';

const WEATHER = {
  sun: { icon: Sun, label: 'Sereno' },
  cloud: { icon: Cloud, label: 'Nuvoloso' },
  rain: { icon: CloudRain, label: 'Pioggia' },
  wind: { icon: Wind, label: 'Ventoso' },
};

const CELL = 'flex flex-1 flex-col items-center gap-2 px-2 text-center';
const ICON = { color: 'var(--ink-3)' };

// Stadio / Meteo / Arbitro: compare solo la voce che ha un dato; senza nessun dato la fascia non c'e'.
export default function InfoBand({ match }) {
  const [, bump] = useState(0);
  useEffect(() => {
    let on = true;
    loadWeather(match).then((w) => w && on && bump((n) => n + 1));
    return () => {
      on = false;
    };
  }, [match.id]);
  const wx = match.weather && match.weather.temp != null ? match.weather : null;
  const w = wx && (WEATHER[wx.icon] || WEATHER.cloud);
  const ref = match.refereeId ? refereeById(match.refereeId) : null;
  const refName = ref ? ref.name : match.refereeName;

  const cells = [];
  if (match.stadium) {
    cells.push(
      <div key="st" className={CELL}>
        <StadiumIcon size={16} style={ICON} />
        <span className="label-sm">Stadio</span>
        <span className="text-[12px]" style={{ color: 'var(--ink)' }}>{match.stadium}</span>
      </div>,
    );
  }
  if (w) {
    const WeatherIcon = w.icon;
    cells.push(
      <div key="wx" className={CELL}>
        <WeatherIcon size={16} strokeWidth={1.2} style={ICON} />
        <span className="label-sm">Meteo</span>
        <span className="tnum text-[12px]" style={{ color: 'var(--ink)' }}>{wx.wind != null ? `${wx.temp}° · ${wx.wind} km/h` : `${wx.temp}°`}</span>
      </div>,
    );
  }
  if (refName) {
    const body = (
      <>
        <WhistleIcon size={16} style={ICON} />
        <span className="label-sm">Arbitro</span>
        <span className="text-[12px]" style={{ color: 'var(--ink)' }}>{refName}</span>
      </>
    );
    cells.push(ref ? <Link key="rf" to={`/arbitro/${ref.id}`} className={`${CELL} transition-opacity active:opacity-60`}>{body}</Link> : <div key="rf" className={CELL}>{body}</div>);
  }
  if (!cells.length) return null;

  return (
    <div className="panel tint-card mx-5 flex items-stretch px-2 py-4">
      {cells.map((c, i) => (
        <Fragment key={c.key}>
          {i ? <span className="w-px self-stretch" style={{ background: 'var(--hair-2)' }} /> : null}
          {c}
        </Fragment>
      ))}
    </div>
  );
}

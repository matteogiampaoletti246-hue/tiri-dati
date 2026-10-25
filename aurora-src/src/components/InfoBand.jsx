import { Link } from 'react-router-dom';
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

export default function InfoBand({ match }) {
  const w = WEATHER[match.weather && match.weather.icon] || WEATHER.sun;
  const WeatherIcon = w.icon;
  const ref = match.refereeId ? refereeById(match.refereeId) : null;

  return (
    <div className="panel mx-5 flex items-stretch px-2 py-4">
      <div className={CELL}>
        <StadiumIcon size={16} style={ICON} />
        <span className="label-sm">Stadio</span>
        <span className="text-[12px]" style={{ color: 'var(--ink)' }}>
          {match.stadium || '—'}
        </span>
      </div>

      <span className="w-px self-stretch" style={{ background: 'var(--hair-2)' }} />

      <div className={CELL}>
        <WeatherIcon size={16} strokeWidth={1.2} style={ICON} />
        <span className="label-sm">Meteo</span>
        <span className="tnum text-[12px]" style={{ color: 'var(--ink)' }}>
          {match.weather ? `${match.weather.temp}° · ${match.weather.wind} km/h` : '—'}
        </span>
      </div>

      <span className="w-px self-stretch" style={{ background: 'var(--hair-2)' }} />

      {ref ? (
        <Link to={`/arbitro/${ref.id}`} className={`${CELL} transition-opacity active:opacity-60`}>
          <WhistleIcon size={16} style={ICON} />
          <span className="label-sm">Arbitro</span>
          <span className="text-[12px]" style={{ color: 'var(--ink)' }}>
            {ref.name}
          </span>
        </Link>
      ) : (
        <div className={CELL}>
          <WhistleIcon size={16} style={ICON} />
          <span className="label-sm">Arbitro</span>
          <span className="text-[12px]" style={{ color: 'var(--ink)' }}>
            —
          </span>
        </div>
      )}
    </div>
  );
}

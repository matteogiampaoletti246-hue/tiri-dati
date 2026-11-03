import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadWeather } from '@/data/weather';
import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { WhistleIcon } from '@/components/LineIcons';
import { refereeById } from '@/data/referees';
import { teamById } from '@/data/teams';
import { teamColor } from '@/lib/tint';
import MAPPA from '../../stadi/mappa.json';
import CREDITI from '../../stadi/crediti.json';

const WEATHER = {
  sun: { icon: Sun, label: 'Sereno' },
  cloud: { icon: Cloud, label: 'Nuvoloso' },
  rain: { icon: CloudRain, label: 'Pioggia' },
  wind: { icon: Wind, label: 'Ventoso' },
};

// Foto degli stadi (aurora-src/stadi/, Wikimedia Commons con licenza libera): Vite le mette nella build, si scaricano solo quando servono.
const FILES = import.meta.glob('../../stadi/*.webp',{ eager: true, query: '?url', import: 'default' });
const URL_OF = Object.fromEntries(Object.entries(FILES).map(([p, u]) => [p.split('/').pop(), u]));
const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const BY_NAME = new Map(Object.entries(MAPPA).map(([k, f]) => [norm(k), f]));
const photoOf = (name) => {
  const f = BY_NAME.get(norm(name));
  return f && URL_OF[f] ? { src: URL_OF[f], credit: CREDITI[f] || null } : null;
};

function Photo({ name, team }) {
  const ph = photoOf(name);
  const [state, setState] = useState('wait'); // wait | ok | err
  const show = ph && state !== 'err';
  return (
    <div className="stad-photo" style={{ '--tint': teamColor(team) }}>
      {show ? <img src={ph.src} alt="" loading="lazy" decoding="async" className={state === 'ok' ? 'on' : ''} onLoad={() => setState('ok')} onError={() => setState('err')} /> : null}
      <div className="stad-shade" />
      {show && state === 'ok' && ph.credit ? <span className="stad-credit">Foto: {ph.credit.autore} · {ph.credit.licenza}</span> : null}
      <div className="stad-text">
        <b>{name}</b>
        {team ? <span>{team.name}</span> : null}
      </div>
    </div>
  );
}

// Card dello stadio: foto con nome dello stadio e squadra di casa, sotto Meteo | Arbitro.
// Compare solo cio' che ha un dato (senza stadio niente foto, senza meteo o arbitro niente colonna); senza nessun dato la card non c'e'.
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
  const home = teamById(match.homeId);

  const cols = [];
  if (w) {
    const WeatherIcon = w.icon;
    cols.push(
      <div key="wx" className="stad-col">
        <span className="stad-lab"><WeatherIcon size={14} strokeWidth={1.4} />Meteo</span>
        <span className="tnum stad-val">{wx.wind != null ? `${wx.temp}° · ${wx.wind} km/h` : `${wx.temp}°`}</span>
      </div>,
    );
  }
  if (refName) {
    const body = (
      <>
        <span className="stad-lab"><WhistleIcon size={14} />Arbitro</span>
        <span className="stad-val">{refName}</span>
      </>
    );
    cols.push(ref ? <Link key="rf" to={`/arbitro/${ref.id}`} className="stad-col transition-opacity active:opacity-60">{body}</Link> : <div key="rf" className="stad-col">{body}</div>);
  }
  if (!match.stadium && !cols.length) return null;

  return (
    <section className="panel stad-card mx-5" data-stadium-card="">
      {match.stadium ? <Photo key={match.stadium} name={match.stadium} team={home} /> : null}
      {cols.length ? (
        <div className="stad-cols">
          {cols[0]}
          {cols[1] ? <span className="stad-sep" aria-hidden="true" /> : null}
          {cols[1] || null}
        </div>
      ) : null}
    </section>
  );
}

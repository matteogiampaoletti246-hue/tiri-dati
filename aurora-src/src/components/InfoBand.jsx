import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadWeather } from '@/data/weather';
import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { StadiumIcon, WhistleIcon } from '@/components/LineIcons';
import { refereeById } from '@/data/referees';
import { teamById } from '@/data/teams';
import { teamColor } from '@/lib/tint';
import MAPPA from '../../stadi/mappa.json';

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
// Chiave "stadio squadra" prima (per i nomi di sponsor uguali in citta' diverse, es. Allianz), poi solo il nome dello stadio.
const photoOf = (name, team) => {
  const f = (team && BY_NAME.get(norm(`${name} ${team}`))) || BY_NAME.get(norm(name));
  return f && URL_OF[f] ? { src: URL_OF[f] } : null;
};

const CELL = 'flex flex-1 flex-col items-center gap-2 px-2 text-center';
const ICON = { color: 'var(--ink-3)' };

// Pannello classico Stadio / Meteo / Arbitro: per gli stadi senza foto (stessa fascia di sempre).
function ClassicBand({ match, wx, w, rf, refName }) {
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
    cells.push(rf ? <Link key="rf" to={`/arbitro/${rf.id}`} className={`${CELL} transition-opacity active:opacity-60`}>{body}</Link> : <div key="rf" className={CELL}>{body}</div>);
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

function Photo({ name, team }) {
  const ph = photoOf(name, team && team.name);
  const [state, setState] = useState('wait'); // wait | ok | err
  const show = ph && state !== 'err';
  return (
    <div className="stad-photo" style={{ '--tint': teamColor(team) }}>
      {show ? <img src={ph.src} alt="" loading="lazy" decoding="async" className={state === 'ok' ? 'on' : ''} onLoad={() => setState('ok')} onError={() => setState('err')} /> : null}
      <div className="stad-shade" />
      <div className="stad-text">
        <b>{name}</b>
        {team ? <span>{team.name}</span> : null}
      </div>
    </div>
  );
}

// Card dello stadio: foto con nome dello stadio e squadra di casa, sotto Meteo | Arbitro.
// Stadi senza foto (o senza stadio): pannello classico. Compare solo cio' che ha un dato; senza nessun dato niente.
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
  if (!match.stadium || !photoOf(match.stadium, home && home.name)) return <ClassicBand match={match} wx={wx} w={w} rf={ref} refName={refName} />;

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

  return (
    <section className="panel stad-card mx-5" data-stadium-card="">
      <Photo key={match.stadium} name={match.stadium} team={home} />
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

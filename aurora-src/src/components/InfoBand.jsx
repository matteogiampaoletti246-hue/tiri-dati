import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { loadWeather } from '@/data/weather';
import { Sun, Cloud, CloudRain, Wind } from 'lucide-react';
import { StadiumIcon, WhistleIcon } from '@/components/LineIcons';
import { refereeById, flagCodeOf } from '@/data/referees';
import FlagDot from '@/components/FlagDot';
import { Image } from '@/components/ui/image';
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

// Weather concept A (21st, Ravi Katiyar "Weather Card") in piccolo: carta col cielo del meteo vero (sole che gira piano,
// nuvola che passa, pioggia che cade; solo transform), gradi grandi. A destra il riquadro dell'arbitro (foto, bandiera, nome).
function WxCard({ wx, w }) {
  const k = wx.icon && WEATHER[wx.icon] ? wx.icon : 'cloud';
  return (
    <div className={`wx-card wx-${k}`}>
      <div className="wx-sky" aria-hidden="true">
        {k === 'sun' ? <span className="wx-sun" /> : null}
        {k === 'sun' || k === 'cloud' || k === 'wind' ? <span className={`wx-cloud${k === 'sun' ? ' wx-c1' : ''}`} /> : null}
        {k === 'cloud' || k === 'wind' ? <span className="wx-cloud wx-c2" /> : null}
        {k === 'rain' ? Array.from({ length: 14 }, (_, i) => <i key={i} style={{ left: `${(i * 7.3) % 100}%`, animationDelay: `${(i % 7) * 0.13}s` }} />) : null}
      </div>
      <div className="wx-txt">
        <span className="wx-lab">Meteo</span>
        <span className="tnum wx-temp">{wx.temp}°</span>
        <span className="wx-sub">{w.label}{wx.wind != null ? ` · ${wx.wind} km/h` : ''}</span>
      </div>
    </div>
  );
}

function RefTile({ rf, refName, cc, games }) {
  const flag = cc ? flagCodeOf(cc) : '';
  const body = (
    <>
      <span className="ref-ava">{rf && rf.photo ? <Image src={rf.photo} alt="" className="h-full w-full" fittingType="fill" /> : <WhistleIcon size={18} />}</span>
      <span className="min-w-0 flex-1">
        <span className="ref-lab">Arbitro</span>
        <span className="ref-name">{flag ? <FlagDot code={flag} size={14} /> : null}<span>{refName}</span></span>
        {games ? <span className="ref-sub">{games}</span> : null}
      </span>
    </>
  );
  return rf ? <Link to={`/arbitro/${rf.id}`} className="ref-tile press">{body}</Link> : <div className="ref-tile">{body}</div>;
}

function WxRef({ match, wx, w, rf, refName }) {
  if (!w && !refName) return null;
  const cc = (rf && rf.cc) || (match.refFm && match.refFm.cc) || '';
  const two = match.refTwo;
  return (
    <div className="wxref">
      {w ? <WxCard wx={wx} w={w} /> : null}
      {refName ? <RefTile rf={rf} refName={refName} cc={cc} games={two && two.n ? `${two.n} ${two.n === 1 ? 'gara' : 'gare'} ${two.seasons > 1 ? 'in 2 stagioni' : 'in stagione'}` : ''} /> : null}
    </div>
  );
}

// Stadi senza foto: nome dello stadio in alto, sotto la stessa fila Meteo | Arbitro delle schede con la foto.
function ClassicBand({ match, wx, w, rf, refName }) {
  if (!match.stadium && !w && !refName) return null;
  return (
    <section className="panel stad-card tint-card mx-5">
      {match.stadium ? (
        <div className="flex items-center gap-2 px-3 pb-1 pt-2.5">
          <StadiumIcon size={15} style={{ color: 'var(--ink-3)' }} />
          <span className="truncate text-[13.5px] font-bold" style={{ color: 'var(--ink)' }}>{match.stadium}</span>
        </div>
      ) : null}
      <WxRef match={match} wx={wx} w={w} rf={rf} refName={refName} />
    </section>
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

  return (
    <section className="panel stad-card mx-5" data-stadium-card="">
      <Photo key={match.stadium} name={match.stadium} team={home} />
      <WxRef match={match} wx={wx} w={w} rf={ref} refName={refName} />
    </section>
  );
}

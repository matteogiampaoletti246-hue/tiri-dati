import { memo } from 'react';
import PlayerPhoto from '@/components/PlayerPhoto';
import { Link, useNavigate } from 'react-router-dom';
import { Calculator } from 'lucide-react';
import Crest from '@/components/Crest';
import RollNumber from '@/components/RollNumber';
import { Image } from '@/components/ui/image';
import { teamById } from '@/data/teams';
import { matchesByDate } from '@/data/matches';
import { romeDay } from '@/data/util';
import { TOP_KEEP } from '@/data/topPlayers';
import { matchStarted, openPanel } from '@/data/playerPanel';

// entrata (concept A): a cascata, 75 ms tra un banner e l'altro; il voto parte poco dopo il suo banner
export const ENTER_STAG = 60;
// nell'app nativa la pagina si scopre un attimo dopo il primo disegno (rotella dell'app): l'entrata parte poco dopo
const BASE = typeof window !== 'undefined' && window.ReactNativeWebView ? 120 : 0;

const RK = ['#F5C84C', '#C5CEDB', '#D98F5C'];

const FMT = new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric', month: 'short' });
// orario vero dalla partita in calendario (solo se la fonte lo conosce: mai l'orario segnaposto del calendario squadra);
// se non c'e', solo giorno e data
const when = (match) => {
  const t = FMT.format(new Date(match.ts)).replace(/\./g, '');
  const cap = t.charAt(0).toUpperCase() + t.slice(1);
  const real = matchesByDate(romeDay(match.ts)).find((m) => m.homeId === match.homeId && m.awayId === match.awayId);
  const wd = cap.split(' ')[0];
  return real && real.kickoff && real.timeKnown !== false ? `${wd} ${real.kickoff}` : cap;
};

// `tv` cambia quando arrivano gli orari veri del giorno (syncDayTimes): la riga si ridisegna con l'orario giusto
export default memo(function TopPlayerRow({ row, rank, threshold, delay = 0, stat = 'tiri', enter = -1, tv = 0 }) { // eslint-disable-line no-unused-vars
  const { player, match } = row;
  const nav = useNavigate();
  const team = teamById(player.teamId);
  const opp = match ? teamById(match.homeId === player.teamId ? match.awayId : match.homeId) : null;
  const c1 = team ? team.colors[0] : '#2C3E66';
  const c2 = team ? team.colors[1] : '#0b1230';
  const rk = RK[rank - 1] || 'var(--accent)';

  const openCalc = (e) => {
    e.preventDefault();
    e.stopPropagation();
    TOP_KEEP.child = Date.now();
    nav('/calcolatore', { state: { calc: { playerId: player.id, line: threshold, ts: match ? match.ts : null, stat } } });
  };
  // entrata dall'alto (index.css .tp-in) solo per i banner visibili all'apertura / al cambio statistica
  const anim = enter >= 0;

  return (
    <Link
      to={`/giocatore/${player.id}`}
      onClick={(e) => {
        TOP_KEEP.child = Date.now();
        // partita non ancora iniziata: pannello giocatore da destra (il tasto Profilo apre la scheda)
        if (!matchStarted(match)) { e.preventDefault(); openPanel(player.id); }
      }}
      className={`press mx-4 mb-2.5 flex items-center gap-3 rounded-[24px] p-3${anim ? ' tp-in' : ''}`}
      style={{ background: `linear-gradient(100deg, ${c1}55, rgba(255,255,255,.03) 70%)`, border: '1px solid var(--glass-border)', ...(anim ? { animationDelay: `${BASE + enter * ENTER_STAG}ms` } : null) }}
    >
      <span className="relative flex-none">
        <span className="avatar h-[50px] w-[50px] text-[13px]">
          <PlayerPhoto src={player.photo} alt={player.name} />
        </span>
        <b className="absolute -left-1.5 -top-1.5 flex h-[22px] min-w-[22px] items-center justify-center rounded-full px-1 text-[12px]" style={{ background: rk, color: rank <= 3 ? '#06101f' : '#fff' }}>
          {rank}
        </b>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-extrabold" style={{ color: 'var(--ink)' }}>{player.name}</span>
        {/* concept B: due righe con stemma nell'ordine casa / trasferta; la squadra del giocatore in grassetto, l'altra tenue;
            l'orario dopo la squadra in trasferta; niente nazionalita' */}
        {match && opp ? (
          [teamById(match.homeId), teamById(match.awayId)].map((t, i) => {
            const own = t && t.id === player.teamId;
            return (
              <span key={i} className={`flex items-center gap-1.5 ${i ? 'mt-1' : 'mt-0.5'} ${own ? 'text-[12px]' : 'text-[11px]'}`} style={{ color: own ? 'var(--ink)' : 'var(--ink-3)' }}>
                {t ? <Crest team={t} size={15} /> : null}
                <span className={`min-w-0 truncate${own ? ' font-extrabold' : ''}`}>{t ? t.name : (own ? player.teamName : match.oppName)}</span>
                {i ? <span className="flex-none whitespace-nowrap" style={{ color: 'var(--ink-3)', fontSize: 11, fontWeight: 400, marginLeft: -2 }}>· {when(match)}</span> : null}
              </span>
            );
          })
        ) : (
          <>
            <span className="mt-0.5 flex items-center gap-1.5 text-[12px]" style={{ color: 'var(--ink)' }}>
              {team ? <Crest team={team} size={15} /> : null}
              <span className="min-w-0 truncate font-extrabold">{team ? team.name : player.teamName}</span>
            </span>
            {match ? (
              <span className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
                <span className="truncate">{match.oppName} · {when(match)}</span>
              </span>
            ) : null}
          </>
        )}
        <span className="mt-1.5 block h-[5px] rounded-full" style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }} />
      </span>

      <span className="flex flex-none flex-col items-center gap-1.5">
        {anim
          ? <RollNumber value={row.voto} from={0} pop delay={BASE + enter * ENTER_STAG + 160} duration={950} className="text-[25px] font-extrabold leading-none" />
          : <RollNumber value={row.voto} delay={delay} className="text-[25px] font-extrabold leading-none" />}
        <button type="button" onClick={openCalc} aria-label="Apri nel calcolatore" className="glass press flex h-[27px] w-[27px] items-center justify-center rounded-full" style={{ color: 'var(--accent)' }}>
          <Calculator size={14} strokeWidth={2} />
        </button>
      </span>
    </Link>
  );
});

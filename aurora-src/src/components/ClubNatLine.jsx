import Crest from './Crest';
import FlagDot from './FlagDot';
import { countryIt } from '@/data/carriere';
import { teamById, teamByFm } from '@/data/teams';

const clubCrest = (n) => ({ name: n.clubName, crest: n.clubFm ? `https://images.fotmob.com/image_resources/logo/teamlogo/${n.clubFm}.png` : null, initials: String(n.clubName).split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(), colors: [] });

// riga sotto il nome: prima stemma e squadra di club, poi (linea sottile) bandiera e nazionale; chi ha solo la nazionale mostra la bandiera.
// Un giocatore = un solo banner, qualunque competizione sia scelta (campionato, coppa europea o Nations League).
export default function ClubNatLine({ p, size = 14, className = '' }) {
  if (!p) return null;
  const club = p.nat ? p.club || null : p;
  const nat = p.nat ? p : p.natView || null;
  // senza profilo di club: il club attuale dalle carriere (stemma FotMob), se c'e'
  const t = club ? teamById(club.teamId) : nat && nat.clubName ? teamByFm(nat.clubFm) || clubCrest(nat) : null;
  const clubLabel = club ? (t ? t.name : club.teamName) : t ? t.name : null;
  // mai testi tagliati: club e nazionale sono due gruppi interi; se non stanno sulla stessa riga la nazionale va sotto
  return (
    <span className={`flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 overflow-hidden ${className}`} style={{ color: 'var(--ink-3)' }}>
      {clubLabel ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          {t ? <Crest team={t} size={size} /> : null}
          <span>{clubLabel}</span>
        </span>
      ) : null}
      {nat ? (
        <span className="relative inline-flex items-center gap-1.5 whitespace-nowrap">
          {/* linea tra club e nazionale nello spazio a sinistra: se la nazionale va a capo resta fuori dal riquadro e non si vede */}
          {clubLabel ? <span className="absolute h-3.5 w-px" style={{ left: -5.5, top: '50%', transform: 'translateY(-50%)', background: 'var(--ink-3)', opacity: 0.5 }} /> : null}
          <FlagDot name={nat.teamName} size={size} />
          <span>{countryIt(nat.teamName)}</span>
        </span>
      ) : null}
    </span>
  );
}


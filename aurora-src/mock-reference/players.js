// Giocatori e rose — dati MOCK generati in modo deterministico (nessun collegamento reale).
import { TEAMS } from './teams';

function seedOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r, a, b) => a + Math.floor(r() * (b - a + 1));
const r1 = (v) => Math.round(v * 10) / 10;
const r2 = (v) => Math.round(v * 100) / 100;

const POOLS = {
  ita: {
    first: ['Marco', 'Luca', 'Andrea', 'Matteo', 'Alessandro', 'Davide', 'Simone', 'Federico', 'Gabriele', 'Riccardo', 'Tommaso', 'Lorenzo', 'Pietro', 'Nicolò', 'Francesco', 'Antonio', 'Emanuele', 'Giulio', 'Samuele', 'Filippo', 'Cristian', 'Manuel', 'Alberto', 'Michele'],
    last: ['Rossi', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Costa', 'Giordano', 'Mancini', 'Rizzo', 'Lombardi', 'Moretti', 'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone', 'Longo', 'Sala', 'Vitale'],
  },
  eng: {
    first: ['Harry', 'Jack', 'Oliver', 'Charlie', 'George', 'Jacob', 'Thomas', 'Alfie', 'Callum', 'Ethan', 'Reece', 'Kieran', 'Marcus', 'Dylan', 'Josh', 'Liam', 'Nathan', 'Owen', 'Rhys', 'Sam', 'Toby', 'Aaron', 'Declan', 'Finn'],
    last: ['Walker', 'Bennett', 'Hughes', 'Turner', 'Morgan', 'Foster', 'Palmer', 'Brooks', 'Doyle', 'Grant', 'Hayes', 'Kelly', 'Barnes', 'Chapman', 'Dawson', 'Ellis', 'Fletcher', 'Gibson', 'Hardy', 'James', 'Lambert', 'Marsh', 'Nolan', 'Pearce', 'Reid', 'Sharp', 'Sutton', 'Ward', 'Webb', 'Yates', 'Trent', 'Hale'],
  },
  esp: {
    first: ['Pablo', 'Álvaro', 'Javier', 'Sergio', 'Diego', 'Marcos', 'Iván', 'Rubén', 'Adrián', 'Hugo', 'Mario', 'Raúl', 'Nico', 'Aitor', 'Unai', 'Ibai', 'Gonzalo', 'Mateo', 'Bruno', 'Óscar', 'Ander', 'Julián', 'Bruno', 'Fernando'],
    last: ['García', 'Martínez', 'López', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Moreno', 'Álvarez', 'Romero', 'Navarro', 'Torres', 'Domínguez', 'Vázquez', 'Serrano', 'Blanco', 'Molina', 'Castro', 'Ortega', 'Delgado', 'Marín', 'Iglesias', 'Cortés', 'Aguilar', 'Herrera', 'Cano', 'Suárez', 'Medina', 'Ramos', 'Peña', 'Bermúdez', 'Aranda'],
  },
  ger: {
    first: ['Leon', 'Jonas', 'Lukas', 'Maximilian', 'Niklas', 'Tim', 'Finn', 'Elias', 'Noah', 'Paul', 'Jannik', 'Marvin', 'Kilian', 'Til', 'Nico', 'Moritz', 'Fabian', 'Philipp', 'Simon', 'Julian', 'Lars', 'Sven', 'Kevin', 'Tom'],
    last: ['Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Neumann', 'Schwarz', 'Zimmermann', 'Braun', 'Krüger', 'Hartmann', 'Lange', 'Werner', 'Krause', 'Meier', 'Lehmann', 'Köhler', 'Huber', 'Kaiser', 'Fuchs', 'Vogel', 'Frank', 'Roth', 'Berg', 'Engel'],
  },
  fra: {
    first: ['Lucas', 'Hugo', 'Théo', 'Nathan', 'Enzo', 'Mathis', 'Alexis', 'Rayan', 'Clément', 'Jules', 'Quentin', 'Baptiste', 'Romain', 'Evan', 'Noé', 'Amaury', 'Yanis', 'Loïc', 'Maxence', 'Amine', 'Bilal', 'Ousmane', 'Isaac', 'Malik'],
    last: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garnier', 'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas', 'Perrin', 'Morel', 'Girard', 'Andre', 'Mercier', 'Diallo', 'Traoré', 'Cissé', 'Camara'],
  },
};

const LANG = { 'serie-a': 'ita', 'premier-league': 'eng', laliga: 'esp', bundesliga: 'ger', 'ligue-1': 'fra' };

const usedNames = new Set();

function makeName(r, lang) {
  const pool = POOLS[lang] || POOLS.ita;
  for (let i = 0; i < 40; i++) {
    const name = `${pool.first[Math.floor(r() * pool.first.length)]} ${pool.last[Math.floor(r() * pool.last.length)]}`;
    if (!usedNames.has(name)) {
      usedNames.add(name);
      return name;
    }
  }
  const fallback = `${pool.first[0]} ${pool.last[Math.floor(r() * pool.last.length)]} ${usedNames.size}`;
  usedNames.add(fallback);
  return fallback;
}

const initialsOf = (name) => name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

const SQUAD_SHAPE = [['GK', 2], ['DEF', 7], ['MID', 7], ['ATT', 5]];

export const PLAYERS = [];

export const COACHES = {};

TEAMS.forEach((team) => {
  const r = rng(seedOf(`squad-${team.id}`));
  const lang = LANG[team.leagueId] || 'ita';
  const numbers = [];
  for (let n = 1; n <= 30; n++) numbers.push(n);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  let idx = 0;
  SQUAD_SHAPE.forEach(([pos, count]) => {
    for (let i = 0; i < count; i++) {
      const name = makeName(r, lang);
      const base = pos === 'GK' ? 6.3 + r() * 0.6 : pos === 'DEF' ? 6.25 + r() * 0.75 : pos === 'MID' ? 6.35 + r() * 0.85 : 6.45 + r() * 0.95;
      const minutes = int(r, 180, 450);
      const shots = pos === 'ATT' ? int(r, 8, 26) : pos === 'MID' ? int(r, 4, 16) : int(r, 0, 7);
      PLAYERS.push({
        id: `${team.id}-p${idx + 1}`,
        teamId: team.id,
        leagueId: team.leagueId,
        name,
        initials: initialsOf(name),
        number: numbers[idx],
        position: pos,
        photo: null,
        rating: r2(base),
        appearances: int(r, 3, 5),
        minutes,
        goals: pos === 'ATT' ? int(r, 0, 7) : pos === 'MID' ? int(r, 0, 4) : int(r, 0, 1),
        assists: pos === 'ATT' ? int(r, 0, 5) : int(r, 0, 4),
        shots,
        shotsOnTarget: Math.max(0, Math.round(shots * (0.3 + r() * 0.25))),
        xg: r2(shots * (0.08 + r() * 0.07)),
        foulsCommitted: int(r, 1, 14),
        foulsDrawn: int(r, 2, 18),
        shots5: [int(r, 0, 6), int(r, 0, 6), int(r, 0, 6), int(r, 0, 6), int(r, 0, 6)],
        ratings5: [r1(5.8 + r() * 2.8), r1(5.8 + r() * 2.8), r1(5.8 + r() * 2.8), r1(5.8 + r() * 2.8), r1(5.8 + r() * 2.8)],
        mediaAttesa: r2(6.1 + r() * 2.1),
        minutiMedi: int(r, 58, 90),
        stagione90: r2(6.0 + r() * 2.4),
      });
      idx++;
    }
  });
  COACHES[team.id] = makeName(r, lang);
});

PLAYERS.forEach((p) => {
  const r = rng(seedOf(`line-${p.id}`));
  p.voto = {
    '0.5': r2(Math.min(9.99, p.mediaAttesa + 0.9 + r() * 1.2)),
    '1.5': r2(Math.min(9.99, p.mediaAttesa + 0.5 + r() * 1.1)),
    '2.5': r2(Math.min(9.99, p.mediaAttesa + 0.1 + r() * 1.0)),
  };
  p.ultime5 = r1(p.ratings5.reduce((a, b) => a + b, 0) / 5);
});

const BY_TEAM = {};
PLAYERS.forEach((p) => {
  if (!BY_TEAM[p.teamId]) BY_TEAM[p.teamId] = [];
  BY_TEAM[p.teamId].push(p);
});

const BY_ID = {};
PLAYERS.forEach((p) => {
  BY_ID[p.id] = p;
});

export const playersByTeam = (teamId) => BY_TEAM[teamId] || [];
export const playerById = (id) => BY_ID[id] || null;
export const coachOf = (teamId) => COACHES[teamId] || '—';

export const per90 = (value, minutes) => (minutes > 0 ? (value * 90) / minutes : 0);

export const topPlayersBy = (leagueId, valueFn, n = 10) =>
  PLAYERS.filter((p) => p.leagueId === leagueId)
    .map((p) => ({ player: p, value: valueFn(p) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, n);

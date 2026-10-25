// Squadre — dati MOCK. crest: null → la UI usa il fallback con le iniziali.
const LISTS = {
  'serie-a': [
    ['inter', 'Inter', 'INT', '#0B2A5B', '#1B6FD6'], ['milan', 'Milan', 'MIL', '#8E1B2A', '#111318'], ['juventus', 'Juventus', 'JUV', '#E9EDF2', '#1B1F27'],
    ['napoli', 'Napoli', 'NAP', '#0E7FBF', '#063E6B'], ['roma', 'Roma', 'ROM', '#8A1C24', '#E0A63C'], ['lazio', 'Lazio', 'LAZ', '#8FC7E8', '#1B4C7E'],
    ['atalanta', 'Atalanta', 'ATA', '#1A2A45', '#2E7FD0'], ['fiorentina', 'Fiorentina', 'FIO', '#4B2A7B', '#8E5BC0'], ['bologna', 'Bologna', 'BOL', '#8E1B2A', '#243B6B'],
    ['torino', 'Torino', 'TOR', '#6B1220', '#B98A3C'], ['genoa', 'Genoa', 'GEN', '#8E1B2A', '#1B2C4E'], ['cagliari', 'Cagliari', 'CAG', '#8E1B2A', '#123A6B'],
    ['udinese', 'Udinese', 'UDI', '#1B1F27', '#C9CFD8'], ['verona', 'Verona', 'VER', '#1B3E7B', '#E2C03C'], ['lecce', 'Lecce', 'LEC', '#E2C03C', '#8E1B2A'],
    ['parma', 'Parma', 'PAR', '#E2C03C', '#1B3E7B'], ['como', 'Como', 'COM', '#1B4C9B', '#E9EDF2'], ['monza', 'Monza', 'MON', '#8E1B2A', '#E9EDF2'],
    ['empoli', 'Empoli', 'EMP', '#1B4C9B', '#9BC2E8'], ['venezia', 'Venezia', 'VEN', '#1B7B4C', '#E28A3C'],
  ],
  'premier-league': [
    ['arsenal', 'Arsenal', 'ARS', '#B01B2E', '#E4C06B'], ['liverpool', 'Liverpool', 'LIV', '#8E1B2A', '#1B6B4C'], ['man-city', 'Manchester City', 'MCI', '#6BB6E8', '#1B4C7B'],
    ['chelsea', 'Chelsea', 'CHE', '#1B3E9B', '#C0C6D0'], ['tottenham', 'Tottenham', 'TOT', '#E9EDF2', '#1B2C4E'], ['man-utd', 'Manchester United', 'MUN', '#B01B2E', '#E2C03C'],
    ['newcastle', 'Newcastle', 'NEW', '#1B1F27', '#C0C6D0'], ['aston-villa', 'Aston Villa', 'AVL', '#6B1220', '#6BB6E8'], ['brighton', 'Brighton', 'BHA', '#1B4C9B', '#E9EDF2'],
    ['west-ham', 'West Ham', 'WHU', '#6B1220', '#3EA0C9'], ['bournemouth', 'Bournemouth', 'BOU', '#8E1B2A', '#1B1F27'], ['crystal-palace', 'Crystal Palace', 'CRY', '#1B3E7B', '#B01B2E'],
    ['fulham', 'Fulham', 'FUL', '#E9EDF2', '#1B1F27'], ['brentford', 'Brentford', 'BRE', '#B01B2E', '#E9EDF2'], ['everton', 'Everton', 'EVE', '#1B3E9B', '#E9EDF2'],
    ['nottingham-forest', 'Nottingham Forest', 'NFO', '#B01B2E', '#E9EDF2'], ['wolves', 'Wolves', 'WOL', '#E2C03C', '#1B1F27'], ['leicester', 'Leicester', 'LEI', '#1B3E9B', '#E2C03C'],
    ['ipswich', 'Ipswich', 'IPS', '#1B4C9B', '#E9EDF2'], ['southampton', 'Southampton', 'SOU', '#B01B2E', '#E9EDF2'],
  ],
  'laliga': [
    ['real-madrid', 'Real Madrid', 'RMA', '#E9EDF2', '#C0A24B'], ['barcellona', 'Barcellona', 'BAR', '#7B1B3E', '#1B3E9B'], ['atletico-madrid', 'Atletico Madrid', 'ATM', '#B01B2E', '#1B3E7B'],
    ['athletic-bilbao', 'Athletic Bilbao', 'ATH', '#B01B2E', '#1B1F27'], ['villarreal', 'Villarreal', 'VIL', '#E2C03C', '#1B3E7B'], ['real-sociedad', 'Real Sociedad', 'RSO', '#1B4C9B', '#E9EDF2'],
    ['betis', 'Betis', 'BET', '#1B7B4C', '#E9EDF2'], ['girona', 'Girona', 'GIR', '#B01B2E', '#E9EDF2'], ['siviglia', 'Siviglia', 'SEV', '#E9EDF2', '#B01B2E'],
    ['valencia', 'Valencia', 'VAL', '#E9EDF2', '#E28A3C'], ['osasuna', 'Osasuna', 'OSA', '#B01B2E', '#1B3E7B'], ['maiorca', 'Maiorca', 'MLL', '#B01B2E', '#1B1F27'],
    ['celta-vigo', 'Celta Vigo', 'CEL', '#6BB6E8', '#B01B2E'], ['rayo-vallecano', 'Rayo Vallecano', 'RAY', '#E9EDF2', '#B01B2E'], ['getafe', 'Getafe', 'GET', '#1B4C9B', '#E9EDF2'],
    ['alaves', 'Alaves', 'ALA', '#1B4C9B', '#E9EDF2'], ['las-palmas', 'Las Palmas', 'LPA', '#E2C03C', '#1B3E7B'], ['espanyol', 'Espanyol', 'ESP', '#1B4C9B', '#E9EDF2'],
    ['leganes', 'Leganes', 'LEG', '#1B4C9B', '#E9EDF2'], ['valladolid', 'Valladolid', 'VLL', '#7B1B3E', '#E9EDF2'],
  ],
  'bundesliga': [
    ['bayern-monaco', 'Bayern Monaco', 'BAY', '#B01B2E', '#1B3E9B'], ['bayer-leverkusen', 'Bayer Leverkusen', 'B04', '#1B1F27', '#B01B2E'], ['borussia-dortmund', 'Borussia Dortmund', 'BVB', '#E2C03C', '#1B1F27'],
    ['rb-lipsia', 'RB Lipsia', 'RBL', '#E9EDF2', '#B01B2E'], ['stoccarda', 'Stoccarda', 'STU', '#E9EDF2', '#B01B2E'], ['eintracht-francoforte', 'Eintracht Francoforte', 'SGE', '#1B1F27', '#B01B2E'],
    ['wolfsburg', 'Wolfsburg', 'WOB', '#6BB6E8', '#1B7B4C'], ['friburgo', 'Friburgo', 'SCF', '#B01B2E', '#1B1F27'], ['hoffenheim', 'Hoffenheim', 'TSG', '#1B4C9B', '#E9EDF2'],
    ['union-berlino', 'Union Berlino', 'FCU', '#B01B2E', '#E9EDF2'], ['werder-brema', 'Werder Brema', 'SVW', '#1B7B4C', '#E9EDF2'], ['mainz', 'Mainz', 'M05', '#B01B2E', '#E9EDF2'],
    ['augsburg', 'Augsburg', 'FCA', '#B01B2E', '#1B7B4C'], ['borussia-mgladbach', 'Borussia M.', 'BMG', '#1B1F27', '#E9EDF2'], ['heidenheim', 'Heidenheim', 'HDH', '#1B3E9B', '#B01B2E'],
    ['st-pauli', 'St. Pauli', 'STP', '#6B4A2A', '#B01B2E'], ['bochum', 'Bochum', 'BOC', '#1B4C9B', '#E9EDF2'], ['holstein-kiel', 'Holstein Kiel', 'KIE', '#1B3E7B', '#E9EDF2'],
  ],
  'ligue-1': [
    ['psg', 'PSG', 'PSG', '#0E1C4E', '#B01B2E'], ['monaco', 'Monaco', 'ASM', '#B01B2E', '#E9EDF2'], ['marsiglia', 'Marsiglia', 'OM', '#6BB6E8', '#E9EDF2'],
    ['lille', 'Lille', 'LIL', '#B01B2E', '#1B3E9B'], ['lione', 'Lione', 'OL', '#E9EDF2', '#1B4C9B'], ['nizza', 'Nizza', 'NIC', '#B01B2E', '#1B1F27'],
    ['lens', 'Lens', 'RCL', '#E2C03C', '#B01B2E'], ['rennes', 'Rennes', 'REN', '#B01B2E', '#1B1F27'], ['brest', 'Brest', 'BRE', '#B01B2E', '#E9EDF2'],
    ['tolosa', 'Tolosa', 'TOU', '#6B2A7B', '#E9EDF2'], ['stade-reims', 'Stade Reims', 'REI', '#B01B2E', '#E9EDF2'], ['nantes', 'Nantes', 'NAN', '#E2C03C', '#1B7B4C'],
    ['strasburgo', 'Strasburgo', 'RCS', '#1B4C9B', '#E9EDF2'], ['montpellier', 'Montpellier', 'MHSC', '#E28A3C', '#1B3E7B'], ['le-havre', 'Le Havre', 'HAC', '#6BB6E8', '#0E1C4E'],
    ['auxerre', 'Auxerre', 'AJA', '#E9EDF2', '#1B4C9B'], ['angers', 'Angers', 'SCO', '#1B1F27', '#E9EDF2'], ['saint-etienne', 'Saint-Etienne', 'ASSE', '#1B7B4C', '#E9EDF2'],
  ],
};

// Membri della Champions League (riusa le squadre dei campionati nazionali)
const CL_MEMBERS = [
  'serie-a-inter', 'serie-a-milan', 'serie-a-juventus', 'serie-a-napoli',
  'premier-league-arsenal', 'premier-league-liverpool', 'premier-league-man-city', 'premier-league-chelsea', 'premier-league-tottenham',
  'laliga-real-madrid', 'laliga-barcellona', 'laliga-atletico-madrid', 'laliga-athletic-bilbao', 'laliga-villarreal',
  'bundesliga-bayern-monaco', 'bundesliga-bayer-leverkusen', 'bundesliga-borussia-dortmund', 'bundesliga-rb-lipsia',
  'ligue-1-psg', 'ligue-1-monaco',
];

export const TEAMS = [];

export const TEAMS_BY_LEAGUE = {};

Object.entries(LISTS).forEach(([leagueId, list]) => {
  TEAMS_BY_LEAGUE[leagueId] = list.map(([slug, name, short, c1, c2]) => {
    const team = { id: `${leagueId}-${slug}`, leagueId, name, short, initials: short, crest: null, photo: null, colors: [c1, c2] };
    TEAMS.push(team);
    return team;
  });
});

TEAMS_BY_LEAGUE['champions-league'] = CL_MEMBERS.map((id) => TEAMS.find((t) => t.id === id)).filter(Boolean);

const INDEX = {};
TEAMS.forEach((t) => {
  INDEX[t.id] = t;
});

export const teamById = (id) => INDEX[id] || null;

export const teamsOf = (leagueId) => TEAMS_BY_LEAGUE[leagueId] || [];

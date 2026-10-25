export type ThemeMode = 'chiaro' | 'scuro' | 'auto';

export interface League {
  id: string;
  key: string;
  name: string;
  country: string;
  season: string;
  logo: string;
  strength?: number;
  cup?: boolean;
  updated?: string;
}

export interface Team {
  id: string;
  name: string;
  leagueId: string;
  crest: string;
  color?: string;
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalDiff: number;
  form: ('V' | 'P' | 'S')[];
  totalFor: number;
  totalAgainst: number;
  sotFor: number;
  sotAgainst: number;
  coach: string;
}

export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: 'Portiere' | 'Difensore' | 'Centrocampista' | 'Attaccante';
  number: number;
  photo: string;
  rating: number;
  appearances: number;
  minutes: number;
  goals: number;
  assists: number;
  shotsPer90: number;
  sotPer90: number;
  foulsCommittedPer90: number;
  foulsDrawnPer90: number;
}

export interface ShotEvent {
  id: string;
  playerId: string;
  playerName: string;
  team: 'home' | 'away';
  minute: number;
  xG: number;
  bodyPart: 'Piede Destro' | 'Piede Sinistro' | 'Testa' | 'Altro';
  outcome: 'Gol' | 'Parato' | 'Fuori' | 'Murato';
  x: number; // 0 - 100 on pitch
  y: number; // 0 - 100 on pitch
}

export interface LineupPlayer {
  id: string;
  name: string;
  number: number;
  positionCoords: { x: number; y: number }; // Percentage 0-100 on half
  rating: number;
  isCaptain?: boolean;
  yellowCard?: boolean;
  redCard?: boolean;
  substitutedMinute?: number;
  subIn?: boolean;
}

export interface MatchTimelineEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'var';
  team: 'home' | 'away';
  player: string;
  detail?: string;
}

export interface Match {
  id: string;
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  homeTeam: Team;
  awayTeam: Team;
  status: 'pre' | 'live' | 'finished';
  date: string; // ISO date or "2026-10-25"
  time: string; // e.g. "20:45"
  liveMinute?: number;
  homeScore?: number;
  awayScore?: number;
  stadium: string;
  weather: {
    temp: string;
    condition: string;
    wind: string;
    icon: 'rain' | 'sun' | 'cloud' | 'clear';
  };
  referee: {
    name: string;
    foulsAvg: number;
    yellowAvg: number;
  };
  keyStats?: {
    label: string;
    homeVal: string | number;
    awayVal: string | number;
    homeRank?: string;
    awayRank?: string;
  }[];
  comparisonStats?: {
    metric: string;
    home: number;
    away: number;
    type?: 'int' | 'pct' | 'float';
  }[];
  seasonAverages?: {
    metric: string;
    home: number;
    away: number;
  }[];
  timeline?: MatchTimelineEvent[];
  momentum?: { minute: number; value: number }[]; // Positive for home, negative for away
  shots?: ShotEvent[];
  homeLineup?: {
    formation: string;
    coach: string;
    starters: LineupPlayer[];
    bench: { id: string; name: string; number: number; position: string; subIn?: boolean }[];
  };
  awayLineup?: {
    formation: string;
    coach: string;
    starters: LineupPlayer[];
    bench: { id: string; name: string; number: number; position: string; subIn?: boolean }[];
  };
}

export interface MatchupItem {
  id: string;
  home: string;
  away: string;
  home_logo?: string;
  away_logo?: string;
  league: string;
  time: string;
  category: 'Angoli' | 'Cartellini' | 'Tiri' | 'Falli' | 'Fuorigiochi';
  gap: number;
  homeValue: number;
  awayValue: number;
  gamesUsed: [number, number];
  firstHalfValue?: number;
  extraInfo?: string;
}

export interface BestPlayerRank {
  rank: number;
  playerId: string;
  name: string;
  match: string;
  league: string;
  line: 'Over 0.5' | 'Over 1.5' | 'Over 2.5';
  score: number; // e.g. 9.96
  expectedRate: number; // e.g. 7.66
  avgMinutes: number;
  last5Rate: number;
  seasonRate90: number;
}

export interface SavedPlay {
  id: string;
  ts: number;
  upd: number;
  outcome: 'pending' | 'win' | 'lose';
  kind: 'giocatore' | 'squadra';
  label: string;
  market: string;
  opp: string;
  score: number;
  odds: number;
  stake: number;
  prob: number;
}

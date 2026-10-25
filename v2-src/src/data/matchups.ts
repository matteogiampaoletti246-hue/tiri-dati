import { MatchupItem, BestPlayerRank } from '../types';

export const BEST_PLAYERS_DATA: BestPlayerRank[] = [
  {
    rank: 1,
    playerId: 'lautaro',
    name: 'Lautaro Martínez',
    match: 'Inter - Juventus',
    league: 'Serie A',
    line: 'Over 1.5',
    score: 9.96,
    expectedRate: 7.66,
    avgMinutes: 88,
    last5Rate: 7.6,
    seasonRate90: 6.9
  },
  {
    rank: 2,
    playerId: 'haaland',
    name: 'Erling Haaland',
    match: 'Man City - Southampton',
    league: 'Premier League',
    line: 'Over 2.5',
    score: 9.84,
    expectedRate: 7.42,
    avgMinutes: 90,
    last5Rate: 7.2,
    seasonRate90: 6.8
  },
  {
    rank: 3,
    playerId: 'vlahovic',
    name: 'Dušan Vlahović',
    match: 'Inter - Juventus',
    league: 'Serie A',
    line: 'Over 1.5',
    score: 9.68,
    expectedRate: 6.88,
    avgMinutes: 86,
    last5Rate: 6.9,
    seasonRate90: 6.4
  },
  {
    rank: 4,
    playerId: 'thuram',
    name: 'Marcus Thuram',
    match: 'Inter - Juventus',
    league: 'Serie A',
    line: 'Over 0.5',
    score: 9.55,
    expectedRate: 6.75,
    avgMinutes: 84,
    last5Rate: 6.5,
    seasonRate90: 6.2
  },
  {
    rank: 5,
    playerId: 'lewandowski',
    name: 'Robert Lewandowski',
    match: 'Real Madrid - Barcelona',
    league: 'La Liga',
    line: 'Over 1.5',
    score: 9.42,
    expectedRate: 6.50,
    avgMinutes: 85,
    last5Rate: 6.8,
    seasonRate90: 6.1
  },
  {
    rank: 6,
    playerId: 'yamal',
    name: 'Lamine Yamal',
    match: 'Real Madrid - Barcelona',
    league: 'La Liga',
    line: 'Over 0.5',
    score: 9.38,
    expectedRate: 6.12,
    avgMinutes: 82,
    last5Rate: 6.3,
    seasonRate90: 5.9
  },
  {
    rank: 7,
    playerId: 'dimarco',
    name: 'Federico Dimarco',
    match: 'Inter - Juventus',
    league: 'Serie A',
    line: 'Over 0.5',
    score: 9.15,
    expectedRate: 5.80,
    avgMinutes: 77,
    last5Rate: 5.9,
    seasonRate90: 5.4
  }
];

export const MATCHUPS_DATA: Record<string, MatchupItem[]> = {
  Angoli: [
    {
      id: 'ang-1',
      home: 'Inter',
      away: 'Juventus',
      league: 'Serie A',
      time: '20:45',
      category: 'Angoli',
      gap: 3.2,
      homeValue: 6.9,
      awayValue: 3.7,
      gamesUsed: [5, 5]
    },
    {
      id: 'ang-2',
      home: 'Real Madrid',
      away: 'Barcelona',
      league: 'La Liga',
      time: '21:00',
      category: 'Angoli',
      gap: 2.8,
      homeValue: 6.5,
      awayValue: 3.7,
      gamesUsed: [6, 6]
    },
    {
      id: 'ang-3',
      home: 'Arsenal',
      away: 'Liverpool',
      league: 'Premier League',
      time: '17:30',
      category: 'Angoli',
      gap: 2.5,
      homeValue: 6.2,
      awayValue: 3.7,
      gamesUsed: [5, 5]
    },
    {
      id: 'ang-4',
      home: 'Bayern Munich',
      away: 'Bochum',
      league: 'Bundesliga',
      time: '15:30',
      category: 'Angoli',
      gap: 4.1,
      homeValue: 7.8,
      awayValue: 3.7,
      gamesUsed: [5, 5]
    }
  ],
  Cartellini: [
    {
      id: 'cart-1',
      home: 'Inter',
      away: 'Juventus',
      league: 'Serie A',
      time: '20:45',
      category: 'Cartellini',
      gap: 1.8,
      homeValue: 2.6,
      awayValue: 4.4,
      firstHalfValue: 1.8,
      gamesUsed: [5, 5]
    },
    {
      id: 'cart-2',
      home: 'Roma',
      away: 'Lazio',
      league: 'Serie A',
      time: '18:00',
      category: 'Cartellini',
      gap: 2.2,
      homeValue: 3.1,
      awayValue: 5.3,
      firstHalfValue: 2.2,
      gamesUsed: [6, 6]
    },
    {
      id: 'cart-3',
      home: 'Sevilla',
      away: 'Real Betis',
      league: 'La Liga',
      time: '21:00',
      category: 'Cartellini',
      gap: 2.0,
      homeValue: 3.4,
      awayValue: 5.4,
      firstHalfValue: 2.1,
      gamesUsed: [5, 5]
    }
  ],
  Tiri: [
    {
      id: 'tir-1',
      home: 'Inter',
      away: 'Juventus',
      league: 'Serie A',
      time: '20:45',
      category: 'Tiri',
      gap: 4.2,
      homeValue: 22.5,
      awayValue: 18.3,
      gamesUsed: [6, 6]
    },
    {
      id: 'tir-2',
      home: 'FC Barcelona',
      away: 'Espanyol',
      league: 'La Liga',
      time: '16:15',
      category: 'Tiri',
      gap: 8.6,
      homeValue: 21.6,
      awayValue: 13.0,
      gamesUsed: [6, 6]
    },
    {
      id: 'tir-3',
      home: 'Bayern Munich',
      away: 'Augsburg',
      league: 'Bundesliga',
      time: '15:30',
      category: 'Tiri',
      gap: 9.6,
      homeValue: 23.2,
      awayValue: 13.6,
      gamesUsed: [5, 5]
    }
  ],
  Falli: [
    {
      id: 'fal-1',
      home: 'Atalanta',
      away: 'Monza',
      league: 'Serie A',
      time: '20:45',
      category: 'Falli',
      gap: 5.4,
      homeValue: 15.2,
      awayValue: 9.8,
      gamesUsed: [5, 5]
    },
    {
      id: 'fal-2',
      home: 'Getafe',
      away: 'Valencia',
      league: 'La Liga',
      time: '14:00',
      category: 'Falli',
      gap: 6.1,
      homeValue: 16.8,
      awayValue: 10.7,
      gamesUsed: [5, 5]
    }
  ],
  Fuorigiochi: [
    {
      id: 'off-1',
      home: 'FC Barcelona',
      away: 'Real Madrid',
      league: 'La Liga',
      time: '21:00',
      category: 'Fuorigiochi',
      gap: 3.5,
      homeValue: 4.8,
      awayValue: 1.3,
      gamesUsed: [6, 6]
    },
    {
      id: 'off-2',
      home: 'Brighton',
      away: 'Chelsea',
      league: 'Premier League',
      time: '16:00',
      category: 'Fuorigiochi',
      gap: 2.7,
      homeValue: 3.6,
      awayValue: 0.9,
      gamesUsed: [5, 5]
    }
  ]
};

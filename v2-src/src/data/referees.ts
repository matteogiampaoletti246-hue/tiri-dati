export interface Referee {
  id: string;
  name: string;
  country: string;
  photo: string;
  matches: number;
  yellowCardsTotal: number;
  yellowCardsAvg: number;
  redCardsTotal: number;
  redCardsAvg: number;
  foulsTotal: number;
  foulsAvg: number;
  penaltiesTotal: number;
  penaltiesAvg: number;
  recentMatches: {
    id: string;
    date: string;
    match: string;
    league: string;
    yellows: number;
    reds: number;
    fouls: number;
    penalties: number;
  }[];
}

export const REFEREES_DATA: Record<string, Referee> = {
  massa: {
    id: 'massa',
    name: 'Davide Massa',
    country: 'Italia',
    photo: 'https://images.fotmob.com/image_resources/playerimages/referee_default.png',
    matches: 5,
    yellowCardsTotal: 22,
    yellowCardsAvg: 4.4,
    redCardsTotal: 1,
    redCardsAvg: 0.2,
    foulsTotal: 128,
    foulsAvg: 25.6,
    penaltiesTotal: 2,
    penaltiesAvg: 0.4,
    recentMatches: [
      { id: 'm1', date: '19 ott 2026', match: 'Roma - Inter', league: 'Serie A', yellows: 5, reds: 0, fouls: 26, penalties: 0 },
      { id: 'm2', date: '05 ott 2026', match: 'Fiorentina - Milan', league: 'Serie A', yellows: 6, reds: 1, fouls: 28, penalties: 1 },
      { id: 'm3', date: '28 set 2026', match: 'Juventus - Napoli', league: 'Serie A', yellows: 3, reds: 0, fouls: 22, penalties: 0 },
      { id: 'm4', date: '21 set 2026', match: 'Lazio - Bologna', league: 'Serie A', yellows: 4, reds: 0, fouls: 24, penalties: 1 },
      { id: 'm5', date: '31 ago 2026', match: 'Atalanta - Torino', league: 'Serie A', yellows: 4, reds: 0, fouls: 28, penalties: 0 }
    ]
  },
  orsato: {
    id: 'orsato',
    name: 'Daniele Orsato',
    country: 'Italia',
    photo: 'https://images.fotmob.com/image_resources/playerimages/referee_default.png',
    matches: 6,
    yellowCardsTotal: 28,
    yellowCardsAvg: 4.67,
    redCardsTotal: 2,
    redCardsAvg: 0.33,
    foulsTotal: 162,
    foulsAvg: 27.0,
    penaltiesTotal: 3,
    penaltiesAvg: 0.5,
    recentMatches: [
      { id: 'o1', date: '20 ott 2026', match: 'Milan - Udinese', league: 'Serie A', yellows: 5, reds: 1, fouls: 29, penalties: 0 },
      { id: 'o2', date: '06 ott 2026', match: 'Inter - Torino', league: 'Serie A', yellows: 4, reds: 1, fouls: 25, penalties: 1 }
    ]
  },
  oliver: {
    id: 'oliver',
    name: 'Michael Oliver',
    country: 'Inghilterra',
    photo: 'https://images.fotmob.com/image_resources/playerimages/referee_default.png',
    matches: 7,
    yellowCardsTotal: 29,
    yellowCardsAvg: 4.14,
    redCardsTotal: 1,
    redCardsAvg: 0.14,
    foulsTotal: 154,
    foulsAvg: 22.0,
    penaltiesTotal: 2,
    penaltiesAvg: 0.29,
    recentMatches: [
      { id: 'ol1', date: '19 ott 2026', match: 'Arsenal - Chelsea', league: 'Premier League', yellows: 6, reds: 0, fouls: 24, penalties: 1 }
    ]
  }
};

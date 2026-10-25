import { Match } from '../types';
import { TEAMS_DATA } from './teams';

export const MATCHES_DATA: Match[] = [
  // Oggi - Live Match
  {
    id: 'match-live-1',
    leagueId: 'serie-a',
    leagueName: 'Serie A',
    leagueLogo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    homeTeam: TEAMS_DATA.inter,
    awayTeam: TEAMS_DATA.juventus,
    status: 'live',
    date: '2026-10-25',
    time: '20:45',
    liveMinute: 68,
    homeScore: 2,
    awayScore: 1,
    stadium: 'Stadio Giuseppe Meazza (San Siro), Milano',
    weather: {
      temp: '16°C',
      condition: 'Parzialmente nuvoloso',
      wind: '11 km/h NO',
      icon: 'cloud'
    },
    referee: {
      name: 'Davide Massa',
      foulsAvg: 25.6,
      yellowAvg: 4.4
    },
    keyStats: [
      { label: 'Tiri concessi a partita', homeVal: '11.0', awayVal: '7.2', homeRank: '2ª su 20', awayRank: '1ª su 20' },
      { label: 'Tiri fatti a partita', homeVal: '22.5', awayVal: '18.3', homeRank: '1ª su 20', awayRank: '4ª su 20' },
      { label: 'Possesso palla medio', homeVal: '61.4%', awayVal: '58.2%', homeRank: '2ª su 20', awayRank: '3ª su 20' },
      { label: 'xG medi prodotti', homeVal: '2.34', awayVal: '1.92', homeRank: '1ª su 20', awayRank: '4ª su 20' }
    ],
    comparisonStats: [
      { metric: 'Possesso palla', home: 58, away: 42, type: 'pct' },
      { metric: 'Expected Goals (xG)', home: 1.84, away: 0.92, type: 'float' },
      { metric: 'Tiri totali', home: 15, away: 8, type: 'int' },
      { metric: 'Tiri in porta', home: 6, away: 3, type: 'int' },
      { metric: 'Occasioni nitide', home: 3, away: 1, type: 'int' },
      { metric: 'Calci d\'angolo', home: 7, away: 3, type: 'int' },
      { metric: 'Falli commessi', home: 11, away: 14, type: 'int' },
      { metric: 'Cartellini gialli', home: 2, away: 3, type: 'int' },
      { metric: 'Passaggi riusciti', home: 412, away: 298, type: 'int' },
      { metric: 'Fuorigioco', home: 1, away: 2, type: 'int' }
    ],
    seasonAverages: [
      { metric: 'Tiri totali /90', home: 22.5, away: 18.3 },
      { metric: 'Tiri in porta /90', home: 7.2, away: 6.5 },
      { metric: 'Corner /90', home: 6.9, away: 5.4 },
      { metric: 'Falli /90', home: 12.1, away: 13.4 },
      { metric: 'Fuorigioco /90', home: 1.8, away: 2.1 }
    ],
    timeline: [
      { minute: 18, type: 'goal', team: 'home', player: 'M. Thuram', detail: 'Assist: F. Dimarco' },
      { minute: 34, type: 'yellow_card', team: 'away', player: 'G. Bremer', detail: 'Fallo tattico' },
      { minute: 42, type: 'goal', team: 'away', player: 'D. Vlahović', detail: 'Tiro di sinistro' },
      { minute: 45, type: 'var', team: 'home', player: 'Controllo VAR', detail: 'Gol convalidato' },
      { minute: 58, type: 'goal', team: 'home', player: 'L. Martínez', detail: 'Colpo di testa' },
      { minute: 61, type: 'yellow_card', team: 'home', player: 'N. Barella', detail: 'Proteste' },
      { minute: 65, type: 'substitution', team: 'away', player: 'T. Weah per K. Yildiz' }
    ],
    momentum: [
      { minute: 5, value: 30 },
      { minute: 15, value: 65 },
      { minute: 20, value: 45 },
      { minute: 30, value: 10 },
      { minute: 40, value: -55 },
      { minute: 45, value: -20 },
      { minute: 55, value: 70 },
      { minute: 60, value: 50 },
      { minute: 68, value: 25 }
    ],
    shots: [
      { id: 's1', playerId: 'thuram', playerName: 'M. Thuram', team: 'home', minute: 18, xG: 0.38, bodyPart: 'Piede Destro', outcome: 'Gol', x: 88, y: 48 },
      { id: 's2', playerId: 'lautaro', playerName: 'L. Martínez', team: 'home', minute: 24, xG: 0.12, bodyPart: 'Piede Destro', outcome: 'Parato', x: 82, y: 38 },
      { id: 's3', playerId: 'dimarco', playerName: 'F. Dimarco', team: 'home', minute: 31, xG: 0.08, bodyPart: 'Piede Sinistro', outcome: 'Fuori', x: 74, y: 25 },
      { id: 's4', playerId: 'vlahovic', playerName: 'D. Vlahović', team: 'away', minute: 42, xG: 0.32, bodyPart: 'Piede Sinistro', outcome: 'Gol', x: 14, y: 52 },
      { id: 's5', playerId: 'lautaro', playerName: 'L. Martínez', team: 'home', minute: 58, xG: 0.44, bodyPart: 'Testa', outcome: 'Gol', x: 91, y: 51 },
      { id: 's6', playerId: 'barella', playerName: 'N. Barella', team: 'home', minute: 63, xG: 0.06, bodyPart: 'Piede Destro', outcome: 'Murato', x: 78, y: 62 },
      { id: 's7', playerId: 'koopmeiners', playerName: 'T. Koopmeiners', team: 'away', minute: 66, xG: 0.15, bodyPart: 'Piede Sinistro', outcome: 'Parato', x: 22, y: 44 }
    ],
    homeLineup: {
      formation: '3-5-2',
      coach: 'Simone Inzaghi',
      starters: [
        { id: 'sommer', name: 'Y. Sommer', number: 1, positionCoords: { x: 50, y: 88 }, rating: 7.2 },
        { id: 'pavard', name: 'B. Pavard', number: 28, positionCoords: { x: 78, y: 72 }, rating: 7.4 },
        { id: 'acerbi', name: 'F. Acerbi', number: 15, positionCoords: { x: 50, y: 74 }, rating: 7.3 },
        { id: 'bastoni', name: 'A. Bastoni', number: 95, positionCoords: { x: 22, y: 72 }, rating: 7.5 },
        { id: 'dumfries', name: 'D. Dumfries', number: 2, positionCoords: { x: 90, y: 48 }, rating: 7.1 },
        { id: 'barella', name: 'N. Barella', number: 23, positionCoords: { x: 68, y: 48 }, rating: 7.6, yellowCard: true },
        { id: 'calhanoglu', name: 'H. Çalhanoğlu', number: 20, positionCoords: { x: 50, y: 52 }, rating: 7.8 },
        { id: 'mkhitaryan', name: 'H. Mkhitaryan', number: 22, positionCoords: { x: 32, y: 48 }, rating: 7.2 },
        { id: 'dimarco', name: 'F. Dimarco', number: 32, positionCoords: { x: 10, y: 48 }, rating: 7.9 },
        { id: 'thuram', name: 'M. Thuram', number: 9, positionCoords: { x: 65, y: 22 }, rating: 8.2 },
        { id: 'lautaro', name: 'L. Martínez', number: 10, positionCoords: { x: 35, y: 22 }, rating: 8.4, isCaptain: true }
      ],
      bench: [
        { id: 'martinez', name: 'J. Martínez', number: 13, position: 'P' },
        { id: 'de_vrij', name: 'S. de Vrij', number: 6, position: 'D' },
        { id: 'bisseck', name: 'Y. Bisseck', number: 31, position: 'D' },
        { id: 'carlos_augusto', name: 'Carlos Augusto', number: 30, position: 'C' },
        { id: 'frattesi', name: 'D. Frattesi', number: 16, position: 'C' },
        { id: 'zielinski', name: 'P. Zieliński', number: 7, position: 'C' },
        { id: 'taremi', name: 'M. Taremi', number: 99, position: 'A' },
        { id: 'arnautovic', name: 'M. Arnautović', number: 8, position: 'A' }
      ]
    },
    awayLineup: {
      formation: '4-2-3-1',
      coach: 'Thiago Motta',
      starters: [
        { id: 'di_gregorio', name: 'M. Di Gregorio', number: 29, positionCoords: { x: 50, y: 88 }, rating: 6.8 },
        { id: 'savona', name: 'N. Savona', number: 37, positionCoords: { x: 85, y: 72 }, rating: 6.5 },
        { id: 'kalulu', name: 'P. Kalulu', number: 15, positionCoords: { x: 62, y: 74 }, rating: 6.9 },
        { id: 'bremer', name: 'G. Bremer', number: 3, positionCoords: { x: 38, y: 74 }, rating: 6.7, yellowCard: true },
        { id: 'cambiaso', name: 'A. Cambiaso', number: 27, positionCoords: { x: 15, y: 72 }, rating: 7.2 },
        { id: 'locatelli', name: 'M. Locatelli', number: 5, positionCoords: { x: 62, y: 54 }, rating: 7.0 },
        { id: 'thuram_k', name: 'K. Thuram', number: 19, positionCoords: { x: 38, y: 54 }, rating: 6.8 },
        { id: 'conceicao', name: 'F. Conceição', number: 7, positionCoords: { x: 80, y: 36 }, rating: 7.4 },
        { id: 'koopmeiners', name: 'T. Koopmeiners', number: 8, positionCoords: { x: 50, y: 36 }, rating: 7.1 },
        { id: 'yildiz', name: 'K. Yildiz', number: 10, positionCoords: { x: 20, y: 36 }, rating: 6.6, substitutedMinute: 65 },
        { id: 'vlahovic', name: 'D. Vlahović', number: 9, positionCoords: { x: 50, y: 18 }, rating: 7.8, isCaptain: true }
      ],
      bench: [
        { id: 'perin', name: 'M. Perin', number: 1, position: 'P' },
        { id: 'gatti', name: 'F. Gatti', number: 4, position: 'D' },
        { id: 'caball', name: 'J. Cabal', number: 32, position: 'D' },
        { id: 'danilo', name: 'Danilo', number: 6, position: 'D' },
        { id: 'fagioli', name: 'N. Fagioli', number: 21, position: 'C' },
        { id: 'douglas_luiz', name: 'Douglas Luiz', number: 26, position: 'C' },
        { id: 'weah', name: 'T. Weah', number: 22, position: 'A', subIn: true },
        { id: 'mbangula', name: 'S. Mbangula', number: 51, position: 'A' }
      ]
    }
  },

  // Oggi - Pre-Match 1
  {
    id: 'match-pre-1',
    leagueId: 'la-liga',
    leagueName: 'La Liga',
    leagueLogo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/87.png',
    homeTeam: TEAMS_DATA.realmadrid,
    awayTeam: TEAMS_DATA.barcelona,
    status: 'pre',
    date: '2026-10-25',
    time: '21:00',
    stadium: 'Estadio Santiago Bernabéu, Madrid',
    weather: {
      temp: '18°C',
      condition: 'Sereno',
      wind: '8 km/h S',
      icon: 'clear'
    },
    referee: {
      name: 'José María Sánchez Martínez',
      foulsAvg: 26.2,
      yellowAvg: 5.1
    },
    keyStats: [
      { label: 'Tiri fatti a partita', homeVal: '17.9', awayVal: '21.6', homeRank: '2ª su 20', awayRank: '1ª su 20' },
      { label: 'Tiri concessi a partita', homeVal: '13.0', awayVal: '6.9', homeRank: '8ª su 20', awayRank: '1ª su 20' },
      { label: 'Tiri in porta a partita', homeVal: '7.1', awayVal: '8.3', homeRank: '2ª su 20', awayRank: '1ª su 20' },
      { label: 'Corner medi a favore', homeVal: '6.8', awayVal: '7.4', homeRank: '2ª su 20', awayRank: '1ª su 20' }
    ],
    seasonAverages: [
      { metric: 'Tiri totali', home: 17.9, away: 21.6 },
      { metric: 'Tiri in porta', home: 7.1, away: 8.3 },
      { metric: 'Corner', home: 6.8, away: 7.4 },
      { metric: 'Falli', home: 11.2, away: 10.4 },
      { metric: 'Fuorigioco', home: 1.6, away: 4.8 }
    ],
    comparisonStats: [
      { metric: 'Tiri attesi in partita', home: 16.4, away: 18.2, type: 'float' },
      { metric: 'Tiri in porta attesi', home: 6.2, away: 7.1, type: 'float' },
      { metric: 'Corner attesi', home: 5.8, away: 6.4, type: 'float' },
      { metric: 'Falli attesi', home: 12.0, away: 11.5, type: 'float' },
      { metric: 'Fuorigioco attesi', home: 1.8, away: 4.2, type: 'float' }
    ],
    homeLineup: {
      formation: '4-3-1-2',
      coach: 'Carlo Ancelotti',
      starters: [
        { id: 'lunin', name: 'A. Lunin', number: 13, positionCoords: { x: 50, y: 88 }, rating: 7.3 },
        { id: 'vazquez', name: 'L. Vázquez', number: 17, positionCoords: { x: 85, y: 72 }, rating: 7.2 },
        { id: 'militao', name: 'É. Militão', number: 3, positionCoords: { x: 62, y: 74 }, rating: 7.5 },
        { id: 'rudiger', name: 'A. Rüdiger', number: 22, positionCoords: { x: 38, y: 74 }, rating: 7.6 },
        { id: 'mendy', name: 'F. Mendy', number: 23, positionCoords: { x: 15, y: 72 }, rating: 7.1 },
        { id: 'valverde', name: 'F. Valverde', number: 8, positionCoords: { x: 75, y: 52 }, rating: 7.8 },
        { id: 'tchouameni', name: 'A. Tchouaméni', number: 14, positionCoords: { x: 50, y: 56 }, rating: 7.4 },
        { id: 'camavinga', name: 'E. Camavinga', number: 6, positionCoords: { x: 25, y: 52 }, rating: 7.5 },
        { id: 'bellingham', name: 'J. Bellingham', number: 5, positionCoords: { x: 50, y: 35 }, rating: 8.1 },
        { id: 'vinicius', name: 'Vinícius Jr.', number: 7, positionCoords: { x: 30, y: 18 }, rating: 8.5 },
        { id: 'mbappe', name: 'K. Mbappé', number: 9, positionCoords: { x: 70, y: 18 }, rating: 8.3 }
      ],
      bench: [
        { id: 'gonzalez', name: 'Fran González', number: 26, position: 'P' },
        { id: 'modric', name: 'L. Modrić', number: 10, position: 'C' },
        { id: 'guler', name: 'A. Güler', number: 15, position: 'C' },
        { id: 'endrick', name: 'Endrick', number: 16, position: 'A' },
        { id: 'brahim', name: 'Brahim Díaz', number: 21, position: 'A' }
      ]
    },
    awayLineup: {
      formation: '4-2-3-1',
      coach: 'Hansi Flick',
      starters: [
        { id: 'pena', name: 'Iñaki Peña', number: 13, positionCoords: { x: 50, y: 88 }, rating: 7.1 },
        { id: 'kounde', name: 'J. Koundé', number: 23, positionCoords: { x: 85, y: 72 }, rating: 7.7 },
        { id: 'cubarsi', name: 'P. Cubarsí', number: 2, positionCoords: { x: 62, y: 74 }, rating: 7.6 },
        { id: 'martinez_i', name: 'I. Martínez', number: 5, positionCoords: { x: 38, y: 74 }, rating: 7.5 },
        { id: 'balde', name: 'A. Balde', number: 3, positionCoords: { x: 15, y: 72 }, rating: 7.3 },
        { id: 'casado', name: 'M. Casadó', number: 17, positionCoords: { x: 62, y: 54 }, rating: 7.6 },
        { id: 'pedri', name: 'Pedri', number: 8, positionCoords: { x: 38, y: 54 }, rating: 8.0 },
        { id: 'yamal', name: 'L. Yamal', number: 19, positionCoords: { x: 80, y: 35 }, rating: 8.4 },
        { id: 'olmo', name: 'Dani Olmo', number: 20, positionCoords: { x: 50, y: 35 }, rating: 7.9 },
        { id: 'raphinha', name: 'Raphinha', number: 11, positionCoords: { x: 20, y: 35 }, rating: 8.3, isCaptain: true },
        { id: 'lewandowski', name: 'R. Lewandowski', number: 9, positionCoords: { x: 50, y: 18 }, rating: 8.5 }
      ],
      bench: [
        { id: 'szczesny', name: 'W. Szczęsny', number: 25, position: 'P' },
        { id: 'de_jong', name: 'F. de Jong', number: 21, position: 'C' },
        { id: 'gavi', name: 'Gavi', number: 6, position: 'C' },
        { id: 'fermin', name: 'Fermín López', number: 16, position: 'C' },
        { id: 'pau_victor', name: 'Pau Víctor', number: 18, position: 'A' },
        { id: 'ansufati', name: 'Ansu Fati', number: 10, position: 'A' }
      ]
    }
  },

  // Oggi - Pre-Match 2
  {
    id: 'match-pre-2',
    leagueId: 'premier-league',
    leagueName: 'Premier League',
    leagueLogo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/47.png',
    homeTeam: TEAMS_DATA.arsenal,
    awayTeam: TEAMS_DATA.manchestercity,
    status: 'pre',
    date: '2026-10-25',
    time: '17:30',
    stadium: 'Emirates Stadium, Londra',
    weather: {
      temp: '14°C',
      condition: 'Pioggia leggera',
      wind: '18 km/h O',
      icon: 'rain'
    },
    referee: {
      name: 'Michael Oliver',
      foulsAvg: 22.0,
      yellowAvg: 4.14
    },
    keyStats: [
      { label: 'Tiri concessi a partita', homeVal: '10.7', awayVal: '12.0', homeRank: '2ª su 20', awayRank: '4ª su 20' },
      { label: 'Tiri in porta fatti', homeVal: '5.0', awayVal: '5.2', homeRank: '4ª su 20', awayRank: '3ª su 20' }
    ]
  },

  // Ieri - Finished Match 1
  {
    id: 'match-fin-1',
    leagueId: 'serie-a',
    leagueName: 'Serie A',
    leagueLogo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    homeTeam: TEAMS_DATA.milan,
    awayTeam: TEAMS_DATA.napoli,
    status: 'finished',
    date: '2026-10-24',
    time: '20:45',
    homeScore: 1,
    awayScore: 2,
    stadium: 'San Siro, Milano',
    weather: {
      temp: '15°C',
      condition: 'Sereno',
      wind: '6 km/h',
      icon: 'clear'
    },
    referee: {
      name: 'Daniele Orsato',
      foulsAvg: 27.0,
      yellowAvg: 4.67
    },
    comparisonStats: [
      { metric: 'Possesso palla', home: 54, away: 46, type: 'pct' },
      { metric: 'Expected Goals (xG)', home: 1.25, away: 1.62, type: 'float' },
      { metric: 'Tiri totali', home: 14, away: 12, type: 'int' },
      { metric: 'Tiri in porta', home: 4, away: 5, type: 'int' },
      { metric: 'Occasioni nitide', home: 2, away: 3, type: 'int' },
      { metric: 'Calci d\'angolo', home: 5, away: 4, type: 'int' },
      { metric: 'Falli commessi', home: 12, away: 16, type: 'int' },
      { metric: 'Cartellini gialli', home: 2, away: 4, type: 'int' },
      { metric: 'Passaggi riusciti', home: 440, away: 365, type: 'int' },
      { metric: 'Fuorigioco', home: 2, away: 1, type: 'int' }
    ],
    timeline: [
      { minute: 12, type: 'goal', team: 'away', player: 'K. Kvaratskhelia', detail: 'Assist: R. Lukaku' },
      { minute: 43, type: 'goal', team: 'away', player: 'R. Lukaku', detail: 'Tiro di sinistro' },
      { minute: 68, type: 'goal', team: 'home', player: 'Á. Morata', detail: 'Colpo di testa' }
    ]
  },

  // Domani - Upcoming Match 1
  {
    id: 'match-up-1',
    leagueId: 'serie-a',
    leagueName: 'Serie A',
    leagueLogo: 'https://images.fotmob.com/image_resources/logo/leaguelogo/55.png',
    homeTeam: TEAMS_DATA.roma,
    awayTeam: TEAMS_DATA.atalanta,
    status: 'pre',
    date: '2026-10-26',
    time: '20:45',
    stadium: 'Stadio Olimpico, Roma',
    weather: {
      temp: '17°C',
      condition: 'Sereno',
      wind: '9 km/h NE',
      icon: 'clear'
    },
    referee: {
      name: 'Fabio Maresca',
      foulsAvg: 26.8,
      yellowAvg: 4.8
    }
  }
];

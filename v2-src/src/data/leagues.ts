export interface TeamStat {
  totalFor: number;
  totalAgainst: number;
  sotFor: number;
  sotAgainst: number;
}

export interface LeagueInfo {
  label: string;
  updated: string;
  cup?: boolean;
  strength?: number;
  size?: number;
  avg?: {
    totalFor: number;
    totalAgainst: number;
    sotFor: number;
    sotAgainst: number;
  };
  ranks?: {
    totalFor: Record<string, number>;
    totalAgainst: Record<string, number>;
    sotFor: Record<string, number>;
    sotAgainst: Record<string, number>;
  };
  teams: Record<string, TeamStat>;
}

export const LEAGUE_DATA: Record<string, LeagueInfo> = {
  "serie-a": {
    label: "Serie A",
    updated: "20 ott 2026 (football-data.co.uk, 6 giornate)",
    teams: {
      "Inter": { totalFor: 22.5, totalAgainst: 11.0, sotFor: 7.2, sotAgainst: 3.5 },
      "Roma": { totalFor: 18.7, totalAgainst: 10.8, sotFor: 6.2, sotAgainst: 3.5 },
      "Como": { totalFor: 22.7, totalAgainst: 14.0, sotFor: 6.7, sotAgainst: 3.2 },
      "Udinese": { totalFor: 14.3, totalAgainst: 16.3, sotFor: 4.2, sotAgainst: 5.8 },
      "Sassuolo": { totalFor: 16.0, totalAgainst: 15.0, sotFor: 6.5, sotAgainst: 6.0 },
      "AC Milan": { totalFor: 12.5, totalAgainst: 9.2, sotFor: 4.5, sotAgainst: 3.5 },
      "Frosinone": { totalFor: 16.8, totalAgainst: 20.5, sotFor: 4.8, sotAgainst: 5.7 },
      "Lazio": { totalFor: 13.5, totalAgainst: 13.2, sotFor: 4.3, sotAgainst: 5.2 },
      "Napoli": { totalFor: 14.7, totalAgainst: 16.7, sotFor: 4.8, sotAgainst: 3.8 },
      "Juventus": { totalFor: 18.3, totalAgainst: 7.2, sotFor: 6.5, sotAgainst: 2.7 },
      "Monza": { totalFor: 14.3, totalAgainst: 12.7, sotFor: 6.0, sotAgainst: 5.2 },
      "Fiorentina": { totalFor: 16.2, totalAgainst: 11.5, sotFor: 5.2, sotAgainst: 5.0 },
      "Atalanta": { totalFor: 13.5, totalAgainst: 19.2, sotFor: 4.7, sotAgainst: 5.8 },
      "Lecce": { totalFor: 10.2, totalAgainst: 15.3, sotFor: 3.7, sotAgainst: 7.3 },
      "Venezia": { totalFor: 14.8, totalAgainst: 15.7, sotFor: 4.3, sotAgainst: 6.8 },
      "Cagliari": { totalFor: 9.7, totalAgainst: 20.7, sotFor: 3.8, sotAgainst: 5.2 },
      "Torino": { totalFor: 9.8, totalAgainst: 15.3, sotFor: 3.2, sotAgainst: 4.0 },
      "Genoa": { totalFor: 11.5, totalAgainst: 15.3, sotFor: 3.2, sotAgainst: 4.3 },
      "Parma": { totalFor: 8.3, totalAgainst: 18.5, sotFor: 2.7, sotAgainst: 5.7 },
      "Bologna": { totalFor: 12.7, totalAgainst: 13.0, sotFor: 3.5, sotAgainst: 3.7 }
    }
  },
  "premier-league": {
    label: "Premier League",
    updated: "20 ott 2026 (football-data.co.uk, 6 giornate)",
    teams: {
      "Brighton": { totalFor: 18.0, totalAgainst: 11.7, sotFor: 5.5, sotAgainst: 3.7 },
      "Chelsea": { totalFor: 13.7, totalAgainst: 13.5, sotFor: 5.3, sotAgainst: 6.0 },
      "Manchester City": { totalFor: 13.8, totalAgainst: 12.0, sotFor: 5.2, sotAgainst: 4.3 },
      "Arsenal": { totalFor: 13.0, totalAgainst: 10.7, sotFor: 5.0, sotAgainst: 3.2 },
      "Manchester United": { totalFor: 20.8, totalAgainst: 10.8, sotFor: 5.3, sotAgainst: 4.3 },
      "Newcastle": { totalFor: 11.7, totalAgainst: 17.8, sotFor: 4.0, sotAgainst: 5.7 },
      "Leeds United": { totalFor: 12.0, totalAgainst: 14.3, sotFor: 3.8, sotAgainst: 4.5 },
      "Ipswich Town": { totalFor: 11.5, totalAgainst: 16.5, sotFor: 4.7, sotAgainst: 5.5 },
      "Brentford": { totalFor: 15.8, totalAgainst: 14.5, sotFor: 4.5, sotAgainst: 5.0 },
      "Liverpool": { totalFor: 14.8, totalAgainst: 12.2, sotFor: 5.0, sotAgainst: 3.7 },
      "Crystal Palace": { totalFor: 11.0, totalAgainst: 18.0, sotFor: 4.2, sotAgainst: 5.7 },
      "Bournemouth": { totalFor: 12.8, totalAgainst: 10.7, sotFor: 5.0, sotAgainst: 4.3 },
      "Everton": { totalFor: 15.8, totalAgainst: 13.0, sotFor: 5.0, sotAgainst: 3.8 },
      "Hull City": { totalFor: 11.7, totalAgainst: 14.0, sotFor: 4.0, sotAgainst: 4.7 },
      "Fulham": { totalFor: 14.2, totalAgainst: 15.7, sotFor: 4.5, sotAgainst: 4.8 },
      "Nottingham Forest": { totalFor: 17.7, totalAgainst: 10.8, sotFor: 3.8, sotAgainst: 3.7 },
      "Sunderland": { totalFor: 13.0, totalAgainst: 12.2, sotFor: 4.7, sotAgainst: 3.3 },
      "Aston Villa": { totalFor: 11.3, totalAgainst: 15.8, sotFor: 3.2, sotAgainst: 5.0 },
      "Tottenham": { totalFor: 13.8, totalAgainst: 14.7, sotFor: 3.7, sotAgainst: 4.2 },
      "Coventry City": { totalFor: 10.0, totalAgainst: 17.7, sotFor: 3.7, sotAgainst: 4.7 }
    }
  },
  "la-liga": {
    label: "La Liga",
    updated: "14 ott 2026",
    teams: {
      "FC Barcelona": { totalFor: 21.6, totalAgainst: 6.9, sotFor: 8.3, sotAgainst: 2.9 },
      "Real Madrid": { totalFor: 17.9, totalAgainst: 13.0, sotFor: 7.1, sotAgainst: 4.4 },
      "Atlético Madrid": { totalFor: 17.6, totalAgainst: 9.5, sotFor: 6.5, sotAgainst: 3.3 },
      "Alavés": { totalFor: 11.9, totalAgainst: 13.4, sotFor: 4.3, sotAgainst: 4.5 },
      "Racing Santander": { totalFor: 11.5, totalAgainst: 15.9, sotFor: 4.9, sotAgainst: 6.6 },
      "Rayo Vallecano": { totalFor: 13.4, totalAgainst: 16.4, sotFor: 4.6, sotAgainst: 5.6 },
      "Villarreal": { totalFor: 15.9, totalAgainst: 12.6, sotFor: 6.3, sotAgainst: 3.8 },
      "Deportivo A Coruña": { totalFor: 11.5, totalAgainst: 12.8, sotFor: 4.3, sotAgainst: 4.4 },
      "Espanyol": { totalFor: 13.0, totalAgainst: 12.5, sotFor: 3.9, sotAgainst: 5.0 },
      "Sevilla": { totalFor: 11.9, totalAgainst: 12.4, sotFor: 4.3, sotAgainst: 4.6 },
      "Levante": { totalFor: 12.0, totalAgainst: 15.6, sotFor: 4.3, sotAgainst: 5.7 },
      "Athletic Bilbao": { totalFor: 15.7, totalAgainst: 9.5, sotFor: 4.7, sotAgainst: 3.7 },
      "Real Betis": { totalFor: 17.8, totalAgainst: 15.1, sotFor: 6.5, sotAgainst: 5.8 },
      "Elche": { totalFor: 11.5, totalAgainst: 14.3, sotFor: 4.6, sotAgainst: 4.1 },
      "Real Sociedad": { totalFor: 13.4, totalAgainst: 16.5, sotFor: 5.0, sotAgainst: 6.3 },
      "Osasuna": { totalFor: 9.5, totalAgainst: 13.8, sotFor: 4.0, sotAgainst: 4.3 },
      "Celta de Vigo": { totalFor: 9.9, totalAgainst: 12.5, sotFor: 3.3, sotAgainst: 3.8 },
      "Getafe": { totalFor: 10.8, totalAgainst: 14.5, sotFor: 2.5, sotAgainst: 4.9 },
      "Málaga": { totalFor: 10.6, totalAgainst: 14.1, sotFor: 2.6, sotAgainst: 5.5 },
      "Valencia": { totalFor: 10.5, totalAgainst: 15.9, sotFor: 2.6, sotAgainst: 5.5 }
    }
  },
  "bundesliga": {
    label: "Bundesliga",
    updated: "14 ott 2026",
    teams: {
      "SC Freiburg": { totalFor: 17.2, totalAgainst: 8.6, sotFor: 6.0, sotAgainst: 2.0 },
      "FC Augsburg": { totalFor: 13.6, totalAgainst: 22.4, sotFor: 6.8, sotAgainst: 7.8 },
      "RB Leipzig": { totalFor: 19.0, totalAgainst: 14.6, sotFor: 7.0, sotAgainst: 6.0 },
      "Dortmund": { totalFor: 15.8, totalAgainst: 11.8, sotFor: 6.0, sotAgainst: 3.6 },
      "Bayer 04 Leverkusen": { totalFor: 21.2, totalAgainst: 11.8, sotFor: 6.4, sotAgainst: 3.8 },
      "Elversberg": { totalFor: 9.6, totalAgainst: 21.2, sotFor: 4.0, sotAgainst: 4.8 },
      "Eintracht Frankfurt": { totalFor: 14.6, totalAgainst: 19.2, sotFor: 5.6, sotAgainst: 7.8 },
      "Bayern Munich": { totalFor: 23.2, totalAgainst: 7.0, sotFor: 9.0, sotAgainst: 2.6 },
      "FSV Mainz 05": { totalFor: 19.2, totalAgainst: 13.2, sotFor: 6.0, sotAgainst: 4.0 },
      "TSG Hoffenheim": { totalFor: 18.6, totalAgainst: 14.6, sotFor: 4.8, sotAgainst: 4.8 },
      "Stuttgart": { totalFor: 15.8, totalAgainst: 18.8, sotFor: 6.0, sotAgainst: 5.4 },
      "Werder Bremen": { totalFor: 13.2, totalAgainst: 16.2, sotFor: 6.0, sotAgainst: 5.8 },
      "Köln": { totalFor: 17.4, totalAgainst: 15.8, sotFor: 5.4, sotAgainst: 6.2 },
      "FC Union Berlin": { totalFor: 13.4, totalAgainst: 16.4, sotFor: 5.4, sotAgainst: 8.0 },
      "Schalke 04": { totalFor: 10.4, totalAgainst: 16.2, sotFor: 3.6, sotAgainst: 6.2 },
      "Borussia Mönchengladbach": { totalFor: 16.4, totalAgainst: 18.8, sotFor: 4.8, sotAgainst: 9.0 },
      "Paderborn": { totalFor: 14.0, totalAgainst: 18.4, sotFor: 2.6, sotAgainst: 5.4 },
      "Hamburg": { totalFor: 10.6, totalAgainst: 18.2, sotFor: 3.8, sotAgainst: 6.0 }
    }
  },
  "ligue-1": {
    label: "Ligue 1",
    updated: "20 ott 2026 (football-data.co.uk, 6 giornate)",
    teams: {
      "Le Mans": { totalFor: 10.5, totalAgainst: 17.2, sotFor: 4.7, sotAgainst: 5.5 },
      "Strasbourg": { totalFor: 11.5, totalAgainst: 16.3, sotFor: 4.5, sotAgainst: 6.2 },
      "Lille": { totalFor: 11.5, totalAgainst: 16.2, sotFor: 5.5, sotAgainst: 3.8 },
      "Angers SCO": { totalFor: 14.0, totalAgainst: 16.8, sotFor: 3.0, sotAgainst: 6.3 },
      "Rennes": { totalFor: 17.0, totalAgainst: 15.0, sotFor: 6.2, sotAgainst: 5.3 },
      "Monaco": { totalFor: 11.2, totalAgainst: 14.0, sotFor: 4.5, sotAgainst: 4.3 },
      "Auxerre": { totalFor: 12.0, totalAgainst: 14.8, sotFor: 5.0, sotAgainst: 6.3 },
      "Toulouse": { totalFor: 13.7, totalAgainst: 15.2, sotFor: 4.5, sotAgainst: 5.0 },
      "Le Havre": { totalFor: 15.8, totalAgainst: 13.0, sotFor: 4.5, sotAgainst: 4.7 },
      "Troyes": { totalFor: 14.8, totalAgainst: 12.3, sotFor: 2.8, sotAgainst: 5.0 },
      "Lorient": { totalFor: 10.0, totalAgainst: 13.8, sotFor: 3.5, sotAgainst: 3.8 },
      "Marseille": { totalFor: 11.8, totalAgainst: 16.7, sotFor: 4.3, sotAgainst: 5.7 },
      "Lens": { totalFor: 14.8, totalAgainst: 11.5, sotFor: 6.5, sotAgainst: 5.0 },
      "Brest": { totalFor: 19.0, totalAgainst: 11.2, sotFor: 6.3, sotAgainst: 4.2 },
      "Nice": { totalFor: 11.7, totalAgainst: 12.7, sotFor: 3.5, sotAgainst: 4.5 },
      "Lyon": { totalFor: 13.5, totalAgainst: 11.8, sotFor: 5.0, sotAgainst: 4.0 },
      "Paris FC": { totalFor: 13.8, totalAgainst: 9.3, sotFor: 4.3, sotAgainst: 3.0 },
      "PSG": { totalFor: 21.3, totalAgainst: 10.2, sotFor: 7.3, sotAgainst: 3.3 }
    }
  },
  "eredivisie": {
    label: "Eredivisie (Olanda)",
    updated: "19 ott 2026",
    strength: 0.85,
    size: 18,
    avg: { totalFor: 15.006, totalAgainst: 15.067, sotFor: 5.256, sotAgainst: 5.283 },
    ranks: {
      totalFor: { "AZ Alkmaar": 5, "Feyenoord": 2, "NEC Nijmegen": 7, "PSV Eindhoven": 4 },
      totalAgainst: { "AZ Alkmaar": 18, "Feyenoord": 14, "NEC Nijmegen": 13, "PSV Eindhoven": 16 },
      sotFor: { "AZ Alkmaar": 5, "Feyenoord": 1, "NEC Nijmegen": 13, "PSV Eindhoven": 3 },
      sotAgainst: { "AZ Alkmaar": 18, "Feyenoord": 17, "NEC Nijmegen": 13, "PSV Eindhoven": 12 }
    },
    teams: {
      "AZ Alkmaar": { totalFor: 17.3, totalAgainst: 9.2, sotFor: 6.6, sotAgainst: 2.9 },
      "Feyenoord": { totalFor: 21.4, totalAgainst: 11.2, sotFor: 8.3, sotAgainst: 3.4 },
      "NEC Nijmegen": { totalFor: 15.3, totalAgainst: 11.6, sotFor: 4.2, sotAgainst: 4.2 },
      "PSV Eindhoven": { totalFor: 19.7, totalAgainst: 11.0, sotFor: 7.2, sotAgainst: 4.4 }
    }
  },
  "super-lig": {
    label: "Süper Lig (Turchia)",
    updated: "19 ott 2026",
    strength: 0.85,
    size: 18,
    avg: { totalFor: 14.050, totalAgainst: 13.972, sotFor: 4.683, sotAgainst: 4.644 },
    ranks: {
      totalFor: { "Beşiktaş": 3, "Fenerbahçe": 2, "Galatasaray": 1 },
      totalAgainst: { "Beşiktaş": 18, "Fenerbahçe": 13, "Galatasaray": 16 },
      sotFor: { "Beşiktaş": 4, "Fenerbahçe": 2, "Galatasaray": 1 },
      sotAgainst: { "Beşiktaş": 18, "Fenerbahçe": 12, "Galatasaray": 17 }
    },
    teams: {
      "Beşiktaş": { totalFor: 17.6, totalAgainst: 8.9, sotFor: 6.3, sotAgainst: 3.3 },
      "Fenerbahçe": { totalFor: 18.4, totalAgainst: 13.4, sotFor: 7.3, sotAgainst: 4.1 },
      "Galatasaray": { totalFor: 22.4, totalAgainst: 11.0, sotFor: 7.6, sotAgainst: 3.5 }
    }
  },
  "liga-portugal": {
    label: "Liga Portugal",
    updated: "20 ott 2026 (football-data.co.uk, 8 giornate)",
    strength: 0.85,
    size: 18,
    avg: { totalFor: 12.276, totalAgainst: 12.221, sotFor: 4.076, sotAgainst: 4.054 },
    ranks: {
      totalFor: { "Benfica": 1, "FC Porto": 3, "Sporting CP": 7 },
      totalAgainst: { "Benfica": 18, "FC Porto": 12, "Sporting CP": 14 },
      sotFor: { "Benfica": 1, "FC Porto": 2, "Sporting CP": 3 },
      sotAgainst: { "Benfica": 18, "FC Porto": 14, "Sporting CP": 13 }
    },
    teams: {
      "Benfica": { totalFor: 19.6, totalAgainst: 7.6, sotFor: 6.9, sotAgainst: 2.1 },
      "FC Porto": { totalFor: 16.4, totalAgainst: 10.2, sotFor: 6.6, sotAgainst: 2.8 },
      "Sporting CP": { totalFor: 12.9, totalAgainst: 9.4, sotFor: 5.5, sotAgainst: 2.9 }
    }
  },
  "champions-league": {
    label: "Champions League",
    cup: true,
    updated: "18 ott 2026 (dopo la 2ª giornata, 2 partite a squadra)",
    teams: {
      "AEK Athens": { totalFor: 14.5, totalAgainst: 11.5, sotFor: 3.0, sotAgainst: 3.5 },
      "Arsenal": { totalFor: 21.0, totalAgainst: 4.5, sotFor: 7.5, sotAgainst: 1.5 },
      "Aston Villa": { totalFor: 20.5, totalAgainst: 14.5, sotFor: 10.0, sotAgainst: 6.0 },
      "Atlético Madrid": { totalFor: 10.0, totalAgainst: 11.5, sotFor: 4.5, sotAgainst: 4.0 },
      "Bayern Munich": { totalFor: 25.5, totalAgainst: 5.5, sotFor: 10.0, sotAgainst: 2.5 },
      "Bodø/Glimt": { totalFor: 6.5, totalAgainst: 17.0, sotFor: 1.5, sotAgainst: 8.0 },
      "Club Brugge": { totalFor: 16.0, totalAgainst: 25.5, sotFor: 7.5, sotAgainst: 10.5 },
      "Como": { totalFor: 11.5, totalAgainst: 13.5, sotFor: 5.5, sotAgainst: 4.5 },
      "Dortmund": { totalFor: 13.5, totalAgainst: 12.0, sotFor: 5.0, sotAgainst: 5.0 },
      "FC Barcelona": { totalFor: 22.0, totalAgainst: 4.5, sotFor: 9.5, sotAgainst: 3.0 },
      "FC Porto": { totalFor: 8.0, totalAgainst: 18.5, sotFor: 2.5, sotAgainst: 8.5 },
      "Fenerbahçe": { totalFor: 13.0, totalAgainst: 14.0, sotFor: 5.5, sotAgainst: 7.0 },
      "Feyenoord": { totalFor: 8.5, totalAgainst: 17.5, sotFor: 3.5, sotAgainst: 7.0 },
      "Galatasaray": { totalFor: 7.5, totalAgainst: 15.0, sotFor: 3.5, sotAgainst: 7.5 },
      "Inter": { totalFor: 24.5, totalAgainst: 17.0, sotFor: 9.5, sotAgainst: 8.0 },
      "LASK": { totalFor: 11.5, totalAgainst: 22.0, sotFor: 3.5, sotAgainst: 5.5 },
      "Lens": { totalFor: 23.5, totalAgainst: 14.0, sotFor: 6.5, sotAgainst: 5.0 },
      "Lille": { totalFor: 5.0, totalAgainst: 18.0, sotFor: 1.0, sotAgainst: 6.0 },
      "Liverpool": { totalFor: 20.0, totalAgainst: 10.5, sotFor: 6.5, sotAgainst: 4.0 },
      "Manchester City": { totalFor: 22.5, totalAgainst: 10.0, sotFor: 9.0, sotAgainst: 4.5 },
      "Manchester United": { totalFor: 14.5, totalAgainst: 11.0, sotFor: 6.5, sotAgainst: 2.5 },
      "Napoli": { totalFor: 8.0, totalAgainst: 21.0, sotFor: 3.0, sotAgainst: 5.5 },
      "PSG": { totalFor: 25.0, totalAgainst: 18.0, sotFor: 11.5, sotAgainst: 6.0 },
      "PSV Eindhoven": { totalFor: 10.0, totalAgainst: 13.5, sotFor: 3.5, sotAgainst: 5.0 },
      "RB Leipzig": { totalFor: 16.0, totalAgainst: 12.5, sotFor: 6.0, sotAgainst: 5.5 },
      "Real Betis": { totalFor: 18.5, totalAgainst: 8.5, sotFor: 6.0, sotAgainst: 3.5 },
      "Real Madrid": { totalFor: 16.0, totalAgainst: 17.5, sotFor: 8.0, sotAgainst: 7.0 },
      "Roma": { totalFor: 11.0, totalAgainst: 13.5, sotFor: 5.0, sotAgainst: 7.0 },
      "Sabah FK": { totalFor: 12.0, totalAgainst: 19.5, sotFor: 3.0, sotAgainst: 7.5 },
      "Shakhtar Donetsk": { totalFor: 9.0, totalAgainst: 11.5, sotFor: 3.0, sotAgainst: 2.5 },
      "Slavia Prague": { totalFor: 17.0, totalAgainst: 19.5, sotFor: 5.0, sotAgainst: 7.0 },
      "Slovan Bratislava": { totalFor: 12.0, totalAgainst: 25.5, sotFor: 2.5, sotAgainst: 11.0 },
      "Sporting CP": { totalFor: 9.0, totalAgainst: 15.5, sotFor: 5.0, sotAgainst: 4.0 },
      "Stuttgart": { totalFor: 16.5, totalAgainst: 12.0, sotFor: 5.5, sotAgainst: 2.0 },
      "Viking": { totalFor: 9.0, totalAgainst: 21.0, sotFor: 4.0, sotAgainst: 5.5 },
      "Villarreal": { totalFor: 15.0, totalAgainst: 14.5, sotFor: 5.0, sotAgainst: 4.5 }
    }
  },
  "europa-league": {
    label: "Europa League",
    cup: true,
    updated: "18 ott 2026 (dopo la 2ª giornata, 2 partite a squadra)",
    teams: {
      "AC Milan": { totalFor: 16.0, totalAgainst: 12.5, sotFor: 7.0, sotAgainst: 3.0 },
      "Anderlecht": { totalFor: 12.0, totalAgainst: 13.0, sotFor: 5.5, sotAgainst: 6.5 },
      "Ararat-Armenia": { totalFor: 14.0, totalAgainst: 18.0, sotFor: 3.0, sotAgainst: 6.5 },
      "AZ Alkmaar": { totalFor: 13.0, totalAgainst: 13.0, sotFor: 4.5, sotAgainst: 4.5 },
      "Bayer 04 Leverkusen": { totalFor: 19.5, totalAgainst: 7.5, sotFor: 9.0, sotAgainst: 3.0 },
      "Benfica": { totalFor: 18.5, totalAgainst: 15.5, sotFor: 5.5, sotAgainst: 5.5 },
      "Beşiktaş": { totalFor: 18.5, totalAgainst: 13.5, sotFor: 6.0, sotAgainst: 3.0 },
      "Bournemouth": { totalFor: 17.0, totalAgainst: 11.0, sotFor: 5.0, sotAgainst: 3.0 },
      "Celje": { totalFor: 8.5, totalAgainst: 15.5, sotFor: 2.5, sotAgainst: 7.0 },
      "Celta de Vigo": { totalFor: 14.0, totalAgainst: 16.0, sotFor: 3.5, sotAgainst: 5.0 },
      "Celtic": { totalFor: 15.0, totalAgainst: 20.0, sotFor: 5.5, sotAgainst: 6.5 },
      "Crystal Palace": { totalFor: 14.0, totalAgainst: 14.0, sotFor: 5.0, sotAgainst: 5.0 },
      "Dinamo Zagreb": { totalFor: 10.0, totalAgainst: 12.5, sotFor: 2.0, sotAgainst: 4.0 },
      "Ferencváros": { totalFor: 13.0, totalAgainst: 17.0, sotFor: 6.0, sotAgainst: 5.5 },
      "Hapoel Beer-Sheva": { totalFor: 10.5, totalAgainst: 11.0, sotFor: 3.0, sotAgainst: 4.0 },
      "Jagiellonia": { totalFor: 8.5, totalAgainst: 20.5, sotFor: 4.0, sotAgainst: 5.0 },
      "Juventus": { totalFor: 16.5, totalAgainst: 10.0, sotFor: 6.5, sotAgainst: 2.5 },
      "Lech Poznań": { totalFor: 13.5, totalAgainst: 19.0, sotFor: 4.5, sotAgainst: 8.0 },
      "Levski Sofia": { totalFor: 11.0, totalAgainst: 15.0, sotFor: 1.0, sotAgainst: 8.0 },
      "Lillestrøm": { totalFor: 15.5, totalAgainst: 13.0, sotFor: 4.0, sotAgainst: 5.5 },
      "Lyon": { totalFor: 12.0, totalAgainst: 13.0, sotFor: 7.0, sotAgainst: 4.5 },
      "Marseille": { totalFor: 12.5, totalAgainst: 13.5, sotFor: 4.0, sotAgainst: 5.5 },
      "NEC Nijmegen": { totalFor: 14.5, totalAgainst: 9.5, sotFor: 6.0, sotAgainst: 4.5 },
      "OFI Crete": { totalFor: 5.5, totalAgainst: 23.0, sotFor: 2.0, sotAgainst: 7.0 },
      "Olympiacos": { totalFor: 17.5, totalAgainst: 7.5, sotFor: 5.0, sotAgainst: 4.0 },
      "Omonia": { totalFor: 12.0, totalAgainst: 15.5, sotFor: 5.0, sotAgainst: 3.5 },
      "Real Sociedad": { totalFor: 11.0, totalAgainst: 13.5, sotFor: 3.0, sotAgainst: 4.0 },
      "Rennes": { totalFor: 24.0, totalAgainst: 6.5, sotFor: 7.0, sotAgainst: 2.5 },
      "Salzburg": { totalFor: 13.0, totalAgainst: 14.5, sotFor: 4.5, sotAgainst: 5.0 },
      "Sparta Praha": { totalFor: 19.0, totalAgainst: 9.5, sotFor: 8.0, sotAgainst: 2.0 },
      "Sturm Graz": { totalFor: 8.5, totalAgainst: 23.0, sotFor: 2.5, sotAgainst: 6.0 },
      "Sunderland": { totalFor: 21.0, totalAgainst: 7.0, sotFor: 5.0, sotAgainst: 1.5 },
      "Torreense": { totalFor: 7.0, totalAgainst: 23.5, sotFor: 2.0, sotAgainst: 5.5 },
      "TSG Hoffenheim": { totalFor: 17.0, totalAgainst: 14.0, sotFor: 4.0, sotAgainst: 4.0 },
      "Union SG": { totalFor: 19.0, totalAgainst: 10.0, sotFor: 9.0, sotAgainst: 3.0 },
      "Viktoria Plzeň": { totalFor: 16.0, totalAgainst: 17.0, sotFor: 6.0, sotAgainst: 9.5 }
    }
  },
  "nazionali": {
    label: "Nazionali",
    updated: "media Nations League + Qualificazioni Mondiali, 23 set 2026",
    teams: {
      "Sweden": { totalFor: 17.4, totalAgainst: 9.6, sotFor: 6.7, sotAgainst: 4.3 },
      "Spain": { totalFor: 20.6, totalAgainst: 8.8, sotFor: 8.5, sotAgainst: 2.9 },
      "Austria": { totalFor: 15.9, totalAgainst: 8.7, sotFor: 6.4, sotAgainst: 2.1 },
      "France": { totalFor: 19.9, totalAgainst: 7.1, sotFor: 7.1, sotAgainst: 2.7 },
      "Türkiye": { totalFor: 15.6, totalAgainst: 11.4, sotFor: 5.1, sotAgainst: 3.9 },
      "Germany": { totalFor: 16.9, totalAgainst: 8.4, sotFor: 6.2, sotAgainst: 3.1 },
      "Romania": { totalFor: 14.8, totalAgainst: 9.6, sotFor: 6.0, sotAgainst: 3.5 },
      "Norway": { totalFor: 17.7, totalAgainst: 8.4, sotFor: 6.9, sotAgainst: 2.9 },
      "England": { totalFor: 17.5, totalAgainst: 5.8, sotFor: 7.1, sotAgainst: 1.5 },
      "Slovakia": { totalFor: 13.2, totalAgainst: 11.5, sotFor: 4.4, sotAgainst: 4.4 },
      "Portugal": { totalFor: 20.2, totalAgainst: 10.3, sotFor: 6.9, sotAgainst: 3.9 },
      "Armenia": { totalFor: 11.2, totalAgainst: 13.4, sotFor: 3.9, sotAgainst: 5.5 },
      "Netherlands": { totalFor: 16.1, totalAgainst: 9.5, sotFor: 6.0, sotAgainst: 3.4 },
      "Belgium": { totalFor: 18.4, totalAgainst: 9.0, sotFor: 6.6, sotAgainst: 3.4 },
      "Greece": { totalFor: 15.1, totalAgainst: 9.7, sotFor: 5.1, sotAgainst: 3.7 },
      "Kosovo": { totalFor: 11.9, totalAgainst: 11.1, sotFor: 4.5, sotAgainst: 4.2 },
      "Georgia": { totalFor: 12.5, totalAgainst: 9.9, sotFor: 3.9, sotAgainst: 3.9 },
      "Croatia": { totalFor: 17.8, totalAgainst: 10.5, sotFor: 6.8, sotAgainst: 3.6 },
      "Czech Republic": { totalFor: 14.8, totalAgainst: 10.8, sotFor: 5.6, sotAgainst: 3.8 },
      "Switzerland": { totalFor: 12.1, totalAgainst: 9.2, sotFor: 4.6, sotAgainst: 3.9 },
      "North Macedonia": { totalFor: 11.7, totalAgainst: 12.8, sotFor: 4.3, sotAgainst: 3.8 },
      "Poland": { totalFor: 15.0, totalAgainst: 13.1, sotFor: 5.3, sotAgainst: 4.8 },
      "Ukraine": { totalFor: 11.8, totalAgainst: 12.7, sotFor: 4.3, sotAgainst: 4.5 },
      "Montenegro": { totalFor: 13.7, totalAgainst: 14.8, sotFor: 4.3, sotAgainst: 5.6 },
      "Hungary": { totalFor: 12.4, totalAgainst: 13.8, sotFor: 4.2, sotAgainst: 5.1 },
      "Moldova": { totalFor: 10.9, totalAgainst: 15.5, sotFor: 3.3, sotAgainst: 5.6 },
      "Denmark": { totalFor: 16.0, totalAgainst: 10.9, sotFor: 6.0, sotAgainst: 3.4 },
      "San Marino": { totalFor: 8.0, totalAgainst: 15.6, sotFor: 2.3, sotAgainst: 6.2 },
      "Italy": { totalFor: 15.8, totalAgainst: 10.5, sotFor: 5.9, sotAgainst: 4.0 },
      "Northern Ireland": { totalFor: 10.2, totalAgainst: 9.1, sotFor: 3.8, sotAgainst: 2.6 },
      "Iceland": { totalFor: 10.7, totalAgainst: 14.3, sotFor: 4.2, sotAgainst: 6.3 },
      "Wales": { totalFor: 13.3, totalAgainst: 12.3, sotFor: 5.5, sotAgainst: 2.9 },
      "Azerbaijan": { totalFor: 7.4, totalAgainst: 18.4, sotFor: 2.6, sotAgainst: 6.5 },
      "Cyprus": { totalFor: 12.4, totalAgainst: 12.9, sotFor: 4.2, sotAgainst: 5.3 },
      "Slovenia": { totalFor: 9.7, totalAgainst: 12.4, sotFor: 3.0, sotAgainst: 4.3 },
      "Latvia": { totalFor: 8.7, totalAgainst: 14.2, sotFor: 2.5, sotAgainst: 4.4 },
      "Lithuania": { totalFor: 9.2, totalAgainst: 12.7, sotFor: 3.2, sotAgainst: 4.7 },
      "Republic of Ireland": { totalFor: 10.8, totalAgainst: 14.7, sotFor: 3.8, sotAgainst: 5.1 },
      "Luxembourg": { totalFor: 8.6, totalAgainst: 12.3, sotFor: 2.5, sotAgainst: 4.6 },
      "Serbia": { totalFor: 11.8, totalAgainst: 13.5, sotFor: 3.5, sotAgainst: 4.8 },
      "Albania": { totalFor: 9.4, totalAgainst: 12.1, sotFor: 2.8, sotAgainst: 3.7 },
      "Malta": { totalFor: 9.3, totalAgainst: 14.2, sotFor: 3.1, sotAgainst: 4.9 },
      "Faroe Islands": { totalFor: 9.1, totalAgainst: 15.8, sotFor: 3.4, sotAgainst: 4.6 },
      "Scotland": { totalFor: 10.1, totalAgainst: 16.4, sotFor: 4.0, sotAgainst: 4.3 },
      "Bulgaria": { totalFor: 6.5, totalAgainst: 15.7, sotFor: 2.5, sotAgainst: 5.3 },
      "Belarus": { totalFor: 9.0, totalAgainst: 16.7, sotFor: 2.9, sotAgainst: 6.8 },
      "Finland": { totalFor: 9.1, totalAgainst: 14.7, sotFor: 3.2, sotAgainst: 5.8 },
      "Liechtenstein": { totalFor: 5.1, totalAgainst: 15.9, sotFor: 1.5, sotAgainst: 6.1 },
      "Andorra": { totalFor: 5.8, totalAgainst: 11.9, sotFor: 1.7, sotAgainst: 4.3 },
      "Bosnia": { totalFor: 11.9, totalAgainst: 14.4, sotFor: 3.9, sotAgainst: 4.6 },
      "Gibraltar": { totalFor: 5.4, totalAgainst: 17.0, sotFor: 1.6, sotAgainst: 6.3 },
      "Kazakhstan": { totalFor: 9.8, totalAgainst: 17.3, sotFor: 2.6, sotAgainst: 6.5 },
      "Estonia": { totalFor: 6.7, totalAgainst: 22.2, sotFor: 2.4, sotAgainst: 7.7 },
      "Israel": { totalFor: 10.4, totalAgainst: 15.2, sotFor: 4.3, sotAgainst: 5.8 }
    }
  }
};

export function leagueSize(leagueKey: string): number {
  const L = LEAGUE_DATA[leagueKey];
  if (!L) return 20;
  return L.size || Object.keys(L.teams).length;
}

export function leagueStrength(leagueKey: string): number {
  const L = LEAGUE_DATA[leagueKey];
  return (L && L.strength) ? L.strength : 1;
}

export function leagueAverage(leagueKey: string, field: keyof TeamStat): number {
  const L = LEAGUE_DATA[leagueKey];
  if (!L) return 13.5;
  if (L.avg) return L.avg[field];
  const teams = L.teams;
  const vals = Object.values(teams).map(t => t[field]);
  if (vals.length === 0) return 13.5;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function computeRanks(leagueKey: string, field: keyof TeamStat): Record<string, number> {
  const L = LEAGUE_DATA[leagueKey];
  if (!L) return {};
  if (L.ranks) return L.ranks[field];
  const teams = L.teams;
  const entries = Object.entries(teams).map(([name, t]) => ({ name, val: t[field] }));
  entries.sort((a, b) => b.val - a.val);
  const ranks: Record<string, number> = {};
  let rank = 0;
  let prevVal: number | null = null;
  let count = 0;
  entries.forEach(e => {
    count++;
    if (e.val !== prevVal) {
      rank = count;
      prevVal = e.val;
    }
    ranks[e.name] = rank;
  });
  return ranks;
}

export function isCup(key: string): boolean {
  return !!(key && LEAGUE_DATA[key] && LEAGUE_DATA[key].cup);
}

export function domesticLeagueOf(teamName: string): string | null {
  for (const k of Object.keys(LEAGUE_DATA)) {
    if (k === 'nazionali' || isCup(k)) continue;
    if (LEAGUE_DATA[k].teams[teamName]) return k;
  }
  return null;
}

export function adjustForStrength(v: number, avg: number, s: number): number {
  return (s < 1 && avg > 0) ? avg + (v - avg) * s : v;
}

export function blendInfo(leagueKey: string, teamName: string, field: keyof TeamStat) {
  const L = LEAGUE_DATA[leagueKey];
  if (!L || !L.teams[teamName]) return null;
  const t = L.teams[teamName];
  const avg = leagueAverage(leagueKey, field);
  if (!L.cup) return { cup: false, combined: t[field], refAvg: avg };
  const dk = domesticLeagueOf(teamName);
  if (!dk) return { cup: true, domKey: null, cupVal: t[field], cupAvg: avg, combined: t[field], refAvg: avg };
  const domVal = LEAGUE_DATA[dk].teams[teamName][field];
  const domAvg = leagueAverage(dk, field);
  const domStr = leagueStrength(dk);
  const domAdj = adjustForStrength(domVal, domAvg, domStr);
  return {
    cup: true,
    domKey: dk,
    domVal,
    domAdj,
    domStr,
    domAvg,
    cupVal: t[field],
    cupAvg: avg,
    combined: (domAdj + t[field]) / 2,
    refAvg: (domAvg + avg) / 2
  };
}

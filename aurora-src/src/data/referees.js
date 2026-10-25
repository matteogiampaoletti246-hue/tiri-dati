// Arbitri — dati MOCK
export const REFEREES = [
  { id: 'ref-ita-1', name: 'Daniele Orsato', country: 'Italia', leagueId: 'serie-a', games: 5, yellows: 21, reds: 1, fouls: 132, penalties: 3 },
  { id: 'ref-ita-2', name: 'Marco Guida', country: 'Italia', leagueId: 'serie-a', games: 5, yellows: 24, reds: 2, fouls: 145, penalties: 2 },
  { id: 'ref-ita-3', name: 'Maurizio Mariani', country: 'Italia', leagueId: 'serie-a', games: 4, yellows: 15, reds: 0, fouls: 106, penalties: 1 },
  { id: 'ref-ita-4', name: 'Davide Massa', country: 'Italia', leagueId: 'serie-a', games: 5, yellows: 27, reds: 1, fouls: 151, penalties: 4 },
  { id: 'ref-eng-1', name: 'Michael Oliver', country: 'Inghilterra', leagueId: 'premier-league', games: 5, yellows: 18, reds: 1, fouls: 121, penalties: 2 },
  { id: 'ref-eng-2', name: 'Anthony Taylor', country: 'Inghilterra', leagueId: 'premier-league', games: 5, yellows: 26, reds: 2, fouls: 148, penalties: 3 },
  { id: 'ref-eng-3', name: 'Craig Pawson', country: 'Inghilterra', leagueId: 'premier-league', games: 4, yellows: 20, reds: 1, fouls: 118, penalties: 2 },
  { id: 'ref-eng-4', name: 'Paul Tierney', country: 'Inghilterra', leagueId: 'premier-league', games: 5, yellows: 22, reds: 0, fouls: 129, penalties: 1 },
  { id: 'ref-esp-1', name: 'Jesús Gil Manzano', country: 'Spagna', leagueId: 'laliga', games: 5, yellows: 31, reds: 3, fouls: 162, penalties: 4 },
  { id: 'ref-esp-2', name: 'Ricardo de Burgos', country: 'Spagna', leagueId: 'laliga', games: 5, yellows: 28, reds: 2, fouls: 154, penalties: 3 },
  { id: 'ref-esp-3', name: 'Alejandro Hernández', country: 'Spagna', leagueId: 'laliga', games: 4, yellows: 19, reds: 1, fouls: 111, penalties: 2 },
  { id: 'ref-esp-4', name: 'Juan Martínez Munuera', country: 'Spagna', leagueId: 'laliga', games: 5, yellows: 25, reds: 2, fouls: 143, penalties: 5 },
  { id: 'ref-ger-1', name: 'Felix Zwayer', country: 'Germania', leagueId: 'bundesliga', games: 5, yellows: 23, reds: 1, fouls: 137, penalties: 3 },
  { id: 'ref-ger-2', name: 'Deniz Aytekin', country: 'Germania', leagueId: 'bundesliga', games: 5, yellows: 20, reds: 2, fouls: 126, penalties: 2 },
  { id: 'ref-ger-3', name: 'Daniel Siebert', country: 'Germania', leagueId: 'bundesliga', games: 4, yellows: 17, reds: 0, fouls: 102, penalties: 1 },
  { id: 'ref-ger-4', name: 'Tobias Stieler', country: 'Germania', leagueId: 'bundesliga', games: 5, yellows: 29, reds: 3, fouls: 158, penalties: 4 },
  { id: 'ref-fra-1', name: 'Clément Turpin', country: 'Francia', leagueId: 'ligue-1', games: 5, yellows: 22, reds: 1, fouls: 134, penalties: 2 },
  { id: 'ref-fra-2', name: 'Benoît Bastien', country: 'Francia', leagueId: 'ligue-1', games: 5, yellows: 26, reds: 2, fouls: 147, penalties: 3 },
  { id: 'ref-fra-3', name: 'François Letexier', country: 'Francia', leagueId: 'ligue-1', games: 4, yellows: 18, reds: 0, fouls: 109, penalties: 1 },
  { id: 'ref-fra-4', name: 'Jérôme Brisard', country: 'Francia', leagueId: 'ligue-1', games: 5, yellows: 24, reds: 1, fouls: 139, penalties: 4 },
  { id: 'ref-eu-1', name: 'Szymon Marciniak', country: 'Polonia', leagueId: 'champions-league', games: 5, yellows: 19, reds: 1, fouls: 122, penalties: 2 },
  { id: 'ref-eu-2', name: 'Slavko Vinčić', country: 'Slovenia', leagueId: 'champions-league', games: 4, yellows: 16, reds: 0, fouls: 98, penalties: 1 },
  { id: 'ref-eu-3', name: 'Danny Makkelie', country: 'Olanda', leagueId: 'champions-league', games: 5, yellows: 21, reds: 2, fouls: 131, penalties: 3 },
  { id: 'ref-eu-4', name: 'István Kovács', country: 'Romania', leagueId: 'champions-league', games: 5, yellows: 25, reds: 1, fouls: 144, penalties: 2 },
];

export const refereeById = (id) => REFEREES.find((r) => r.id === id) || null;
export const refereesOf = (leagueId) => REFEREES.filter((r) => r.leagueId === leagueId);

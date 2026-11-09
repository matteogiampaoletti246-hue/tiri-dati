// Colori sociali scelti a mano (hanno la precedenza su quelli calcolati dagli stemmi).
const FIX = {
  lecce: ['#F2C500', '#C8102E'],
  'aston villa': ['#8A1538', '#95BFE5'],
  fulham: ['#FFFFFF', '#111111'],
  barcelona: ['#004D98', '#A50044'],
  'atletico madrid': ['#CB3524', '#FFFFFF'],
  'real madrid': ['#FFFFFF', '#C9B27C'],
  betis: ['#0BB363', '#FFFFFF'],
  'real betis': ['#0BB363', '#FFFFFF'],
  'real sociedad': ['#0067B1', '#FFFFFF'],
  villarreal: ['#FBE122', '#005187'],
  psv: ['#E2001A', '#FFFFFF'],
  'psv eindhoven': ['#E2001A', '#FFFFFF'],
  'slovan bratislava': ['#4FB3E8', '#FFFFFF'],
  lazio: ['#3DB8F5', '#FFFFFF'],
  benfica: ['#E30613', '#FFFFFF'],
  'union saint-gilloise': ['#FFD200', '#0B3C8C'],
  'union saint gilloise': ['#FFD200', '#0B3C8C'],
  'st gilloise': ['#FFD200', '#0B3C8C'],
  'royale union saint-gilloise': ['#FFD200', '#0B3C8C'],
  besiktas: ['#FFFFFF', '#111111'],
  jagiellonia: ['#F5C518', '#C8102E'],
  'jagiellonia bialystok': ['#F5C518', '#C8102E'],
};
const norm = (n) => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, ' ').replace(/\b(fc|cf|ac|sc|ud|rc|cd|sl|sk|fk|bk|ssc|as|us|sad)\b/g, ' ').replace(/[^a-z\- ]/g, ' ').replace(/\s+/g, ' ').trim();

// ── Colori sociali dei campionati aggiunti (indicati a mano): [nomi, primo colore, secondo colore] ──
const C = {
  rosso: '#D81E2B', bianco: '#FFFFFF', nero: '#1B1B20', giallo: '#F5C518', blu: '#1F5FD1', verde: '#1FA45B',
  arancione: '#F28B1E', viola: '#7A3FB0', bordeaux: '#8A1538', ambra: '#FFB000',
};
const LIST = [
  // Eredivisie
  [['Ajax'], 'rosso', 'bianco'], [['AZ', 'AZ Alkmaar'], 'rosso', 'bianco'], [['Cambuur'], 'giallo', 'blu'],
  [['ADO Den Haag'], 'giallo', 'verde'], [['Excelsior'], 'rosso', 'nero'], [['Feyenoord'], 'rosso', 'bianco'],
  [['Fortuna Sittard'], 'giallo', 'verde'], [['Go Ahead Eagles'], 'rosso', 'giallo'], [['Groningen', 'FC Groningen'], 'verde', 'bianco'],
  [['Heerenveen', 'SC Heerenveen'], 'blu', 'bianco'], [['NEC', 'NEC Nijmegen'], 'rosso', 'verde'], [['PEC Zwolle'], 'blu', 'bianco'],
  [['PSV', 'PSV Eindhoven'], 'rosso', 'bianco'], [['Sparta Rotterdam'], 'rosso', 'bianco'], [['Telstar'], 'blu', 'bianco'],
  [['Twente', 'FC Twente'], 'rosso', 'bianco'], [['Utrecht', 'FC Utrecht'], 'rosso', 'bianco'], [['Willem II'], 'rosso', 'bianco'],
  // Süper Lig
  [['Alanyaspor'], 'arancione', 'verde'], [['Amed', 'Amed Sportif'], 'verde', 'rosso'], [['Başakşehir', 'Istanbul Basaksehir'], 'arancione', 'blu'],
  [['Beşiktaş'], 'nero', 'bianco'], [['Çorum', 'Çorum FK'], 'rosso', 'bianco'], [['Erzurumspor', 'Erzurumspor FK'], 'blu', 'bianco'],
  [['Eyüpspor'], 'giallo', 'viola'], [['Fenerbahçe'], 'giallo', 'blu'], [['Galatasaray'], 'giallo', 'rosso'],
  [['Gaziantep', 'Gaziantep FK'], 'rosso', 'nero'], [['Gençlerbirliği'], 'rosso', 'nero'], [['Göztepe'], 'giallo', 'rosso'],
  [['Kasımpaşa'], 'blu', 'bianco'], [['Kocaelispor'], 'verde', 'nero'], [['Konyaspor'], 'verde', 'bianco'],
  [['Rizespor', 'Çaykur Rizespor'], 'verde', 'blu'], [['Samsunspor'], 'rosso', 'bianco'], [['Trabzonspor'], 'bordeaux', 'blu'],
  // Liga Portugal
  [['Académico de Viseu', 'Académico Viseu'], 'bianco', 'nero'], [['Alverca'], 'rosso', 'bianco'], [['Arouca'], 'giallo', 'blu'],
  [['Benfica'], 'rosso', 'bianco'], [['Braga', 'SC Braga'], 'rosso', 'bianco'], [['Casa Pia', 'Casa Pia AC'], 'nero', 'bianco'],
  [['Estoril'], 'giallo', 'blu'], [['Estrela da Amadora'], 'rosso', 'verde'], [['Famalicão'], 'blu', 'bianco'],
  [['Gil Vicente'], 'rosso', 'blu'], [['Marítimo'], 'verde', 'rosso'], [['Moreirense'], 'verde', 'bianco'],
  [['Nacional'], 'bianco', 'nero'], [['Porto', 'FC Porto'], 'blu', 'bianco'], [['Rio Ave'], 'verde', 'bianco'],
  [['Santa Clara'], 'rosso', 'bianco'], [['Sporting', 'Sporting CP'], 'verde', 'bianco'], [['Vitória Guimarães', 'Vitória de Guimarães'], 'bianco', 'nero'],
  // Bundesliga austriaca
  [['Austria Lustenau'], 'verde', 'bianco'], [['Austria Wien'], 'viola', 'bianco'], [['Grazer AK'], 'rosso', 'bianco'],
  [['LASK'], 'nero', 'bianco'], [['Rapid Wien'], 'verde', 'bianco'], [['Red Bull Salzburg', 'Salzburg'], 'rosso', 'bianco'],
  [['Rheindorf Altach', 'Altach'], 'nero', 'bianco'], [['Ried'], 'verde', 'nero'], [['Sturm Graz'], 'nero', 'bianco'],
  [['Hartberg'], 'blu', 'bianco'], [['WSG Tirol'], 'verde', 'bianco'], [['Wolfsberger AC'], 'bianco', 'nero'],
  // Premiership scozzese
  [['Aberdeen'], 'rosso', 'bianco'], [['Celtic'], 'verde', 'bianco'], [['Dundee', 'Dundee FC'], 'blu', 'bianco'],
  [['Dundee United'], 'arancione', 'nero'], [['Hearts'], 'bordeaux', 'bianco'], [['Hibernian'], 'verde', 'bianco'],
  [['Kilmarnock'], 'blu', 'bianco'], [['Livingston'], 'giallo', 'nero'], [['Motherwell'], 'ambra', 'bordeaux'],
  [['Rangers'], 'blu', 'bianco'], [['Ross County'], 'blu', 'rosso'], [['St Johnstone', 'St. Johnstone'], 'blu', 'bianco'],
  [['St Mirren', 'St. Mirren'], 'bianco', 'nero'],
  // Pro League belga
  [['Anderlecht'], 'viola', 'bianco'], [['Antwerp', 'Royal Antwerp'], 'rosso', 'bianco'], [['Cercle Brugge'], 'verde', 'nero'],
  [['Charleroi', 'Sporting Charleroi'], 'nero', 'bianco'], [['Club Brugge'], 'blu', 'nero'], [['Genk'], 'blu', 'bianco'],
  [['Gent'], 'blu', 'bianco'], [['Kortrijk'], 'rosso', 'bianco'], [['Mechelen', 'KV Mechelen'], 'giallo', 'rosso'],
  [['OH Leuven'], 'bianco', 'nero'], [['Sint-Truiden', 'St.Truiden'], 'giallo', 'blu'], [['Standard Liège'], 'rosso', 'bianco'],
  [['Union Saint-Gilloise', 'Union St.Gilloise'], 'giallo', 'blu'], [['Westerlo'], 'giallo', 'blu'], [['Zulte Waregem'], 'rosso', 'verde'],
  // Eliteserien norvegese
  [['Bodø/Glimt'], 'giallo', 'nero'], [['Brann'], 'rosso', 'bianco'], [['Fredrikstad'], 'rosso', 'bianco'],
  [['HamKam'], 'verde', 'bianco'], [['Haugesund'], 'bianco', 'blu'], [['KFUM Oslo'], 'arancione', 'blu'],
  [['Kristiansund'], 'blu', 'bianco'], [['Lillestrøm'], 'giallo', 'nero'], [['Molde'], 'blu', 'bianco'],
  [['Odd'], 'bianco', 'nero'], [['Rosenborg'], 'bianco', 'nero'], [['Sandefjord'], 'blu', 'rosso'],
  [['Sarpsborg 08'], 'blu', 'nero'], [['Strømsgodset'], 'blu', 'bianco'], [['Tromsø'], 'rosso', 'bianco'],
  [['Viking'], 'blu', 'bianco'],
];
// la chiave tiene conto delle lettere speciali (ø, ı, ş ecc.) che la normalizzazione normale non scompone
const fold = (n) => String(n || '').replace(/ø/gi, 'o').replace(/ı/g, 'i').replace(/ß/g, 'ss').replace(/đ/gi, 'd').replace(/ł/gi, 'l');
LIST.forEach(([names, a, b]) => names.forEach((n) => { FIX[norm(fold(n))] = [C[a], C[b]]; }));

// Nazionali: colori storici delle federazioni (maglia principale)
const NAT_LIST = [
  [['Italy'], 'blu', 'bianco'],
  [['Spain'], 'rosso', 'giallo'],
  [['France'], 'blu', 'rosso'],
  [['Portugal'], 'rosso', 'verde'],
  [['Ireland'], 'verde', 'bianco'],
  [['Republic of Ireland'], 'verde', 'bianco'],
  [['England'], 'bianco', 'blu'],
  [['Germany'], 'bianco', 'nero'],
  [['Netherlands'], 'arancione', 'blu'],
  [['Belgium'], 'rosso', 'giallo'],
  [['Croatia'], 'rosso', 'blu'],
  [['Switzerland'], 'rosso', 'bianco'],
  [['Austria'], 'rosso', 'bianco'],
  [['Denmark'], 'rosso', 'bianco'],
  [['Sweden'], 'giallo', 'blu'],
  [['Norway'], 'rosso', 'blu'],
  [['Finland'], 'bianco', 'blu'],
  [['Iceland'], 'blu', 'rosso'],
  [['Poland'], 'bianco', 'rosso'],
  [['Czechia'], 'rosso', 'blu'],
  [['Czech Republic'], 'rosso', 'blu'],
  [['Slovakia'], 'blu', 'rosso'],
  [['Hungary'], 'rosso', 'verde'],
  [['Romania'], 'giallo', 'blu'],
  [['Bulgaria'], 'bianco', 'verde'],
  [['Serbia'], 'rosso', 'blu'],
  [['Slovenia'], 'bianco', 'blu'],
  [['Bosnia and Herzegovina'], 'blu', 'giallo'],
  [['Bosnia-Herzegovina'], 'blu', 'giallo'],
  [['Montenegro'], 'rosso', 'giallo'],
  [['North Macedonia'], 'rosso', 'giallo'],
  [['Albania'], 'rosso', 'nero'],
  [['Kosovo'], 'blu', 'giallo'],
  [['Greece'], 'blu', 'bianco'],
  [['Turkiye'], 'rosso', 'bianco'],
  [['Turkey'], 'rosso', 'bianco'],
  [['Cyprus'], 'bianco', 'arancione'],
  [['Israel'], 'bianco', 'blu'],
  [['Scotland'], 'blu', 'bianco'],
  [['Wales'], 'rosso', 'verde'],
  [['Northern Ireland'], 'verde', 'bianco'],
  [['Ukraine'], 'giallo', 'blu'],
  [['Belarus'], 'rosso', 'verde'],
  [['Russia'], 'bianco', 'blu'],
  [['Georgia'], 'bianco', 'rosso'],
  [['Armenia'], 'arancione', 'rosso'],
  [['Azerbaijan'], 'blu', 'rosso'],
  [['Kazakhstan'], 'blu', 'giallo'],
  [['Lithuania'], 'giallo', 'verde'],
  [['Latvia'], 'bordeaux', 'bianco'],
  [['Estonia'], 'blu', 'nero'],
  [['Moldova'], 'blu', 'giallo'],
  [['Luxembourg'], 'rosso', 'blu'],
  [['Malta'], 'rosso', 'bianco'],
  [['Faroe Islands'], 'blu', 'rosso'],
  [['Gibraltar'], 'bianco', 'rosso'],
  [['Andorra'], 'blu', 'giallo'],
  [['San Marino'], 'blu', 'bianco'],
  [['Liechtenstein'], 'blu', 'rosso'],
  [['Brazil'], 'giallo', 'verde'],
  [['Argentina'], 'blu', 'bianco'],
  [['Uruguay'], 'blu', 'bianco'],
  [['Colombia'], 'giallo', 'blu'],
  [['Chile'], 'rosso', 'blu'],
  [['Mexico'], 'verde', 'rosso'],
  [['USA'], 'blu', 'rosso'],
  [['Japan'], 'blu', 'bianco'],
  [['South Korea'], 'rosso', 'bianco'],
  [['Morocco'], 'rosso', 'verde'],
  [['Senegal'], 'verde', 'giallo'],
  [['Nigeria'], 'verde', 'bianco'],
  [['Egypt'], 'rosso', 'bianco'],
  [['Algeria'], 'verde', 'bianco'],
  [['Tunisia'], 'rosso', 'bianco'],
  [['Cameroon'], 'verde', 'rosso'],
  [['Ghana'], 'giallo', 'rosso'],
  [['Ivory Coast'], 'arancione', 'verde'],
  [['Australia'], 'giallo', 'verde'],
  [['Canada'], 'rosso', 'bianco'],
  [['Ecuador'], 'giallo', 'blu'],
  [['Paraguay'], 'rosso', 'blu'],
  [['Peru'], 'rosso', 'bianco'],
  [['Saudi Arabia'], 'verde', 'bianco'],
  [['Iran'], 'bianco', 'rosso'],
  [['Qatar'], 'bordeaux', 'bianco'],
];
NAT_LIST.forEach(([names, a, b]) => names.forEach((n) => { FIX[norm(fold(n))] = [C[a], C[b]]; }));


// ── Colori sociali dei 5 top campionati (lista 9/11/2026): [colore principale della maglia di casa, secondo colore].
// Fonti: teamcolorcodes.com (codici dei loghi ufficiali), siti dei club; per le squadre a strisce bianco/nero il principale e' il bianco.
// Hanno la precedenza su tutto il resto. Inter = blu acceso dello stemma 2021, Como = blu reale + bianco.
const SOCIALI = {
  // Serie A
  Atalanta: ['#1E71B8', '#000000'], Bologna: ['#A21C26', '#1A2F48'], Cagliari: ['#AD002A', '#002350'], Como: ['#1B5FB4', '#FFFFFF'],
  Fiorentina: ['#482E92', '#FFFFFF'], Frosinone: ['#FFD400', '#00539F'], Genoa: ['#C8102E', '#002F6C'], Inter: ['#0033AB', '#000000'],
  Juventus: ['#FFFFFF', '#1B1B20'], Lazio: ['#87D8F7', '#15366F'], Lecce: ['#FFF200', '#ED1B23'], Milan: ['#FB090B', '#000000'],
  Monza: ['#E30613', '#FFFFFF'], Napoli: ['#12A0D7', '#003C82'], Parma: ['#FFD200', '#1C3F94'], Roma: ['#8E1F2F', '#F0BC42'],
  Sassuolo: ['#00A752', '#000000'], Torino: ['#8A1E03', '#FFFFFF'], Udinese: ['#FFFFFF', '#000000'], Venezia: ['#F37021', '#00704A'],
  // Premier League
  'AFC Bournemouth': ['#DA291C', '#000000'], Bournemouth: ['#DA291C', '#000000'], Arsenal: ['#EF0107', '#FFFFFF'], 'Aston Villa': ['#670E36', '#95BFE5'],
  Brentford: ['#E30613', '#FFFFFF'], 'Brighton & Hove Albion': ['#0057B8', '#FFFFFF'], Brighton: ['#0057B8', '#FFFFFF'], Chelsea: ['#034694', '#FFFFFF'],
  'Coventry City': ['#6CADDF', '#FFFFFF'], 'Crystal Palace': ['#1B458F', '#C4122E'], Everton: ['#003399', '#FFFFFF'], Fulham: ['#FFFFFF', '#000000'],
  'Hull City': ['#F5A12D', '#000000'], 'Ipswich Town': ['#3A64A3', '#FFFFFF'], 'Leeds United': ['#FFFFFF', '#1D428A'], Liverpool: ['#C8102E', '#00B2A9'],
  'Manchester City': ['#6CABDD', '#1C2C5B'], 'Manchester United': ['#DA291C', '#FBE122'], 'Newcastle United': ['#FFFFFF', '#241F20'],
  'Nottingham Forest': ['#DD0000', '#FFFFFF'], Sunderland: ['#EB172B', '#FFFFFF'], 'Tottenham Hotspur': ['#FFFFFF', '#132257'], Tottenham: ['#FFFFFF', '#132257'],
  // LaLiga
  'Athletic Club': ['#EE2523', '#FFFFFF'], 'Atlético Madrid': ['#CB3524', '#272E61'], Barcelona: ['#004D98', '#A50044'], 'Celta Vigo': ['#8AC3EE', '#E30613'],
  'Deportivo A Coruña': ['#1F5FD1', '#FFFFFF'], 'Deportivo La Coruña': ['#1F5FD1', '#FFFFFF'], 'Deportivo Alavés': ['#0761AF', '#FFFFFF'], Elche: ['#05642C', '#FFFFFF'],
  Espanyol: ['#007FC8', '#FFFFFF'], Getafe: ['#005999', '#FFFFFF'], Levante: ['#00519E', '#B4053F'], 'Málaga': ['#0089C8', '#FFFFFF'],
  Osasuna: ['#D91A21', '#0A346F'], 'Racing Santander': ['#00843D', '#FFFFFF'], 'Rayo Vallecano': ['#FFFFFF', '#E53027'], 'Real Betis': ['#0BB363', '#FFFFFF'],
  'Real Madrid': ['#FFFFFF', '#FEBE10'], 'Real Sociedad': ['#0067B1', '#FFFFFF'], Sevilla: ['#FFFFFF', '#D81920'], Valencia: ['#FFFFFF', '#F18E00'], Villarreal: ['#FBE122', '#005187'],
  // Bundesliga
  '1. FC Köln': ['#ED1C24', '#FFFFFF'], Augsburg: ['#BA3733', '#46714D'], 'Bayer Leverkusen': ['#E32221', '#000000'], 'Bayern München': ['#DC052D', '#0066B2'],
  'Borussia Dortmund': ['#FDE100', '#000000'], 'Borussia Mönchengladbach': ['#FFFFFF', '#00A443'], 'Eintracht Frankfurt': ['#E1000F', '#000000'],
  Elversberg: ['#1B1B20', '#FFFFFF'], Freiburg: ['#E2001A', '#FFFFFF'], 'Hamburger SV': ['#0A3F86', '#FFFFFF'], Hoffenheim: ['#1961B5', '#FFFFFF'],
  'Mainz 05': ['#C3141E', '#FFFFFF'], Paderborn: ['#005CA9', '#000000'], 'RB Leipzig': ['#DD0741', '#FFFFFF'], 'Schalke 04': ['#004D9D', '#FFFFFF'],
  'Union Berlin': ['#EB1923', '#FFFFFF'], 'VfB Stuttgart': ['#E32219', '#FFFFFF'], 'Werder Bremen': ['#1D9053', '#FFFFFF'],
  // Ligue 1
  Angers: ['#FFFFFF', '#000000'], Auxerre: ['#00447C', '#FFFFFF'], Brest: ['#E30613', '#FFFFFF'], 'Le Havre': ['#5CBFEB', '#1B2C5B'], 'Le Mans': ['#E30613', '#FCD116'],
  Lens: ['#FFE600', '#EE2224'], Lille: ['#E01E13', '#20325F'], Lorient: ['#F58113', '#000000'], Lyon: ['#DA0812', '#14387F'], Marseille: ['#2FAEE0', '#FFFFFF'],
  Monaco: ['#E7212E', '#FFFFFF'], Nice: ['#C8102E', '#000000'], 'Paris FC': ['#2F5BA3', '#FFFFFF'], 'Paris Saint-Germain': ['#004170', '#DA291C'],
  Rennes: ['#E13327', '#000000'], Strasbourg: ['#009FE3', '#FFFFFF'], Toulouse: ['#6A4C9C', '#FFFFFF'], Troyes: ['#005FAA', '#FFFFFF'],
};
Object.entries(SOCIALI).forEach(([n, c]) => { FIX[norm(fold(n))] = c; });

// ── Colori sociali degli altri campionati dell'app (lista 9/11/2026, maglie di casa dei club): [principale, secondo].
// Bianco sempre #FFFFFF puro. Le squadre fuori da tutte le liste usano i due colori letti dallo stemma (arch/colors2.json).
const SOCIALI2 = {
  // Championship
  Birmingham: ['#0033A0', '#FFFFFF'], Blackburn: ['#009EE0', '#FFFFFF'], Bolton: ['#FFFFFF', '#1C2A5C'], 'Bristol City': ['#E21D38', '#FFFFFF'],
  Burnley: ['#6C1D45', '#99D6EA'], Cardiff: ['#0070B5', '#FFFFFF'], Charlton: ['#D4021D', '#FFFFFF'], Derby: ['#FFFFFF', '#111111'],
  Lincoln: ['#E2231A', '#FFFFFF'], Middlesbrough: ['#E11B22', '#FFFFFF'], Millwall: ['#001D5E', '#FFFFFF'], Norwich: ['#FFF200', '#00A650'],
  Portsmouth: ['#001489', '#FFFFFF'], Preston: ['#FFFFFF', '#001F5B'], QPR: ['#005CAB', '#FFFFFF'], 'Sheff Utd': ['#EE2737', '#111111'],
  Southampton: ['#D71920', '#FFFFFF'], Stoke: ['#E03A3E', '#FFFFFF'], Swansea: ['#FFFFFF', '#111111'], Watford: ['#FBEE23', '#ED2127'],
  'West Brom': ['#122F67', '#FFFFFF'], 'West Ham': ['#7A263A', '#1BB1E7'], Wolves: ['#FDB913', '#231F20'], Wrexham: ['#D71920', '#FFFFFF'],
  // Serie B
  Arezzo: ['#8A1538', '#FFFFFF'], Ascoli: ['#FFFFFF', '#111111'], Avellino: ['#00843D', '#FFFFFF'], Benevento: ['#D71920', '#FFDD00'],
  Carrarese: ['#FFDD00', '#0033A0'], Catanzaro: ['#FFD200', '#C8102E'], Cesena: ['#FFFFFF', '#111111'], Cremonese: ['#D71920', '#FFFFFF'],
  Empoli: ['#005BAC', '#FFFFFF'], 'Hellas Verona': ['#003C82', '#FFDD00'], 'Juve Stabia': ['#FFDD00', '#0033A0'], 'LR Vicenza': ['#E2231A', '#FFFFFF'],
  Mantova: ['#FFFFFF', '#C8102E'], Modena: ['#FFDD00', '#003C82'], Padova: ['#FFFFFF', '#C8102E'], Palermo: ['#F5A4C7', '#111111'],
  Pisa: ['#111111', '#0057B8'], Sampdoria: ['#1B5FB4', '#FFFFFF'], 'Südtirol': ['#E2231A', '#FFFFFF'], 'Virtus Entella': ['#5AB0F0', '#FFFFFF'],
  // 2. Bundesliga
  '1. FC Nürnberg': ['#AA1124', '#111111'], 'Arminia Bielefeld': ['#004E95', '#FFFFFF'], Bochum: ['#005CA9', '#FFFFFF'], Darmstadt: ['#004E9E', '#FFFFFF'],
  'Dynamo Dresden': ['#FFD200', '#111111'], 'Eintracht Braunschweig': ['#FFD200', '#0050A0'], 'Energie Cottbus': ['#E2231A', '#FFFFFF'],
  'FC Heidenheim': ['#E2231A', '#003B79'], 'Greuther Fürth': ['#009A44', '#FFFFFF'], 'Hannover 96': ['#00843D', '#111111'], 'Hertha BSC': ['#005CA9', '#FFFFFF'],
  'Holstein Kiel': ['#0033A0', '#E2231A'], Kaiserslautern: ['#E2231A', '#FFFFFF'], 'Karlsruher SC': ['#005BAC', '#FFFFFF'], Magdeburg: ['#005CA9', '#FFFFFF'],
  'St. Pauli': ['#5B3A29', '#FFFFFF'], 'VfL Osnabrück': ['#6C2C8E', '#FFFFFF'], Wolfsburg: ['#65B32E', '#FFFFFF'],
  // LaLiga2
  'AD Ceuta FC': ['#FFFFFF', '#111111'], Albacete: ['#FFFFFF', '#E2231A'], 'Almería': ['#E2231A', '#FFFFFF'], 'Burgos CF': ['#FFFFFF', '#111111'],
  'Castellón': ['#FFFFFF', '#111111'], 'Celta Fortuna': ['#8AC3EE', '#E30613'], 'Cádiz': ['#FFD200', '#0033A0'], 'Córdoba': ['#00843D', '#FFFFFF'],
  Eibar: ['#0033A0', '#AA1124'], Eldense: ['#005BAC', '#E2231A'], 'FC Andorra': ['#0033A0', '#FFD200'], Girona: ['#E2231A', '#FFFFFF'],
  Granada: ['#E2231A', '#FFFFFF'], 'Las Palmas': ['#FFD200', '#005BAC'], 'Leganés': ['#FFFFFF', '#005BAC'], Mallorca: ['#E2231A', '#111111'],
  'Real Oviedo': ['#0033A0', '#FFFFFF'], 'Real Sociedad B': ['#0067B1', '#FFFFFF'], 'Real Valladolid': ['#6C2C8E', '#FFFFFF'], Sabadell: ['#005BAC', '#FFFFFF'],
  'Sporting Gijón': ['#E2231A', '#FFFFFF'], Tenerife: ['#FFFFFF', '#0033A0'],
  // Ligue 2
  'Annecy FC': ['#E2231A', '#FFFFFF'], Boulogne: ['#E2231A', '#111111'], 'Clermont Foot': ['#AA1124', '#005BAC'], Dijon: ['#E2231A', '#FFFFFF'],
  Dunkerque: ['#005BAC', '#FFFFFF'], Grenoble: ['#005BAC', '#FFFFFF'], Guingamp: ['#E2231A', '#111111'], Laval: ['#F58113', '#111111'],
  Metz: ['#7A1E3A', '#FFFFFF'], Montpellier: ['#002F6C', '#F58113'], Nancy: ['#E2231A', '#FFFFFF'], Nantes: ['#FFD200', '#00843D'],
  Pau: ['#FFD200', '#0033A0'], 'Red Star': ['#00843D', '#FFFFFF'], Reims: ['#E2231A', '#FFFFFF'], Rodez: ['#E2231A', '#FFD200'],
  'Saint-Étienne': ['#00843D', '#FFFFFF'], Sochaux: ['#FFD200', '#003C82'],
  // Super League Grecia
  'AEK Athens': ['#FFD200', '#111111'], 'Aris Thessaloniki': ['#FFD200', '#111111'], 'Asteras Tripolis': ['#FFD200', '#0033A0'], Atromitos: ['#005BAC', '#FFFFFF'],
  Iraklis: ['#005BAC', '#FFFFFF'], Kalamata: ['#111111', '#FFFFFF'], 'Kifisia FC': ['#005BAC', '#FFFFFF'], Levadiakos: ['#00843D', '#FFFFFF'],
  'NFC Volos': ['#5AB0F0', '#FFFFFF'], 'OFI Crete': ['#111111', '#FFFFFF'], Olympiacos: ['#E2231A', '#FFFFFF'], 'PAOK Thessaloniki': ['#111111', '#FFFFFF'],
  Panathinaikos: ['#00843D', '#FFFFFF'], Panetolikos: ['#FFD200', '#005BAC'],
  // Brasileirão
  'Athletico Paranaense': ['#C8102E', '#111111'], 'Atlético-MG': ['#111111', '#FFFFFF'], Bahia: ['#005BAC', '#E2231A'], Botafogo: ['#111111', '#FFFFFF'],
  Chapecoense: ['#00843D', '#FFFFFF'], Corinthians: ['#FFFFFF', '#111111'], Coritiba: ['#00843D', '#FFFFFF'], Cruzeiro: ['#0033A0', '#FFFFFF'],
  Flamengo: ['#C8102E', '#111111'], Fluminense: ['#8A1538', '#00843D'], 'Grêmio': ['#0D80BF', '#111111'], Internacional: ['#E2231A', '#FFFFFF'],
  Mirassol: ['#FFD200', '#00843D'], Palmeiras: ['#006437', '#FFFFFF'], 'RB Bragantino': ['#FFFFFF', '#E2231A'], Remo: ['#002F6C', '#FFFFFF'],
  Santos: ['#FFFFFF', '#111111'], 'São Paulo': ['#FFFFFF', '#E2231A'], 'Vasco da Gama': ['#111111', '#FFFFFF'], 'Vitória': ['#E2231A', '#111111'],
  // Liga Profesional Argentina
  Aldosivi: ['#FFD200', '#00843D'], 'Argentinos Juniors': ['#E2231A', '#FFFFFF'], 'Atlético Tucumán': ['#5AB0F0', '#FFFFFF'], Banfield: ['#00843D', '#FFFFFF'],
  'Barracas Central': ['#E2231A', '#FFFFFF'], Belgrano: ['#5AB0F0', '#FFFFFF'], 'Boca Juniors': ['#103F79', '#FFC72C'], 'Central Córdoba de Santiago': ['#111111', '#FFFFFF'],
  'Club Atlético Platense': ['#5B3A29', '#FFFFFF'], 'Defensa y Justicia': ['#FFD200', '#00843D'], 'Deportivo Riestra': ['#111111', '#FFFFFF'],
  Estudiantes: ['#E2231A', '#FFFFFF'], 'Estudiantes de Río Cuarto': ['#005BAC', '#FFFFFF'], 'Gimnasia LP': ['#FFFFFF', '#002F6C'],
  'Gimnasia Mendoza': ['#FFFFFF', '#111111'], 'Huracán': ['#FFFFFF', '#E2231A'], Independiente: ['#E2231A', '#FFFFFF'], 'Independiente Rivadavia': ['#002F6C', '#FFFFFF'],
  Instituto: ['#E2231A', '#FFFFFF'], 'Lanús': ['#8A1538', '#FFFFFF'], "Newell's Old Boys": ['#E2231A', '#111111'], 'Racing Club': ['#5AB0F0', '#FFFFFF'],
  'River Plate': ['#FFFFFF', '#E2231A'], 'Rosario Central': ['#003C82', '#FFD200'], 'San Lorenzo': ['#003C82', '#E2231A'], Sarmiento: ['#00843D', '#FFFFFF'],
  Talleres: ['#002F6C', '#FFFFFF'], Tigre: ['#002F6C', '#E2231A'], 'Unión': ['#E2231A', '#FFFFFF'], 'Vélez Sarsfield': ['#FFFFFF', '#0033A0'],
  // MLS
  'Atlanta United': ['#80000A', '#111111'], 'Austin FC': ['#00B140', '#111111'], 'Charlotte FC': ['#1A85C8', '#111111'], Chicago: ['#C8102E', '#002F6C'],
  Cincinnati: ['#F05323', '#263B80'], Colorado: ['#862633', '#8BB8E8'], Columbus: ['#FEDD00', '#111111'], 'DC United': ['#111111', '#EF3E42'],
  Dallas: ['#E81F3E', '#2A4076'], Houston: ['#FF6B00', '#101820'], 'Inter Miami CF': ['#F7B5CD', '#231F20'], 'LA Galaxy': ['#00245D', '#FFD200'],
  LAFC: ['#111111', '#C39E6D'], Minnesota: ['#8CD2F4', '#231F20'], Montreal: ['#111111', '#0033A0'], 'NY Red Bulls': ['#ED1E36', '#FFFFFF'],
  NYCFC: ['#6CACE4', '#F15524'], 'Nashville SC': ['#ECE83A', '#1F1646'], 'New England': ['#0A2240', '#CE0E2D'], Orlando: ['#633492', '#FDE192'],
  Philadelphia: ['#071B2C', '#B19B69'], Portland: ['#00482B', '#D69A00'], 'Salt Lake': ['#B30838', '#013A81'], 'San Diego FC': ['#111111', '#00B2A9'],
  'San Jose': ['#0067B1', '#111111'], 'Seattle Sounders': ['#5D9741', '#005595'], 'Sporting KC': ['#91B0D5', '#002F65'], 'St. Louis City': ['#DD004A', '#0A1E2C'],
  Toronto: ['#B81137', '#455560'], Vancouver: ['#00245E', '#FFFFFF'],
  // Liga MX
  'América': ['#FFE500', '#002F6C'], Atlante: ['#0033A0', '#E2231A'], Atlas: ['#E2231A', '#111111'], Chivas: ['#E2231A', '#FFFFFF'],
  'Cruz Azul': ['#0033A0', '#FFFFFF'], 'Juárez': ['#00843D', '#E2231A'], 'León': ['#00843D', '#FFFFFF'], Monterrey: ['#002F6C', '#FFFFFF'],
  Necaxa: ['#E2231A', '#FFFFFF'], Pachuca: ['#FFFFFF', '#002F6C'], Puebla: ['#FFFFFF', '#0033A0'], Pumas: ['#002F6C', '#C39E6D'],
  'Querétaro': ['#111111', '#0033A0'], 'San Luis': ['#E2231A', '#002F6C'], 'Santos Laguna': ['#00843D', '#FFFFFF'], Tigres: ['#FDB913', '#002F6C'],
  Tijuana: ['#E2231A', '#111111'], Toluca: ['#E2231A', '#FFFFFF'],
  // Liga Portugal 2
  'AVS Futebol SAD': ['#E2231A', '#FFFFFF'], 'Académica': ['#111111', '#FFFFFF'], 'Amarante FC': ['#FFFFFF', '#00843D'], 'Benfica B': ['#E30613', '#FFFFFF'],
  Chaves: ['#E2231A', '#005BAC'], 'FC Porto B': ['#003C82', '#FFFFFF'], Farense: ['#111111', '#FFFFFF'], Feirense: ['#005BAC', '#FFFFFF'],
  'Felgueiras 1932': ['#E2231A', '#FFFFFF'], 'Leixões': ['#E2231A', '#FFFFFF'], 'Lusitânia Lourosa': ['#FFFFFF', '#005BAC'], Penafiel: ['#E2231A', '#111111'],
  Portimonense: ['#111111', '#FFFFFF'], 'Sporting CP B': ['#008057', '#FFFFFF'], Tondela: ['#00843D', '#FFD200'], Torreense: ['#00843D', '#FFFFFF'],
  'União de Leiria': ['#111111', '#FFFFFF'], Vizela: ['#005BAC', '#FFFFFF'],
  // Eerste Divisie
  'Almere City FC': ['#E2231A', '#111111'], 'De Graafschap': ['#005BAC', '#FFFFFF'], 'FC Den Bosch': ['#E2231A', '#FFFFFF'], 'FC Dordrecht': ['#E2231A', '#FFFFFF'],
  'FC Eindhoven': ['#005BAC', '#FFFFFF'], 'FC Emmen': ['#E2231A', '#FFFFFF'], 'FC Volendam': ['#F58113', '#111111'], 'Helmond Sport': ['#E2231A', '#111111'],
  Heracles: ['#111111', '#FFFFFF'], 'Jong AZ Alkmaar': ['#E2231A', '#FFFFFF'], 'Jong Ajax': ['#D2122E', '#FFFFFF'], 'Jong FC Utrecht': ['#E2231A', '#FFFFFF'],
  'Jong PSV': ['#E2001A', '#FFFFFF'], 'MVV Maastricht': ['#E2231A', '#FFFFFF'], 'NAC Breda': ['#FFD200', '#111111'], 'RKC Waalwijk': ['#FFD200', '#005BAC'],
  'Roda JC Kerkrade': ['#FFD200', '#111111'], 'TOP Oss': ['#E2231A', '#FFFFFF'], 'VVV-Venlo': ['#FFD200', '#111111'], Vitesse: ['#FFD200', '#111111'],
  // 1. Lig Turchia
  Antalyaspor: ['#E2231A', '#FFFFFF'], 'Bandırmaspor': ['#E2231A', '#005BAC'], 'Batman Petrolspor': ['#E2231A', '#00843D'], 'Bodrum FK': ['#00843D', '#FFFFFF'],
  Boluspor: ['#E2231A', '#FFFFFF'], Bursaspor: ['#00843D', '#FFFFFF'], 'Esenler Erokspor': ['#F58113', '#111111'], 'Iğdır FK': ['#005BAC', '#FFFFFF'],
  'Karagümrük': ['#E2231A', '#111111'], Kayserispor: ['#E2231A', '#FFD200'], 'Keçiörengücü': ['#8A1538', '#FFFFFF'], 'Manisa Futbol Kulübü': ['#111111', '#FFFFFF'],
  'Mardin 1969 Spor': ['#E2231A', '#FFD200'], 'Muğlaspor': ['#00843D', '#FFFFFF'], Pendikspor: ['#E2231A', '#FFFFFF'], 'Sarıyer': ['#005BAC', '#FFD200'],
  Sivasspor: ['#E2231A', '#FFFFFF'], 'Van Spor Kulübü': ['#E2231A', '#111111'], 'Ümraniyespor': ['#E2231A', '#FFFFFF'], 'İstanbulspor': ['#FFD200', '#111111'],
};
Object.entries(SOCIALI2).forEach(([n, c]) => { if (!FIX[norm(fold(n))]) FIX[norm(fold(n))] = c; });


export const NAT_NAMES = new Set();
NAT_LIST.forEach(([names]) => names.forEach((n) => NAT_NAMES.add(norm(fold(n)))));
export const isNationName = (name) => NAT_NAMES.has(norm(fold(name)));
export const fixedColors = (name) => FIX[norm(fold(name))] || null;

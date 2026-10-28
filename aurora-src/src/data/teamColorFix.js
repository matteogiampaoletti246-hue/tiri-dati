// Colori sociali scelti a mano (hanno la precedenza su quelli calcolati dagli stemmi).
const FIX = {
  lecce: ['#F2C500', '#C8102E'],
  'aston villa': ['#8A1538', '#95BFE5'],
  fulham: ['#F4F4F4', '#111111'],
  barcelona: ['#004D98', '#A50044'],
  'atletico madrid': ['#CB3524', '#F4F4F4'],
  'real madrid': ['#F4F4F4', '#C9B27C'],
  betis: ['#0BB363', '#F4F4F4'],
  'real betis': ['#0BB363', '#F4F4F4'],
  'real sociedad': ['#0067B1', '#F4F4F4'],
  villarreal: ['#FBE122', '#005187'],
  'deportivo la coruna': ['#7A3FB0', '#F4F4F4'],
  'deportivo': ['#7A3FB0', '#F4F4F4'],
  psv: ['#E2001A', '#F4F4F4'],
  'psv eindhoven': ['#E2001A', '#F4F4F4'],
  'slovan bratislava': ['#4FB3E8', '#F4F4F4'],
  lazio: ['#3DB8F5', '#F4F4F4'],
  benfica: ['#E30613', '#F4F4F4'],
  'union saint-gilloise': ['#FFD200', '#0B3C8C'],
  'union saint gilloise': ['#FFD200', '#0B3C8C'],
  'st gilloise': ['#FFD200', '#0B3C8C'],
  'royale union saint-gilloise': ['#FFD200', '#0B3C8C'],
  besiktas: ['#F4F4F4', '#111111'],
  jagiellonia: ['#F5C518', '#C8102E'],
  'jagiellonia bialystok': ['#F5C518', '#C8102E'],
};
const norm = (n) => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\./g, ' ').replace(/\b(fc|cf|ac|sc|ud|rc|cd|sl|sk|fk|bk|ssc|as|us|sad)\b/g, ' ').replace(/[^a-z\- ]/g, ' ').replace(/\s+/g, ' ').trim();

// ── Colori sociali dei campionati aggiunti (indicati a mano): [nomi, primo colore, secondo colore] ──
const C = {
  rosso: '#D81E2B', bianco: '#F4F4F4', nero: '#1B1B20', giallo: '#F5C518', blu: '#1F5FD1', verde: '#1FA45B',
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

export const fixedColors = (name) => FIX[norm(fold(name))] || null;

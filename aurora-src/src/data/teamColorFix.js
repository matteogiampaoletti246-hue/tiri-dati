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
export const fixedColors = (name) => FIX[norm(name)] || null;

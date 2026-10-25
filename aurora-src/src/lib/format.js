// Formattazione numeri e date (virgola decimale)
export const comma = (value, digits = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return Number(value).toFixed(digits).replace('.', ',');
};

export const int = (value) => (value === null || value === undefined ? '—' : String(value));

// Numero compatto: interi senza decimali, altrimenti con la virgola.
export const num = (value) => {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',');
};

export const WEEKDAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
export const WEEKDAYS_LONG = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
export const MONTHS = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

export const shortDate = (d) => `${WEEKDAYS[d.getDay()]} ${d.getDate()}`;
export const longDate = (d) => `${WEEKDAYS_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

export const dayLabel = (date, todayIndex, index) => {
  if (index < todayIndex) {
    if (index === todayIndex - 1) return 'Ieri';
    return shortDate(date);
  }
  if (index === todayIndex) return 'Oggi';
  if (index === todayIndex + 1) return 'Domani';
  return shortDate(date);
};

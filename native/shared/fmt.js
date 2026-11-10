// Date e ore per le liste d'archivio (stessi testi di archive/parts.jsx del sito, fuso di Roma).
const DATE_FMT = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Rome' });
const TIME_FMT = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });
const DAY_FMT = new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Europe/Rome' });
export const fmtDate = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : DATE_FMT.format(d).replace('.', ''); };
export const fmtTime = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? '' : TIME_FMT.format(d); };
export const dayKey = (iso) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? String(iso || '').slice(0, 10) : DAY_FMT.format(d); };

// Funzioni di servizio condivise dai moduli dati.
export const slug = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

const TZ = 'Europe/Rome';
const dayFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat('it-IT', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false });

// Giorno e ora sempre in fuso italiano, qualunque sia il fuso del telefono.
export const romeDay = (ts) => dayFmt.format(new Date(ts));
export const romeTime = (ts) => timeFmt.format(new Date(ts));

export const r1 = (v) => Math.round(v * 10) / 10;
export const r2 = (v) => Math.round(v * 100) / 100;

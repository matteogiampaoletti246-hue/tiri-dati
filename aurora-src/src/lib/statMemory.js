// Ultime statistiche viste per ogni partita (regola: aprendo la partita si vedono per mezzo secondo i numeri vecchi
// che poi scorrono verso quelli aggiornati). Capienza fissa: 60 partite, salvate sul telefono.
import { lruGet, lruSet } from './lru';

const KEY = 'sl-statmem-v1';
const MAX = 60;
let mem = null;
const load = () => {
  if (mem) return mem;
  mem = new Map();
  try { const raw = JSON.parse(localStorage.getItem(KEY) || '[]'); raw.forEach(([k, v]) => mem.set(k, v)); } catch (e) { /* niente memoria */ }
  return mem;
};
let saveT = 0;
const save = () => {
  clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify([...load()])); } catch (e) { /* pieno o vietato */ } }, 400);
};
export const statGet = (k) => (k ? lruGet(load(), k) : undefined);
export const statSet = (k, v) => { if (!k) return; lruSet(load(), k, v, MAX); save(); };

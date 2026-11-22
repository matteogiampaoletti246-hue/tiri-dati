// Una sola foto per giocatore, ovunque (formazioni, finestre, banner, Profilo, Calcolatore, liste).
// Id FotMob -> foto: quella di PitchAPI (la piu' recente) dove l'abbiamo, altrimenti FotMob. Si riempie all'avvio da `data/players.js`.
const OVR = new Map();
export const hasFace = (fm) => OVR.has(String(fm));
export const setFace = (fm, url) => { if (fm != null && url) OVR.set(String(fm), url); };
export const playerFace = (id) => OVR.get(String(id)) || `https://images.fotmob.com/image_resources/playerimages/${id}.png`;

// Il livello dati del sito (aurora-src/src/data e lib, copiato in app/src dalla CI) gira tale e quale in nativo:
// gli serve solo questo punto di partenza dei file dati e un localStorage in memoria.
global.document = global.document || { baseURI: 'https://matteogiampaoletti246-hue.github.io/tiri-dati/aurora/' };
if (typeof global.localStorage === 'undefined') {
  const m = {};
  global.localStorage = { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
}

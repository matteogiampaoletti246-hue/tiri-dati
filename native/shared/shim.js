// Il livello dati del sito (aurora-src/src/data e lib, copiato in app/src dalla CI) gira tale e quale in nativo:
// gli serve solo questo punto di partenza dei file dati e un localStorage in memoria.
global.document = global.document || { baseURI: 'https://matteogiampaoletti246-hue.github.io/tiri-dati/aurora/' };
if (typeof global.localStorage === 'undefined') {
  const m = {};
  global.localStorage = { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
}
// Il livello dati del sito registra qualche ascoltatore di eventi della pagina (visibilita', aggiornamento archivi): in nativo non esistono, si ignorano.
const noop = () => {};
const doc = global.document;
if (typeof doc.addEventListener !== 'function') { doc.addEventListener = noop; doc.removeEventListener = noop; }
if (doc.visibilityState === undefined) doc.visibilityState = 'visible';
if (typeof global.addEventListener !== 'function') { global.addEventListener = noop; global.removeEventListener = noop; }
if (typeof global.dispatchEvent !== 'function') global.dispatchEvent = noop;

// Decompressione dei file .json.gz (partite di stagione, falli): Hermes non ha DecompressionStream. fflate e' puro JS.
import { gunzipSync, strFromU8 } from 'fflate';
globalThis.__gunzip = (u8) => JSON.parse(strFromU8(gunzipSync(u8)));

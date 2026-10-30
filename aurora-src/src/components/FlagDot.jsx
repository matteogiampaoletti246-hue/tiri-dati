import { flagCode } from '@/data/carriere';

// Bandiera tonda (come nella Home dell'app): l'immagine riempie il cerchio, anello e alone del colore della bandiera. Mai emoji.
let TINTS = null;
let loading = false;
const loadTints = () => {
  if (TINTS || loading) return;
  loading = true;
  fetch(`${import.meta.env.BASE_URL}flags/tints.json`).then((r) => (r.ok ? r.json() : {})).then((j) => { TINTS = j; }).catch(() => { TINTS = {}; });
};

export default function FlagDot({ name, code, size = 18, className = '' }) {
  const c = code || flagCode(name);
  if (!c) return null;
  loadTints();
  const t = (TINTS && TINTS[c]) || '#8592a6';
  return (
    <span className={`inline-flex shrink-0 overflow-hidden rounded-full align-middle ${className}`} style={{ width: size, height: size, boxShadow: `0 0 0 ${size >= 26 ? 2 : 1.5}px ${t}8c, 0 0 ${Math.round(size / 3)}px ${t}59`, background: 'rgba(255,255,255,.08)' }} aria-hidden="true">
      <img src={`${import.meta.env.BASE_URL}flags/${c}.png`} alt="" width={size} height={size} draggable={false} decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; }} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </span>
  );
}

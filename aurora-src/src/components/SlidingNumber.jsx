// Numero a cifre che scorrono (concept A "Sliding Number", Motion Primitives): ogni cifra e' una colonna 0-9 che scivola
// in verticale verso la cifra nuova; i simboli (virgola, %, –) restano fermi. Solo transform, nessun salto di layout:
// le cifre si allineano da destra, cosi' 9 -> 10 aggiunge una colonna a sinistra senza spostare le altre.
const reduced = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DIG = '0123456789'.split('');

export default function SlidingNumber({ text, className = '', style, dur = 620 }) {
  const s = String(text ?? '');
  const chars = s.split('');
  const n = chars.length;
  const tr = reduced() ? 'none' : `transform ${dur}ms cubic-bezier(.22,1,.36,1)`;
  return (
    <span className={`tnum inline-flex ${className}`} style={{ ...style, lineHeight: 1, height: '1em', overflow: 'hidden', verticalAlign: 'baseline' }} aria-label={s}>
      {chars.map((c, i) => {
        const key = `p${n - i}`; // posizione contata da destra
        if (!/\d/.test(c)) return <span key={key + c} aria-hidden="true" style={{ display: 'inline-block', height: '1em', lineHeight: 1 }}>{c}</span>;
        return (
          <span key={key} aria-hidden="true" style={{ display: 'inline-block', height: '1em', overflow: 'hidden' }}>
            <span style={{ display: 'block', transform: `translateY(${-Number(c)}em)`, transition: tr, willChange: 'transform' }}>
              {DIG.map((d) => <span key={d} style={{ display: 'block', height: '1em', lineHeight: 1 }}>{d}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}

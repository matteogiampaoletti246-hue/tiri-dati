import { useLayoutEffect, useRef, useState } from 'react';
import { useNavigationType } from 'react-router-dom';
import { titleFrom, setPrevTitle } from '@/lib/tabSlide';

// Titolo delle schede del dock (concept B scelto dall'utente il 9/11/2026, componente TextRotate di 21st.dev rifatto leggero):
// senza riquadro, bianco e grande; cambiando scheda le lettere del titolo vecchio escono verso l'alto e quelle nuove entrano dal basso
// una dopo l'altra; sotto una linea azzurra che si adatta al nome. Il titolo si rimpicciolisce solo se non entra accanto ai tasti.
const SIZE = 28;
const MIN = 17;
const STAG = 25;
const SPRING = 'cubic-bezier(.3,1.35,.55,1)'; // come spring damping 30 / stiffness 400 del prompt
const NATIVE_BASE = typeof window !== 'undefined' && window.ReactNativeWebView ? 120 : 0;
const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const seg = (t) => (typeof Intl !== 'undefined' && Intl.Segmenter
  ? Array.from(new Intl.Segmenter('it', { granularity: 'grapheme' }).segment(t), (x) => x.segment)
  : Array.from(t));

function Letters({ text }) {
  const words = text.split(' ');
  return words.map((w, i) => (
    <span key={`${i}${w}`} className="inline-flex overflow-hidden" style={{ paddingBottom: '.1em', marginBottom: '-.1em' }}>
      {seg(w).map((c, k) => <span key={k} data-rc="" className="inline-block">{c}</span>)}
      {i < words.length - 1 ? <span className="whitespace-pre"> </span> : null}
    </span>
  ));
}

export default function RotateTitle({ title }) {
  const pop = useNavigationType() === 'POP';
  const [from] = useState(() => titleFrom(pop));
  const [shown, setShown] = useState(() => (from && from !== title ? from : title));
  const [enter, setEnter] = useState(() => from === '' || (from !== null && from === title));
  const ref = useRef(null);
  const bar = useRef(null);
  const started = useRef(false);

  useLayoutEffect(() => { setPrevTitle(title); }, [title]);

  // il titolo si adatta allo spazio accanto ai due tasti (mai tagliato). Lo si rifa anche quando il font Sora finisce di caricarsi
  // e quando cambia la larghezza disponibile: alla prima apertura il titolo veniva misurato col font di ripiego (piu' stretto)
  // e poi, a font arrivato, si allargava fin sotto la lente.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const fit = () => {
      const txt = el.firstChild;
      if (!txt || !el.parentNode) return;
      const room = el.parentNode.clientWidth;
      let s = SIZE;
      el.style.fontSize = `${s}px`;
      // stessa misura finale di prima (la piu' grande che entra, tra MIN e SIZE), ma partendo da una stima proporzionale:
      // 2-3 misure invece di una per ogni pixel (ogni misura dopo un cambio di font obbliga il browser a rifare l'impaginazione)
      const w0 = txt.offsetWidth;
      if (w0 > room) {
        const size = (v) => { el.style.fontSize = `${v}px`; };
        s = Math.max(MIN, Math.min(SIZE - 1, Math.floor((SIZE * room) / w0)));
        size(s);
        if (txt.offsetWidth <= room) {
          while (s + 1 < SIZE) { size(s + 1); if (txt.offsetWidth > room) { size(s); break; } s += 1; }
        } else {
          while (txt.offsetWidth > room && s > MIN) { s -= 1; size(s); }
        }
      }
      if (bar.current) bar.current.style.width = `${Math.min(txt.offsetWidth, 120)}px`;
    };
    fit();
    let alive = true;
    const again = () => { if (alive) fit(); };
    if (document.fonts) {
      if (document.fonts.ready) document.fonts.ready.then(again);
      document.fonts.addEventListener && document.fonts.addEventListener('loadingdone', again);
    }
    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && el.parentNode) { ro = new ResizeObserver(again); ro.observe(el.parentNode); }
    return () => {
      alive = false;
      if (document.fonts && document.fonts.removeEventListener) document.fonts.removeEventListener('loadingdone', again);
      if (ro) ro.disconnect();
    };
  }, [shown]);

  // uscita del titolo vecchio verso l'alto, poi il nuovo
  useLayoutEffect(() => {
    if (started.current) return undefined;
    started.current = true;
    if (!from || from === title) return undefined;
    if (reduced()) { setShown(title); return undefined; }
    let alive = true;
    const cs = [...ref.current.querySelectorAll('[data-rc]')];
    const anims = cs.map((c, i) => c.animate(
      [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-120%)', opacity: 0 }],
      { duration: 220, delay: i * STAG * 0.4, easing: 'cubic-bezier(.4,0,1,1)', fill: 'forwards' },
    ));
    Promise.all(anims.map((a) => a.finished)).catch(() => {}).then(() => { if (alive) { setShown(title); setEnter(true); } });
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // entrata dal basso, lettera dopo lettera (prima del disegno: nessun lampo del titolo fermo)
  useLayoutEffect(() => {
    if (!enter || shown !== title || reduced()) return;
    const base = from === '' ? NATIVE_BASE : 0;
    [...ref.current.querySelectorAll('[data-rc]')].forEach((c, i) => c.animate(
      [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }],
      { duration: 480, delay: base + i * STAG, easing: SPRING, fill: 'backwards' },
    ));
    setEnter(false);
  }, [enter, shown, title, from]);

  // il titolo cambia mentre la pagina e' aperta (non succede oggi, ma resta corretto)
  useLayoutEffect(() => { if (started.current && !enter && shown !== title && from === null) setShown(title); }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative mr-auto min-w-0 flex-1 pb-1.5">
      <h1 ref={ref} className="title-sora flex whitespace-nowrap" style={{ color: 'var(--ink)', fontSize: SIZE, lineHeight: 1.15 }} aria-label={title}>
        <span aria-hidden="true" className="inline-flex">
          <Letters key={shown} text={shown} />
        </span>
      </h1>
      <span ref={bar} aria-hidden="true" className="absolute bottom-0 left-0 h-[3px] rounded-full" style={{ background: 'var(--accent)', width: 0, transition: 'width .45s cubic-bezier(.22,1,.36,1)' }} />
    </div>
  );
}

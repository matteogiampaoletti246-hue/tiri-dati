// Ritorno nell'app dopo un cambio di applicazione o qualche minuto di inattivita' (iOS: WebView sospesa, tocchi interrotti a meta', tastiera o viewport rimasti vecchi).
// Un solo punto: si chiudono animazioni e fotografie rimaste a meta', si azzera un blocco-finestra rimasto acceso e si rimisura lo schermo.
// Chi misura lo schermo (finestra giocatore, barre fisse) ascolta 'resize' e 'sl-resume'.
import { finishCarousel } from './carousel';
import { resetModalLockIfIdle } from './modal';

let hiddenAt = 0;
let lastRun = 0;

export function resumeApp() {
  const now = Date.now();
  if (now - lastRun < 250) return;
  lastRun = now;
  const away = hiddenAt ? now - hiddenAt : 0;
  hiddenAt = 0;
  try { finishCarousel(); } catch (e) { /* ignora */ }
  try {
    // fotografie di scorrimento rimaste a meta' (copie fisse senza tocchi): non devono restare sopra la pagina
    document.querySelectorAll('body > div[aria-hidden="true"][style*="will-change"]').forEach((n) => n.remove());
  } catch (e) { /* ignora */ }
  try { resetModalLockIfIdle(); } catch (e) { /* ignora */ }
  try {
    if (!document.querySelector('[role="dialog"]') && document.body.style.overflow === 'hidden') document.body.style.overflow = '';
    // dopo un po' di assenza la tastiera non deve restare ne' il viewport accorciato
    const a = document.activeElement;
    if (away > 20000 && a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) a.blur();
  } catch (e) { /* ignora */ }
  const measure = () => {
    try {
      window.dispatchEvent(new Event('sl-resume'));
      window.dispatchEvent(new Event('resize'));
      if (window.visualViewport) window.visualViewport.dispatchEvent(new Event('resize'));
    } catch (e) { /* ignora */ }
  };
  measure();
  // iOS assesta lo schermo con un po' di ritardo dopo il ritorno
  setTimeout(measure, 350);
  setTimeout(measure, 1200);
}

export function initResume() {
  if (typeof window === 'undefined' || window.__slResume) return;
  window.__slResume = true;
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return; }
    resumeApp();
  });
  window.addEventListener('pageshow', () => resumeApp());
  window.addEventListener('focus', () => { if (hiddenAt) resumeApp(); });
  // l'app nativa lo chiede appena torna attiva (la pagina puo' non accorgersi del ritorno)
  window.addEventListener('sl-native-resume', () => resumeApp());
}

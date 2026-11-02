import { useEffect } from 'react';

// Finestre aperte sopra la pagina (giocatore, fogli, tendine): mentre ce n'e' una, la pagina sotto resta immobile
// e nessuno swipe di pagina (giorni, schede, indietro) parte.
let open = 0;
export const modalOpen = () => open > 0;
// Tornando dal background un blocco rimasto acceso (finestra gia' chiusa) fermerebbe ogni swipe e tocco di pagina: se non c'e' nessuna finestra aperta si azzera.
export function resetModalLockIfIdle() {
  if (open > 0 && !document.querySelector('[role="dialog"],[role="listbox"],[aria-modal="true"]')) {
    open = 0;
    delete document.documentElement.dataset.modal;
  }
}

export function useModalLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    open += 1;
    document.documentElement.dataset.modal = '1';
    return () => {
      open = Math.max(0, open - 1);
      if (!open) delete document.documentElement.dataset.modal;
    };
  }, [active]);
}

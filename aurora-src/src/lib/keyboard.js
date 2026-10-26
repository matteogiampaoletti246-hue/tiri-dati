// iOS apre la tastiera solo se focus() avviene dentro il tocco: si "prepara" un campo temporaneo subito,
// poi il vero campo (che compare dopo) prende il focus mantenendo la tastiera aperta.
export function primeKeyboard() {
  try {
    const el = document.createElement('input');
    el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;';
    document.body.appendChild(el);
    el.focus({ preventScroll: true });
    setTimeout(() => el.remove(), 1200);
  } catch { /* nessuna tastiera */ }
}

const KEY = 'scalperlab-theme';

export function getTheme() {
  try {
    return localStorage.getItem(KEY) || 'auto';
  } catch (e) {
    return 'auto';
  }
}

export function isDark(theme) {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme) {
  const dark = isDark(theme);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function setTheme(theme) {
  try {
    localStorage.setItem(KEY, theme);
  } catch (e) {
    /* ignora */
  }
  applyTheme(theme);
}

export function initTheme() {
  applyTheme(getTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'auto') applyTheme('auto');
  });
}

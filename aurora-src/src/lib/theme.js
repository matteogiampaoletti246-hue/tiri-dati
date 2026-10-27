import { runThemeFx } from './themeFx';

const KEY = 'scalperlab-theme';

export function getTheme() {
  try {
    return localStorage.getItem(KEY) || 'dark';
  } catch (e) {
    return 'dark';
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
  const now = document.documentElement.classList.contains('dark');
  const to = isDark(theme);
  if (now === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { applyTheme(theme); return; }
  runThemeFx(to, () => applyTheme(theme));
}

export function initTheme() {
  applyTheme(getTheme());
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (getTheme() === 'auto') applyTheme('auto');
  });
}

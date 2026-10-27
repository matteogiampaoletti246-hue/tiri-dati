import { webkit, devices } from 'playwright';
import fs from 'fs';
const BASE = 'https://matteogiampaoletti246-hue.github.io/tiri-dati/aurora/';
const b = await webkit.launch();
const ctx = await b.newContext({ ...devices['iPhone 13'] });
const pg = await ctx.newPage();
const out = {};
await pg.goto(BASE); await pg.waitForTimeout(7000);
await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="#/match/"]')].find((x) => { const r = x.getBoundingClientRect(); return r.top > 150 && r.top < 600 && r.left >= 0 && r.left < 300; }); if (a) a.click(); });
await pg.waitForTimeout(3000);
out.tab0 = await pg.evaluate(() => document.querySelector('[data-active="1"]') ? 'n/a' : [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().top < 300).map((b) => b.textContent.trim() + ':' + (getComputedStyle(b).fontWeight)).join('|'));
out.caps = await pg.evaluate(() => ({ createTouch: typeof document.createTouch, createTouchList: typeof document.createTouchList, TouchEvent: typeof TouchEvent, Touch: typeof Touch, initTouchEvent: (() => { try { return typeof document.createEvent('TouchEvent').initTouchEvent; } catch (e) { return 'ERR ' + e; } })() }));
out.B = await pg.evaluate(async () => {
  const log = [];
  const t = document.elementFromPoint(300, 420) || document.body;
  window.addEventListener('touchstart', () => log.push('seen touchstart'), true);
  window.addEventListener('touchmove', () => log.push('seen touchmove'), true);
  const mk = (type, x) => {
    try {
      const touch = document.createTouch(window, t, 1, x, 420, x, 420);
      const list = document.createTouchList(touch);
      const empty = document.createTouchList();
      const ev = document.createEvent('TouchEvent');
      const end = type === 'touchend';
      ev.initTouchEvent(type, true, true, window, 0, x, 420, x, 420, false, false, false, false, end ? empty : list, end ? empty : list, list, 1, 0);
      return ev;
    } catch (e) { log.push('ERR ' + e); return null; }
  };
  const e0 = mk('touchstart', 300); if (e0) t.dispatchEvent(e0);
  for (let i = 1; i <= 10; i++) { const e = mk('touchmove', 300 - i * 20); if (e) t.dispatchEvent(e); await new Promise((r) => setTimeout(r, 16)); }
  const e1 = mk('touchend', 100); if (e1) t.dispatchEvent(e1);
  return log.slice(0, 8);
});
await pg.waitForTimeout(1000);
out.after = await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().top < 300).map((b) => b.textContent.trim() + ':' + getComputedStyle(b).fontWeight).join('|'));
fs.writeFileSync('webkit-debug.json', JSON.stringify(out, null, 2));
await b.close();

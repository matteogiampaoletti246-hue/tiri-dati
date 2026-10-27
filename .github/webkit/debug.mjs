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
// approccio A: eventi sintetici con log
out.A = await pg.evaluate(async () => {
  const log = [];
  const t = document.elementFromPoint(300, 420) || document.body;
  log.push('target ' + t.tagName + '.' + String(t.className).slice(0, 40));
  window.addEventListener('touchstart', () => log.push('seen touchstart'), true);
  window.addEventListener('touchmove', () => log.push('seen touchmove'), true);
  let ok = true;
  const mk = (type, x) => { try { const o = new Touch({ identifier: 7, target: t, clientX: x, clientY: 420, pageX: x, pageY: 420, screenX: x, screenY: 420 }); return new TouchEvent(type, { bubbles: true, cancelable: true, composed: true, touches: type === 'touchend' ? [] : [o], targetTouches: type === 'touchend' ? [] : [o], changedTouches: [o] }); } catch (e) { log.push('ERR ' + e); ok = false; return null; } };
  const e0 = mk('touchstart', 300); if (e0) t.dispatchEvent(e0);
  for (let i = 1; i <= 10; i++) { const e = mk('touchmove', 300 - i * 20); if (e) t.dispatchEvent(e); await new Promise((r) => setTimeout(r, 16)); }
  const e1 = mk('touchend', 100); if (e1) t.dispatchEvent(e1);
  return log.slice(0, 12);
});
await pg.waitForTimeout(1000);
out.after = await pg.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getBoundingClientRect().top < 300).map((b) => b.textContent.trim() + ':' + getComputedStyle(b).fontWeight).join('|'));
fs.writeFileSync('webkit-debug.json', JSON.stringify(out, null, 2));
await b.close();

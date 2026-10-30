// Misura della fluidita' degli swipe tra i giorni della Home: Chromium con CPU rallentata, traccia dei tempi (script / stile / layout / disegno).
// Confronta varianti (CSS o script iniettati) sulla stessa app costruita. Risultato: perf-out/perf.json (ramo perf-out).
import { chromium, devices } from 'playwright';
import fs from 'fs';

const APP = (process.env.BASE || 'http://localhost:8080/') + 'aurora/';
const RATE = Number(process.env.RATE || 4);
const REPS = Number(process.env.REPS || 3);
const N = Number(process.env.N || 14);
const GAP = Number(process.env.GAP || 250);
const VARIANTS = JSON.parse(fs.readFileSync(process.env.VARIANTS || '.github/perf/variants.json', 'utf8'));
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const NAMES = ['FunctionCall', 'UpdateLayoutTree', 'Layout', 'Paint', 'PrePaint', 'Layerize', 'Commit'];

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };
const b = await chromium.launch();

async function once(v) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], colorScheme: 'dark', locale: 'it-IT', timezoneId: 'Europe/Rome' });
  const pg = await ctx.newPage();
  await ctx.route('**/*.workers.dev/**', (r) => r.abort());
  if (v.init) await pg.addInitScript(v.init);
  const cdp = await ctx.newCDPSession(pg);
  await pg.goto(APP);
  if (v.css) await pg.addStyleTag({ content: v.css });
  await pg.waitForTimeout(9000);
  const nodes = await pg.evaluate(() => document.getElementsByTagName('*').length);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await b.startTracing(pg, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'blink', 'cc'] });
  const res = await pg.evaluate(async ([n, gap]) => {
    const lts = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => lts.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) { /* ignore */ }
    const loaf = []; try { new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (e.duration > 80) loaf.push({ d: Math.round(e.duration), blk: Math.round(e.blockingDuration || 0), rs: Math.round(e.renderStart ? e.startTime + e.duration - e.renderStart : 0), sl: Math.round(e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0), sc: (e.scripts || []).map((x) => `${x.invokerType}:${(x.invoker || '').slice(0, 40)} ${Math.round(x.duration)}ms forced ${Math.round(x.forcedStyleAndLayoutDuration || 0)} ${x.sourceFunctionName || ''}@${(x.sourceURL || '').split('/').pop()}:${x.sourceCharPosition}`) }); })).observe({ type: 'long-animation-frame', buffered: true }); } catch (e) { /* ignore */ }
    window.__loaf = loaf;
    const ts = []; let on = true;
    const f = (t) => { ts.push(t); if (on) requestAnimationFrame(f); };
    requestAnimationFrame(f);
    const el = document.getElementById('sl-shell') || document.body;
    for (let k = 0; k < n; k++) {
      const dir = k < n / 2 ? -1 : 1; const x = dir < 0 ? 320 : 70;
      const mk = (cx) => ({ identifier: 1, target: el, clientX: cx, clientY: 450 });
      const fire = (type, cx) => { const ev = new Event(type, { bubbles: true, cancelable: true }); Object.defineProperty(ev, 'touches', { value: type === 'touchend' ? [] : [mk(cx)] }); Object.defineProperty(ev, 'changedTouches', { value: [mk(cx)] }); el.dispatchEvent(ev); };
      fire('touchstart', x);
      for (let i = 1; i <= 8; i++) { fire('touchmove', x + dir * 22 * i); await new Promise((q) => requestAnimationFrame(q)); }
      fire('touchend', x + dir * 180);
      await new Promise((q) => setTimeout(q, gap));
    }
    await new Promise((q) => setTimeout(q, 1200));
    on = false;
    const d = ts.slice(1).map((t, i) => t - ts[i]);
    const s = [...d].sort((a, c) => a - c);
    await new Promise((q) => setTimeout(q, 100));
    return { loaf: window.__loaf, lt: lts, p50: Math.round(s[s.length >> 1]), p95: Math.round(s[Math.floor(s.length * 0.95)]), max: Math.round(s[s.length - 1]), over50: d.filter((x) => x > 50).length, over100: d.filter((x) => x > 100).length, persi: Math.round(d.reduce((a, x) => a + Math.max(0, Math.round(x / 16.7) - 1), 0)) };
  }, [N, GAP]);
  const trace = JSON.parse((await b.stopTracing()).toString());
  const ev = trace.traceEvents || trace;
  const by = {}; const longTasks = [];
  const cnt = {};
  ev.forEach((e) => { if (NAMES.includes(e.name) && e.ph === 'X') cnt[`${e.pid}:${e.tid}`] = (cnt[`${e.pid}:${e.tid}`] || 0) + 1; });
  const main = Object.entries(cnt).sort((a, c) => c[1] - a[1])[0][0];
  ev.forEach((e) => { if (`${e.pid}:${e.tid}` !== main || e.ph !== 'X' || !e.dur) return; if (NAMES.includes(e.name)) by[e.name] = (by[e.name] || 0) + e.dur / 1000; if (e.name === 'RunTask' && e.dur > 50000) longTasks.push(Math.round(e.dur / 1000)); });
  await ctx.close();
  const lt = res.lt || [];
  if (v.loaf && !globalThis.__loafDone) { globalThis.__loafDone = true; fs.mkdirSync('perf-out', { recursive: true }); fs.writeFileSync('perf-out/loaf.json', JSON.stringify(res.loaf, null, 1)); }
  return { ...res, loaf: undefined, lt: undefined, ltN: lt.length, ltSum: lt.reduce((a, x) => a + x, 0), ltMax: Math.max(0, ...lt), nodes, ms: Object.fromEntries(Object.entries(by).map(([k, x]) => [k, Math.round(x)])), lt50: longTasks.length, lt100: longTasks.filter((x) => x > 100).length };
}

const out = { when: new Date().toISOString(), rate: RATE, reps: REPS, variants: {} };
for (const v of VARIANTS) {
  if (only && !only.test(v.name)) continue;
  const runs = [];
  for (let i = 0; i < REPS; i++) { try { runs.push(await once(v)); } catch (e) { runs.push({ err: String(e).slice(0, 200) }); } }
  const okr = runs.filter((r) => !r.err);
  const agg = okr.length ? { p50: med(okr.map((r) => r.p50)), p95: med(okr.map((r) => r.p95)), over50: med(okr.map((r) => r.over50)), over100: med(okr.map((r) => r.over100)), persi: med(okr.map((r) => r.persi)), lt50: med(okr.map((r) => r.lt50)), lt100: med(okr.map((r) => r.lt100)), ltN: med(okr.map((r) => r.ltN)), ltSum: med(okr.map((r) => r.ltSum)), ltMax: med(okr.map((r) => r.ltMax)), nodes: okr[0].nodes, ms: Object.fromEntries(NAMES.map((k) => [k, med(okr.map((r) => r.ms[k] || 0))])) } : { err: runs.map((r) => r.err) };
  out.variants[v.name] = agg;
  console.log(v.name, JSON.stringify(agg));
}
fs.mkdirSync('perf-out', { recursive: true });
fs.writeFileSync('perf-out/perf.json', JSON.stringify(out, null, 1));
await b.close();

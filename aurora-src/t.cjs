const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();
for(const th of ['dark','light']){
const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,colorScheme:th});
const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(t=>localStorage.setItem('sl-theme',t),th);
await p.goto('http://localhost:4173/#/');
await p.waitForTimeout(1900);await p.screenshot({path:`/tmp/${th}-splash.png`});
await p.waitForTimeout(3500);await p.screenshot({path:`/tmp/${th}-home.png`});
for(const r of ['calcolatore','migliori-giocatori','migliori-matchup','menu']){await p.goto('http://localhost:4173/#/'+r);await p.waitForTimeout(1200);await p.screenshot({path:`/tmp/${th}-${r}.png`});}
console.log(th,errs);await c.close();}
await b.close();})();

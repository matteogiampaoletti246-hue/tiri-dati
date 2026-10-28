const {chromium,devices}=require('playwright');
(async()=>{
const b=await chromium.launch();
const c=await b.newContext({...devices['iPhone 14'],ignoreHTTPSErrors:true});
const p=await c.newPage();
const cdp=await c.newCDPSession(p);
await p.goto('https://matteogiampaoletti246-hue.github.io/tiri-dati/aurora/#/campionato/'+(process.argv[2]||'pro-league'));
await p.waitForTimeout(6000);
await p.evaluate(()=>{
 window.__f=[];window.__ls=[];window.__pill=[];
 let last=performance.now();
 const loop=(t)=>{const d=t-last;last=t;window.__f.push(d);if(d>30)(window.__L=window.__L||[]).push([Math.round(t),Math.round(d)]);
  const pl=document.querySelector('.glass-flat.hide-sb span[aria-hidden]');
  if(pl){const r=pl.getBoundingClientRect();window.__pill.push([Math.round(t),Math.round(r.top*10)/10,Math.round(r.left*10)/10,Math.round(r.width)]);}
  requestAnimationFrame(loop)};requestAnimationFrame(loop);
 new PerformanceObserver(l=>{for(const e of l.getEntries()){if(e.value>0.001)window.__ls.push({v:e.value,t:Math.round(e.startTime),src:(e.sources||[]).map(s=>(s.node&&(s.node.className||s.node.nodeName)||'').toString().slice(0,60)+' '+JSON.stringify(s.previousRect)+'->'+JSON.stringify(s.currentRect)).slice(0,2)})}}).observe({type:'layout-shift',buffered:true});
});
const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
async function swipe(dir){
 const y=500;let x=dir<0?330:60;const end=dir<0?60:330;
 await touch('touchStart',x,y);
 for(let i=1;i<=18;i++){await touch('touchMove',x+(end-x)*i/18,y);await p.waitForTimeout(16);}
 await touch('touchEnd',end,y);
 await p.waitForTimeout(900);
}
for(const d of [-1,-1,-1,1,1,-1]){console.log('swipe',d,await p.evaluate(()=>Math.round(performance.now())));await swipe(d);}
const r=await p.evaluate(()=>{const f=window.__f.slice(2);const long=f.filter(x=>x>34);
 // pill vertical/horizontal jumps between consecutive frames with big delta
 const pj=[];for(let i=1;i<window.__pill.length;i++){const a=window.__pill[i-1],b=window.__pill[i];if(Math.abs(b[1]-a[1])>2)pj.push([a,b]);}
 return {L:window.__L,frames:f.length,long:long.length,max:Math.max(...f),p95:f.sort((a,b)=>a-b)[Math.floor(f.length*.95)],ls:window.__ls.slice(0,15),pillJumps:pj.slice(0,8)}});
console.log(JSON.stringify(r,null,1));
await p.screenshot({path:'sw.png'});
await b.close();})();

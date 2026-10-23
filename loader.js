function loader(){
  var MARK = '<svg viewBox="0 0 512 512"><circle cx="256" cy="256" r="196" fill="#fff"/>'
    + '<circle cx="256" cy="256" r="170" fill="none" stroke="#8CCBFF" stroke-width="28"/>'
    + '<circle cx="256" cy="256" r="108" fill="none" stroke="#1F63E0" stroke-width="28"/>'
    + '<circle cx="256" cy="256" r="42" fill="#1F63E0"/>'
    + '<g class="slb-ticks" stroke="#0B2A6B" stroke-width="20" stroke-linecap="round"><path d="M256 40v76M256 396v76M40 256h76M396 256h76"/></g></svg>';
  var IC = {
    player: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="3.6"/><path d="M4.5 20.5c.6-4.2 3.6-6.5 7.5-6.5s6.9 2.3 7.5 6.5"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 19.5c.5-3.5 3-5.4 6-5.4s5.5 1.9 6 5.4"/><circle cx="17.2" cy="9" r="2.5"/><path d="M16.6 14.2c2.6.1 4.3 1.7 4.7 4.6"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="#E5322D" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 21.5V3"/><path d="M6 4.5h11.5l-3 4 3 4H6" fill="#E5322D" fill-opacity=".2"/></svg>',
    versus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14M14 4l4 4-4 4"/><path d="M20 16H6M10 12l-4 4 4 4"/></svg>',
    shots: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
    fouls: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="14.5" r="5"/><path d="M13 11.5l7-1.5v4l-6 .8"/><path d="M9 3.5V7M5.5 5l1.5 2M12.5 5L11 7"/></svg>',
    offs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V3"/><path d="M4 5h9l-2 3 2 3H4" /><path d="M16 21v-9M20 21v-5" stroke-dasharray="1 3"/></svg>',
    guide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v15H5.5C4.7 19 4 18.3 4 17.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H13v15h5.5c.8 0 1.5-.7 1.5-1.5z"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="8.6" y="1.6" width="7.2" height="10" rx="1.5" fill="#F5C518" transform="rotate(-9 12 7)"/><path d="M3.5 15.6l2.6-1.2c.9-.4 1.9-.2 2.6.5l.9.9h4.6c1 0 1.8.8 1.8 1.8 0 .5-.2 1-.6 1.3l-1.4 1.1c-.4.3-.8.5-1.3.5H8.6c-.7 0-1.3-.2-1.8-.7L3.5 18.2"/><path d="M14 13.6l4.8-1.6c.8-.3 1.7.2 1.9 1 .2.7-.2 1.4-.9 1.7l-5 1.9"/></svg>'
  };
  var VIEWS = [
    {id:'players', label:'Giocatori',     ic:'player', val:'player'},
    {id:'teams',   label:'Tiri Squadre',  ic:'team',   val:'team'},
    {id:'best',    label:'Migliori Giocatori', ic:'player', match:'best'},
    {id:'corners', label:'Angoli',        ic:'flag',   match:'corners', sub:true},
    {id:'cards',   label:'Cartellini',    ic:'card',   match:'cards',   sub:true},
    {id:'shots',   label:'Tiri',          ic:'shots',  match:'shots',   sub:true},
    {id:'fouls',   label:'Falli',         ic:'fouls',  match:'fouls',   sub:true},
    {id:'offs',    label:'Fuorigiochi',   ic:'offs',   match:'offs',    sub:true},
    {id:'guide',   label:'Linee guida',   ic:'guide',  val:'player', guide:true}
  ];

  // categorie dei matchup: sezioni, liste dentro angoli.json e campi
  var CATS = {
    corners: [{t:'Maggiore divario angoli', list:'corner', f:['corners_home','corners_away','gap'], lab:'Angoli attesi', g:'games'}],
    cards:   [{t:'Meno cartellini (totali)', list:'cartellini', kind:'cards'},
              {t:'Meno cartellini nel primo tempo', list:'cartellini_1t', kind:'cards1'}],
    shots:   [{t:'Maggiore divario tiri totali', list:'tiri', f:['tiri_home','tiri_away','tiri_gap'], lab:'Tiri attesi', g:'tiri_games'},
              {t:'Maggiore divario tiri in porta', list:'tiri_sot', f:['sot_home','sot_away','sot_gap'], lab:'Tiri in porta attesi', g:'sot_games'}],
    fouls:   [{t:'Maggiore divario falli', list:'falli', f:['falli_home','falli_away','falli_gap'], lab:'Falli attesi', g:'falli_games'}],
    offs:    [{t:'Maggiore divario fuorigiochi', list:'fuorigiochi', f:['off_home','off_away','off_gap'], lab:'Fuorigiochi attesi', g:'off_games'}]
  };

  function shell(){
    var lk = document.createElement('link');
    lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap';
    document.head.appendChild(lk);

    var st = document.createElement('style');
    st.textContent =
      'html:root{--bg:#F5F8FE;--panel:#FFFFFF;--panel-2:#EEF3FC;--line:#DCE5F4;--text:#0F2347;--text-dim:#5C6F94;' +
      '--accent:#1F63E0;--accent-dim:#DDE9FF;--red:#D9442E;--amber:#C98300;--green:#13955F;--gold:#C99A06;' +
      '--gold-dim:rgba(242,194,48,.16);color-scheme:light;}' +
      'body{padding-block:0 80px !important;}' +
      'body .wrap > header,#viewSeg{display:none !important;}' +
      'h1,h2,h3,.panel h2{font-family:Poppins,"Space Grotesk",sans-serif !important;}' +
      '.slb-bar{position:sticky;top:0;z-index:50;display:flex;align-items:center;gap:9px;' +
        'margin:0 calc(-1*max(16px,env(safe-area-inset-right,0px))) 14px calc(-1*max(16px,env(safe-area-inset-left,0px)));' +
        'padding:12px max(16px,env(safe-area-inset-right,0px)) 12px max(16px,env(safe-area-inset-left,0px));' +
        'background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}' +
      '#slbLogo{width:34px;height:34px;flex:0 0 auto;display:block;}#slbLogo svg{width:100%;height:100%;display:block;}' +
      '#slbName{font-family:Poppins,sans-serif;font-weight:800;font-size:24px;letter-spacing:-.5px;color:#0B2A6B;line-height:1;white-space:nowrap;}' +
      '#slbName b{color:#2F8DFF;font-weight:800;}' +
      '.slb-hide{visibility:hidden;}' +
      '#slbBurger{margin-left:auto;width:42px;height:42px;border-radius:12px;border:1px solid var(--line);background:#fff;color:#0B2A6B;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}' +
      '#slbBurger svg{width:22px;height:22px;}' +
      '#slbTitle{display:flex;align-items:center;gap:10px;margin:2px 0 14px;font-family:Poppins,sans-serif;font-weight:700;font-size:22px;color:#0B2A6B;}' +
      '#slbTitle svg{width:26px;height:26px;color:#1F63E0;}' +
      '#slbScrim{position:fixed;inset:0;background:rgba(11,42,107,.35);z-index:80;opacity:0;pointer-events:none;transition:opacity .2s;}' +
      '#slbMenu{position:fixed;top:0;right:0;bottom:0;width:min(300px,84vw);background:#fff;z-index:90;transform:translateX(102%);transition:transform .25s cubic-bezier(.2,.8,.25,1),visibility 0s linear .25s;visibility:hidden;' +
        'padding:max(18px,env(safe-area-inset-top)) 14px 24px;display:flex;flex-direction:column;gap:6px;}' +
      'body.slb-open #slbScrim{opacity:1;pointer-events:auto;}body.slb-open #slbMenu{transform:none;visibility:visible;transition-delay:0s;box-shadow:-12px 0 40px rgba(11,42,107,.18);}' +
      '#slbMenu .mh{display:flex;align-items:center;justify-content:space-between;padding:0 6px 10px;font-family:Poppins,sans-serif;font-weight:700;color:#0B2A6B;font-size:17px;}' +
      '#slbMenu .mh button{border:0;background:transparent;font-size:26px;line-height:1;color:#5C6F94;cursor:pointer;}' +
      '.slb-item{display:flex;align-items:center;gap:14px;width:100%;text-align:left;border:0;background:transparent;border-radius:14px;padding:14px 14px;' +
        'font-family:Poppins,sans-serif;font-weight:600;font-size:16px;color:#0F2347;cursor:pointer;}' +
      '.slb-item svg{width:24px;height:24px;color:#1F63E0;flex:0 0 auto;}' +
      '.slb-item.on{background:#E6F0FF;color:#1F63E0;}' +
      '.slb-item:active{background:#EEF3FC;}' +
      '.slb-item.sep{margin-top:10px;border-top:1px solid var(--line);border-radius:0 0 14px 14px;padding-top:18px;}' +
      '.hint:empty{display:none;}#hitRate5 ~ .hint{display:none !important;}' +
      '#playerTeamSub,#oppSub,#teamForSub,#teamOppSub,#compHint{display:none !important;}' +
      '#homeAwaySeg button,#teamSedeSeg button{white-space:nowrap;font-size:14px;padding-left:4px;padding-right:4px;}' +
      '#slbGuide,#slbMatch{display:none;}body.slb-guide #slbGuide,body.slb-match #slbMatch{display:block;}' +
      'body.slb-alt #playerView,body.slb-alt #teamView,body.slb-alt #angoliView{display:none !important;}' +
      '.slb-item .chev{margin-left:auto;width:18px;height:18px;transition:transform .2s;color:#5C6F94;}.slb-item.openp .chev{transform:rotate(180deg);}' +
      '.slb-sub{display:none;flex-direction:column;gap:2px;margin:0 0 4px 10px;padding-left:8px;border-left:2px solid var(--line);}.slb-sub.open{display:flex;}' +
      '.slb-item.subitem{padding:11px 12px;font-size:15px;}.slb-item.subitem svg{width:21px;height:21px;}' +
      '#slbMatch .play-card .who{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}#slbMatch .who img{width:20px;height:20px;object-fit:contain;}' +
      '#slbGuide details.panel{margin-bottom:14px;}' +
      '#slbSplash{position:fixed;inset:0;background:#fff;z-index:9999;}' +
      '#slbSplash .sl{position:absolute;left:0;top:0;transform-origin:0 0;}' +
      '#slbSplash .sl svg{display:block;width:100%;height:100%;}' +
      '#slbSplash .nm{position:absolute;white-space:nowrap;}' +
      '#slbSplash .nm span{display:inline-block;}';
    document.head.appendChild(st);
    document.title = 'ScalperLab';

    // barra in alto
    var bar = document.createElement('div'); bar.className = 'slb-bar';
    bar.innerHTML = '<span id="slbLogo" class="slb-hide">' + MARK + '</span><span id="slbName" class="slb-hide">Scalper<b>Lab</b></span>' +
      '<button id="slbBurger" type="button" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>';
    document.body.insertBefore(bar, document.body.firstChild);

    // titolo della pagina corrente
    var title = document.createElement('div'); title.id = 'slbTitle';
    var wrap = document.querySelector('.wrap');
    wrap.insertBefore(title, wrap.firstChild);

    // menu
    var scrim = document.createElement('div'); scrim.id = 'slbScrim';
    var menu = document.createElement('div'); menu.id = 'slbMenu';
    menu.innerHTML = '<div class="mh"><span>Menu</span><button type="button" id="slbClose" aria-label="Chiudi">&times;</button></div>';
    var sub = document.createElement('div'); sub.className = 'slb-sub';
    var mm = document.createElement('button'); mm.type = 'button'; mm.className = 'slb-item'; mm.id = 'slbMM';
    mm.innerHTML = IC.versus + '<span>Migliori Matchup</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
    mm.addEventListener('click', function(){ var o = !sub.classList.contains('open'); sub.classList.toggle('open', o); mm.classList.toggle('openp', o); });
    var added = false;
    VIEWS.forEach(function(v){
      var b = document.createElement('button'); b.type = 'button'; b.className = 'slb-item' + (v.sub ? ' subitem' : ''); b.dataset.id = v.id;
      b.innerHTML = IC[v.ic] + '<span>' + v.label + '</span>'; if(v.guide) b.classList.add('sep');
      b.addEventListener('click', function(){ go(v.id); });
      if(v.sub){ if(!added){ menu.appendChild(mm); menu.appendChild(sub); added = true; } sub.appendChild(b); }
      else menu.appendChild(b);
    });
    document.body.appendChild(scrim); document.body.appendChild(menu);
    function openMenu(o){ document.body.classList.toggle('slb-open', o); }
    document.getElementById('slbBurger').addEventListener('click', function(){ openMenu(true); });
    scrim.addEventListener('click', function(){ openMenu(false); });
    document.getElementById('slbClose').addEventListener('click', function(){ openMenu(false); });

    function go(id){
      var v = VIEWS.filter(function(x){ return x.id === id; })[0]; if(!v) return;
      var cl = document.body.classList;
      cl.toggle('slb-guide', !!v.guide); cl.toggle('slb-match', !!v.match); cl.toggle('slb-alt', !!(v.guide || v.match));
      var btn = document.querySelector('#viewSeg button[data-val="' + (v.val || 'player') + '"]');
      if(btn) btn.click();
      title.innerHTML = IC[v.ic] + '<span>' + v.label + '</span>';
      Array.prototype.forEach.call(menu.querySelectorAll('.slb-item'), function(b){ b.classList.toggle('on', b.dataset.id === id); });
      if(v.match){ if(v.sub){ sub.classList.add('open'); mm.classList.add('openp'); } renderMatch(v.match); }
      openMenu(false);
      window.scrollTo(0, 0);
    }
    go('players');

    cleanup();
    players();
    splash();
  }

  // pulizia dell'interfaccia: via descrizioni inutili, "Come viene calcolato" nelle Linee guida, data aggiornamento
  var MDATA = null, MSEL = null, MCAT = 'corners';
  function el(tag, cls, txt){ var e = document.createElement(tag); if(cls) e.className = cls; if(txt != null) e.textContent = txt; return e; }
  function f1(x){ return x == null ? '\u2013' : String(x).replace('.', ','); }
  function dayLabel(d){
    try{ return new Date(d + 'T12:00:00').toLocaleDateString('it-IT', {weekday:'short', day:'numeric', month:'short'}); }catch(e){ return d; }
  }
  function hhmm(t){
    if(!t || String(t).length < 11) return '';
    var x = new Date(t); return isNaN(x) ? '' : ('0' + x.getHours()).slice(-2) + ':' + ('0' + x.getMinutes()).slice(-2);
  }
  function mcard(m, sec){
    var c = el('div', 'play-card'), top = el('div', 'play-top'), who = el('div', 'who');
    if(m.home_logo){ var i1 = el('img'); i1.src = m.home_logo; i1.alt = ''; i1.onerror = function(){ i1.remove(); }; who.appendChild(i1); }
    who.appendChild(el('span', '', m.home));
    who.appendChild(el('span', '', '\u2013'));
    if(m.away_logo){ var i2 = el('img'); i2.src = m.away_logo; i2.alt = ''; i2.onerror = function(){ i2.remove(); }; who.appendChild(i2); }
    who.appendChild(el('span', '', m.away));
    top.appendChild(who); top.appendChild(el('div', 'when', hhmm(m.time)));
    c.appendChild(top); c.appendChild(el('div', 'play-mkt', m.league));
    var chips = el('div', 'chips'), g = m.games;
    if(sec.f){
      chips.appendChild(el('span', 'chip gold', 'Divario ' + f1(m[sec.f[2]])));
      chips.appendChild(el('span', 'chip', sec.lab + ' ' + f1(m[sec.f[0]]) + ' \u2013 ' + f1(m[sec.f[1]])));
      g = m[sec.g];
    } else if(sec.kind === 'cards'){
      chips.appendChild(el('span', 'chip gold', 'Cartellini totali ' + f1(m.cards))); chips.appendChild(el('span', 'chip', '1T ' + f1(m.cards_1t))); g = m.games_k;
    } else {
      chips.appendChild(el('span', 'chip gold', 'Cartellini 1T ' + f1(m.cards_1t))); chips.appendChild(el('span', 'chip', 'Totali ' + f1(m.cards))); g = m.games_k;
    }
    if(g) chips.appendChild(el('span', 'chip', 'Partite usate: ' + g[0] + ' / ' + g[1]));
    c.appendChild(chips);
    if(m.non_coperto && m.non_coperto.length) c.appendChild(el('span', 'chip ang-warn', 'Campionato non coperto: ' + m.non_coperto.join(', ')));
    return c;
  }
  function drawMatch(){
    var root = document.getElementById('slbMatch'); if(!root) return;
    var days = root.querySelector('.ang-days'), body = root.querySelector('.mbody'), note = root.querySelector('.mnote');
    days.innerHTML = ''; body.innerHTML = '';
    if(MCAT === 'best'){ drawBest(days, body, note); return; }
    if(!MDATA){ note.textContent = 'Dati non disponibili: lancia l\'Action "Aggiorna dati" da GitHub.'; return; }
    var keys = Object.keys(MDATA.days || {}).sort();
    note.textContent = 'Aggiornato: ' + new Date(MDATA.updated_at).toLocaleString('it-IT');
    if(!keys.length){ body.appendChild(el('div', 'empty-hist', 'Nessuna partita nei prossimi giorni.')); return; }
    if(!MSEL || keys.indexOf(MSEL) < 0) MSEL = keys[0];
    keys.forEach(function(k){
      var b = el('button', 'ang-day' + (k === MSEL ? ' active' : ''), dayLabel(k)); b.type = 'button';
      b.addEventListener('click', function(){ MSEL = k; drawMatch(); });
      days.appendChild(b);
    });
    var d = MDATA.days[MSEL];
    CATS[MCAT].forEach(function(sec){
      body.appendChild(el('div', 'ang-h', sec.t));
      var list = d[sec.list];
      if(!list){ body.appendChild(el('div', 'hist-note', 'Dati non ancora disponibili: lancia l\'Action "Aggiorna dati".')); return; }
      if(!list.length){ body.appendChild(el('div', 'hist-note', 'Nessuna partita con dati sufficienti.')); return; }
      list.forEach(function(m){ body.appendChild(mcard(m, sec)); });
    });
  }
  // --- migliori giocatori: voto = probabilita' del modello (come il calcolatore, senza hit rate) di Over 1,5 tiri; sotto le linee con le quote ---
  var BIDX = null, BCACHE = {}, BSTAT = 0, BDAY = null, BLINE = [1.5, 0.5], BMIN = 7.75, BMAX = 30, QMIN = 1.25;
  function pois(k, l){ var s = 0, t = Math.exp(-l); for(var i = 0; i <= k; i++){ s += t; t = t * l / (i + 1); } return s; }
  function lgAvg(D, k, field){
    if(D[k].avg) return D[k].avg[field];
    var v = Object.keys(D[k].teams).map(function(n){ return D[k].teams[n][field]; });
    return v.length ? v.reduce(function(a, b){ return a + b; }, 0) / v.length : null;
  }
  function lgStr(D, k){ return D[k] && D[k].strength ? D[k].strength : 1; }
  function adjStr(v, avg, s){ return (s < 1 && avg > 0) ? avg + (v - avg) * s : v; }
  function bTeam(key, name, field){
    var D = window.LEAGUE_DATA || {}, L = D[key]; if(!L || !L.teams || !L.teams[name]) return null;
    var t = L.teams[name], avg = lgAvg(D, key, field);
    if(!L.cup) return {v: t[field], avg: avg, str: lgStr(D, key)};
    var dk = null;
    Object.keys(D).some(function(k){ if(k !== 'nazionali' && !D[k].cup && D[k].teams && D[k].teams[name]){ dk = k; return true; } return false; });
    if(!dk) return {v: t[field], avg: avg, str: 1};
    var dv = D[dk].teams[name][field], da = lgAvg(D, dk, field);
    return {v: (adjStr(dv, da, lgStr(D, dk)) + t[field]) / 2, avg: (da + avg) / 2, str: 1};
  }
  // media di tiri attesa (lambda) del giocatore in quella partita; idx 0 = tiri totali, 1 = tiri in porta
  function bLam(p, f, idx){
    var g = p.l[0] + p.c[0], mi = p.l[3] + p.c[3]; if(g < 3 || mi <= 0) return null;
    var lr = lastRows(p).r.slice(0, 5); if(lr.length < 3) return null;
    var sh = 0, mn = 0, nl = lr.length; lr.forEach(function(x){ sh += x[idx]; mn += x[2]; });
    if(mn / nl < 35 || mn <= 0) return null;                              // minuti medi minimi nelle ultime 5 partite
    var season = (p.l[1 + idx] + p.c[1 + idx]) / mi * 90, l5 = sh / mn * 90, rate = (season + l5) / 2;
    var comp = f[3], D = window.LEAGUE_DATA || {}, cup = !!(D[comp] && D[comp].cup);
    var fo = idx ? 'sotFor' : 'totalFor', ag = idx ? 'sotAgainst' : 'totalAgainst';
    var own = bTeam(pickKey(p.t, cup ? comp : null), p.t, fo), opp = bTeam(pickKey(f[1], cup ? comp : null), f[1], ag);
    if(!own || !opp) return null;
    var ro = opp.v > 0 && opp.avg > 0 ? opp.v / opp.avg : 1; if(opp.str > 0 && opp.str < 1) ro = 1 + (ro - 1) * opp.str;
    var rc = own.v > 0 && own.avg > 0 ? own.v / own.avg : 1; if(own.str > 0 && own.str < 1) rc = 1 + (rc - 1) * own.str;
    var lam = rate * Math.pow(ro, 0.85) * Math.pow(rc, 0.35) * (f[2] === 1 ? 1.06 : 0.94);
    return lam > 0 ? {lam: lam, sea: season, l5: l5, mn: mn / nl} : null;
  }
  function bProb(lam, line){ return Math.max(0, Math.min(1, 1 - pois(Math.floor(line), lam))); }
  function bList(day, idx, line){
    var ck = day + '|' + idx + '|' + line; if(BCACHE[ck]) return BCACHE[ck];
    var out = [], bd = BIDX.byDay[day] || {};
    PDATA.forEach(function(p){
      var f = bd[p.t]; if(!f) return;
      var t = bLam(p, f, idx); if(!t) return;
      var v = bProb(t.lam, line) * 10; if(v < BMIN) return;
      out.push({p: p, f: f, t: t, voto: v});
    });
    out.sort(function(a, b){ return b.voto - a.voto || b.t.lam - a.t.lam; });
    if(QDATA) out = out.filter(function(r){ var q = qOdd(r.p, 0, 1.5, day); return !q || q.v >= QMIN; });
    return BCACHE[ck] = out.slice(0, BMAX);
  }
  function drawBest(days, body, note){
    note.textContent = '';
    if(!PDATA){ note.textContent = 'Carico i giocatori…'; return; }
    if(!BIDX){
      var today = romeDay(new Date()), lim = romeDay(new Date(Date.now() + 7 * 864e5)), set = {}, byDay = {};
      Object.keys(PFIX).forEach(function(t){ PFIX[t].forEach(function(f){
        var d = romeDay(new Date(f[0])); if(d < today || d > lim) return;
        set[d] = 1; (byDay[d] = byDay[d] || {})[t] = f; }); });
      BIDX = {keys: Object.keys(set).sort(), byDay: byDay};
    }
    var keys = BIDX.keys;
    if(!keys.length){ body.appendChild(el('div', 'empty-hist', 'Nessuna partita nei prossimi giorni.')); return; }
    if(!BDAY || keys.indexOf(BDAY) < 0) BDAY = keys[0];
    keys.forEach(function(k){
      var b = el('button', 'ang-day' + (k === BDAY ? ' active' : ''), dayLabel(k)); b.type = 'button';
      b.addEventListener('click', function(){ BDAY = k; drawMatch(); }); days.appendChild(b);
    });
    var idx = 0, lines = [0.5, 1.5, 2.5], line = BLINE[0];
    var lg = el('div', 'ang-days');
    lines.forEach(function(l){
      var b = el('button', 'ang-day' + (l === line ? ' active' : ''), 'Over ' + f1(l)); b.type = 'button';
      b.addEventListener('click', function(){ BLINE[idx] = l; drawMatch(); }); lg.appendChild(b);
    });
    body.appendChild(lg);
    var list = bList(BDAY, idx, line);
    body.appendChild(el('div', 'ang-h', 'Migliori giocatori per affidabilità'));
    body.appendChild(el('div', 'hist-note', 'Giocatori con voto 7,75 o più su Over ' + f1(line) + ' (massimo ' + BMAX + ' al giorno); esclusi quelli con quota Over 1,5 sotto 1,25.' + (QDATA ? ' Le quote Bet365 compaiono man mano che il book le pubblica.' : '')));
    if(!list.length){ body.appendChild(el('div', 'hist-note', 'Nessun giocatore con voto 7,75 o più per questo giorno.')); return; }
    list.forEach(function(r, i){
      var c = el('div', 'play-card'), top = el('div', 'play-top'), who = el('div', 'who');
      who.appendChild(el('span', '', (i + 1) + '. ' + r.p.n));
      top.appendChild(who); top.appendChild(el('div', 'when', hhmm(r.f[0])));
      c.appendChild(top);
      c.appendChild(el('div', 'play-mkt', r.p.t + (r.f[2] === 1 ? ' – ' : ' @ ') + r.f[1]));
      var ch = el('div', 'chips');
      var tt = r.t;
      ch.appendChild(el('span', 'chip gold', 'Voto ' + f1((Math.round(r.voto * 100) / 100).toFixed(2))));
      if(tt) ch.appendChild(el('span', 'chip', 'Media attesa ' + f1(tt.lam.toFixed(2))));
      ch.appendChild(el('span', 'chip', Math.round(r.t.mn) + '\' medi'));
      if(tt) ch.appendChild(el('span', 'chip', 'Ultime 5: ' + f1(tt.l5.toFixed(1)) + ' \u00b7 stagione ' + f1(tt.sea.toFixed(1)) + ' /90\''));
      c.appendChild(ch);
      var qs = [];
      lines.forEach(function(l){ var q = QDATA ? qOdd(r.p, idx, l, BDAY) : null; if(q) qs.push([l, q.v]); });
      var row = el('div', 'chips'); row.style.marginTop = '8px';
      if(qs.length){
        row.appendChild(b365());
        qs.forEach(function(x){ var qc = el('span', 'chip', 'Over ' + f1(x[0]) + ' \u00b7 ' + f1((Math.round(x[1] * 100) / 100).toFixed(2))); qc.style.fontWeight = '700'; row.appendChild(qc); });
      } else {
        row = el('div', 'hist-note', 'Quote Bet365 non disponibili.');
      }
      c.appendChild(row);
      body.appendChild(c);
    });
  }
  function renderMatch(cat){
    MCAT = cat; drawMatch();
    if(cat === 'best'){ loadPlayers().then(drawMatch); return; }
    fetch('angoli.json?t=' + Date.now()).then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; }).then(function(j){ MDATA = j; drawMatch(); });
  }
  var LAST = null;

  // --- giocatori: ricerca nome e compilazione automatica di medie, minuti, ultime 5 e hit rate ---
  var PDATA = null, PSEL = null, PLOAD = null, PFIX = {};
  function norm(x){ return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  var QDATA = null, QUPD = null;
  function loadPlayers(){
    if(!PLOAD){
      var qp = fetch('quote.json?t=' + Date.now()).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
      PLOAD = fetch('giocatori.json?t=' + Date.now()).then(function(r){ return r.ok ? r.json() : null; })
        .catch(function(){ return null; }).then(function(j){
          PFIX = (j && j.fix) || {}; BIDX = null; BCACHE = {};
          PDATA = j && j.players ? j.players.map(function(p){ p._k = norm(p.n); p._t = norm(p.t); return p; }) : [];
          return qp;
        }).then(function(q){ QDATA = q && q.q ? q.q : null; QUPD = q && q.updated_at ? q.updated_at : null; BCACHE = {}; return PDATA; });
    }
    return PLOAD;
  }
  function qOdd(p, idx, line, day){
    var dd = QDATA && QDATA[p.i]; if(!dd) return null;
    var k = day || Object.keys(dd).sort()[0]; var e = k && dd[k]; if(!e) return null;
    var v = (idx ? e.o : e.s) || {}; v = v[String(line)];
    return v ? {v: v, d: k, u: e.u} : null;
  }
  function b365(){
    var s = el('span', '', 'bet365'); s.title = 'Quota Bet365';
    s.style.cssText = 'display:inline-block;background:#027B5B;color:#FFDF1B;font-weight:800;font-size:11px;letter-spacing:-.2px;padding:2px 6px;border-radius:5px;line-height:1.3;margin-right:5px;vertical-align:1px;';
    return s;
  }
  function hmQ(t){ t = t || QUPD; if(!t) return ''; var d = new Date(t); return isNaN(d) ? '' : d.toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit', timeZone:'Europe/Rome'}); }
  var AUTOODD = false;
  function fillOdds(){
    var inp = document.getElementById('odds'), nt = document.getElementById('slbQNote');
    if(!inp) return;
    if(!nt){ nt = el('div'); nt.id = 'slbQNote'; nt.style.cssText = 'font-size:12.5px;margin-top:6px;color:#027B5B;font-weight:600;'; inp.parentNode.appendChild(nt); }
    var p = PSEL, ln = parseFloat((document.getElementById('lineValue') || {}).value);
    var a = document.querySelector('#lineTypeSeg button.active'), over = !a || a.dataset.val !== 'under';
    var q = p && over && isFinite(ln) ? qOdd(p, statIdx(), ln) : null;
    nt.innerHTML = '';
    if(q){
      setVal('odds', (Math.round(q.v * 100) / 100).toString()); AUTOODD = true;
      nt.appendChild(b365()); nt.appendChild(document.createTextNode('Quota ' + f1((Math.round(q.v * 100) / 100).toFixed(2)) + (hmQ(q.u) ? ' \u00b7 aggiornata alle ' + hmQ(q.u) : '')));
    } else if(AUTOODD){ setVal('odds', ''); AUTOODD = false; }
  }
  function setVal(id, v, ev){
    var e = document.getElementById(id); if(!e) return;
    e.value = v;
    e.dispatchEvent(new Event(ev || 'input', {bubbles:true}));
  }
  function statIdx(){
    var a = document.querySelector('#shotTypeSeg button.active');
    return a && a.dataset.val === 'sot' ? 1 : 0;     // 0 = tiri totali, 1 = tiri in porta
  }
  function lastRows(p){
    var h = p.h || [];
    return h.length >= 5 ? {r: h, fb: false, n: h.length} : {r: p.r || [], fb: true, n: h.length};   // senza 5 partite da 50' si usano le ultime 5 giocate
  }
  function l5Note(p){
    var e = document.getElementById('slbL5Note'); if(!e) return;
    var x = p ? lastRows(p) : null;
    e.textContent = x && x.fb ? 'Meno di 5 partite da almeno 50 minuti (' + x.n + '): uso le ultime 5 partite giocate.' : '';
  }
  function fillHit(){
    var p = PSEL; if(!p) return;
    var k = statIdx(), line = parseFloat((document.getElementById('lineValue') || {}).value);
    var a = document.querySelector('#lineTypeSeg button.active'), over = !a || a.dataset.val !== 'under';
    var r = lastRows(p).r;
    if(r.length < 5 || !isFinite(line) || line <= 0){ setVal('hitRate5', '', 'change'); return; }
    var n = 0;
    r.slice(0, 5).forEach(function(x){ if(over ? x[k] > line : x[k] < line) n++; });
    setVal('hitRate5', ['0', '0.2', '0.4', '0.6', '0.8', '1'][n], 'change');
  }
  function fillAvg(){
    var p = PSEL; if(!p) return;
    var k = statIdx();
    function avg(a, i){ return a && a[0] > 0 ? a[i] / a[0] : null; }
    var comps = [['League', p.l], ['Cup', p.c]];
    comps.forEach(function(c){
      var sh = avg(c[1], 1 + k), mi = avg(c[1], 3);
      setVal('shots' + c[0], sh == null ? '' : (Math.round(sh * 100) / 100).toString());
      setVal('minutes' + c[0], mi == null ? '' : Math.round(mi).toString());
    });
    setVal('shotsNL', ''); setVal('minutesNL', ''); setVal('shotsWCQ', ''); setVal('minutesWCQ', '');
    var r = lastRows(p).r;
    l5Note(p);
    setVal('l5Shots', r.map(function(x){ return x[k]; }).join('-'));
    setVal('l5Mins', r.map(function(x){ return x[2]; }).join('-'));
    var info = document.getElementById('slbPInfo');
    if(info) info.textContent = p.t + ' \u00b7 stagione: ' + (p.l[0] + p.c[0]) + ' partite (' + p.l[0] + ' campionato, ' + p.c[0] + ' coppe)';
    fillHit();
  }
  // --- prossima partita: squadra del giocatore e avversaria si compilano da sole ---
  var RDC = {};
  function romeDay(d){ var k = d.getTime(); return RDC[k] || (RDC[k] = d.toLocaleDateString('sv-SE', {timeZone:'Europe/Rome'})); }
  var PKC = {};
  function pickKey(name, prefer){ var ck = name + '|' + prefer; if(!(ck in PKC)) PKC[ck] = pickKey0(name, prefer); return PKC[ck]; }
  function pickKey0(name, prefer){
    var D = window.LEAGUE_DATA || {}, order = [];
    if(prefer) order.push(prefer);
    KEEP.forEach(function(k){ if(k && order.indexOf(k) < 0 && !(D[k] && D[k].cup)) order.push(k); });
    KEEP.forEach(function(k){ if(k && order.indexOf(k) < 0) order.push(k); });
    for(var i = 0; i < order.length; i++){
      var k = order[i], sel = document.getElementById('oppLeague');
      var inList = sel && Array.prototype.some.call(sel.options, function(o){ return o.value === k; });
      if(inList && D[k] && D[k].teams && D[k].teams[name]) return k;
    }
    return null;
  }
  function pick(leagueId, teamId, key, name){
    var ls = document.getElementById(leagueId), ts = document.getElementById(teamId);
    if(!ls || !ts || !key) return false;
    ls.value = key; ls.dispatchEvent(new Event('change', {bubbles:true}));
    ts.value = name; ts.dispatchEvent(new Event('change', {bubbles:true}));
    return ts.value === name;
  }
  function setNote(t){
    var e = document.getElementById('slbMNote'); if(e) e.textContent = t || '';
  }
  function fillTeams(p){
    setNote('');
    var list = PFIX[p.t] || [], today = romeDay(new Date()), f = null;
    for(var i = 0; i < list.length; i++){ if(romeDay(new Date(list[i][0])) >= today){ f = list[i]; break; } }
    if(!f){ setNote('Prossima partita di ' + p.t + ' non trovata: scegli le squadre a mano.'); return; }
    var opp = f[1], home = f[2] === 1, comp = f[3];
    var D = window.LEAGUE_DATA || {}, isCup = !!(D[comp] && D[comp].cup);
    if(!isCup){
      var cb = document.querySelector('#compSeg button[data-val="league"]'); if(cb) cb.click();   // azzera eventuali coppe rimaste
    }
    var pk = isCup ? pickKey(p.t, comp) : pickKey(p.t, null);
    var ok1 = pick('playerLeague', 'playerTeam', pk, p.t);
    var ok = isCup ? pick('oppLeague', 'oppTeam', pickKey(opp, comp), opp) : pick('oppLeague', 'oppTeam', pickKey(opp, comp), opp);
    var hb = document.querySelector('#homeAwaySeg button[data-val="' + (home ? 'home' : 'away') + '"]'); if(hb) hb.click();
    var when = new Date(f[0]).toLocaleDateString('it-IT', {timeZone:'Europe/Rome', weekday:'short', day:'numeric', month:'short'});
    var txt = 'Prossima partita: ' + (home ? p.t + ' \u2013 ' + opp : opp + ' \u2013 ' + p.t) + ' \u00b7 ' + when + (isCup ? ' \u00b7 coppa europea' : '');
    if(!ok1) txt += ' \u00b7 squadra del giocatore non presente nel database';
    if(!ok) txt += ' \u00b7 avversaria non presente nel database';
    setNote(txt);
  }
  function lineSelect(){
    var inp = document.getElementById('lineValue'); if(!inp || document.getElementById('slbLineSel')) return;
    var sel = document.createElement('select'); sel.id = 'slbLineSel'; sel.className = inp.className;
    sel.innerHTML = '<option value="">\u2013 scegli \u2013</option>' + ['0.5', '1.5', '2.5', '3.5'].map(function(v){ return '<option value="' + v + '">' + v.replace('.', ',') + '</option>'; }).join('');
    sel.value = ['0.5', '1.5', '2.5', '3.5'].indexOf(inp.value) >= 0 ? inp.value : '';
    sel.addEventListener('change', function(){ inp.value = sel.value; inp.dispatchEvent(new Event('input', {bubbles:true})); });
    inp.style.display = 'none'; inp.parentNode.insertBefore(sel, inp);
  }
  function players(){
    lineSelect();
    var inp = document.getElementById('playerName'); if(!inp) return;
    inp.setAttribute('autocomplete', 'off'); inp.setAttribute('autocapitalize', 'off'); inp.setAttribute('spellcheck', 'false');
    var wrap = document.createElement('div'); wrap.className = 'cdd';
    inp.parentNode.insertBefore(wrap, inp); wrap.appendChild(inp);
    var panel = document.createElement('div'); panel.className = 'cdd-panel'; panel.hidden = true; wrap.appendChild(panel);
    var info = document.createElement('span'); info.className = 'hint'; info.id = 'slbPInfo'; wrap.appendChild(info);
    var mn = document.createElement('div'); mn.id = 'slbMNote';
    mn.style.cssText = 'color:#1F63E0;font-size:12.5px;margin-top:6px;font-weight:600;'; wrap.appendChild(mn);
    var hr = document.getElementById('hitRate5');
    if(hr){
      var note = document.createElement('div'); note.id = 'slbL5Note';
      note.style.cssText = 'color:#C98300;font-size:12.5px;margin-top:6px;';
      hr.parentNode.appendChild(note);
    }
    function show(){
      var q = norm(inp.value.trim());
      panel.innerHTML = '';
      if(q.length < 2){ panel.hidden = true; return; }
      if(!PDATA){ panel.appendChild(el('div', 'cdd-item dim', 'Caricamento giocatori\u2026')); panel.hidden = false; return; }
      if(!PDATA.length){ panel.appendChild(el('div', 'cdd-item dim', 'Database giocatori non ancora disponibile')); panel.hidden = false; return; }
      var toks = q.split(/\s+/), out = [];
      for(var i = 0; i < PDATA.length && out.length < 60; i++){
        var p = PDATA[i], ok = true;
        for(var j = 0; j < toks.length; j++){ if(p._k.indexOf(toks[j]) < 0 && p._t.indexOf(toks[j]) < 0){ ok = false; break; } }
        if(ok) out.push(p);
      }
      out.sort(function(a, b){ return (a._k.indexOf(q) === 0 ? 0 : 1) - (b._k.indexOf(q) === 0 ? 0 : 1); });
      if(!out.length){ panel.appendChild(el('div', 'cdd-item dim', 'Nessun giocatore trovato')); panel.hidden = false; return; }
      out.slice(0, 40).forEach(function(p){
        var d = el('div', 'cdd-item');
        var u = TEAM_LOGOS[p.t];
        if(u){ var im = el('img'); im.src = u; im.alt = ''; im.onerror = function(){ im.remove(); }; d.appendChild(im); }
        var t = el('span', '', p.n); d.appendChild(t);
        var tm = el('span', '', '\u00b7 ' + p.t); tm.style.cssText = 'color:var(--text-dim);font-size:13px;margin-left:auto;text-align:right;'; d.appendChild(tm);
        d.addEventListener('click', function(){
          PSEL = p; inp.value = p.n; panel.hidden = true; inp.blur();
          fillAvg(); fillTeams(p); fillOdds();
        });
        panel.appendChild(d);
      });
      panel.hidden = false;
    }
    inp.addEventListener('focus', function(){ loadPlayers().then(show); });
    inp.addEventListener('input', function(){
      if(PSEL && inp.value !== PSEL.n){ PSEL = null; info.textContent = ''; l5Note(null); setNote(''); }
      loadPlayers().then(show); show();
    });
    document.addEventListener('click', function(e){ if(!wrap.contains(e.target)) panel.hidden = true; });
    document.addEventListener('click', function(e){
      if(e.target.closest && e.target.closest('#shotTypeSeg')) setTimeout(function(){ fillAvg(); fillOdds(); }, 0);
      else if(e.target.closest && e.target.closest('#lineTypeSeg')) setTimeout(function(){ fillHit(); fillOdds(); }, 0);
    });
    var lv = document.getElementById('lineValue'); if(lv) lv.addEventListener('input', function(){ fillHit(); fillOdds(); });
  }
  var INFO_IDS = ['datasetInfo','playerTeamDatasetInfo','teamForDatasetInfo','teamOppDatasetInfo'];
  function fixInfo(el){
    if(!LAST || !el) return;
    var t = el.textContent;
    if(t.indexOf('Non ho ancora') === 0) return;
    var want = 'Ultimo aggiornamento: ' + LAST;
    if(t !== want) el.textContent = want;
  }
  function cleanup(){
    // descrizioni sotto i titoli
    Array.prototype.forEach.call(document.querySelectorAll('.panel > .sub'), function(p){
      if(/^(Il giocatore, la linea|Inserisci media tiri|Affidabilit\u00e0 = P|Seleziona campionato)/.test(p.textContent.trim())) p.style.display = 'none';
    });
    // etichetta "Sede" tolta
    ['homeAwaySeg','teamSedeSeg'].forEach(function(id){
      var seg = document.getElementById(id);
      var lb = seg && seg.parentNode.querySelector('label');
      if(lb) lb.style.display = 'none';
    });
    // etichette linea: Linea Tiri / Linea Tiri in Porta
    function lineLabels(){
      [['shotTypeSeg','lineValue'],['teamShotTypeSeg','teamLineValue']].forEach(function(p){
        var seg = document.getElementById(p[0]), lb = document.querySelector('label[for="' + p[1] + '"]');
        if(!seg || !lb) return;
        var a = seg.querySelector('button.active');
        var txt = a && a.dataset.val === 'sot' ? 'Linea Tiri in Porta' : 'Linea Tiri';
        if(lb.textContent !== txt) lb.textContent = txt;
      });
    }
    lineLabels();
    document.addEventListener('click', function(){ setTimeout(lineLabels, 0); });
    setInterval(lineLabels, 800);
    // piè di pagina "Bozza di lavoro"
    Array.prototype.forEach.call(document.querySelectorAll('footer'), function(f){ f.remove(); });
    // "Come viene calcolato" -> Linee guida
    var mv = document.createElement('div'); mv.id = 'slbMatch';
    mv.innerHTML = '<div class="mnote hist-note" style="margin:0 0 10px;"></div><div class="ang-days"></div><div class="mbody"></div>';
    document.querySelector('.wrap').appendChild(mv);
    var guide = document.createElement('div'); guide.id = 'slbGuide';
    document.querySelector('.wrap').appendChild(guide);
    var names = ['Calcolo giocatori', 'Calcolo tiri squadre'], n = 0;
    Array.prototype.slice.call(document.querySelectorAll('details.panel')).forEach(function(d){
      var h = d.querySelector('summary h2');
      if(!h || h.textContent.trim() !== 'Come viene calcolato') return;
      h.textContent = names[n++] || 'Calcolo';
      guide.appendChild(d);
    });
    // data ultimo aggiornamento
    INFO_IDS.forEach(function(id){
      var el = document.getElementById(id);
      if(el) new MutationObserver(function(){ fixInfo(el); }).observe(el, {childList:true, characterData:true, subtree:true});
    });
  }

  // animazione di apertura: il logo cade, si aggancia, va in alto a sinistra e il nome esce da dietro
  function splash(){
    var cov = function(){ var c = document.getElementById('slbCover'); if(c) c.remove(); };
    setTimeout(cov, 6000);
    var logoEl = document.getElementById('slbLogo'), nameEl = document.getElementById('slbName');
    var done = function(){
      logoEl.classList.remove('slb-hide'); nameEl.classList.remove('slb-hide');
      var s = document.getElementById('slbSplash'); if(s) s.remove();
      cov();
    };
    if(!logoEl.animate || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)){ done(); return; }
    var lr = logoEl.getBoundingClientRect(), nr = nameEl.getBoundingClientRect();
    var big = 150, W = window.innerWidth, H = window.innerHeight;
    var cx = (W - big) / 2, cy = (H - big) / 2 - 20;
    var ov = document.createElement('div'); ov.id = 'slbSplash';
    var sl = document.createElement('div'); sl.className = 'sl'; sl.style.width = sl.style.height = big + 'px'; sl.innerHTML = MARK;
    var nm = document.createElement('div'); nm.className = 'nm';
    nm.style.left = nr.left + 'px'; nm.style.top = nr.top + 'px'; nm.style.height = nr.height + 'px';
    nm.style.font = '800 24px Poppins,sans-serif'; nm.style.letterSpacing = '-.5px'; nm.style.lineHeight = '1';
    var word = 'ScalperLab', off = lr.width + 9;
    for(var k = 0; k < word.length; k++){
      var sp = document.createElement('span'); sp.textContent = word.charAt(k);
      sp.style.color = k >= 7 ? '#2F8DFF' : '#0B2A6B'; sp.style.opacity = '0'; nm.appendChild(sp);
    }
    ov.appendChild(nm); ov.appendChild(sl); document.body.appendChild(ov); cov();
    var EASE = 'cubic-bezier(.65,0,.2,1)';
    var A = function(el, kf, o){ return el.animate(kf, Object.assign({fill:'both'}, o)); };
    A(sl, [{opacity:0, transform:'translate(' + cx + 'px,' + (cy - 260) + 'px)'},
           {opacity:1, transform:'translate(' + cx + 'px,' + (cy + 26) + 'px)', offset:.55},
           {transform:'translate(' + cx + 'px,' + (cy - 16) + 'px)', offset:.78},
           {transform:'translate(' + cx + 'px,' + cy + 'px)'}], {duration:900, easing:'ease-in-out'});
    var tk = sl.querySelector('.slb-ticks');
    A(tk, [{transform:'rotate(0deg)', transformOrigin:'256px 256px'}, {transform:'rotate(90deg)', transformOrigin:'256px 256px'}], {delay:700, duration:700, easing:EASE});
    A(sl, [{transform:'translate(' + cx + 'px,' + cy + 'px) scale(1)'},
           {transform:'translate(' + lr.left + 'px,' + lr.top + 'px) scale(' + (lr.width / big) + ')'}], {delay:1600, duration:750, easing:EASE});
    Array.prototype.forEach.call(nm.children, function(s, i){
      A(s, [{transform:'translateX(-' + (off + i * 9) + 'px)', opacity:0}, {transform:'none', opacity:1}],
        {delay:2000 + i * 55, duration:500, easing:'cubic-bezier(.2,.9,.3,1.1)'});
    });
    setTimeout(done, 3300);
  }

  // --- dati e menu a tendina con stemmi ---
  var KEEP = ['', 'serie-a', 'premier-league', 'bundesliga', 'la-liga', 'ligue-1',
              'champions-league', 'europa-league', 'nazionali'];
  var LEAGUE_LOGOS = {}, TEAM_LOGOS = {};

  function data(){
    fetch('data.json?v=' + Date.now()).then(function(r){ return r.json(); }).then(function(j){
      var D = window.LEAGUE_DATA;
      var dd = new Date(j.updated_at);
      var when = dd.getDate() + ' ' + (function(m){ return m.charAt(0).toUpperCase() + m.slice(1); })(dd.toLocaleDateString('it-IT', {month:'long'}));
      LAST = when;
      var fmt = function(x){ return String(x).replace('.', ','); };
      Object.keys(j.leagues).forEach(function(k){
        var src = j.leagues[k];
        var old = D[k] || {};
        var h = src.handicap;               // 0,85 / 0,80 ...: tiri fatti x h, tiri subiti / h
        var teams = {};
        Object.keys(src.teams).forEach(function(n){
          var t = src.teams[n];
          teams[n] = h ? {totalFor:t.totalFor*h, totalAgainst:t.totalAgainst/h,
                          sotFor:t.sotFor*h, sotAgainst:t.sotAgainst/h}
                       : {totalFor:t.totalFor, totalAgainst:t.totalAgainst,
                          sotFor:t.sotFor, sotAgainst:t.sotAgainst};
        });
        var label = old.label || src.label || src.name;
        var e = {label: label, updated: when,
                 teams: teams};
        if(h){ e.avg = src.league_avg; }    // la media di riferimento resta quella reale, senza handicap
        else if(old.strength){ e.strength = old.strength; }
        if(old.cup) e.cup = true;
        D[k] = e;
        if(src.logo) LEAGUE_LOGOS[k] = src.logo;
        Object.keys(src.logos || {}).forEach(function(n){ TEAM_LOGOS[n] = src.logos[n]; });
      });
      INFO_IDS.forEach(function(id){ fixInfo(document.getElementById(id)); });
      dropdowns();
    }).catch(function(){ dropdowns(); });
  }

  function dropdowns(){
    var leagueIds = ['oppLeague','playerLeague','teamForLeague','teamOppLeague'];
    var teamIds = ['oppTeam','playerTeam','teamForTeam','teamOppTeam'];
    leagueIds.forEach(function(id){
      var s = document.getElementById(id);
      if(!s) return;
      Array.prototype.slice.call(s.options).forEach(function(o){
        if(KEEP.indexOf(o.value) < 0) o.remove();
      });
    });
    var st = document.createElement('style');
    st.textContent =
      '.cdd{position:relative;}' +
      '.cdd-btn{width:100%;display:flex;align-items:center;gap:10px;text-align:left;cursor:pointer;' +
        'background:var(--panel-2);color:var(--text);border:1px solid var(--line);' +
        'border-radius:10px;padding:12px 14px;font:inherit;}' +
      '.cdd-btn .cdd-arrow{margin-left:auto;opacity:.6;font-size:12px;}' +
      '.cdd-panel{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:60;max-height:55vh;overflow:auto;' +
        'background:#fff;border:1px solid var(--line);border-radius:12px;' +
        'box-shadow:0 12px 32px rgba(11,42,107,.18);-webkit-overflow-scrolling:touch;}' +
      '.cdd-item{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;color:var(--text);}' +
      '.cdd-item:active{background:var(--panel-2);}' +
      '.cdd-item.dim{color:var(--text-dim);}' +
      '.cdd-item.sel{background:#E6F0FF;color:#1F63E0;}' +
      '.cdd-search{width:100%;box-sizing:border-box;padding:11px 14px;border:0;border-bottom:1px solid var(--line);' +
        'background:#fff;color:var(--text);font:inherit;outline:none;position:sticky;top:0;}' +
      '.cdd img{width:22px;height:22px;object-fit:contain;flex:0 0 auto;}';
    document.head.appendChild(st);

    var openPanel = null;
    document.addEventListener('click', function(e){
      if(openPanel && !openPanel.parentNode.contains(e.target)){ openPanel.hidden = true; openPanel = null; }
    });
    function logoOf(kind, value){ return kind === 'league' ? LEAGUE_LOGOS[value] : TEAM_LOGOS[value]; }
    function row(kind, opt, cls){
      var d = document.createElement('div');
      d.className = 'cdd-item' + (cls ? ' ' + cls : '');
      var u = opt.value ? logoOf(kind, opt.value) : null;
      if(u){
        var im = document.createElement('img'); im.src = u; im.alt = ''; im.loading = 'lazy';
        im.onerror = function(){ im.remove(); };
        d.appendChild(im);
      }
      var sp = document.createElement('span'); sp.textContent = opt.textContent; d.appendChild(sp);
      return d;
    }
    function enhance(sel, kind){
      if(!sel || sel.dataset.enh) return;
      sel.dataset.enh = '1';
      var wrap = document.createElement('div'); wrap.className = 'cdd';
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'cdd-btn';
      var panel = document.createElement('div'); panel.className = 'cdd-panel'; panel.hidden = true;
      var search = null;
      if(kind === 'team'){
        search = document.createElement('input'); search.type = 'search';
        search.placeholder = 'Cerca squadra…'; search.className = 'cdd-search';
        panel.appendChild(search);
      }
      var list = document.createElement('div'); panel.appendChild(list);
      sel.parentNode.insertBefore(wrap, sel);
      wrap.appendChild(btn); wrap.appendChild(panel);
      sel.style.display = 'none';
      var last = null;
      function refresh(){
        var q = search ? search.value.trim().toLowerCase() : '';
        list.innerHTML = '';
        Array.prototype.slice.call(sel.options).forEach(function(o){
          if(q && o.value && o.textContent.toLowerCase().indexOf(q) < 0) return;
          if(q && !o.value) return;
          var r = row(kind, o, (o.value ? '' : 'dim') + (o.value === sel.value && o.value ? ' sel' : ''));
          r.addEventListener('click', function(){
            sel.value = o.value;
            sel.dispatchEvent(new Event('change', {bubbles:true}));
            panel.hidden = true; openPanel = null; if(search) search.value = '';
            refresh();
          });
          list.appendChild(r);
        });
        var cur = sel.options[sel.selectedIndex];
        btn.innerHTML = '';
        if(cur){
          var u = cur.value ? logoOf(kind, cur.value) : null;
          if(u){ var im = document.createElement('img'); im.src = u; im.alt = ''; im.onerror = function(){ im.remove(); }; btn.appendChild(im); }
          var sp = document.createElement('span'); sp.textContent = cur.textContent; btn.appendChild(sp);
        }
        var ar = document.createElement('span'); ar.className = 'cdd-arrow'; ar.textContent = '▾'; btn.appendChild(ar);
        last = sel.value + '|' + sel.options.length;
      }
      btn.addEventListener('click', function(){
        if(panel.hidden){
          if(openPanel) openPanel.hidden = true;
          refresh(); panel.hidden = false; openPanel = panel;
        } else { panel.hidden = true; openPanel = null; }
      });
      if(search) search.addEventListener('input', refresh);
      new MutationObserver(refresh).observe(sel, {childList:true});
      setInterval(function(){ if(last !== sel.value + '|' + sel.options.length) refresh(); }, 500);
      refresh();
    }
    leagueIds.forEach(function(id){ enhance(document.getElementById(id), 'league'); });
    teamIds.forEach(function(id){ enhance(document.getElementById(id), 'team'); });
  }

  shell();
  data();
}
(async function(){
  var ICON = 'data:image/png;base64,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';
  try{
    var r = await fetch('app.html?v=' + Date.now());
    if(!r.ok) throw new Error('app.html non trovato');
    var html = await r.text();
    if(html.indexOf('const LEAGUE_DATA = {') < 0) throw new Error('struttura dell\'app cambiata');
    html = html.replace('const LEAGUE_DATA = {', 'const LEAGUE_DATA = window.LEAGUE_DATA = {');
    var SWAP = [['Nessun effetto', 'Campo Neutro'], ['Valore linea (tiri)', 'Linea Tiri'],
                ['Giocatore \u2014 medie per competizione', 'Medie Tiri Giocatore'],
                ['Facoltativo: scrivi i valori partita per partita separati da trattini. Il calcolatore fa la media e la unisce alla media stagionale.', '']];
    SWAP.forEach(function(p){ html = html.split(p[0]).join(p[1]); });
    html = html.replace(/(<input[^>]*?) placeholder="[^"]*"/g, '$1');
    html = html.replace(/<title>[^<]*<\/title>/, '<title>ScalperLab</title>');
    html = html.replace('</head>', function(){ return '<style>html,body{background:#fff !important}#slbCover{position:fixed;inset:0;background:#fff;z-index:99999}</style><meta name="theme-color" content="#ffffff"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="ScalperLab"><link rel="apple-touch-icon" href="' + ICON + '"><link rel="icon" href="' + ICON + '" type="image/png"></head>'; });
    html = html.replace(/<body[^>]*>/i, function(m){ return m + '<div id="slbCover"></div>'; });
    html = html.replace('</body>', function(){ return '<script>(' + loader.toString() + ')();<\/script></body>'; });
    document.open(); document.write(html); document.close();
  }catch(e){ document.body.textContent = 'Errore: ' + e.message; }
})();

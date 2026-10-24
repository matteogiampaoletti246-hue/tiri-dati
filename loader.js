function loader(){
  var MARK = '<svg viewBox="0 0 512 512"><circle cx="256" cy="256" r="196" fill="#fff"/>'
    + '<circle cx="256" cy="256" r="170" fill="none" stroke="#8CCBFF" stroke-width="28"/>'
    + '<circle cx="256" cy="256" r="108" fill="none" stroke="#1F63E0" stroke-width="28"/>'
    + '<circle cx="256" cy="256" r="42" fill="#1F63E0"/>'
    + '<g class="slb-ticks" stroke="#0B2A6B" stroke-width="20" stroke-linecap="round"><path d="M256 40v76M256 396v76M40 256h76M396 256h76"/></g></svg>';
  var IC = {
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2.8" width="14" height="18.4" rx="2.6"/><rect x="8" y="5.8" width="8" height="3.4" rx=".8"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/></svg>',
    ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.6l3.6 2.6-1.4 4.2H9.8l-1.4-4.2z"/><path d="M12 7.6V3.2M15.6 10.2l4.1-1.3M14.2 14.4l2.5 3.4M9.8 14.4l-2.5 3.4M8.4 10.2L4.3 8.9"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.6A8.2 8.2 0 0 1 9.4 4a8.2 8.2 0 1 0 10.6 10.6z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17a8.5 8.5 0 0 0 0-17z" fill="currentColor"/></svg>',
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
    {id:'home',    label:'Partite',       ic:'ball',   match:'home'},
    {id:'players', label:'Calcolatore di Affidabilità', ic:'calc', val:'player'},
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
        'margin:0 calc(-1*max(16px,env(safe-area-inset-right,0px))) 6px calc(-1*max(16px,env(safe-area-inset-left,0px)));' +
        'padding:7px max(16px,env(safe-area-inset-right,0px)) 7px max(16px,env(safe-area-inset-left,0px));' +
        'background:rgba(255,255,255,.94);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);}' +
      '#slbLogo{width:28px;height:28px;flex:0 0 auto;display:block;}#slbLogo svg{width:100%;height:100%;display:block;}' +
      '#slbName{font-family:Poppins,sans-serif;font-weight:800;font-size:20px;letter-spacing:-.5px;color:#0B2A6B;line-height:1;white-space:nowrap;}' +
      '#slbName b{color:#2F8DFF;font-weight:800;}' +
      '.slb-hide{visibility:hidden;}' +
      '#slbBurger{width:38px;height:38px;border-radius:0;border:0;background:transparent;color:#0B2A6B;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}' +
      '#slbBurger svg{width:24px;height:24px;}#slbSearchBtn{margin-left:auto;width:38px;height:38px;border:0;background:transparent;color:#0B2A6B;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;}#slbSearchBtn svg{width:22px;height:22px;}' +
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
    themeCSS(); document.documentElement.setAttribute('data-theme', themeNow());
    document.title = 'ScalperLab';

    // barra in alto
    var bar = document.createElement('div'); bar.className = 'slb-bar';
    bar.innerHTML = '<span id="slbLogo" class="slb-hide">' + MARK + '</span><span id="slbName" class="slb-hide">Scalper<b>Lab</b></span>' +
      '<button id="slbBurger" type="button" aria-label="Menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>';
    document.body.insertBefore(bar, document.body.firstChild);
    searchSetup(bar);

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
    themeSetup(menu);
    document.body.appendChild(scrim); document.body.appendChild(menu);
    function openMenu(o){ document.body.classList.toggle('slb-open', o); }
    document.getElementById('slbBurger').addEventListener('click', function(){ openMenu(true); });
    scrim.addEventListener('click', function(){ openMenu(false); });
    document.getElementById('slbClose').addEventListener('click', function(){ openMenu(false); });

    function go(id){
      var v = VIEWS.filter(function(x){ return x.id === id; })[0]; if(!v) return;
      var cl = document.body.classList;
      cl.toggle('slb-home', id === 'home'); cl.toggle('slb-guide', !!v.guide); cl.toggle('slb-match', !!v.match); cl.toggle('slb-alt', !!(v.guide || v.match));
      var btn = document.querySelector('#viewSeg button[data-val="' + (v.val || 'player') + '"]');
      if(btn) btn.click();
      title.innerHTML = IC[v.ic] + '<span>' + v.label + '</span>';
      Array.prototype.forEach.call(menu.querySelectorAll('.slb-item'), function(b){ b.classList.toggle('on', b.dataset.id === id); });
      if(v.match){ if(v.sub){ sub.classList.add('open'); mm.classList.add('openp'); } renderMatch(v.match); }
      openMenu(false);
      window.scrollTo(0, 0);
    }
    GOFN = go;
    go('home');

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
    document.body.classList.remove('pinon');
    var root = document.getElementById('slbMatch'); if(!root) return;
    var days = root.querySelector('.ang-days'), body = root.querySelector('.mbody'), note = root.querySelector('.mnote');
    days.innerHTML = ''; days.className = 'ang-days'; body.innerHTML = ''; days.style.display = '';
    if(MCAT === 'home'){ drawHome(days, body, note); runAnim(body); return; }
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
  // --- tema Light / Night e stile delle pagine partita ---
  function themeCSS(){
    var st = document.createElement('style'); st.id = 'slbThemeCSS';
    st.textContent = `
html:root{--ink:#0B2A6B;--hl:rgba(31,99,224,.10);--hero:linear-gradient(180deg,#0B2A6B,#1F63E0);--bar:rgba(255,255,255,.94);--pitch:#2F8F5B;--pitch2:#2A8452;}
html[data-theme="night"]:root{--bg:#0E1526;--panel:#151F38;--panel-2:#1B2748;--line:#26335A;--text:#EAF0FF;--text-dim:#8FA3CE;
  --accent:#4C9BFF;--accent-dim:#1F3A73;--red:#FF6B57;--amber:#F0B44A;--green:#3DDC97;--gold:#F2C230;--gold-dim:rgba(242,194,48,.16);
  --ink:#FFFFFF;--hl:rgba(76,155,255,.22);--hero:radial-gradient(120% 100% at 50% 0%,#24407F,#0E1526);--bar:rgba(14,21,38,.94);--pitch:#1F6B45;--pitch2:#1B613F;color-scheme:dark;}
html[data-theme="night"],html[data-theme="night"] body{background:var(--bg) !important;}
html[data-theme="night"] .slb-bar{background:var(--bar);}
html[data-theme="night"] #slbName{color:#fff;}html[data-theme="night"] #slbName b{color:#4C9BFF;}
html[data-theme="night"] #slbBurger{background:var(--panel);color:#fff;}
html[data-theme="night"] #slbTitle{color:#fff;}html[data-theme="night"] #slbTitle svg,html[data-theme="night"] .slb-item svg{color:#4C9BFF;}
html[data-theme="night"] #slbMenu{background:var(--panel);}html[data-theme="night"] #slbMenu .mh{color:#fff;}
html[data-theme="night"] .slb-item{color:var(--text);}html[data-theme="night"] .slb-item.on{background:#1F3A73;color:#fff;}
html[data-theme="night"] .slb-item:active{background:var(--panel-2);}
html[data-theme="night"] #slbSplash{background:var(--bg);}
html[data-theme="night"] #slbLogo svg circle:first-child,html[data-theme="night"] #slbSplash svg circle:first-child{fill:#151F38;}
html[data-theme="night"] .slb-ticks{stroke:#fff;}
html[data-theme="night"] .cdd-panel,html[data-theme="night"] .cdd-search{background:var(--panel) !important;}
html[data-theme="night"] .cdd-item.sel{background:#1F3A73;color:#fff;}
html[data-theme="night"] body.slb-open #slbMenu{box-shadow:-12px 0 40px rgba(0,0,0,.5);}
#slbTheme{margin-top:auto;padding:14px 6px 4px;border-top:1px solid var(--line);}
#slbTheme .tl{font-family:Poppins,sans-serif;font-weight:600;font-size:13px;color:var(--text-dim);margin:0 6px 8px;}
#slbTheme .tg{display:flex;gap:4px;background:var(--panel-2);border-radius:14px;padding:4px;}
#slbTheme button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;border:0;background:transparent;color:var(--text-dim);border-radius:11px;padding:10px 4px;font-family:Poppins,sans-serif;font-weight:600;font-size:13px;cursor:pointer;}
#slbTheme button svg{width:17px;height:17px;}
#slbTheme button.on{background:var(--panel);color:var(--accent);box-shadow:0 1px 4px rgba(11,42,107,.15);}
html[data-theme="night"] #slbTheme button.on{background:var(--accent-dim);color:#fff;box-shadow:none;}
.hcr{display:inline-flex;align-items:center;justify-content:center;flex:none;overflow:hidden;font-weight:800;color:var(--accent);}
.hcr img{width:100%;height:100%;object-fit:contain;}
.hlg{background:var(--panel);border:1px solid var(--line);border-radius:16px;margin-bottom:12px;overflow:hidden;}
.hlgh{display:flex;align-items:center;gap:8px;padding:12px 16px 8px;font-family:Poppins,sans-serif;font-weight:700;font-size:14px;color:var(--ink);}
.hlgh img{width:20px;height:20px;object-fit:contain;}
.pfc{width:40px;height:40px;border-radius:50%;overflow:hidden;flex:none;display:flex;align-items:center;justify-content:center;background:var(--panel-2);color:var(--accent);font-weight:800;font-size:13px;}.pfc img{width:100%;height:100%;object-fit:cover;object-position:50% 15%;}.hpc .mid b .hcr{vertical-align:-2px;}
.htabs.sc{overflow-x:auto;scrollbar-width:none;}.htabs.sc::-webkit-scrollbar{display:none;}.htabs.sc button{flex:none;padding:11px 14px;}
.htm{display:flex;align-items:center;gap:14px;padding:10px 4px 6px;}.htm .htn{font-family:Poppins,sans-serif;font-weight:800;font-size:22px;line-height:1.15;}.htm .sm{margin-top:3px;}.htm .hcr{filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));}.hlgo{width:46px;height:46px;object-fit:contain;background:#fff;border-radius:12px;padding:5px;}
.hhero .tap{cursor:pointer;text-decoration:underline;text-decoration-color:rgba(255,255,255,.35);text-underline-offset:3px;}
.hfm{display:flex;gap:4px;justify-content:flex-end;}.hfm i{width:22px;height:22px;border-radius:6px;color:#fff;font-style:normal;font-weight:800;font-size:11.5px;display:flex;align-items:center;justify-content:center;}.hfm i.e{background:var(--panel-2);}
.htab.hfr,.htr.hfr{grid-template-columns:28px 1fr auto;}
.hrs{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid var(--line);font-size:14px;}.hrs.tap{cursor:pointer;}.hrs .dt{width:42px;color:var(--text-dim);font-size:12.5px;font-weight:600;font-variant-numeric:tabular-nums;}.hrs .op{flex:1;min-width:0;display:flex;align-items:center;gap:9px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.hrs .sc2{font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink);}
.vps{width:24px;height:24px;border-radius:7px;color:#fff;font-style:normal;font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;}
.hrs.hlr{background:var(--hl);}.hrs .lvr{color:#E5322D;font-weight:800;}.hrs .dt.lvr{font-size:11.5px;}
.hhd{display:flex;padding:2px 18px 4px;font-size:11.5px;color:var(--text-dim);font-weight:600;}.hhd span{width:78px;text-align:right;}.hhd span:first-child{flex:1;width:auto;}
.hr2{display:flex;align-items:center;padding:11px 18px;border-top:1px solid var(--line);font-size:14.5px;}.hr2 .l{flex:1;color:var(--text-dim);}.hr2 b{width:78px;text-align:right;font-variant-numeric:tabular-nums;color:var(--ink);}.hr2 b.g{color:var(--text-dim);font-weight:600;}
.hhd.t4 span{width:84px;text-align:center;}.hhd.t4 span:first-child{flex:1;width:auto;text-align:left;}.hr2.t4 b{display:block;width:84px;text-align:center;}.hr2.t4{padding:12px 18px;}.hr2.t4 .l{align-self:center;}.hr2.t4 b .tv{display:block;font-size:16px;font-weight:800;font-variant-numeric:tabular-nums;}.hr2.t4 b small{display:block;margin-top:3px;color:var(--text-dim);font-weight:700;font-size:11px;}.tbar{display:block;height:4px;border-radius:2px;background:var(--line);margin:6px 10px 0;overflow:hidden;}.tbar u{display:block;height:100%;border-radius:2px;text-decoration:none;}
.hch{display:flex;align-items:center;justify-content:space-between;width:100%;border:0;background:transparent;font-family:Poppins,sans-serif;font-weight:700;font-size:14px;color:var(--ink);padding:10px 18px;cursor:pointer;}.hch .chev2{color:var(--text-dim);font-size:22px;}
.hpl{display:flex;align-items:center;gap:12px;width:100%;border:0;border-top:1px solid var(--line);background:transparent;color:var(--text);padding:9px 16px;text-align:left;cursor:pointer;font:inherit;}.hpl .rk{width:18px;color:var(--text-dim);font-weight:700;font-size:13px;}.hpl .mid{flex:1;min-width:0;display:flex;flex-direction:column;}.hpl .mid b{font-size:14.5px;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.hpl .mid small{color:var(--text-dim);font-size:12px;}.hpl .val{font-weight:800;font-size:16px;color:var(--ink);font-variant-numeric:tabular-nums;}.hpl .hcr{vertical-align:-3px;}
.hdh{display:flex;align-items:center;gap:12px;margin-bottom:12px;}.hdh .hback{background:var(--panel-2);color:var(--ink);}.hdt{font-family:Poppins,sans-serif;font-weight:700;font-size:17px;color:var(--ink);}
.hpf{display:block;margin:0 auto 6px;width:96px;height:96px;overflow:hidden;}.hpf img{width:100%;height:100%;object-fit:cover;object-position:50% 12%;}
.hpn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;}.hhero .tn .hpn .hcr{margin:0;}.hpf{border-radius:18px;}.hhero .hcr{color:#fff;}
.hrow{display:flex;align-items:center;width:100%;text-align:left;border:0;border-top:1px solid var(--line);background:transparent;color:var(--text);padding:10px 16px;cursor:pointer;font:inherit;}
.hrow:active{background:var(--panel-2);}
.hrow .tm{width:50px;font-size:13px;color:var(--text-dim);font-weight:600;font-variant-numeric:tabular-nums;}
.hrow .tms{flex:1;min-width:0;}
.hrow .tms div{display:flex;align-items:center;gap:9px;font-weight:600;font-size:14.5px;line-height:30px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hrow .chev2{color:var(--text-dim);font-size:22px;margin-left:8px;}
.hhero{background:var(--hero);color:#fff;border-radius:18px;padding:14px 14px 0;margin-bottom:12px;overflow:hidden;}
.hback{border:0;background:rgba(255,255,255,.16);color:#fff;width:34px;height:34px;border-radius:50%;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}
.hhero.hg .tt{align-items:flex-start;}.hhero.hg .tt>div:nth-child(2){margin-top:8px;}.hhero .hgl{margin-top:6px;font-size:12px;font-weight:600;line-height:1.35;opacity:.92;}.hhero .hgl div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.hhero .tt{display:flex;justify-content:space-between;align-items:center;text-align:center;padding:4px 4px 0;}
.hhero.mst{position:sticky;z-index:41;margin-bottom:12px;}.hhero.mst.stuck{border-radius:0;box-shadow:0 2px 8px rgba(0,0,0,.14);}body.pinon #slbMatch{touch-action:none;}body.pinon #slbMatch .hpin{touch-action:pan-y;}body.pinon #slbMatch .htabs.sc,body.pinon #slbMatch .hpills{touch-action:pan-x;}.hhero .mnl{position:relative;height:34px;display:flex;align-items:center;justify-content:center;margin-top:2px;}.hhero .mnl .mbk{position:absolute;left:0;top:50%;margin-top:-17px;opacity:0;pointer-events:none;width:34px;height:34px;border:0;background:transparent;color:#fff;font-size:26px;line-height:1;cursor:pointer;}.hhero .mnl .mtx{font-size:13px;font-weight:700;opacity:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:78%;}.hhero.stuck .mnl .mtx{opacity:1;}.hhero.stuck .mnl .mbk{opacity:1;pointer-events:auto;}.hhero .tn{width:34%;font-weight:700;font-size:14px;line-height:1.2;}
.hhero .tn .hcr{margin:0 auto 8px;display:flex;filter:drop-shadow(0 2px 4px rgba(0,0,0,.35));}
.hhero .ko{font-family:Poppins,sans-serif;font-weight:800;font-size:26px;}
.hhero .sm{font-size:12px;opacity:.78;margin-top:2px;}
.htabs{display:flex;margin-top:6px;gap:0;}
.htabs button{flex:1;border:0;background:transparent;color:rgba(255,255,255,.65);padding:11px 2px;font-family:Poppins,sans-serif;font-weight:600;font-size:12.5px;border-bottom:3px solid transparent;cursor:pointer;white-space:nowrap;}
.htabs button.on{color:#fff;border-color:#fff;}
.hcard{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:8px 0;margin-bottom:12px;}
.hsec{font-family:Poppins,sans-serif;font-weight:700;font-size:13.5px;color:var(--ink);padding:10px 18px 2px;}
.hst{padding:9px 18px;}
.hst .v{display:flex;justify-content:space-between;align-items:baseline;font-size:15px;font-variant-numeric:tabular-nums;}
.hst .v span{color:var(--text-dim);font-size:12.5px;font-weight:500;}
.hst .v b{font-weight:500;color:var(--text-dim);}.hst .v b.w{font-weight:800;color:var(--ink);}
.hbar{display:flex;gap:4px;margin-top:6px;height:5px;}.hbar i,.hbar u{display:block;border-radius:3px;background:var(--line);}.hbar u{flex:1;}.hbar i.hw,.hbar u.aw{background:var(--accent);}
.hpills{display:flex;gap:8px;margin:2px 0 12px;}
.hpill{border:0;background:var(--panel-2);color:var(--text-dim);padding:8px 14px;border-radius:999px;font-family:Poppins,sans-serif;font-weight:600;font-size:13px;cursor:pointer;}
.hpill.on{background:var(--ink);color:var(--bg);}
html:not([data-theme="night"]) .hpill.on{color:#fff;}
.htab,.htr{display:grid;grid-template-columns:28px 1fr 34px 40px 36px;align-items:center;gap:2px;padding:8px 14px;font-size:13px;font-variant-numeric:tabular-nums;}
.htab{color:var(--text-dim);font-weight:600;font-size:11.5px;}
.htr{margin:0 6px;border-radius:10px;font-weight:500;}.htr.hl{background:var(--hl);}.htr b{font-weight:800;color:var(--ink);}
.htr .nm{display:flex;align-items:center;gap:9px;min-width:0;}.htr .nm span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hsw{display:flex;gap:8px;margin-bottom:12px;}
.hsw button{flex:1;display:flex;align-items:center;justify-content:center;gap:8px;border:1px solid var(--line);background:var(--panel);color:var(--text);padding:10px 6px;border-radius:12px;font-family:Poppins,sans-serif;font-weight:600;font-size:13px;cursor:pointer;}
.hsw button.on{border-color:var(--accent);background:var(--hl);color:var(--ink);}
html[data-theme="night"] img[data-tone="dark"]{filter:brightness(0) invert(1);}html[data-theme="night"] img[data-tone="mix"]{filter:invert(1) hue-rotate(180deg) brightness(1.1);}html[data-theme="night"] .hcr img[data-ct="dark"]{filter:drop-shadow(0 0 .7px #fff) drop-shadow(0 0 .7px #fff) drop-shadow(0 0 .5px #fff);}
html:not([data-theme="night"]) img[data-tone="light"]{filter:brightness(0);}
.hlgo{background:none !important;padding:0 !important;border-radius:0 !important;width:56px !important;height:56px !important;filter:none !important;}
.hhero.hlt{background:var(--hlt) !important;color:var(--hltx) !important;}
.hhero.hlt .hback{background:rgba(0,0,0,.08);color:var(--hltx);}
.hhero.hlt .htabs button{color:var(--hltx);opacity:.6;}.hhero.hlt .htabs button.on{opacity:1;border-color:var(--hltx);}
.hlg,.hcard,.hpc,.hpitch,.htr,.hgrid div,.hbtn,.hbench button,.hsw button,#slbMatch .ang-day,#slbMatch .play-card{border-radius:0 !important;}

.hpitch{position:relative;width:100%;aspect-ratio:68/100;border-radius:16px;overflow:hidden;background:repeating-linear-gradient(180deg,var(--pitch) 0,var(--pitch) 10%,var(--pitch2) 10%,var(--pitch2) 20%);margin-bottom:12px;}
.hpitch svg.ln{position:absolute;inset:0;width:100%;height:100%;}
.hp{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;width:84px;border:0;background:transparent;padding:0;cursor:pointer;color:#fff;}
.hp .fc{position:relative;width:44px;height:44px;border-radius:50%;overflow:hidden;background:#fff;color:#0B2A6B;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);}.hp .fc img{width:100%;height:100%;object-fit:cover;object-position:50% 15%;}
.hp .cp2{position:absolute;left:8px;top:-3px;width:15px;height:15px;border-radius:50%;background:#F2C230;color:#241800;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;z-index:2;}
.hp .vb{position:absolute;right:11px;top:29px;width:25px;height:25px;border-radius:50%;border:2px solid #fff;font-size:10px;font-weight:800;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,.35);z-index:2;}
.hp .vb.nd{width:auto;min-width:25px;height:17px;border-radius:9px;padding:0 4px;font-size:8px;top:34px;right:6px;background:#8E98AB;}
.mbody,#slbMatch{overflow-x:visible;}
.hp .nb{position:relative;width:36px;height:36px;border-radius:50%;background:#fff;color:#0B2A6B;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.3);}
.hp .nb .hv{position:absolute;right:-9px;bottom:-5px;min-width:22px;height:17px;border-radius:9px;background:#3C527F;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center;padding:0 4px;border:1.5px solid #fff;}
.hp .nb .hv.g{background:#E5A800;color:#241800;}
.hp .nb .cp{position:absolute;left:-6px;top:-4px;width:15px;height:15px;border-radius:50%;background:#F2C230;color:#241800;font-size:9px;font-weight:800;display:flex;align-items:center;justify-content:center;}
.hp .pn{margin-top:12px;font-size:11.5px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,.65);white-space:nowrap;max-width:80px;overflow:hidden;text-overflow:ellipsis;}
.hbp .bic{margin-left:auto;display:flex;align-items:center;gap:3px;flex:none;}.hbp .bic b{font:800 11px Poppins,sans-serif;color:var(--text);margin-left:-1px;}.hbg{display:grid;grid-template-columns:1fr 1fr;gap:0 10px;padding:0 14px 12px;}.hbp{display:flex;align-items:center;gap:8px;background:none;border:0;border-bottom:1px solid var(--line);padding:7px 0;color:var(--text);font:inherit;text-align:left;cursor:pointer;min-width:0;}.hbp .pfc{width:30px;height:30px;font-size:10px;flex:0 0 auto;}.hbp .bn{color:var(--text-dim);font-weight:700;font-size:13px;width:22px;}.hbp .bm{font-weight:600;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hbench{display:flex;flex-wrap:wrap;gap:6px;padding:6px 14px 12px;}
.hbench button{border:1px solid var(--line);background:var(--panel-2);color:var(--text);border-radius:9px;padding:6px 10px;font-size:12.5px;cursor:pointer;font-family:inherit;}
.hbench button b{color:var(--text-dim);margin-right:6px;font-variant-numeric:tabular-nums;}
.htag{display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:999px;background:var(--hl);color:var(--ink);margin-left:8px;vertical-align:2px;}
.hpc{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:16px;padding:12px 14px;margin-bottom:10px;cursor:pointer;font:inherit;}
.hpc .rk{width:24px;font-weight:700;color:var(--text-dim);font-variant-numeric:tabular-nums;}
.hpc .mid{flex:1;min-width:0;}.hpc .mid b{display:block;font-size:15px;color:var(--ink);}.hpc .mid small{color:var(--text-dim);font-size:12.5px;}
.hpc .vt{font-weight:800;font-size:15px;color:var(--gold);border:1px solid var(--gold);border-radius:8px;padding:4px 8px;font-variant-numeric:tabular-nums;}
.hgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:6px 14px 12px;}
.hgrid div{background:var(--panel-2);border-radius:12px;padding:10px 6px;text-align:center;}
.hgrid b{display:block;font-family:Poppins,sans-serif;font-size:17px;color:var(--ink);font-variant-numeric:tabular-nums;}.hgrid small{color:var(--text-dim);font-size:11.5px;}
.hbtn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;border:0;background:var(--accent);color:#fff;border-radius:14px;padding:14px;font-family:Poppins,sans-serif;font-weight:700;font-size:15px;cursor:pointer;margin:4px 0 14px;}
.hbtn svg{width:22px;height:22px;}
.hstory{overflow:hidden !important;padding-bottom:16px;cursor:pointer;user-select:none;-webkit-user-select:none;}
.hsbars{display:flex;gap:4px;padding:2px 14px 12px;}.hsbars i{flex:1;height:3px;background:var(--line);overflow:hidden;display:block;}.hsbars u{display:block;height:100%;width:0;background:var(--accent);}
.hsbody{text-align:left;padding:6px 18px 4px;position:relative;min-height:190px;}.hsbg{position:absolute !important;right:-24px;top:14px;opacity:.2;pointer-events:none;filter:none;}.hsbody>*{position:relative;}.hsbody>.hsbg{position:absolute;}.hst{font-weight:800;font-size:17px;}
.hsv{font-size:52px;font-weight:800;line-height:1.1;margin-top:10px;color:var(--text);}.hsl{color:var(--text-dim);font-size:14px;margin-top:2px;}
.hsr{display:inline-block;margin-top:12px;padding:6px 14px;font-weight:800;font-size:14px;color:#fff;}.hsr.u{background:#1E8E3E;}.hsr.d{background:#D93A3A;}
.hr2.t2 b{width:auto;}
body.slb-home #slbTitle{display:none;}
html[data-theme="night"] #slbSearchBtn,html[data-theme="night"] #slbBurger{color:#fff;background:transparent !important;}
.hdates{display:flex !important;align-items:center;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--line);margin:0 -16px 12px !important;padding:0 8px 0 0 !important;gap:0 !important;}
.hdates::-webkit-scrollbar{display:none;}
.hdates button{flex:0 0 auto;padding:11px 11px 9px;background:none;border:0;border-bottom:3px solid transparent;color:var(--text-dim);font:700 14px Poppins,sans-serif;cursor:pointer;white-space:nowrap;}
.hdates button.on{color:var(--text);border-bottom-color:var(--accent);}
.hdates .hcal{position:sticky;left:0;z-index:2;background:var(--bg);border-right:1px solid var(--line);padding:8px 14px 8px 16px;margin-right:4px;color:var(--text);}.hdates .hcal svg{width:20px;height:20px;display:block;}
.hdates .hcal input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer;}
.hrow .hsc{margin-left:auto;display:flex;flex-direction:column;gap:13px;font-weight:800;font-size:15px;text-align:right;min-width:20px;padding-right:6px;}
#slbSearch{position:fixed;inset:0;z-index:120;background:var(--bg);display:none;flex-direction:column;}
#slbSearch.on{display:flex;}
#slbSearch .sb{display:flex;align-items:center;gap:8px;padding:10px 14px;border-bottom:1px solid var(--line);}
#slbSearch input{flex:1;font:600 16px Poppins,sans-serif;padding:11px 12px;border:1px solid var(--line);background:var(--panel);color:var(--text);outline:none;border-radius:0;}
#slbSearch .sx{background:none;border:0;color:var(--text);font-size:26px;cursor:pointer;padding:0 6px;}
#slbSearch .sr{overflow:auto;flex:1;padding-bottom:40px;}
#slbSearch .sh{padding:14px 16px 6px;font:700 12px Poppins,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:var(--text-dim);}
#slbSearch .si{display:flex;align-items:center;gap:12px;width:100%;padding:11px 16px;background:none;border:0;border-bottom:1px solid var(--line);color:var(--text);font:600 15px Poppins,sans-serif;text-align:left;cursor:pointer;}
#slbSearch .sface{width:34px;height:34px;border-radius:50%;overflow:hidden;background:var(--panel-2);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex:0 0 auto;}#slbSearch .sface img{width:100%;height:100%;object-fit:cover;}
#slbSearch .si small{display:block;color:var(--text-dim);font-weight:500;font-size:12px;}
.hhero.hlt{position:relative;overflow:hidden;border-radius:0 !important;margin-left:calc(50% - 50vw) !important;margin-right:calc(50% - 50vw) !important;width:100vw;max-width:100vw;box-sizing:border-box;margin-top:-6px !important;padding-left:16px;padding-right:16px;}
.hhero.hlt .hlbg{position:absolute;right:-18px;top:6px;width:170px;height:170px;object-fit:contain;opacity:.16;pointer-events:none;}
.hhero.hlt>*{position:relative;}.hhero.hlt .hlbg{position:absolute;}
.mbody{overflow:visible !important;}html,body{overflow-x:clip;}
.hyc{display:inline-block;width:11px;height:15px;background:#F2C230;vertical-align:-2px;}.hyc.rd{background:#D93A3A;}.hyc.big{width:22px;height:30px;}
.hev{display:flex;align-items:center;gap:10px;padding:9px 14px;border-top:1px solid var(--line);}.hev.r{flex-direction:row;justify-content:flex-end;text-align:right;}.hev .mn{width:38px;color:var(--text-dim);font-size:13px;font-weight:700;}.hev.r .mn{text-align:right;}.hev .ic{width:20px;text-align:center;font-size:15px;}.hev .ic.sb{color:var(--accent);font-weight:800;}.hev .ic.so{color:#D93A3A;font-size:11px;}.hev .ic.si{color:#1E8E3E;font-size:11px;}.hev .nm2{display:flex;flex-direction:column;min-width:0;}.hev .nm2 b{font-size:14px;}.hev .nm2 small{color:var(--text-dim);font-size:11.5px;}
.hevs{text-align:center;padding:7px;font-weight:800;font-size:12px;letter-spacing:.06em;background:var(--panel-2);color:var(--text-dim);border-top:1px solid var(--line);}
.hband{padding:0;background:linear-gradient(180deg,var(--panel-2),var(--panel));}.hbh{display:flex;gap:14px;align-items:center;padding:16px 16px 14px;}.hbh svg{flex:none;}.hbh .sn{margin-bottom:0;}.hbg{display:flex;border-top:1px solid var(--line);}.hbg>div{flex:1;min-width:0;padding:14px 6px;text-align:center;}.hbg>div:not(:last-child){border-right:1px solid var(--line);}.hbg .hbi{display:flex;justify-content:center;height:38px;align-items:center;}.hbg b{display:block;font-size:17px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.hbg small{display:block;font-size:12.5px;letter-spacing:0;text-transform:none;margin-top:2px;}.hband small{display:block;color:var(--text-dim);font-size:11px;letter-spacing:.05em;}.hband .sn{display:block;font-size:19px;margin-bottom:4px;}.hbr{display:flex;gap:22px;margin-top:10px;}.hbr b{font-size:15px;}
.href{width:100%;text-align:left;cursor:pointer;color:var(--text);}.href .hsec{display:flex;align-items:center;gap:6px;}.href .hsec .chev2{margin-left:auto;}.hrg{display:flex;text-align:center;padding:2px 6px 14px;}.hrg>div{flex:1;}.hrg b{font-size:20px;display:block;}.hrg small{color:var(--text-dim);font-size:10.5px;}
.hcmp{display:flex;gap:14px;padding:10px 14px;border-top:1px solid var(--line);}.hcmp.hh{font-weight:800;font-size:13px;justify-content:space-between;border-top:0;padding-top:0;}.hcmp .cs{flex:1;min-width:0;}.hcmp .ct{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:13px;}.hcmp .ra .ct{flex-direction:row-reverse;}.hcmp .v{border:1.5px solid #E5B400;color:#E5B400;font-weight:800;padding:1px 6px;font-size:13px;}.hcmp .cb{height:5px;background:var(--line);margin-top:6px;}.hcmp .ra .cb{transform:scaleX(-1);}.hcmp .cb i{display:block;height:100%;}.hcmp.hh span:last-child{text-align:right;}
.hsr3{display:flex;align-items:center;padding:10px 16px;border-top:1px solid var(--line);font-size:14px;}.hsr3 span{flex:1;text-align:center;color:var(--text-dim);}.hsr3 b{width:64px;font-variant-numeric:tabular-nums;}.hsr3 b:last-child{text-align:right;}.hsr3 b.hi{color:var(--accent);}
.hgh{border-left:4px solid var(--accent);padding:2px 10px;margin:16px 0 8px;}.hgh b{display:block;font-size:13px;letter-spacing:.08em;}.hgh small{color:var(--text-dim);font-size:12px;}
.hrow .tm.two{display:flex;flex-direction:column;line-height:1.3;text-align:left;}.hrow .tm.two span:first-child{font-size:11.5px;}
.hdg{font:800 15px Poppins,sans-serif;color:var(--text);padding:14px 2px 8px;}
.hempty{padding:28px 16px;text-align:center;color:var(--text-dim);font-size:14px;}
.hrow .tm.lv{color:#E5322D;font-weight:800;}.hrow .hsc.lv{color:#E5322D;}
.hdates button.lvb{color:#E5322D;display:flex;align-items:center;}.hdates button.lvb.on{color:#E5322D;border-bottom-color:#E5322D;}
.bnr .bnh .bnbg.wh{filter:brightness(0) invert(1) blur(1.4px);opacity:.3;}html{overflow-x:hidden;overscroll-behavior-x:none;}body{overflow-x:clip;}#slbMatch{overflow-x:clip;}.lvt{display:flex;justify-content:flex-end;margin:-4px 0 10px;}.lvsw{display:flex;align-items:center;gap:7px;border:1px solid var(--line);background:var(--panel);color:var(--text);font:700 13px Poppins,sans-serif;padding:5px 8px 5px 10px;border-radius:16px;cursor:pointer;}.lvsw .lvd{margin:0;border-radius:50%;}.lvk{position:relative;width:30px;height:18px;border-radius:9px;background:#C9D3E3;transition:background .15s;}.lvk::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;transition:transform .15s;box-shadow:0 1px 2px rgba(0,0,0,.3);}.lvsw.on .lvk{background:#E5322D;}.lvsw.on .lvk::after{transform:translateX(12px);}@keyframes hfi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}.hlg.fi{animation:hfi .22s ease-out;}.lvd{display:inline-block;width:7px;height:7px;background:#E5322D;margin-right:6px;animation:lvp 1.2s infinite;}@keyframes lvp{50%{opacity:.25}}
.hhero .ko.lv{color:#E5322D;}.hhero .sm.lv{color:#E5322D;font-weight:800;}
.lvc{display:flex;gap:10px;padding:8px 14px;border-top:1px solid var(--line);font-size:13px;line-height:1.4;}.lvc b{flex:0 0 40px;color:var(--text-dim);font-weight:700;}
.lvg{flex-wrap:wrap;}.lvg>div{flex:0 0 25%;padding-bottom:10px;}
.lvov{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,0);transition:background .28s ease;display:flex;align-items:flex-end;}.lvov.on{background:rgba(0,0,0,.55);}
.lvpn{width:100%;max-height:86vh;overflow:auto;background:var(--panel);color:var(--text);transform:translateY(100%);transition:transform .3s cubic-bezier(.2,.8,.25,1);border-top:1px solid var(--line);}.lvov.on .lvpn{transform:translateY(0);}
.lvhd{padding:8px 16px 14px;position:sticky;top:0;background:var(--panel);z-index:2;}.lvgrip{display:block;width:44px;height:4px;background:var(--line);margin:0 auto 12px;}
.lvtop{display:flex;align-items:center;gap:14px;}.lvf{width:64px;height:64px;border-radius:50%;overflow:hidden;background:var(--panel-2);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--accent);flex:none;}.lvf img{width:100%;height:100%;object-fit:cover;}
.lvnm b{display:block;font:700 19px Poppins,sans-serif;}.lvnm small{color:var(--text-dim);font-size:12.5px;}
.lvbd{padding:0 16px 28px;}.rfi.rfp{overflow:hidden;padding:0;width:48px;height:48px;}.rfi.rfp img{width:100%;height:100%;object-fit:cover;display:block;}.rfa{display:inline-block;width:28px;height:28px;border-radius:50%;overflow:hidden;vertical-align:middle;margin-right:2px;}.rfa img{width:100%;height:100%;object-fit:cover;display:block;}.lvshs{font-size:13px;color:var(--text-dim);padding:0 0 8px;}.lvgp{border-top:1px solid var(--line);padding:6px 0 4px;}.lvgt{font:700 12px Poppins,sans-serif;letter-spacing:.07em;text-transform:uppercase;color:var(--text-dim);padding:8px 0 4px;}
.lvrt{margin-left:auto;min-width:46px;height:34px;padding:0 10px;border-radius:17px;color:#fff;font-weight:800;font-size:16px;display:flex;align-items:center;justify-content:center;flex:none;}.lvrw{display:flex;justify-content:space-between;padding:8px 0;font-size:14.5px;}.lvrw span{color:var(--text-dim);}.lvrw b{font-weight:800;}

.lgstk{position:sticky;z-index:41;background:var(--bg);margin-bottom:10px;}
.lgstk .hhero{display:flex !important;align-items:center;gap:10px;margin-bottom:0 !important;padding:8px 14px !important;}
.lgstk .hhero.hlt{margin-top:-6px !important;padding-left:16px !important;}
.lgstk .hhero .hback{margin:0 !important;flex:none;}
.lgstk .htm{padding:0 !important;gap:10px;}.lgstk .htm .htn{font-size:19px;}.lgstk .htm .sm{margin-top:1px;}
.lgstk .hhero .hcr{width:38px !important;height:38px !important;}.lgstk .hlgo{width:38px !important;height:38px !important;}
.lgstk .hhero .hlbg{display:none;}
.lgstk .htabs{margin:0 -16px;padding:0 10px;background:var(--bg);border-bottom:1px solid var(--line);}
.lgstk .htabs button{color:var(--text-dim);opacity:1;}.lgstk .htabs button.on{color:var(--text);border-bottom-color:var(--accent);}
.lvpn{overscroll-behavior:contain;}
.lgstk.bnr{margin-bottom:10px;isolation:isolate;}.lgstk.bnr::before{content:'';position:absolute;left:-16px;right:-16px;top:0;bottom:0;background:var(--bg);z-index:-1;}
\.bnr .bnh{position:relative;height:130px;display:flex;align-items:flex-end;gap:10px;overflow:hidden;background:linear-gradient(160deg,var(--b1),var(--b2));padding:0 14px 11px;box-sizing:border-box;}
.bnr .bnh::before{content:'';position:absolute;inset:0;background:repeating-linear-gradient(135deg,rgba(255,255,255,.045) 0 12px,transparent 12px 24px);}
.bnr .bnh>*{position:relative;}
.bnr .bnh .bnbg{position:absolute;right:-18px;top:-34px;width:200px;height:200px;object-fit:contain;opacity:.42;filter:blur(1.4px);pointer-events:none;}
.bnr .bnh .hback{background:rgba(255,255,255,.25);margin:0;}
.bnr .bnt{display:flex;align-items:center;gap:10px;margin-top:0;flex:1;min-width:0;}
.bnr .bnt .htn{font-family:Poppins,sans-serif;font-weight:800;font-size:21px;line-height:1.1;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.bnr .bnc{width:36px;height:36px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex:none;overflow:hidden;}.bnr .bnc img{width:30px;height:30px;object-fit:contain;display:block;}.bnr .bnc .hcr{margin:0 !important;width:30px !important;height:30px !important;filter:none;}
.lgstk.bnr .htabs{margin:0;padding:0 4px;background:var(--b2);border:0;}
.lgstk.bnr .htabs button{color:rgba(255,255,255,.72);opacity:1;}.lgstk.bnr .htabs button.on{color:#fff;border-bottom-color:#fff;}
.zlg{border-top:1px solid var(--line);margin:8px 6px 0;padding:12px 8px 10px;display:flex;flex-direction:column;gap:9px;}.zli{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-dim);}.zli i{display:inline-block;flex:none;width:4px;height:16px;}.hjph{display:none;}.hgs .hjw{position:absolute;right:0;top:-1px;}.hgs .hjb{text-transform:none;letter-spacing:0;padding:7px 14px;}.hjw{position:relative;}.hjb{border:0;background:var(--panel-2);color:var(--accent);font-family:Poppins,sans-serif;font-weight:700;font-size:13px;padding:9px 14px;border-radius:18px;cursor:pointer;}.hjm{position:absolute;right:0;top:40px;z-index:60;width:250px;max-height:58vh;overflow-y:auto;background:var(--panel);border:1px solid var(--line);border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.18);padding:6px 0;}.hjm button{display:block;width:100%;text-align:left;border:0;background:transparent;color:var(--text);padding:10px 16px;font-size:14px;cursor:pointer;}.hjm button.g{font-weight:800;color:var(--accent);font-size:12px;letter-spacing:.4px;text-transform:uppercase;padding-top:12px;}.hcard,.hsec{scroll-margin-top:190px;}.hmore{display:block;width:100%;margin:2px 0 12px;padding:12px;border:0;border-radius:12px;background:var(--panel-2);color:var(--accent);font-family:Poppins,sans-serif;font-weight:700;font-size:14px;cursor:pointer;}.hpin{overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding-top:0;}.hpin .htab{position:sticky;top:0;z-index:3;background:var(--panel);padding-top:10px;padding-bottom:6px;margin-top:0;}
.hpills.p4{gap:6px;}.hpills.p4 .hpill{padding:8px 14px;}
.tsk{display:flex;gap:8px;margin:0 0 12px;}.tsk>div{flex:1;background:var(--panel);border:1px solid var(--line);padding:10px 4px;text-align:center;}.tsk small{display:block;font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:.03em;}.tsk b{display:block;font:800 21px Poppins,sans-serif;color:var(--text);margin:2px 0;}
.rkb{display:inline-block;min-width:34px;text-align:center;padding:3px 7px;border-radius:99px;color:#fff;font-weight:800;font-size:12px;line-height:1.3;}.rkb.g{background:#1E8E3E;}.rkb.y{background:#E5B400;color:#241800;}.rkb.r{background:#D93A3A;}
.tsrow{display:flex;align-items:center;gap:8px;min-height:46px;padding:0 14px;border-top:1px solid var(--line);}.tsrow .l{flex:1;min-width:0;color:var(--text);font-size:14px;}.tsrow .c{display:flex;align-items:center;justify-content:flex-end;gap:8px;width:92px;}.tsrow .c b{font-size:16px;color:var(--text);}.tsrow.hd{min-height:34px;border-top:0;font-size:12px;font-weight:800;color:var(--text-dim);letter-spacing:.04em;}
.tssw{display:flex;align-items:center;justify-content:flex-end;gap:8px;margin:0 0 10px;font-weight:800;font-size:14px;color:var(--text);}.tssw button{position:relative;width:46px;height:26px;border-radius:99px;border:0;background:var(--line);cursor:pointer;padding:0;transition:background .15s;}.tssw button i{position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.3);transition:left .15s;}.tssw button.on{background:var(--ink);}.tssw button.on i{left:23px;}
.shbx{display:flex;flex-direction:column;gap:2px;padding:8px 12px;}.shbx>div{min-width:0;}.shbx svg{display:block;width:100%;height:auto;}
.shnav{display:flex;align-items:center;gap:10px;padding:12px 10px;}.shnav button.ar{flex:none;width:40px;height:40px;border-radius:50%;border:0;background:var(--panel-2);color:var(--text);font-size:22px;line-height:1;cursor:pointer;}.shnav button.ar:disabled{opacity:.3;cursor:default;}
.shnav .mid{flex:1;min-width:0;display:flex;align-items:center;gap:10px;}.shnav .fc2{width:46px;height:46px;border-radius:50%;overflow:hidden;background:var(--panel-2);flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:var(--accent);}.shnav .fc2 img{width:100%;height:100%;object-fit:cover;}
.shnav .tx{min-width:0;flex:1;}.shnav .tx b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.shnav .tx small{display:block;color:var(--text-dim);font-size:12.5px;margin-top:1px;}
.shnav .xg{text-align:right;flex:none;}.shnav .xg b{display:block;font:800 18px Poppins,sans-serif;}.shnav .xg small{color:var(--text-dim);font-size:11px;font-weight:700;}
.shpc{display:block;width:calc(100% - 0px);text-align:left;font:inherit;color:inherit;cursor:pointer;padding:10px 12px;}.shph{display:flex;align-items:center;gap:10px;margin-bottom:8px;}.shph .fc2{width:38px;height:38px;border-radius:50%;overflow:hidden;background:var(--panel-2);flex:none;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;color:var(--accent);}.shph .fc2 img{width:100%;height:100%;object-fit:cover;}.shph .tx{min-width:0;}.shph .tx b{display:block;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}.shph .tx small{display:block;color:var(--text-dim);font-size:12px;}.shpm{display:flex;gap:8px;align-items:center;}.shpm .p1{flex:0 0 38%;}.shpm .p2{flex:1;min-width:0;}.shpm svg{display:block;width:100%;height:auto;}.shcnt{text-align:center;font-size:12px;color:var(--text-dim);padding:0 0 10px;font-weight:700;}

.hev small.fd{opacity:.5;font-weight:500;}
.bth{align-items:center;color:var(--text) !important;font-size:14px !important;}.bth span{display:flex;align-items:center;gap:6px;text-align:left;}.bth span:last-child{justify-content:flex-end;text-align:right;}
.bnm{flex:1;min-width:0;display:flex;align-items:center;gap:5px;}.bnm b{flex:0 1 auto !important;}.bc.r .bnm{justify-content:flex-end;}
.hcoach{display:flex;align-items:center;gap:12px;padding:12px 14px;}.hcoach .cf{position:relative;width:52px;height:52px;flex:none;}.hcoach .cf .ph{width:52px;height:52px;border-radius:50%;overflow:hidden;background:var(--panel-2);display:flex;align-items:center;justify-content:center;font-weight:800;color:var(--accent);}.hcoach .cf .ph img{width:100%;height:100%;object-fit:cover;}
.hcoach .cf .fl{position:absolute;right:-4px;bottom:-4px;width:22px;height:22px;border-radius:50%;background:var(--panel);border:2px solid var(--panel);display:flex;align-items:center;justify-content:center;font-size:14px;line-height:1;box-shadow:0 0 0 1px var(--line);}
.hcoach .cn{min-width:0;}.hcoach .cn small{display:block;color:var(--text-dim);font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;}.hcoach .cn b{display:block;font-size:16px;}.hgs{padding:14px 2px 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-dim);}.hcoach .cn b .fl2{margin-left:8px;font-size:18px;font-weight:400;}.nlink{text-decoration:none;}.lvlink{display:block;width:calc(100% - 28px);margin:12px 14px 18px;padding:12px;border:0;border-radius:12px;background:var(--panel-2);color:var(--accent);font-weight:700;font-size:15px;font-family:inherit;}


.shw{margin:0 0 12px;}.shw svg{display:block;width:100%;height:auto;}
.shlg{display:flex;gap:14px;flex-wrap:wrap;padding:8px 2px 0;font-size:12px;color:var(--text-dim);align-items:center;}.shlg span{display:flex;align-items:center;gap:5px;}.shlg svg{width:14px;height:14px;}
.hscr{overflow-x:auto;flex-wrap:nowrap;-webkit-overflow-scrolling:touch;scrollbar-width:none;}.hscr::-webkit-scrollbar{display:none;}.hscr .hpill{flex:none;}
.shdt{display:flex;gap:12px;align-items:flex-start;padding:12px 14px 4px;}.shdt .gl{flex:none;width:52%;}.shdt .gl svg{display:block;width:100%;height:auto;}.shdt .nm{flex:1;min-width:0;}.shdt .nm b{display:block;font-size:15px;}.shdt .nm small{color:var(--text-dim);}
.shx{display:flex;gap:16px;margin-top:8px;}.shx div small{display:block;color:var(--text-dim);font-size:12px;}.shx div b{font-size:18px;}
.shr{display:flex;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--line);}.shr small{color:var(--text-dim);}.shr b{font-weight:700;}

.lvx{position:absolute;right:12px;top:6px;width:36px;height:36px;border:0;background:transparent;color:var(--text-dim);font-size:28px;line-height:1;cursor:pointer;}
.htabs.stk{position:sticky;z-index:40;background:var(--bg);margin:0 -16px 10px;padding:0 10px;border-bottom:1px solid var(--line);}.htabs.stk button{color:var(--text-dim);opacity:1;}.htabs.stk button.on{color:var(--text);border-bottom-color:var(--accent);}
.hbest .hsec.ctr{text-align:center;padding:12px 0 4px;}.bth{display:flex;padding:2px 14px 8px;font-weight:800;font-size:13px;color:var(--text-dim);}.bth span{flex:1;text-align:center;}
.brow{padding:10px 14px 12px;border-top:1px solid var(--line);}.bcells{display:flex;gap:14px;}.bc{flex:1;display:flex;align-items:center;gap:8px;min-width:0;}.bc.r{flex-direction:row;}.bc b{flex:1;min-width:0;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;}.bc.r b{text-align:right;}.bc .bv{font:800 15px Poppins,sans-serif;}
.bface{width:36px;height:36px;border-radius:50%;overflow:hidden;background:var(--panel-2);flex:none;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:var(--accent);}.bface img{width:100%;height:100%;object-fit:cover;}
.btr{display:flex;height:7px;margin-top:10px;position:relative;}.btr>div{flex:1;background:var(--panel-2);display:flex;overflow:hidden;}.btr .bl{justify-content:flex-end;margin-right:1px;}.btr .br{margin-left:1px;}.btr i{display:block;height:100%;}.btr .bl i{background:#2F8DFF;}.btr .br i{background:#E5B400;}.btr::after{content:'';position:absolute;left:50%;top:-5px;bottom:-5px;width:2px;margin-left:-1px;background:var(--text-dim);}
.mmlg{display:flex;justify-content:space-between;align-items:center;padding:4px 16px 6px;font-size:12.5px;font-weight:700;color:var(--text-dim);}.mmlg span{display:flex;align-items:center;gap:6px;}.mmsv{padding:0 14px 12px;color:var(--text);}.mmsv svg{width:100%;height:auto;display:block;}.mmax{display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);padding-top:2px;}
.rfh{display:flex;align-items:center;gap:12px;padding:12px 16px 8px;}.rfi{width:38px;height:38px;border-radius:50%;background:var(--panel-2);display:flex;align-items:center;justify-content:center;}.rfn{flex:1;min-width:0;}.rfn b{display:block;font:700 16px Poppins,sans-serif;}.rfn small{color:var(--text-dim);font-size:12.5px;}
.rfg{display:flex;border-top:1px solid var(--line);}.rfc{flex:1;padding:12px 16px 14px;}.rfc+.rfc{border-left:1px solid var(--line);}.rfc small{display:block;color:var(--text-dim);font-size:12.5px;font-weight:600;}.rfv{margin:6px 0 10px;}.rfv b{font:800 22px Poppins,sans-serif;}.rfv span{color:var(--text-dim);font-size:12.5px;}.rft{font-size:12.5px;font-weight:700;margin-top:8px;}
.abar{position:relative;height:4px;background:var(--panel-2);border-radius:2px;margin:20px 0 8px;}.abar s{position:absolute;top:-19px;transform:translateX(-50%);font-size:10.5px;font-weight:700;color:var(--text-dim);text-decoration:none;white-space:nowrap;line-height:1;}.abar i{display:block;height:100%;border-radius:2px;position:relative;}.abar i::after{content:'';position:absolute;right:-5px;top:50%;width:10px;height:10px;margin-top:-5px;border-radius:50%;background:inherit;}.abar u{position:absolute;left:50%;top:-5px;width:2px;height:14px;margin-left:-1px;background:var(--text-dim);border-radius:1px;}
.hbar2{display:flex;gap:3px;height:4px;margin-top:7px;}.hbar2>div{flex:1;background:var(--panel-2);display:flex;border-radius:2px;overflow:hidden;}.hbar2 .l{justify-content:flex-end;}.hbar2 i{display:block;height:100%;border-radius:2px;}
html{touch-action:pan-x pan-y;}.htabs,.hdates{position:relative;}.swp button.on{border-bottom-color:transparent !important;border-color:transparent !important;}.hp .cp2{left:auto !important;right:-5px;top:20px !important;}.hrw{padding-bottom:10px;}.hrw .hr2{padding-top:9px;padding-bottom:8px;}.hrw .abar{margin:15px 16px 0;}
.hrs .sc2.tbd{font-size:12px;font-weight:600;color:var(--text-dim);white-space:nowrap;}.hrow .tm{white-space:nowrap;}
.trk .op .hyc{flex:none;}.trk .op>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hsec.hsc2{padding:8px 18px 10px;}
html.slb-tr,html.slb-tr *,html.slb-tr *::before,html.slb-tr *::after{transition:background-color .3s ease,color .3s ease,border-color .3s ease,fill .3s ease,stroke .3s ease,box-shadow .3s ease,filter .3s ease !important;}
`;
    document.head.appendChild(st);
  }
  function themeMode(){ try{ var v = localStorage.getItem('slbTheme'); if(v === 'light' || v === 'night' || v === 'auto') return v; }catch(e){} return 'light'; }
  function themeNow(){ var m = themeMode(); if(m === 'auto') return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'night' : 'light'; return m; }
  var TRT = 0, TFIRST = true;
  function applyTheme(){
    var r = themeNow(), de = document.documentElement;
    if(!TFIRST && de.getAttribute('data-theme') !== r){
      de.classList.add('slb-tr'); clearTimeout(TRT); TRT = setTimeout(function(){ de.classList.remove('slb-tr'); }, 380);
    }
    TFIRST = false;
    de.setAttribute('data-theme', r);
    if(THCOL !== undefined){ var rt = document.getElementById('slbMatch'); if(rt) themeVars(rt, THCOL); }
    var mt = document.querySelector('meta[name="theme-color"]'); if(mt) mt.setAttribute('content', r === 'night' ? '#0E1526' : '#ffffff');
    var cv = document.getElementById('slbCover'); if(cv) cv.style.background = r === 'night' ? '#0E1526' : '#fff';
    var m = themeMode();
    Array.prototype.forEach.call(document.querySelectorAll('#slbTheme button'), function(b){ b.classList.toggle('on', b.dataset.m === m); });
  }
  function themeSetup(menu){
    var row = document.createElement('div'); row.id = 'slbTheme';
    row.innerHTML = '<div class="tl">Tema</div><div class="tg">'
      + '<button type="button" data-m="light">' + IC.sun + 'Light</button>'
      + '<button type="button" data-m="night">' + IC.moon + 'Night</button>'
      + '<button type="button" data-m="auto">' + IC.auto + 'Auto</button></div>';
    row.addEventListener('click', function(e){
      var b = e.target.closest && e.target.closest('button'); if(!b) return;
      try{ localStorage.setItem('slbTheme', b.dataset.m); }catch(x){}
      applyTheme();
    });
    menu.appendChild(row);
    var mq = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
    if(mq){ var f = function(){ if(themeMode() === 'auto') applyTheme(); }; if(mq.addEventListener) mq.addEventListener('change', f); else if(mq.addListener) mq.addListener(f); }
    applyTheme();
  }
  // --- home: partite del giorno, scheda partita (Statistiche, Formazioni, Classifica, Giocatori) e scheda giocatore ---
  var HD = null, HOK = false, HDAY = null, HSEL = null, HTAB = 'stat', HTT = 'tot', HSIDE = 'h', HPL = null, HLINE = 1.5, HLOAD = null;
  var GOFN = null, PICKFN = null;
  var HLG = [['serie-a', 'Serie A'], ['premier-league', 'Premier League'], ['la-liga', 'LaLiga'], ['bundesliga', 'Bundesliga'], ['ligue-1', 'Ligue 1']];
  var FOTO = {};
  function photoOf(p){
    if(!HSEL || !HD || !HD.lin) return null;
    var L = HD.lin[HSEL.id]; if(!L) return null;
    var team = p.t, res = null;
    ['h','a'].forEach(function(s){ var S = L[s]; if(!S) return; (S.s || []).concat(S.b || []).forEach(function(x){ if(res) return; var id = x.length > 3 ? x[5] : x[2]; if(id && FOTO[id] && FOTO[id].u && findPlayer(x[0], team) === p) res = FOTO[id].u; }); });
    return res;
  }
  function loadHome(){
    if(!HLOAD){
      var g = function(u){ return fetch(u, {cache: 'no-cache'}).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); };
      HLOAD = Promise.all([g('partite.json'), g('angoli.json'), loadPlayers(), g('foto.json'), g('data.json'), g('zone.json')]).then(function(a){ HD = a[0]; ZN = a[5] || {}; HOK = true; try{ prefetchCrests(); }catch(e){} if(a[1]) MDATA = a[1]; FOTO = a[3] || {}; if(a[4] && a[4].leagues) Object.keys(a[4].leagues).forEach(function(k){ if(a[4].leagues[k].logo) LEAGUE_LOGOS[k] = a[4].leagues[k].logo; }); setTimeout(function(){ loadExtra().then(function(){ if(MCAT === 'home' && HSEL && HTAB === 'form') drawMatch(); }); }, 1800); return a; });
    }
    return HLOAD;
  }
  function timeOf(iso){
    if(!iso) return '';
    var d = new Date(iso); if(isNaN(d)) return '';
    return d.toLocaleTimeString('it-IT', {timeZone:'Europe/Rome', hour:'2-digit', minute:'2-digit'});
  }
  function inits(n){ return String(n || '').replace(/^\d+\.\s*/, '').split(/\s+/).slice(0, 2).map(function(w){ return w.charAt(0); }).join('').toUpperCase(); }
  var CTONE = {};
  function crestTone(im, url){
    if(document.documentElement.getAttribute('data-theme') !== 'night' || !/^https?:/.test(url)) return;
    if(url in CTONE){ if(CTONE[url]) im.setAttribute('data-ct', CTONE[url]); return; }
    CTONE[url] = '';
    var pr = new Image(); pr.crossOrigin = 'anonymous';
    pr.onload = function(){
      try{
        var c = document.createElement('canvas'); c.width = c.height = 24; var x = c.getContext('2d'); x.drawImage(pr, 0, 0, 24, 24);
        var d = x.getImageData(0, 0, 24, 24).data, dk = 0, sa = 0;
        for(var q = 0; q < d.length; q += 4){ var al = d[q + 3] / 255; if(al < .4) continue; var l = (0.299 * d[q] + 0.587 * d[q + 1] + 0.114 * d[q + 2]) / 255; sa += 1; if(l < .3) dk += 1; }
        if(sa > 20 && dk / sa > .38){ CTONE[url] = 'dark'; document.querySelectorAll('img').forEach(function(e){ if(e.getAttribute('src') === url) e.setAttribute('data-ct', 'dark'); }); }
      }catch(e){}
    };
    pr.src = url;
  }
  function crestEl(url, name, size){
    var c = el('span', 'hcr'); c.style.width = c.style.height = size + 'px'; c.style.fontSize = Math.max(8, Math.round(size * .34)) + 'px';
    url = url || TEAM_LOGOS[name];
    if(url){ var i = el('img'); i.src = url; i.alt = ''; i.loading = 'lazy'; i.onerror = function(){ i.remove(); c.textContent = inits(name); }; c.appendChild(i); crestTone(i, url); }
    else c.textContent = inits(name);
    return c;
  }
  function shortName(n){
    var w = String(n || '').split(/\s+/); if(w.length < 2) return n || '';
    var last = w[w.length - 1], prev = w[w.length - 2];
    return (prev.length <= 3 && w.length > 2) ? prev + ' ' + last : last;
  }
  var HANIM = null, SWST = 0;
  function runAnim(body){
    var a = HANIM; HANIM = null;
    if(!a || !body.animate || NOANIM || Date.now() < SWST) return;
    var tgt = a.t === 'tab' ? body.querySelector('.hc') : body; if(!tgt) return;
    var from = a.t === 'back' ? '-28%' : a.t === 'tab' ? (a.d * 100) + '%' : '100%';
    tgt.style.willChange = 'transform'; var an = tgt.animate([{transform: 'translate3d(' + from + ',0,0)'}, {transform: 'translate3d(0,0,0)'}], {duration: a.t === 'tab' ? 230 : 300, easing: 'cubic-bezier(.2,.8,.2,1)'}); an.onfinish = function(){ tgt.style.willChange = ''; };
  }
  var TONE = {}, DARKLG = {'premier-league': 1}, FORCETONE = {'ligue-1': 'dark', 'champions-league': 'dark', 'europa-league': 'mix'};
  function lgImg(key, cls){
    var url = LEAGUE_LOGOS[key], im = el('img', cls || ''); if(!url) return null;
    im.src = url; im.alt = '';
    var set = function(t){ if(FORCETONE[key]) t = FORCETONE[key]; TONE[key] = t; if(t) im.setAttribute('data-tone', t); };
    if(key in TONE) set(TONE[key]);
    else {
      var pr = new Image(); pr.crossOrigin = 'anonymous';
      pr.onload = function(){
        try{
          var c = document.createElement('canvas'); c.width = c.height = 24; var x = c.getContext('2d'); x.drawImage(pr, 0, 0, 24, 24);
          var d = x.getImageData(0, 0, 24, 24).data, sl = 0, sa = 0;
          for(var i = 0; i < d.length; i += 4){ var a = d[i + 3] / 255; sl += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255 * a; sa += a; }
          var L = sa > 4 ? sl / sa : .5; set(L < .3 ? 'dark' : L > .85 ? 'light' : '');
        }catch(e){ set(DARKLG[key] ? 'dark' : ''); }
      };
      pr.onerror = function(){ set(DARKLG[key] ? 'dark' : ''); };
      pr.src = url;
      if(DARKLG[key]) set('dark');
    }
    return im;
  }
  var LGHERO = {'premier-league': ['#2A0F3F', '#5A2A82'], 'bundesliga': ['#8A0F18', '#D6202E'], 'la-liga': ['#C9566B', '#F2937F'], 'ligue-1': ['#0A2F73', '#1E6FE0'], 'champions-league': ['#050E2E', '#12307A'], 'europa-league': ['#C24A00', '#F28A1F'], 'conference-league': ['#0B6B3A', '#1FAE63']};
  function drawHome(days, body, note){
    note.textContent = '';
    if(!HOK){ note.textContent = 'Carico le partite…'; return; }
    if(!HD || !HD.matches || !HD.matches.length){ body.appendChild(el('div', 'hempty', 'Partite non ancora disponibili')); return; }
    themeVars(document.getElementById('slbMatch'), null);
    if(HREF){ days.style.display = 'none'; drawRefPage(body); return; }
    if(HPL){ days.style.display = 'none'; drawPlayerPage(days, body); return; }
    if(HTEAM){ days.style.display = 'none'; drawTeamPage(body); return; }
    if(HLV){ days.style.display = 'none'; drawLeaguePage(body); return; }
    if(HSEL){ drawHMatch(days, body); return; }
    var keys = {}; HD.matches.forEach(function(m){ keys[m.d] = 1; }); keys = Object.keys(keys).sort();
    var today = romeDay(new Date());
    if(!HDAY) HDAY = keys.indexOf(today) >= 0 ? today : keys[0];
    var strip = [], t0 = new Date(today + 'T12:00:00');
    for(var i = -6; i <= 0; i++){ var dd = new Date(t0.getTime() + i * 86400000); strip.push(romeDay(dd)); }
    keys.forEach(function(k){ if(strip.indexOf(k) < 0) strip.push(k); });
    if(HDAY === 'live') HDAY = keys.indexOf(today) >= 0 ? today : keys[0];
    if(strip.indexOf(HDAY) < 0) strip.push(HDAY);
    strip.sort();
    days.className = 'ang-days hdates';
    var cal = el('button', 'hcal'); cal.type = 'button'; cal.setAttribute('aria-label', 'Calendario');
    cal.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="0"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>';
    var ci = el('input'); ci.type = 'date'; ci.value = HDAY; ci.min = SEASON_MIN; ci.max = keys[keys.length - 1];
    ci.addEventListener('change', function(){ if(ci.value){ HDAY = ci.value; HCAL = true; if(!XDONE) loadExtra(); drawMatch(); } });
    cal.appendChild(ci); days.appendChild(cal);
    var act = null;
    strip.forEach(function(k){
      var dif = Math.round((new Date(k + 'T12:00:00') - t0) / 86400000);
      var lb = dif === -1 ? 'Ieri' : dif === 0 ? 'Oggi' : dif === 1 ? 'Domani' : dayLabel(k);
      var b = el('button', k === HDAY ? 'on' : '', lb); b.type = 'button'; b.setAttribute('data-k', k);
      b.addEventListener('click', function(){ HDAY = k; HCAL = false; drawMatch(); }); days.appendChild(b);
      if(k === HDAY) act = b;
    });
    if(act){ var cs = function(){ days.scrollLeft = act.offsetLeft - (days.clientWidth - act.offsetWidth) / 2; }; cs(); requestAnimationFrame(cs); }
    drawDayBody(body, today);
  }
  function drawDayBody(body, today){
    var LVON = HLVON && HDAY === today;
    if(HDAY === today && (HLVON || lvList().length)) body.appendChild(lvSwitch());
    var list = LVON ? lvList() : HD.matches.filter(function(m){ return m.d === HDAY; });
    if(!LVON && (!list.length || HDAY < today)){
      if(needExtra()){ if(!list.length){ body.appendChild(el('div', 'hempty', 'Carico\u2026')); return; } }
      else {
        var have = {}; list.forEach(function(m){ have[m.lg + '|' + norm(m.h) + '|' + norm(m.a)] = 1; });
        var po = pastOf(HDAY).filter(function(m){ return !have[m.lg + '|' + norm(m.h) + '|' + norm(m.a)]; });
        list = list.concat(po);
      }
    }
    if(!LVON && HDAY < today){
      lvCups(HDAY);
      var dv = LVD[HDAY] && LVD[HDAY].l || [];
      dv.forEach(function(e){
        var lgk = LVMAP[e.lg]; if(!lgk || e.st !== 'post') return;
        var hit = null; list.some(function(m){ if(m.lg === lgk && lvSame(m.h, e.h) && lvSame(m.a, e.a)){ hit = m; return true; } return false; });
        if(hit){ if(!hit.t) hit.t = e.d; if(!stiId(hit)) hit.es = e; }
        else list.push(lvDomM(e));
      });
    }
    var any = false;
    HLG.forEach(function(L){
      var ms = list.filter(function(m){ return m.lg === L[0]; }).sort(function(a, b){ return lvTs(a) - lvTs(b); });
      if(!ms.length) return; any = true;
      var box = el('div', 'hlg' + (HFI ? ' fi' : '')), h = el('div', 'hlgh'); var lg = lgImg(L[0]); if(lg){ lg.onerror = function(){ lg.remove(); }; h.appendChild(lg); } h.appendChild(el('span', '', L[1])); h.appendChild(el('span', 'chev2', '\u203A')); h.style.cursor = 'pointer'; h.addEventListener('click', function(){ openLeague(L[0]); }); box.appendChild(h);
      ms.forEach(function(m){ box.appendChild(matchRow(m)); });
      body.appendChild(box);
    });
    var cms = LVON ? lvList().filter(function(m){ return m.cup; }) : lvCups(HDAY);
    CUPS.forEach(function(C){
      var ms = cms.filter(function(m){ return m.lg === C[0]; }); if(!ms.length) return; any = true;
      var box = el('div', 'hlg' + (HFI ? ' fi' : '')), h = el('div', 'hlgh'), ck = ESPK[C[0]];
      if(ck){ var cl = lgImg(ck); if(cl){ cl.onerror = function(){ cl.remove(); }; h.appendChild(cl); } h.appendChild(el('span', '', C[1])); h.appendChild(el('span', 'chev2', '\u203A')); h.style.cursor = 'pointer'; h.addEventListener('click', function(){ openLeague(ck); }); }
      else h.appendChild(el('span', '', C[1]));
      box.appendChild(h); ms.forEach(function(m){ box.appendChild(matchRow(m)); });
      body.appendChild(box);
    });
    if(!any) body.appendChild(el('div', 'hempty', LVON ? 'Nessuna partita in corso' : 'Nessuna partita in questo giorno'));
  }
  var HLVON = false, HFI = false, HCAL = false, SEASON_MIN = '2026-08-15', RIDX = null;
  function resIdx(){
    if(RIDX || !TM || !TM.res) return RIDX;
    RIDX = {};
    Object.keys(TM.res).forEach(function(lg){ Object.keys(TM.res[lg]).forEach(function(t){ TM.res[lg][t].forEach(function(x){
      if(x[2] && x[3] != null) RIDX[x[0] + '|' + t + '|' + x[1]] = [x[3], x[4], lg];
    }); }); });
    return RIDX;
  }
  function pastOf(day){
    var R = resIdx(), out = []; if(!R) return out;
    Object.keys(R).forEach(function(k){
      var q = k.split('|'); if(q[0] !== day) return;
      out.push({d: day, lg: R[k][2], h: q[1], a: q[2], hl: tLogo(q[1]), al: tLogo(q[2]), t: null, sh: R[k][0], sa: R[k][1]});
    });
    return out;
  }
  function statMatch(m){
    var d = MDATA && MDATA.days && MDATA.days[m.d]; if(!d || !d.tutte) return null;
    for(var i = 0; i < d.tutte.length; i++){ if(d.tutte[i].id === m.id) return d.tutte[i]; }
    for(var j = 0; j < d.tutte.length; j++){ if(d.tutte[j].home === m.h && d.tutte[j].away === m.a) return d.tutte[j]; }
    return null;
  }
  function statRow(label, h, a, dec, unit){
    var r = el('div', 'hst'), v = el('div', 'v'), un = unit || '';
    var fh = h == null ? '–' : f1(h.toFixed(dec == null ? 1 : dec)) + un, fa = a == null ? '–' : f1(a.toFixed(dec == null ? 1 : dec)) + un;
    var bh = el('b', h != null && a != null && h > a ? 'w' : '', fh), ba = el('b', h != null && a != null && a > h ? 'w' : '', fa);
    v.appendChild(bh); v.appendChild(el('span', '', label)); v.appendChild(ba); r.appendChild(v);
    var mx = Math.max(h || 0, a || 0) || 1, bar = el('div', 'hbar2'), L = el('div', 'l'), R = el('div', 'r'), i = el('i'), u = el('i');
    i.style.width = Math.round(100 * (h || 0) / mx) + '%'; u.style.width = Math.round(100 * (a || 0) / mx) + '%';
    i.style.background = '#2F8DFF'; u.style.background = '#E5484D';
    if(h != null && a != null){ if(h < a) i.style.opacity = '.4'; else if(a < h) u.style.opacity = '.4'; }
    L.appendChild(i); R.appendChild(u); bar.appendChild(L); bar.appendChild(R); r.appendChild(bar);
    if(h != null && a != null){ if(h > a) bh.style.color = '#2F8DFF'; else if(a > h) ba.style.color = '#E5484D'; }
    return r;
  }
  function teamAvg(name){
    var D = window.LEAGUE_DATA || {}, k = pickKey(name, null);
    return k && D[k] && D[k].teams ? D[k].teams[name] : null;
  }
  function tabStats(box){
    var sm = statMatch(HSEL), ta = teamAvg(HSEL.h), tb = teamAvg(HSEL.a);
    if(sm){
      var c1 = el('div', 'hcard');
      c1.appendChild(el('div', 'hsec', 'Attesi in partita'));
      c1.appendChild(statRow('Tiri totali', sm.tiri_home, sm.tiri_away));
      c1.appendChild(statRow('Tiri in porta', sm.sot_home, sm.sot_away));
      c1.appendChild(statRow('Corner', sm.corners_home, sm.corners_away));
      c1.appendChild(statRow('Falli', sm.falli_home, sm.falli_away));
      c1.appendChild(statRow('Fuorigioco', sm.off_home, sm.off_away));
      box.appendChild(c1);
    }
    if(ta && tb){
      var c2 = el('div', 'hcard');
      c2.appendChild(el('div', 'hsec', 'Medie di stagione'));
      c2.appendChild(statRow('Tiri fatti', ta.totalFor, tb.totalFor));
      c2.appendChild(statRow('Tiri subiti', ta.totalAgainst, tb.totalAgainst));
      c2.appendChild(statRow('Tiri in porta fatti', ta.sotFor, tb.sotFor));
      c2.appendChild(statRow('Tiri in porta subiti', ta.sotAgainst, tb.sotAgainst));
      box.appendChild(c2);
    }
    if(!sm && !(ta && tb)) box.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili'));
  }
  // ===== squadre, campionati, statistiche =====
  var HTEAM = null, HTLG = null, HTTAB = 'par', HLV = null, HLTAB = 'par', HFORM = false, HSTV = 'sq', HSTK = null, HSTS = 0, HSTW = 0, HLDAY = null, HSVS = false, HSCAT = 'Attacco', HLALL = {};
  var STI = null, ARB = null, STD = null, HREF = null, HRLG = null, HRK = 'y', HSP = 'all', HLSC = null, MF = {}, HSM = 'd', HSFLT = 'all', HSPL = null, HSHOT = null;
  var ST = null, SQ = null, TM = null, XLOAD = null, XDONE = false, SC = {}, SIDX = {}, SNAME = {}, PIDX = null, LOGOS = null;
  var NAV = [];
  var VCOL = {V: '#1E8E3E', P: '#8E98AB', S: '#D93A3A'};
  var CUPK = {'champions-league': ['uefa.champions', 'Champions League', 8], 'europa-league': ['uefa.europa', 'Europa League', 8], 'conference-league': ['uefa.europa.conf', 'Conference League', 6]}, ESPK = {};
  Object.keys(CUPK).forEach(function(k){ ESPK[CUPK[k][0]] = k; });
  function nk(x){ return norm(x).replace(/[-.']/g, ' ').replace(/\s+/g, ' ').trim(); }
  function gj(u){ return fetch(u, {cache: 'no-cache'}).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function loadExtra(){
    if(!XLOAD) XLOAD = Promise.all([gj('stats.json'), gj('squadre.json'), gj('teams.json'), gj('storico.json'), gj('arbitri.json'), gj('stadi.json'), gj('stats_ex.json'), gj('squadre_ex.json'), gj('ruoli.json')]).then(function(a){
      ST = a[0]; SQ = a[1]; TM = a[2]; STI = a[3] || {}; ARB = a[4]; STD = a[5] || {}; XDONE = true;
      if(ST && ST.cols){
        ST.cols.forEach(function(c, i){ SC[c] = i; });
        ST.players.forEach(function(r){ SIDX[r[0]] = r; SNAME[norm(r[1]) + '|' + norm(r[2])] = r; });
      }
      mergeExtra(a[6], a[7], a[8]);
      return a;
    });
    return XLOAD;
  }
  var SX = null, SXR = {}, SXC = {}, SXH = {}, SQX = null;
  var SQM = {total_shots: 'sh', ShotsOnTarget: 'st', fouls: 'fo', corners: 'co', Offsides: 'of'};
  function sxv(x, key, l5){ var i = SXC[key]; if(i == null) return 0; return (x[SXH[l5 ? 'l5' : 's']][i]) || 0; }
  function mergeExtra(sx, sqx, roles){
    PRC = {}; PLC = {};
    try{
      if(roles && ST && ST.players) ST.players.forEach(function(r){ var p = roles[nk(r[SC.n]) + '|' + nk(r[SC.t])]; if(p) r[SC.pos] = p; });
      if(sx && sx.rows && sx.cols){
        SX = sx; sx.cols.forEach(function(k, i){ SXC[k] = i; }); sx.head.forEach(function(k, i){ SXH[k] = i; });
        sx.rows.forEach(function(x){
          var lgk = x[SXH.lg];
          if(CUPK[lgk]){
            if(!ST || !ST.players) return;
            var id = 'c|' + lgk + '|' + nk(x[SXH.n]) + '|' + nk(x[SXH.t]);
            var v = function(k){ return sxv(x, k, false); }, w = function(k){ return sxv(x, k, true); };
            var row = ST.cols.map(function(c){
              switch(c){
                case 'id': return id; case 'n': return x[SXH.n]; case 't': return x[SXH.t]; case 'lg': return lgk; case 'g': return x[SXH.g]; case 'min': return x[SXH.min];
                case 'go': return v('goals'); case 'as': return v('assists'); case 'sh': return v('total_shots'); case 'st': return v('ShotsOnTarget'); case 'fo': return v('fouls'); case 'fs': return v('was_fouled'); case 'of': return v('Offsides');
                case 'y': return x[SXH.y]; case 'r': return x[SXH.r]; case 'l5g': return x[SXH.l5g]; case 'l5min': return x[SXH.l5min];
                case 'l5sh': return w('total_shots'); case 'l5st': return w('ShotsOnTarget'); case 'l5fo': return w('fouls'); case 'l5fs': return w('was_fouled'); case 'l5of': return w('Offsides');
                case 'l5go': return w('goals'); case 'l5as': return w('assists'); case 'l5y': return x[SXH.l5y]; case 'l5r': return x[SXH.l5r]; case 'pos': return x[SXH.pos] || 'C';
                default: return 0;
              }
            });
            ST.players.push(row); SXR[id] = x;
          } else if(ST){
            var b = SNAME[norm(x[SXH.n]) + '|' + norm(x[SXH.t])]; if(b) SXR[b[0]] = x;
          }
        });
      }
      if(sqx && sqx.lg){
        SQX = sqx; SQ = SQ || {updated_at: '', lg: {}}; SQ.lg = SQ.lg || {};
        Object.keys(sqx.lg).forEach(function(lgk){
          var dst = SQ.lg[lgk] = SQ.lg[lgk] || {};
          Object.keys(sqx.lg[lgk]).forEach(function(t){
            var o = dst[t] = dst[t] || {}, src = sqx.lg[lgk][t];
            Object.keys(src).forEach(function(k){ o[k] = src[k]; if(SQM[k] && !o[SQM[k]]) o[SQM[k]] = src[k]; });
          });
        });
      }
    }catch(e){}
  }
  function needExtra(){
    if(XDONE) return false;
    loadExtra().then(function(){ if(MCAT === 'home') drawMatch(); });
    return true;
  }
  function statOf(p){ return ST ? (SIDX[p.i] || SNAME[norm(p.n) + '|' + norm(p.t)] || null) : null; }
  function dbById(id){
    if(!PDATA) return null;
    if(!PIDX){ PIDX = {}; PDATA.forEach(function(p){ PIDX[p.i] = p; }); }
    return PIDX[id] || null;
  }
  function photoFor(p){
    var s = statOf(p);
    if(s && ST.ph && ST.ph[s[0]]) return ST.ph[s[0]];
    if(p.i && FOTO[p.i] && FOTO[p.i].u) return FOTO[p.i].u;
    return photoOf(p);
  }
  function tLogo(name){
    if(!LOGOS){ LOGOS = {}; if(HD && HD.tab) Object.keys(HD.tab).forEach(function(k){ (HD.tab[k].tot || []).forEach(function(r){ if(r[1]) LOGOS[r[0]] = r[1]; }); }); }
    return LOGOS[name] || TEAM_LOGOS[name] || null;
  }
  function teamLg(name){
    var ks = Object.keys((HD && HD.tab) || {});
    for(var i = 0; i < ks.length; i++){ var t = HD.tab[ks[i]].tot || []; for(var j = 0; j < t.length; j++){ if(t[j][0] === name) return ks[i]; } }
    return null;
  }
  function lgLabel(k){ if(CUPK[k]) return CUPK[k][1]; var x = HLG.filter(function(l){ return l[0] === k; })[0]; return x ? x[1] : (cupLabel(k) || k); }
  function hexRgb(h){ return [1, 3, 5].map(function(i){ return parseInt(h.substr(i, 2), 16); }); }
  function shade(h, f){
    var c = hexRgb(h).map(function(v){ return Math.max(0, Math.min(255, Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f))); });
    return '#' + c.map(function(v){ return ('0' + v.toString(16)).slice(-2); }).join('');
  }
  var THCOL;
  function themeVars(root, col){
    THCOL = col;
    ['--hero', '--accent', '--hl', '--ink'].forEach(function(v){ root.style.removeProperty(v); });
    if(!col) return;
    var rgb = hexRgb(col);
    root.style.setProperty('--hero', 'linear-gradient(180deg,' + shade(col, -.5) + ',' + col + ')');
    root.style.setProperty('--accent', col);
    root.style.setProperty('--hl', 'rgba(' + rgb.join(',') + ',.12)');
    if(themeNow() !== 'night') root.style.setProperty('--ink', shade(col, -.35));
  }
  // --- navigazione con cronologia ---
  function snap(){ return {HSEL: HSEL, HPL: HPL, HTEAM: HTEAM, HTLG: HTLG, HTTAB: HTTAB, HLV: HLV, HLTAB: HLTAB, HTAB: HTAB, HSIDE: HSIDE, HSTK: HSTK, HSTV: HSTV, HSTS: HSTS, HSTW: HSTW, HDAY: HDAY, HREF: HREF, HRLG: HRLG, y: window.pageYOffset || 0}; }
  function restore(s){ HSEL = s.HSEL; HPL = s.HPL; HTEAM = s.HTEAM; HTLG = s.HTLG; HTTAB = s.HTTAB; HLV = s.HLV; HLTAB = s.HLTAB; HTAB = s.HTAB; HSIDE = s.HSIDE; HSTK = s.HSTK; HSTV = s.HSTV; HSTS = s.HSTS; HSTW = s.HSTW; HDAY = s.HDAY; HREF = s.HREF || null; HRLG = s.HRLG || null; }
  function navTo(fn, anim){
    NAV.push(snap());
    try{ history.pushState({slb: 1}, ''); }catch(e){}
    HANIM = anim || {t: 'push'};
    fn(); drawMatch(); window.scrollTo(0, 0);
  }
  function navBack(){
    LASTNB = Date.now(); var s = NAV.pop(); HANIM = {t: 'back'};
    if(s) restore(s); else { HSEL = HPL = HTEAM = HLV = HSTK = null; }
    drawMatch(); window.scrollTo(0, s ? s.y : 0);
  }
  function openMatch(m){ navTo(function(){ HREF = null; HSEL = m; HTAB = 'pano'; HPL = null; HSIDE = 'h'; HTEAM = null; HLV = null; HSTK = null; }); try{ prefetchMatch(m); }catch(e){} }
  function openPlayer(p){ navTo(function(){ HREF = null; HPL = p; }); }
  function openRef(n, lg){ navTo(function(){ HRLG = lg || null; HREF = n; HPL = HTEAM = HLV = HSTK = null; HSEL = null; }); }
  function openTeam(n, lg){ navTo(function(){ HREF = null; HTEAM = n; HTLG = lg || teamLg(n); HTTAB = 'par'; HPL = null; HLV = null; HSTK = null; HSTV = 'sq'; HSTS = 0; HSTW = 0; }); }
  function openLeague(k){ navTo(function(){ HREF = null; HLSC = null; HLV = k; HLTAB = 'par'; HTEAM = null; HPL = null; HSEL = null; HSTK = null; HSTV = 'sq'; HSTS = 0; HSTW = 0; HLDAY = null; }); }
  function openStat(k){ navTo(function(){ HSTK = k; }); }
  var LASTNB = 0;
  window.addEventListener('popstate', function(){ if(MCAT !== 'home') return; if(Date.now() - LASTNB < 700 || !(HSEL || HPL || HTEAM || HLV || HREF || HSTK)) return; navBack(); });
  function backBtn(){
    var b = el('button', 'hback', '‹'); b.type = 'button'; b.setAttribute('aria-label', 'Indietro');
    b.addEventListener('click', function(){ if(history.state && history.state.slb) history.back(); else navBack(); });
    return b;
  }
  // --- elementi comuni ---
  function segmented(box, items, cur, pick){
    var sw = el('div', 'hpills');
    items.forEach(function(o){
      var b = el('button', 'hpill' + (cur === o[0] ? ' on' : ''), o[1]); b.type = 'button';
      b.addEventListener('click', function(){ if(cur !== o[0]) pick(o[0]); }); sw.appendChild(b);
    });
    box.appendChild(sw);
  }
  var BNH = 68;
  function bigBanner(c1, c2, bgUrl, smallNode, title, tabsNode){
    var w = el('div', 'lgstk bnr'); w.style.setProperty('--b1', c1); w.style.setProperty('--b2', c2); w.style.top = 'calc(' + stkTop() + ' - ' + BNH + 'px)'; w.setAttribute('data-hid', BNH);
    var h = el('div', 'bnh');
    if(bgUrl){ var bg = el('img', 'bnbg' + (/champions/i.test(title || '') ? ' wh' : '')); bg.src = bgUrl; bg.alt = ''; h.appendChild(bg); }
    h.appendChild(backBtn());
    var t = el('div', 'bnt'); if(smallNode){ var cw = el('span', 'bnc'); cw.appendChild(smallNode); t.appendChild(cw); }
    t.appendChild(el('div', 'htn', title)); h.appendChild(t);
    w.appendChild(h); w.appendChild(tabsNode); return w;
  }
  function stkTop(){ var b = document.querySelector('.slb-bar'); return ((b ? b.offsetHeight : 57) - 1) + 'px'; }
  function tabsBar(items, cur, scroll, pick){
    var tabs = el('div', 'htabs' + (scroll ? ' sc' : ''));
    var ids = items.map(function(o){ return o[0]; });
    items.forEach(function(o){
      var t = el('button', cur === o[0] ? 'on' : '', o[1]); t.type = 'button';
      t.setAttribute('data-k', o[0]);
      t.addEventListener('click', function(){ var ob = tabs.querySelector('button.on'), ck = ob ? ob.getAttribute('data-k') : cur; if(ck === o[0]) return; HANIM = {t: 'tab', d: ids.indexOf(o[0]) > ids.indexOf(ck) ? 1 : -1}; pick(o[0]); drawMatch(); window.scrollTo(0, 0); });
      tabs.appendChild(t);
    });
    return tabs;
  }
  function formBoxes(s){
    var w = el('span', 'hfm');
    for(var i = 0; i < 5; i++){
      var ch = s.charAt(i - (5 - s.length)), b = el('i', '', i >= 5 - s.length ? ch : '');
      if(i >= 5 - s.length) b.style.background = VCOL[ch]; else b.className = 'e';
      w.appendChild(b);
    }
    return w;
  }
  // --- classifica: normale / forma, totale / casa / trasferta ---
  var ZN = {}, ZC = {ucl: ['#2F6FE0', 'Champions League'], uel: ['#F28C1E', 'Europa League'], uecl: ['#22A559', 'Conference League'], rel: ['#E04848', 'Retrocessione'], relp: ['#F29A9A', 'Spareggio retrocessione'], r16: ['#2F6FE0', 'Ottavi di finale'], po: ['#F28C1E', 'Sedicesimi (spareggi)'], out: ['#E04848', 'Eliminate']}, ZO = ['ucl', 'r16', 'uel', 'po', 'uecl', 'relp', 'rel', 'out'];
  function zoneCat(key, rank){
    var z = ZN[key] && ZN[key][String(rank)]; if(!z || !z[0]) return null;
    var d = String(z[0]).toLowerCase(), lgz = key.indexOf('uefa.') !== 0;
    if(d.indexOf('round of 16') >= 0) return 'r16'; if(d.indexOf('playoffs') >= 0) return 'po'; if(d.indexOf('eliminated') >= 0) return 'out';
    if(d.indexOf('relegation playoff') >= 0) return 'relp'; if(d.indexOf('relegat') >= 0) return 'rel';
    if(d.indexOf('champions') >= 0) return 'ucl'; if(d.indexOf('conference') >= 0) return 'uecl';
    if(d.indexOf('europa') >= 0) return (lgz && rank > 7) ? null : 'uel';
    return null;
  }
  function zoneRow(row, key, rank, used){ var k = zoneCat(key, rank); if(!k) return; row.style.boxShadow = 'inset 4px 0 0 ' + ZC[k][0]; used[k] = 1; }
  function zoneLegend(c, used){
    var ks = ZO.filter(function(k){ return used[k]; }); if(!ks.length) return;
    var l = el('div', 'zlg'); ks.forEach(function(k){ var x = el('div', 'zli'), b = el('i'); b.style.background = ZC[k][0]; x.appendChild(b); x.appendChild(document.createTextNode(ZC[k][1])); l.appendChild(x); }); c.appendChild(l);
  }
  function tableView(box, lg, hl, pin){
    var T = HD.tab && HD.tab[lg];
    var pl0 = box.childNodes.length;
    segmented(box, [['forma', 'Forma'], ['tot', 'Totale'], ['casa', 'Casa'], ['trasf', 'Trasferta']], HFORM ? 'forma' : HTT, function(v){ if(v === 'forma'){ HFORM = true; } else { HFORM = false; HTT = v; } drawMatch(); });
    var pillRow = box.lastChild; if(pillRow && pillRow.classList) pillRow.classList.add('p4');
    var rows = T && T[HFORM ? 'tot' : HTT];
    if(!rows || !rows.length){ box.appendChild(el('div', 'hempty', 'Classifica non ancora disponibile')); return; }
    var c = el('div', 'hcard'), h = el('div', HFORM ? 'htab hfr' : 'htab');
    (HFORM ? ['#', 'Squadra', 'Ultime 5'] : ['#', 'Squadra', 'G', 'DR', 'Pt']).forEach(function(t, i){ var s = el('span', '', t); if(i > 1) s.style.textAlign = 'right'; h.appendChild(s); });
    c.appendChild(h);
    var zu = {}, zk = (HFORM || HTT === 'tot') ? lg : null;
    rows.forEach(function(r, i){
      var row = el('div', (HFORM ? 'htr hfr' : 'htr') + (hl && hl.indexOf(r[0]) >= 0 ? ' hl' : '')); row.style.cursor = 'pointer';
      row.appendChild(el('span', '', String(i + 1)));
      var nm = el('span', 'nm'); nm.appendChild(crestEl(r[1], r[0], 22)); nm.appendChild(el('span', '', r[0])); row.appendChild(nm);
      if(HFORM) row.appendChild(formBoxes(r[5] || ''));
      else {
        var g = el('span', '', String(r[2])), d = el('span', '', (r[3] > 0 ? '+' : '') + r[3]), p = el('b', '', String(r[4]));
        [g, d, p].forEach(function(s){ s.style.textAlign = 'right'; row.appendChild(s); });
      }
      row.addEventListener('click', function(){ openTeam(r[0], lg); });
      if(zk) zoneRow(row, zk, i + 1, zu);
      c.appendChild(row);
    });
    if(zk) zoneLegend(c, zu);
    box.appendChild(c);
    if(pin) pinCard(c, box);
  }
  function stuckBottom(){
    var sb = document.querySelector('#slbMatch .bnr, #slbMatch .hhero.mst'); if(!sb) return 0;
    var hid = +(sb.getAttribute('data-hid') || 0);
    return parseFloat(stkTop()) + sb.offsetHeight - hid;
  }
  function pinCard(c, box){ document.body.classList.remove('pinon'); }
  var CTAB = {}, CTF = {};
  function ccGet(k){ try{ var q = localStorage.getItem('slbc1:' + k); return q ? JSON.parse(q) : null; }catch(e){ return null; } }
  function ccPut(k, v){ try{ localStorage.setItem('slbc1:' + k, JSON.stringify(v)); }catch(e){} }
  function ctRedraw(code){ if(!lvVisible()) return; if((HSEL && HSEL.lg === code) || (HLV && CUPK[HLV] && CUPK[HLV][0] === code && !HSEL && !HPL && !HTEAM)) drawMatch(); }
  function ctFetch(code){
    if(CTF[code] && Date.now() - CTF[code] < 300000) return; CTF[code] = Date.now();
    fetch(LVURL + '/t?lg=' + encodeURIComponent(code)).then(function(r){ return r.json(); }).then(function(j){
      var nv = j && j.groups ? j : null, old = CTAB[code];
      if(nv && nv.groups.length){ ccPut('t:' + code, nv); }
      if(!nv) nv = old || {groups: []};
      var ch = !old || JSON.stringify(old) !== JSON.stringify(nv); CTAB[code] = nv; if(ch) ctRedraw(code);
    }).catch(function(){ if(!CTAB[code]){ CTAB[code] = {groups: []}; ctRedraw(code); } });
  }
  function cupPrefetch(){ Object.keys(CUPK).forEach(function(k){ ctFetch(CUPK[k][0]); cfFetch(CUPK[k][0], k); }); if(window.requestIdleCallback) requestIdleCallback(function(){ loadExtra(); }, {timeout: 4000}); else setTimeout(loadExtra, 3500); }
  function cupTable(box, m){
    var T = CTAB[m.lg]; if(!T){ var cc0 = ccGet('t:' + m.lg); if(cc0) T = CTAB[m.lg] = cc0; }
    ctFetch(m.lg);
    if(!T){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
    var gs = (T.groups || []).filter(function(g){ return g.rows && g.rows.length; });
    if(!gs.length){ box.appendChild(el('div', 'hempty', 'Classifica non ancora disponibile')); return; }
    gs.forEach(function(g){
      var c = el('div', 'hcard'); if(gs.length > 1 && g.n) c.appendChild(el('div', 'hsec', g.n));
      var h = el('div', 'htab'); ['#', 'Squadra', 'G', 'DR', 'Pt'].forEach(function(t, i){ var s = el('span', '', t); if(i > 1) s.style.textAlign = 'right'; h.appendChild(s); }); c.appendChild(h);
      var zu = {};
      g.rows.forEach(function(r, i){
        var hl = lvSame(r.t, m.h) || lvSame(r.t, m.a), row = el('div', 'htr' + (hl ? ' hl' : ''));
        row.appendChild(el('span', '', String(r.rk || i + 1)));
        var nm = el('span', 'nm'); nm.appendChild(crestEl(r.l, r.t, 22)); nm.appendChild(el('span', '', r.t)); row.appendChild(nm);
        var d = r.gd != null ? r.gd : (r.gf || 0) - (r.ga || 0);
        [String(r.p == null ? '' : r.p), (d > 0 ? '+' : '') + d, String(r.pt == null ? '' : r.pt)].forEach(function(t, k){ var s = el(k === 2 ? 'b' : 'span', '', t); s.style.textAlign = 'right'; row.appendChild(s); });
        if(gs.length === 1) zoneRow(row, m.lg, r.rk || i + 1, zu);
        c.appendChild(row);
      });
      if(gs.length === 1) zoneLegend(c, zu);
      box.appendChild(c); if(gs.length === 1) pinCard(c, box);
    });
  }
  function tabTable(box){ if(HSEL.cup){ cupTable(box, HSEL); return; } tableView(box, HSEL.lg, [HSEL.h, HSEL.a], true); }
  // --- righe partita (home e campionato) ---
  function matchRow(m){
    var r = el('button', 'hrow'); r.type = 'button';
    var R = resIdx(), sc = m.sh != null ? [m.sh, m.sa] : (R && R[m.d + '|' + m.h + '|' + m.a]);
    var le = lvOf(m); if(le && le.st !== 'pre' && !sc) sc = [le.sh, le.sa]; var lt = le && le.st === 'in' ? lvMin(le) : (le && le.st === 'post' ? 'FT' : null);
    var tmx = el('span', 'tm' + (m.g ? ' two' : '')); if(m.g){ tmx.appendChild(el('span', '', shortDay(m.d))); tmx.appendChild(el('span', '', lt || (sc ? 'FT' : timeOf(m.t)))); } else tmx.textContent = lt || (sc ? 'FT' : (timeOf(m.t) || 'Da definire'));
    if(le && le.st === 'in') tmx.className += ' lv';
    r.appendChild(tmx);
    var t = el('div', 'tms'), a = el('div'), b = el('div');
    a.appendChild(crestEl(m.hl, m.h, 22)); a.appendChild(el('span', '', m.h));
    b.appendChild(crestEl(m.al, m.a, 22)); b.appendChild(el('span', '', m.a));
    t.appendChild(a); t.appendChild(b); r.appendChild(t);
    if(sc){ var hs = el('span', 'hsc' + (le && le.st === 'in' ? ' lv' : '')); hs.appendChild(el('span', '', String(sc[0]))); hs.appendChild(el('span', '', String(sc[1]))); r.appendChild(hs); }
    r.appendChild(el('span', 'chev2', '›'));
    r.addEventListener('click', function(){ openMatch(m); });
    return r;
  }
  // --- pagina squadra ---
  function drawTeamPage(body){
    var name = HTEAM, lg = HTLG, col = (TM && TM.col && TM.col[name]) || '#1F63E0';
    themeVars(document.getElementById('slbMatch'), col);
    var tt2 = tabsBar([['par', 'Partite'], ['class', 'Classifica'], ['squ', 'Squadra'], ['gio', 'Giocatori'], ['sta', 'Statistiche']], HTTAB, true, function(v){ HTTAB = v; HSTK = null; });
    var wrp2 = bigBanner(col, shade(col, -.55), tLogo(name), crestEl(tLogo(name), name, 30), name, tt2); body.appendChild(wrp2);
    var hc = el('div', 'hc'); body.appendChild(hc);
    teamTabInto(hc, name, lg);
  }
  function teamTabInto(hc, name, lg){
    if(HTTAB === 'class'){ tableView(hc, lg, [name], true); return; }
    if(needExtra()){ hc.appendChild(el('div', 'hempty', 'Carico…')); return; }
    if(HTTAB === 'par') teamMatches(hc, name, lg);
    else if(HTTAB === 'squ') teamRoster(hc, name);
    else if(HTTAB === 'gio') playersStats(hc, name, lg);
    else teamStats(hc, name, lg);
  }
  function shortDay(d){ try{ return new Date(d + 'T12:00:00').toLocaleDateString('it-IT', {weekday: 'short', day: 'numeric'}); }catch(e){ return d; } }
  function dmy(d){ var p = String(d).split('-'); return p[2] + '/' + p[1]; }
  function teamMatches(hc, name, lg){
    var res = TM && TM.res && TM.res[lg] && TM.res[lg][name];
    if(!res || !res.length){ hc.appendChild(el('div', 'hempty', 'Partite non ancora disponibili')); return; }
    var next = [], past = res.filter(function(x){ return x[3] != null; }).reverse(), liv = [];
    res.forEach(function(x){
      if(x[3] != null) return;
      var pr = {d: x[0], lg: lg, h: x[2] ? name : x[1], a: x[2] ? x[1] : name}, le = LV.ev.length ? lvOf(pr) : null;
      if(le && le.st === 'post' && le.sh != null){ var gf = x[2] ? +le.sh : +le.sa, ga = x[2] ? +le.sa : +le.sh; past.unshift([x[0], x[1], x[2], gf, ga]); return; }
      if(le && le.st === 'in'){ liv.push([x, le, pr]); next.push(x); return; }
      next.push(x);
    });
    past.sort(function(p, q){ return p[0] < q[0] ? 1 : p[0] > q[0] ? -1 : 0; });
    function liveOf(x){ for(var i = 0; i < liv.length; i++){ if(liv[i][0] === x) return liv[i]; } return null; }
    function card(title, list, isPast){
      if(!list.length) return;
      var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', title));
      list.forEach(function(x){
        var ms = (HD.matches || []).filter(function(m){ return m.d === x[0] && ((x[2] && m.h === name && m.a === x[1]) || (!x[2] && m.a === name && m.h === x[1])); })[0];
        var lvx = !isPast && liveOf(x), lve = lvx && lvx[1];
        if(lvx && !ms){ ms = {d: x[0], lg: lg, h: lvx[2].h, a: lvx[2].a, hl: tLogo(lvx[2].h), al: tLogo(lvx[2].a), t: lve.d}; }
        var r = el('div', 'hrs' + (ms ? ' tap' : ''));
        r.appendChild(el('span', 'dt' + (lve ? ' lvr' : ''), lve ? (lvMin(lve) || 'LIVE') : dmy(x[0])));
        var o = el('span', 'op'); o.appendChild(crestEl(tLogo(x[1]), x[1], 22)); o.appendChild(el('span', '', x[1] + (x[2] ? '' : ' (T)'))); r.appendChild(o);
        if(isPast){
          var res_ = x[3] > x[4] ? 'V' : x[3] === x[4] ? 'P' : 'S', sc = el('span', 'sc2', x[3] + ' - ' + x[4]), bd = el('i', 'vps', res_); bd.style.background = VCOL[res_];
          r.appendChild(sc); r.appendChild(bd);
        } else if(lve){ r.appendChild(el('span', 'sc2 lvr', lve.sh + ' - ' + lve.sa)); }
        else { var tt0 = ms && ms.t ? timeOf(ms.t) : ''; r.appendChild(el('span', 'sc2' + (tt0 ? '' : ' tbd'), tt0 || 'Da definire')); }
        if(ms) r.addEventListener('click', function(){ openMatch(ms); });
        c.appendChild(r);
      });
      hc.appendChild(c);
    }
    card('Prossime partite', next.slice(0, 6), false);
    card('Risultati', past, true);
  }
  function teamRoster(hc, name){
    var rows = ST && ST.players.filter(function(r){ return r[SC.t] === name && !CUPK[r[SC.lg]]; });
    if(!rows || !rows.length){ hc.appendChild(el('div', 'hempty', 'Rosa non ancora disponibile')); return; }
    rows.sort(function(a, b){ return b[SC.min] - a[SC.min]; });
    [['P', 'Portieri'], ['D', 'Difensori'], ['C', 'Centrocampisti'], ['A', 'Attaccanti']].forEach(function(g){
      var list = rows.filter(function(r){ return (r[SC.pos] || 'C') === g[0]; });
      if(!list.length) return;
      var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', g[1]));
      list.forEach(function(r){ c.appendChild(playerLine(r, r[SC.g] + ' partite \u00B7 ' + Math.round(r[SC.min] / Math.max(1, r[SC.g])) + '\u2019 a partita', null)); });
      hc.appendChild(c);
    });
  }
  function avatar(url, name, size){
    var pf = el('span', 'pfc'); pf.style.width = pf.style.height = size + 'px';
    if(url){ var im = el('img'); im.src = url; im.alt = ''; im.decoding = 'async'; im.loading = 'lazy'; im.onerror = function(){ im.remove(); pf.textContent = inits(name); }; pf.appendChild(im); } else pf.textContent = inits(name);
    return pf;
  }
  function playerLine(r, sub, val, idx){
    var b = el('button', 'hpl'); b.type = 'button';
    if(idx != null) b.appendChild(el('span', 'rk', String(idx)));
    b.appendChild(avatar((ST.ph && ST.ph[r[0]]) || (CUPK[r[SC.lg]] ? lvPhoto({n: r[SC.n]}, r[SC.t]) : null), r[SC.n], 38));
    var mid = el('span', 'mid'), nb = el('b', ''); nb.appendChild(crestEl(tLogo(r[SC.t]), r[SC.t], 14)); nb.appendChild(document.createTextNode(' ' + r[SC.n])); mid.appendChild(nb);
    if(sub) mid.appendChild(el('small', '', sub)); b.appendChild(mid);
    if(val != null) b.appendChild(el('span', 'val', val));
    var db = dbById(r[0]) || findPlayer(r[SC.n], r[SC.t]);
    if(db) b.addEventListener('click', function(){ openPlayer(db); }); else b.style.cursor = 'default';
    return b;
  }
  // --- statistiche giocatori: classifiche ---
  function p90(r, k){ return r[SC.min] > 0 ? r[SC[k]] / r[SC.min] * 90 : null; }
  var PRK = [
    {k: 'go', t: 'Capocannonieri', f: function(r){ return r[SC.go]; }, d: 0, s: 'gol'},
    {k: 'as', t: 'Assist', f: function(r){ return r[SC.as]; }, d: 0, s: 'assist'},
    {k: 'sh', t: 'Tiri totali ogni 90’', f: function(r){ return p90(r, 'sh'); }, d: 2, min: 270},
    {k: 'st', t: 'Tiri in porta ogni 90’', f: function(r){ return p90(r, 'st'); }, d: 2, min: 270},
    {k: 'form', t: 'Più in forma (tiri ultime 5)', f: function(r){ return r[SC.l5g] >= 3 ? r[SC.l5sh] : null; }, d: 0, s: 'tiri in 5 partite'},
    {k: 'fo', t: 'Falli commessi ogni 90’', f: function(r){ return p90(r, 'fo'); }, d: 2, min: 270},
    {k: 'fs', t: 'Falli subiti ogni 90’', f: function(r){ return p90(r, 'fs'); }, d: 2, min: 270},
    {k: 'y', t: 'Cartellini gialli', f: function(r){ return r[SC.y]; }, d: 0, s: 'gialli'},
    {k: 'r', t: 'Cartellini rossi', f: function(r){ return r[SC.r]; }, d: 0, s: 'rossi'},
    {k: 'of', t: 'Fuorigioco ogni 90’', f: function(r){ return p90(r, 'of'); }, d: 2, min: 270}
  ];
  var PSKIP = {goals: 1, assists: 1, total_shots: 1, ShotsOnTarget: 1, fouls: 1, was_fouled: 1, Offsides: 1, yellow_cards: 1, red_cards: 1, minutes_played: 1, rating_title: 1};
  var PINV = {dispossessed: 1, dribbled_past: 1, error_led_to_goal: 1, error_led_to_shot: 1, goals_conceded: 1};
  var PRKX = null;
  function prkExt(){
    if(PRKX) return PRKX;
    if(!SX || !SX.lab) return [];
    PRKX = [];
    var tot = {}; SX.cols.forEach(function(k){ if(/\|t$/.test(k)) tot[k.slice(0, -2)] = 1; });
    Object.keys(SX.lab).forEach(function(k){
      if(PSKIP[k]) return;
      var mt = SX.lab[k], lab = PIT[k] || mt[0] || k, grp = pgName(mt[1]), pc = !tot[k] && /percent/i.test(mt[2] || '');
      (function(k, lab, grp, pc){
        PRKX.push({k: 'x:' + k, t: lab + (pc ? '' : ' ogni 90\u2019'), g: grp, d: pc ? 1 : 2, u: pc ? '%' : '', min: 270,
          f: function(r){ var x = SXR[r[0]]; if(!x || !(x[SXH.min] > 0)) return null; return pc ? sxv(x, k) : sxv(x, k) / x[SXH.min] * 90; }});
        if(tot[k]) PRKX.push({k: 'x:' + k + '%', t: lab + ' \u00B7 precisione', g: grp, d: 1, u: '%', min: 270,
          f: function(r){ var x = SXR[r[0]]; if(!x) return null; var t = sxv(x, k + '|t'); return t >= 15 ? 100 * sxv(x, k) / t : null; }});
      })(k, lab, grp, pc);
    });
    var go = {}, gi = 0; PRKX.forEach(function(d){ if(go[d.g] == null) go[d.g] = gi++; });
    PRKX = PRKX.map(function(d, i){ return [go[d.g], i, d]; }).sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; }).map(function(x){ return x[2]; });
    return PRKX;
  }
  function prkAll(){ return PRK.concat(prkExt()); }
  var PRC = {}, PLC = {};
  function pRank(def, lg, team){
    var ck = def.k + '|' + (team ? 'T:' + team : lg); if(PRC[ck]) return PRC[ck];
    var pk = team ? 'T:' + team : lg, base = PLC[pk];
    if(!base) base = PLC[pk] = ST.players.filter(function(r){ return team ? (r[SC.t] === team && !CUPK[r[SC.lg]]) : r[SC.lg] === lg; });
    var out = [];
    base.forEach(function(r){
      if(def.min && r[SC.min] < def.min) return;
      var v = def.f(r); if(v == null || isNaN(v) || v <= 0) return;
      out.push({r: r, v: v});
    });
    out.sort(function(a, b){ return b.v - a.v || b.r[SC.min] - a.r[SC.min]; });
    return PRC[ck] = out;
  }
  function fmtV(v, d){ return f1(d ? v.toFixed(d) : String(Math.round(v))); }
  var LZO = null;
  function lazyObs(c){
    if(!window.IntersectionObserver){ c.__f(); return; }
    if(!LZO) LZO = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ var t = e.target; LZO.unobserve(t); if(t.__f){ var f = t.__f; t.__f = null; f(); } } }); }, {rootMargin: '900px 0px'});
    LZO.observe(c);
  }
  var JMP = null;
  function jumpBtn(hc, items){
    var w = el('div', 'hjw'), b = el('button', 'hjb', 'Vai a ▾'); b.type = 'button'; var m = el('div', 'hjm'); m.style.display = 'none';
    items.forEach(function(it){
      var o = el('button', it.g ? 'g' : '', it.t); o.type = 'button';
      o.addEventListener('click', function(ev){ ev.stopPropagation(); m.style.display = 'none'; if(it.n && it.n.scrollIntoView) it.n.scrollIntoView({behavior: 'smooth', block: 'start'}); });
      m.appendChild(o);
    });
    b.addEventListener('click', function(ev){ ev.stopPropagation(); m.style.display = m.style.display === 'none' ? 'block' : 'none'; });
    var close = function(){ m.style.display = 'none'; }; document.addEventListener('click', close, {once: false, passive: true});
    w.appendChild(b); w.appendChild(m); return w;
  }
  function playersStats(hc, team, lg){
    if(!ST){ hc.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili')); return; }
    var def = HSTK && prkAll().filter(function(x){ return x.k === HSTK; })[0];
    if(def){
      var hd = el('div', 'hdh'); hd.appendChild(backBtn()); hd.appendChild(el('span', 'hdt', def.t)); hc.appendChild(hd);
      var c = el('div', 'hcard');
      pRank(def, lg, team).slice(0, 20).forEach(function(o, i){ c.appendChild(playerLine(o.r, o.r[SC.g] + ' partite', fmtV(o.v, def.d) + (def.u || ''), i + 1)); });
      if(!c.childNodes.length) c.appendChild(el('div', 'hempty', 'Nessun dato'));
      hc.appendChild(c); return;
    }
    var lastG = null, jit = [], jph = el('div', 'hjph'), nfill = 0; hc.appendChild(jph);
    prkAll().forEach(function(d){
      var rk = pRank(d, lg, team); if(!rk.length) return;
      var gg = d.g || 'Principali';
      if(gg !== lastG){ lastG = gg; var gh = el('div', 'hsec hgs', gg); hc.appendChild(gh); jit.push({t: gg, n: gh, g: 1}); }
      var c = el('div', 'hcard');
      var fill = (function(c, d, rk){ return function(){
        var h = el('button', 'hch'); h.type = 'button'; h.appendChild(el('span', '', d.t)); h.appendChild(el('span', 'chev2', '›'));
        h.addEventListener('click', function(){ openStat(d.k); }); c.appendChild(h);
        rk.slice(0, 3).forEach(function(o, i){ c.appendChild(playerLine(o.r, null, fmtV(o.v, d.d) + (d.u || ''), i + 1)); });
        c.style.minHeight = ''; c.removeAttribute('data-lz'); }; })(c, d, rk);
      if(nfill++ < 8) fill(); else { c.style.minHeight = '188px'; c.setAttribute('data-lz', '1'); c.__f = fill; lazyObs(c); }
      hc.appendChild(c); jit.push({t: d.t, n: c});
    });
    if(jit.length){ var f0 = jit[0].n; f0.style.position = 'relative'; f0.appendChild(jumpBtn(hc, jit)); }
  }
  // --- statistiche squadre ---
  var TMET = [['sh', 'Tiri totali', 'Tiri subiti'], ['st', 'Tiri in porta', 'Tiri in porta subiti'], ['fo', 'Falli commessi', 'Falli subiti'],
              ['co', 'Angoli fatti', 'Angoli subiti'], ['pt', 'Sanzioni prese', 'Sanzioni degli avversari'], ['of', 'Fuorigioco fatti', 'Fuorigioco concessi']];
  var POL = {sh: [1, -1], st: [1, -1], fo: [-1, 1], co: [1, -1], pt: [1, -1], of: [-1, 1]};
  function goodFr(m, side, fr){ return (POL[m] ? POL[m][side] : 1) > 0 ? fr : 1 - fr; }
  function tRank(lg, m, side, w){
    var o = (SQ && SQ.lg && SQ.lg[lg]) || {}, out = [];
    Object.keys(o).forEach(function(n){ var a = tsCell(o[n], m, side, w); if(a) out.push({n: n, l: o[n].l, v: a[0], g: a[1]}); });
    out.sort(function(a, b){ return b.v - a.v; });
    return out;
  }
  function teamRow(o, i, hl, dec, unit){
    var r = el('div', 'hrs trk' + (hl ? ' hlr' : '')); r.style.cursor = 'pointer';
    r.appendChild(el('span', 'dt', String(i + 1)));
    var n = el('span', 'op'); n.appendChild(crestEl(o.l || tLogo(o.n), o.n, 22)); n.appendChild(el('span', '', o.n)); r.appendChild(n);
    r.appendChild(el('b', 'sc2', f1(o.v.toFixed(dec == null ? 2 : dec)) + (unit || '')));
    r.addEventListener('click', function(){ openTeam(o.n, null); });
    return r;
  }
  function teamStatsLeague(hc, lg){
    if(!SQ){ hc.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili')); return; }
    var TM2 = tmetAll(), def = HSTK && TM2.filter(function(x){ return x[0] === HSTK; })[0];
    var sides = [[0, 'Fatti'], [1, 'Vs']], ws = [[0, 'Totale'], [1, 'Casa'], [2, 'Trasferta']];
    if(def){
      var hd = el('div', 'hdh'); hd.appendChild(backBtn()); hd.appendChild(el('span', 'hdt', HSTS ? def[2] : def[1])); hc.appendChild(hd);
      segmented(hc, sides, HSTS, function(v){ HSTS = v; drawMatch(); }); segmented(hc, ws, HSTW, function(v){ HSTW = v; drawMatch(); });
      var c = el('div', 'hcard'); tRank(lg, def[0], HSTS, HSTW).forEach(function(o, i){ c.appendChild(teamRow(o, i)); });
      if(!c.childNodes.length) c.appendChild(el('div', 'hempty', 'Nessun dato'));
      hc.appendChild(c); return;
    }
    var jit = [], jph = el('div', 'hjph'), lastG = null; hc.appendChild(jph);
    TM2.forEach(function(d){
      var rk = tRank(lg, d[0], 0, 0); if(!rk.length) return;
      if(d[3] && d[3] !== lastG){ lastG = d[3]; var gh = el('div', 'hsec hgs', d[3]); hc.appendChild(gh); jit.push({t: d[3], n: gh, g: 1}); }
      var c = el('div', 'hcard'), h = el('button', 'hch'); h.type = 'button'; h.appendChild(el('span', '', d[1])); h.appendChild(el('span', 'chev2', '›'));
      h.addEventListener('click', function(){ openStat(d[0]); }); c.appendChild(h);
      rk.slice(0, 3).forEach(function(o, i){ c.appendChild(teamRow(o, i, false, d[4], d[5])); });
      hc.appendChild(c); jit.push({t: d[1], n: c});
    });
    if(jit.length){ var f0 = jit[0].n; f0.style.position = 'relative'; f0.appendChild(jumpBtn(hc, jit)); }
  }
  var TM2C = null;
  function tmetAll(){
    if(TM2C) return TM2C;
    var out = [], seen = {};
    Object.keys(TSC).forEach(function(g){ TSC[g].forEach(function(x){ out.push([x[0], x[1], x[1] + ' (subiti)', g, x[2] == null ? 1 : x[2], x[3] || '']); seen[x[0]] = 1; }); });
    TMET.forEach(function(d){ if(!seen[d[0]] && !TSALT_INV[d[0]]) out.push([d[0], d[1], d[2], 'Altro', 0, '']); });
    return TM2C = out;
  }
  var TSALT_INV = {sh: 1, st: 1, fo: 1, co: 1, of: 1};
  // statistiche della singola squadra (con posizione nel campionato)
  var TSC = {
    'Attacco': [['goals', 'Gol', 2], ['expected_goals', 'xG', 2], ['expected_goals_non_penalty', 'xG senza rigori', 2], ['expected_goals_on_target', 'xGOT (qualità dei tiri in porta)', 2], ['expected_goals_open_play', 'xG da azione', 2], ['expected_goals_set_play', 'xG da palla inattiva', 2], ['ShotsOffTarget', 'Tiri fuori', 1], ['shots_outside_box', 'Tiri da fuori area', 1], ['blocked_shots', 'Tiri bloccati dagli avversari', 1], ['total_shots', 'Tiri totali', 1], ['ShotsOnTarget', 'Tiri in porta', 1], ['big_chance', 'Grandi occasioni', 1], ['big_chance_missed_title', 'Grandi occasioni sbagliate', 1], ['touches_opp_box', 'Tocchi in area avversaria', 1], ['shots_inside_box', 'Tiri in area', 1], ['shots_woodwork', 'Pali e traverse', 2], ['corners', 'Corner', 1]],
    'Passaggi': [['BallPossesion', 'Possesso palla', 1, '%'], ['passes', 'Passaggi', 0], ['passes%', 'Precisione passaggi', 1, '%'], ['accurate_passes', 'Passaggi riusciti', 0], ['long_balls_accurate', 'Lanci lunghi riusciti', 1], ['accurate_crosses', 'Cross riusciti', 1], ['opposition_half_passes', 'Passaggi nella metà avversaria', 0], ['own_half_passes', 'Passaggi nella propria metà', 0], ['accurate_crosses%', 'Precisione cross', 1, '%'], ['long_balls_accurate%', 'Precisione lanci lunghi', 1, '%']],
    'Difesa': [['matchstats.headers.tackles', 'Contrasti', 1], ['interceptions', 'Intercetti', 1], ['clearances', 'Respinte', 1], ['shot_blocks', 'Tiri bloccati', 1], ['keeper_saves', 'Parate', 1], ['duel_won', 'Duelli vinti', 1], ['ground_duels_won', 'Duelli a terra vinti', 1], ['aerials_won', 'Duelli aerei vinti', 1], ['aerials_won%', 'Duelli aerei vinti %', 1, '%'], ['ground_duels_won%', 'Duelli a terra vinti %', 1, '%']],
    'Disciplina': [['fouls', 'Falli commessi', 1], ['yellow_cards', 'Gialli', 2], ['red_cards', 'Rossi', 2]],
    'Altro': [['Offsides', 'Fuorigiochi', 1], ['player_throws', 'Rimesse laterali', 1], ['dribbles_succeeded', 'Dribbling riusciti', 1], ['dribbles_succeeded%', 'Dribbling riusciti %', 1, '%']]
  };
  var TSLOW = {fouls: 1, yellow_cards: 1, red_cards: 1, Offsides: 1, ShotsOffTarget: 1};
  var TSALT = {total_shots: 'sh', ShotsOnTarget: 'st', fouls: 'fo', corners: 'co', Offsides: 'of'};
  function tsCell(o, k, side, w){
    var e = o[k] || (TSALT[k] && o[TSALT[k]]); return e && e[side] && e[side][w] || null;
  }
  function tsRank(lg, k, side, w, name){
    var T = (SQ && SQ.lg && SQ.lg[lg]) || {}, arr = [], mine = null;
    Object.keys(T).forEach(function(n){ var c = tsCell(T[n], k, side, w); if(c){ arr.push(c[0]); if(n === name) mine = c[0]; } });
    if(mine == null || arr.length < 2) return null;
    var hb = ((TSLOW[k] ? -1 : 1) * (side ? -1 : 1)) > 0;
    arr.sort(function(a, b){ return hb ? b - a : a - b; });
    var pos = arr.indexOf(mine) + 1, fr = (pos - 1) / (arr.length - 1);
    return {pos: pos, cls: fr < .34 ? 'g' : fr < .67 ? 'y' : 'r'};
  }
  function tsFmt(v, d, u){ return f1(v.toFixed(d == null ? 1 : d)) + (u || ''); }
  function teamStats(hc, name, lg){
    var o = SQ && SQ.lg && SQ.lg[lg] && SQ.lg[lg][name];
    if(!o){ hc.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili')); return; }
    var w = HSTW || 0;
    function cellFor(k, d, u, side){
      var a = tsCell(o, k, side, w), c = el('span', 'c'); if(!a) { c.appendChild(el('b', '', '–')); return c; }
      c.appendChild(el('b', '', tsFmt(a[0], d, u)));
      var r = tsRank(lg, k, side, w, name); if(r) c.appendChild(el('span', 'rkb ' + r.cls, r.pos + '°'));
      return c;
    }
    var kp = el('div', 'tsk');
    [['goals', 'GOL', 1], ['expected_goals', 'xG', 1], ['BallPossesion', 'POSSESSO', 0, '%'], ['total_shots', 'TIRI', 1]].forEach(function(x){
      var a = tsCell(o, x[0], 0, w); if(!a) return;
      var c = el('div'); c.appendChild(el('small', '', x[1])); c.appendChild(el('b', '', tsFmt(a[0], x[2], x[3] || '')));
      var r = tsRank(lg, x[0], 0, w, name); if(r){ var bb = el('span', 'rkb ' + r.cls, r.pos + '°'); c.appendChild(bb); }
      kp.appendChild(c);
    });
    if(kp.childNodes.length) hc.appendChild(kp);
    segmented(hc, [[0, 'Totale'], [1, 'Casa'], [2, 'Trasferta']], w, function(v){ HSTW = v; drawMatch(); });
    var sw = el('div', 'tssw'); sw.appendChild(el('span', '', 'Vs'));
    var sb = el('button', HSVS ? 'on' : ''); sb.type = 'button'; sb.setAttribute('aria-label', 'Vs'); sb.appendChild(el('i'));
    sb.addEventListener('click', function(){ HSVS = !HSVS; drawMatch(); }); sw.appendChild(sb); hc.appendChild(sw);
    var cats = Object.keys(TSC), cp = el('div', 'hpills hscr');
    cats.forEach(function(cn){ var b = el('button', 'hpill' + (HSCAT === cn ? ' on' : ''), cn); b.type = 'button'; b.addEventListener('click', function(){ HSCAT = cn; drawMatch(); }); cp.appendChild(b); });
    hc.appendChild(cp);
    var c = el('div', 'hcard'), hd = el('div', 'tsrow hd'); hd.appendChild(el('span', 'l', HSCAT.toUpperCase()));
    hd.appendChild(el('span', 'c', HSVS ? 'FATTI' : '')); if(HSVS) hd.appendChild(el('span', 'c', 'SUBITI'));
    c.appendChild(hd);
    var shown = 0;
    TSC[HSCAT].forEach(function(x){
      if(!tsCell(o, x[0], 0, w) && !(HSVS && tsCell(o, x[0], 1, w))) return;
      var r = el('div', 'tsrow'); r.appendChild(el('span', 'l', x[1]));
      r.appendChild(cellFor(x[0], x[2], x[3], 0)); if(HSVS) r.appendChild(cellFor(x[0], x[2], x[3], 1));
      c.appendChild(r); shown++;
    });
    if(!shown) c.appendChild(el('div', 'hempty', 'Nessun dato'));
    hc.appendChild(c);
  }
  // --- pagina campionato ---
  function drawLeaguePage(body){
    var lg = HLV;
    var root = document.getElementById('slbMatch'); themeVars(root, null);
    if(LGHERO[lg]){ }
    var lh = LGHERO[lg] || ['#0B2A6B', '#1F63E0'], lsm = null;
    if(LEAGUE_LOGOS[lg]){ lsm = el('img'); lsm.src = LEAGUE_LOGOS[lg]; lsm.alt = ''; }
    var isCup = !!CUPK[lg];
    if(isCup && lg === 'conference-league' && HLTAB !== 'par' && HLTAB !== 'class') HLTAB = 'par';
    var lt = tabsBar(isCup && lg === 'conference-league' ? [['par', 'Partite'], ['class', 'Classifica']] : [['par', 'Partite'], ['class', 'Classifica'], ['sq', 'Squadre'], ['gi', 'Giocatori'], ['ar', 'Arbitri']], HLTAB, true, function(v){ HLTAB = v; HSTK = null; if(v === 'sq' || v === 'gi' || v === 'ar') HSTV = v; });
    var wrp = bigBanner(lh[1], lh[0], LEAGUE_LOGOS[lg] || null, lsm, lgLabel(lg), lt); body.appendChild(wrp);
    var hc = el('div', 'hc'); body.appendChild(hc);
    leagueTabInto(hc, lg, isCup, wrp);
  }
  function leagueTabInto(hc, lg, isCup, wrp){
    if(HLTAB === 'class'){ if(isCup) cupTable(hc, {lg: CUPK[lg][0], h: '', a: ''}); else tableView(hc, lg, [], true); return; }
    if(HLTAB === 'par' && isCup){ cupFixtures(hc, lg, wrp); return; }
    if(HLTAB === 'par'){
      if(needExtra()){ hc.appendChild(el('div', 'hempty', 'Carico…')); return; }
      var today = romeDay(new Date()), map = {}, res = TM && TM.res && TM.res[lg];
      if(res) Object.keys(res).forEach(function(t){ res[t].forEach(function(x, i){ if(x[2]){ map[x[0] + '|' + t + '|' + x[1]] = {d: x[0], lg: lg, h: t, a: x[1], g: i + 1, sh: x[3], sa: x[4], hl: tLogo(t), al: tLogo(x[1]), t: null}; } }); });
      HD.matches.forEach(function(m){ if(m.lg !== lg) return; var o = map[m.d + '|' + m.h + '|' + m.a]; if(o){ for(var f in m) if(f !== 'sh' && f !== 'sa') o[f] = m[f]; } });
      var gr = {}; Object.keys(map).forEach(function(k){ var o = map[k]; (gr[o.g] = gr[o.g] || []).push(o); });
      var gk = Object.keys(gr).map(Number).sort(function(a, b){ return a - b; });
      if(!gk.length){ hc.appendChild(el('div', 'hempty', 'Nessuna partita')); return; }
      var curG = gk[gk.length - 1];
      for(var q = 0; q < gk.length; q++){ if(gr[gk[q]].some(function(o){ return o.d >= today; })){ curG = gk[q]; break; } }
      function rg(a, b){ var f = function(d){ return new Date(d + 'T12:00:00').toLocaleDateString('it-IT', {weekday: 'short', day: 'numeric'}); }; return f(a) + (a === b ? '' : ' – ' + f(b)) + ' ' + new Date(b + 'T12:00:00').toLocaleDateString('it-IT', {month: 'short'}); }
      var curEl = null, ci = gk.indexOf(curG), lo = HLALL[lg] && HLALL[lg].pre ? 0 : ci, hi = HLALL[lg] && HLALL[lg].post ? gk.length - 1 : Math.min(gk.length - 1, ci + 2);
      if(lo > 0){ var pb = el('button', 'hmore', 'Giornate precedenti'); pb.type = 'button'; pb.addEventListener('click', function(){ (HLALL[lg] = HLALL[lg] || {}).pre = true; drawMatch(); }); hc.appendChild(pb); }
      gk.forEach(function(g, gi){
        if(gi < lo || gi > hi) return;
        var L = gr[g].sort(function(a, b){ return a.d < b.d ? -1 : a.d > b.d ? 1 : String(a.t || '').localeCompare(String(b.t || '')); });
        var hh = el('div', 'hgh'); hh.appendChild(el('b', '', 'GIORNATA ' + g)); hh.appendChild(el('small', '', rg(L[0].d, L[L.length - 1].d))); hc.appendChild(hh);
        var box = el('div', 'hlg'); L.forEach(function(m){ box.appendChild(matchRow(m)); }); hc.appendChild(box);
        if(g === curG) curEl = hh;
      });
      if(hi < gk.length - 1){ var nb = el('button', 'hmore', 'Giornate successive'); nb.type = 'button'; nb.addEventListener('click', function(){ (HLALL[lg] = HLALL[lg] || {}).post = true; drawMatch(); }); hc.appendChild(nb); }
      return;
    }
    if(needExtra()){ hc.appendChild(el('div', 'hempty', 'Carico…')); return; }
    if(HLTAB === 'sq' || HLTAB === 'gi' || HLTAB === 'ar') HSTV = HLTAB;
    var n0 = hc.childNodes.length;
    try{ if(HSTV === 'sq') teamStatsLeague(hc, lg); else if(HSTV === 'ar') refsLeague(hc, lg); else playersStats(hc, null, lg); }catch(e){}
    if(hc.childNodes.length === n0) hc.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili'));
  }
  var CSF = {};
  function cfFetch(code, lg){
    var e = CSF[code]; if(e && (e.busy || Date.now() - e.ts < 300000)) return;
    CSF[code] = {ev: e ? e.ev : null, ts: e ? e.ts : 0, busy: true};
    fetch(LVURL + '/cs?lg=' + encodeURIComponent(code)).then(function(r){ return r.json(); }).then(function(j){
      var ev = (j && j.ev) || [], old = CSF[code] && CSF[code].ev; if(ev.length) ccPut('c:' + code, ev);
      if(!ev.length && old && old.length) ev = old;
      CSF[code] = {ev: ev, ts: Date.now()};
      if(!old || JSON.stringify(old) !== JSON.stringify(ev)){ if(HLV === lg && HLTAB === 'par' && lvVisible()) drawMatch(); }
    }).catch(function(){ CSF[code] = {ev: (CSF[code] && CSF[code].ev) || [], ts: Date.now()}; if(HLV === lg && lvVisible()) drawMatch(); });
  }
  function cupFixtures(hc, lg, wrp){
    var code = CUPK[lg][0], e = CSF[code];
    if(!e){ var cc1 = ccGet('c:' + code); if(cc1) e = CSF[code] = {ev: cc1, ts: 0}; }
    cfFetch(code, lg);
    var cur = CSF[code] || {ev: null};
    if(!cur.ev){ hc.appendChild(el('div', 'hempty', 'Carico…')); return; }
    var evs = cur.ev.slice().sort(function(a, b){ return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
    if(!evs.length){ hc.appendChild(el('div', 'hempty', 'Nessuna partita')); return; }
    var today = romeDay(new Date()), gr = [], last = null;
    evs.forEach(function(x){
      var d = romeDay(new Date(x.d)), dn = new Date(d + 'T12:00:00').getTime();
      if(!last || dn - last > 2.2 * 86400000) gr.push([]);
      gr[gr.length - 1].push(x); last = dn;
    });
    var curG = gr.length - 1;
    for(var q = 0; q < gr.length; q++){ if(romeDay(new Date(gr[q][gr[q].length - 1].d)) >= today){ curG = q; break; } }
    function rg(a, b){ var f = function(d){ return new Date(d).toLocaleDateString('it-IT', {timeZone: 'Europe/Rome', weekday: 'short', day: 'numeric'}); }; var da = romeDay(new Date(a)), db = romeDay(new Date(b)); return f(a) + (da === db ? '' : ' – ' + f(b)) + ' ' + new Date(b).toLocaleDateString('it-IT', {timeZone: 'Europe/Rome', month: 'short'}); }
    var lo = HLALL[lg] && HLALL[lg].pre ? 0 : curG, hi = HLALL[lg] && HLALL[lg].post ? gr.length - 1 : Math.min(gr.length - 1, curG + 2);
    if(lo > 0){ var pb = el('button', 'hmore', 'Giornate precedenti'); pb.type = 'button'; pb.addEventListener('click', function(){ (HLALL[lg] = HLALL[lg] || {}).pre = true; drawMatch(); }); hc.appendChild(pb); }
    gr.forEach(function(L, i){
      if(i < lo || i > hi) return;
      var hh = el('div', 'hgh'); hh.appendChild(el('b', '', i < CUPK[lg][2] ? 'GIORNATA ' + (i + 1) : 'FASE FINALE')); hh.appendChild(el('small', '', rg(L[0].d, L[L.length - 1].d))); hc.appendChild(hh);
      var box = el('div', 'hlg'); L.forEach(function(x){ var m = lvCupM(x); m.g = i + 1; box.appendChild(matchRow(m)); }); hc.appendChild(box);
    });
    if(hi < gr.length - 1){ var nb = el('button', 'hmore', 'Giornate successive'); nb.type = 'button'; nb.addEventListener('click', function(){ (HLALL[lg] = HLALL[lg] || {}).post = true; drawMatch(); }); hc.appendChild(nb); }
  }
  // giocatori del database -> voto sulla partita
  function fixFor(p, m){
    var list = PFIX[p.t] || [], opp = p.t === m.h ? m.a : m.h;
    for(var i = 0; i < list.length; i++){ if(romeDay(new Date(list[i][0])) === m.d && list[i][1] === opp) return list[i]; }
    return null;
  }
  function votoOf(p, m, line){
    if(!PDATA) return null;
    var f = fixFor(p, m); if(!f) return null;
    var t = bLam(p, f, 0); if(!t) return null;
    return {v: bProb(t.lam, line) * 10, t: t, f: f};
  }
  var TEQ = {};
  function teamEq(a, b){ var k = a + '|' + b; if(TEQ[k] === undefined) TEQ[k] = lvSame(a, b); return TEQ[k]; }
  function findPlayer(name, team, loose){
    if(!PDATA || !name) return null;
    var q = norm(name), tq = norm(team), best = null, toks = q.split(/\s+/);
    for(var i = 0; i < PDATA.length; i++){
      var p = PDATA[i]; if(p._t !== tq && !(loose && teamEq(team, p.t))) continue;
      if(p._k === q) return p;
      var ok = true; for(var j = 0; j < toks.length; j++){ if(p._k.indexOf(toks[j]) < 0){ ok = false; break; } }
      if(ok){ best = p; continue; }
      var pt = p._k.split(/\s+/), last = toks[toks.length - 1];
      if(!best && last.length > 3 && pt[pt.length - 1] === last && pt[0].charAt(0) === toks[0].charAt(0)) best = p;
    }
    return best;
  }
  function flagOf(x){
    if(!x) return '';
    x = String(x).trim();
    if(/^[A-Za-z]{2}$/.test(x)){ return String.fromCodePoint.apply(null, x.toUpperCase().split('').map(function(c){ return 0x1F1E6 + c.charCodeAt(0) - 65; })); }
    return /[\u{1F1E6}-\u{1F1FF}]/u.test(x) ? x : '';
  }
  // === FotMob: formazioni ufficiali e arbitro (controllo ogni minuto vicino al calcio d'inizio) ===
  var FXC = {};
  function fxRedraw(m){ if(HSEL && HSEL.d === m.d && HSEL.h === m.h && HSEL.a === m.a && lvVisible() && !LVSH && !HPL && !HTEAM && !HREF && /pano|form|stat/.test(HTAB) && !(HSM === 't' && /stat/.test(HTAB))) drawMatch(); }
  function fxGet(m){
    if(!m || pastScore(m)) return null;
    var f = fmFind(m);
    if(f === undefined){ fmDay(m.d, function(){ fxRedraw(m); }); return undefined; }
    if(!f) return null;
    var c = FXC[f.id], now = Date.now(), ko = m.t ? new Date(m.t).getTime() : 0, near = ko && now > ko - 6 * 3600000 && now < ko + 4 * 3600000;
    var cj = c && c.j, ttl = near || (cj && cj.st) ? 9000 : 1800000;
    if(!c || (!c.busy && now - c.t > ttl)){
      FXC[f.id] = {j: c ? c.j : null, t: c ? c.t : 0, busy: true};
      fetch(LVURL + '/fx?id=' + f.id).then(function(r){ return r.json(); }).then(function(j){
        var fsg = function(q){ return q ? JSON.stringify([q.ty, q.h && q.h.s, q.a && q.a.s, q.ref, q.ev, q.sc, q.clk, q.stats, q.mo && q.mo.length]) : null; };
        var old = FXC[f.id] && FXC[f.id].j, sg = fsg(j), og = fsg(old);
        FXC[f.id] = {j: j && !j.error ? j : old, t: Date.now(), busy: false};
        var le = lvOf(m); if(le && j && j.sc && (j.st || j.fin)) fxApply(le, j);
        if(sg !== og) fxRedraw(m);
        if(near || (j && j.st)){ clearTimeout(FXC.tm); FXC.tm = setTimeout(function(){ if(HSEL && HSEL.d === m.d && HSEL.h === m.h && HSEL.a === m.a && lvVisible()) fxGet(m); }, 9500); }
      }).catch(function(){ FXC[f.id] = {j: c ? c.j : null, t: Date.now(), busy: false}; });
    }
    return FXC[f.id] ? FXC[f.id].j : (c ? c.j : undefined);
  }

  var FXO = {}, HSPD = 'All';
  function fxApply(e, j){
    var o = {sh: String(j.sc[0]), sa: String(j.sc[1]), t: Date.now()};
    if(j.fin){ o.st = 'post'; o.nm = 'STATUS_FULL_TIME'; o.clk = e.clk; }
    else { o.st = 'in'; o.nm = j.ht ? 'STATUS_HALFTIME' : 'STATUS_IN_PROGRESS'; o.clk = j.clk || e.clk; }
    FXO[e.id] = o; fxPut(e, o);
  }
  function fxPut(e, o){ e.sh = o.sh; e.sa = o.sa; e.st = o.st; e.nm = o.nm; e.clk = o.clk; }
  function fxData(m){ var f = fmFind(m), c = f && FXC[f.id]; return c && c.j && c.j.pl ? c.j : null; }
  function fxRows(F){
    var out = [], sc = [0, 0];
    (F.ev || []).forEach(function(e){
      var mn = e.t + (e.a ? '+' + e.a : '') + '’', side = e.h ? 'h' : 'a', pp = e.t > 45 ? 2 : 1;
      if(e.ty === 'Goal'){
        if(e.sc){ side = e.sc[0] > sc[0] ? 'h' : e.sc[1] > sc[1] ? 'a' : side; sc = [e.sc[0], e.sc[1]]; } else sc[side === 'h' ? 0 : 1]++;
        out.push({k: 'g', min: mn, side: side, n: cnm(e.n), pid: e.id, as: cnm(e.as), og: e.og, pen: e.pen, sc: sc[0] + ' - ' + sc[1], p: pp});
      } else if(e.ty === 'Card') out.push({k: /red/i.test(e.cd || '') ? 'r' : 'y', min: mn, side: side, n: e.n || '', pid: e.id, p: pp});
      else out.push({k: 's', min: mn, side: side, n: e.n || '', pid: e.id, o: e.o || '', opid: e.oid, p: pp});
    });
    return out;
  }
  var KL = {BallPossesion: 'Possesso palla', expected_goals: 'xG', total_shots: 'Tiri totali', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori', touches_opp_box: 'Tocchi in area avversaria', big_chance: 'Occasioni da gol', big_chance_missed_title: 'Occasioni sbagliate', accurate_passes: 'Passaggi precisi', yellow_cards: 'Gialli', red_cards: 'Rossi', corners: 'Corner', blocked_shots: 'Tiri bloccati', shots_woodwork: 'Legni', shots_inside_box: 'Tiri da dentro area', shots_outside_box: 'Tiri da fuori area', expected_goals_open_play: 'xG da azione', expected_goals_set_play: 'xG da palla inattiva', expected_goals_non_penalty: 'xG senza rigori', expected_goals_on_target: 'xGOT', physical_metrics_distance_covered: 'Distanza (km)', physical_metrics_running: 'Corsa (km)', physical_metrics_sprinting: 'Sprint (km)', physical_metrics_number_of_sprints: 'Numero sprint', passes: 'Passaggi', own_half_passes: 'Passaggi metà propria', opposition_half_passes: 'Passaggi metà avversaria', long_balls_accurate: 'Lanci lunghi precisi', accurate_crosses: 'Cross precisi', player_throws: 'Rimesse laterali', Offsides: 'Fuorigioco', 'matchstats.headers.tackles': 'Contrasti', interceptions: 'Intercetti', shot_blocks: 'Tiri respinti', clearances: 'Rinvii', keeper_saves: 'Parate', duel_won: 'Duelli vinti', ground_duels_won: 'Duelli a terra vinti', aerials_won: 'Duelli aerei vinti', dribbles_succeeded: 'Dribbling riusciti', fouls: 'Falli'};
  var KG = {top_stats: 'Principali', shots: 'Tiri', expected_goals: 'xG', physical_metrics: 'Prestazione fisica', passes: 'Passaggi', defense: 'Difesa', duels: 'Duelli', discipline: 'Disciplina', attack: 'Attacco'};
  function fxStats(box, m, F){
    segmented(box, [['d', 'Dati'], ['t', 'Mappa tiri']], HSM, function(v){ HSM = v; HSHOT = null; drawMatch(); });
    if(HSM === 't'){ shotsView(box, m, null); return; }
    segmented(box, [['All', 'Totale'], ['FirstHalf', '1° tempo'], ['SecondHalf', '2° tempo']], HSPD, function(v){ HSPD = v; drawMatch(); });
    var P = F.stats[HSPD];
    if(!P || !P.length){ box.appendChild(el('div', 'hempty', 'Nessun dato')); return; }
    var fouls = null; P.forEach(function(g){ g[2].forEach(function(r){ if(r[0] === 'fouls') fouls = r; }); });
    P.forEach(function(g){
      var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', KG[g[0]] || g[1]));
      var rows0 = g[2].filter(function(r){ return !(r[0] === 'fouls' && g[0] !== 'top_stats'); });
      if(g[0] === 'top_stats' && fouls && !rows0.some(function(r){ return r[0] === 'fouls'; })) rows0 = rows0.concat([fouls]);
      rows0.forEach(function(r){
        var k = r[0], lab = KL[k] || r[1], a = r[2], b = r[3], at = r[4], bt = r[5], fm = r[6] || '';
        if(a == null && b == null) return;
        var sc = 1, dec = 0;
        if(/^physical_metrics_(distance_covered|running|sprinting)$/.test(k)){ sc = .001; dec = 1; }
        else if(fm === 'double' || /expected_goals/.test(k)) dec = 2;
        c.appendChild(statRow(lab, a == null ? null : a * sc, b == null ? null : b * sc, dec, k === 'BallPossesion' ? '%' : ''));
        if(/Percentage/.test(fm) && at != null && bt != null && (at || bt)) c.appendChild(statRow(lab + ' %', at ? Math.round(100 * a / at) : 0, bt ? Math.round(100 * b / bt) : 0, 0, '%'));
      });
      if(c.childNodes.length > 1) box.appendChild(c);
    });
  }
  var PLB = {goals: 'Gol', assists: 'Assist', expected_goals: 'xG', expected_goals_on_target_variant: 'xGOT', xg_and_xa: 'xG + xA', total_shots: 'Tiri', physical_metrics_topspeed: 'Velocità massima', physical_metrics_distance_covered: 'Distanza', accurate_passes: 'Passaggi precisi', chances_created: 'Occasioni create', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori', shot_accuracy: 'Precisione tiri', defensive_actions: 'Azioni difensive', touches: 'Tocchi', touches_opp_box: 'Tocchi in area avversaria', dribbles_succeeded: 'Dribbling riusciti', dispossessed: 'Palle perse', expected_goals_non_penalty: 'xG senza rigori', 'matchstats.headers.tackles': 'Contrasti', shot_blocks: 'Tiri respinti', clearances: 'Rinvii', headed_clearance: 'Rinvii di testa', interceptions: 'Intercetti', recoveries: 'Recuperi', dribbled_past: 'Dribblato', ground_duels_won: 'Duelli a terra vinti', aerials_won: 'Duelli aerei vinti', was_fouled: 'Falli subiti', fouls: 'Falli fatti', duel_won: 'Duelli vinti', duel_lost: 'Duelli persi', physical_metrics_running: 'Corsa', physical_metrics_sprinting: 'Sprint', physical_metrics_number_of_sprints: 'Numero sprint', saves: 'Parate', goals_conceded: 'Gol subiti', yellow_cards: 'Gialli', red_cards: 'Rossi', minutes_played: 'Minuti', passes_into_final_third: 'Passaggi nell\'ultimo terzo', accurate_long_balls: 'Lanci lunghi precisi', accurate_crosses: 'Cross precisi', touches_opp_box_p: 'Tocchi in area', offsides: 'Fuorigioco', Offsides: 'Fuorigioco', goals_prevented: 'Gol evitati', expected_goals_on_target_faced: 'xGOT subito', keeper_sweeper: 'Uscite', high_claim: 'Uscite alte', punches: 'Respinte di pugno'};
  PLB.line_breaking_passes = 'Passaggi che rompono la linea'; PLB.long_balls_accurate = 'Lanci lunghi precisi'; PLB.expected_assists = 'xA'; PLB.big_chance_created_team_title = 'Occasioni da gol create'; PLB.corners = 'Corner'; PLB.keeper_diving_save = 'Parate in tuffo'; PLB.saves_inside_box = 'Parate in area'; PLB.player_throws = 'Rimesse laterali'; PLB.keeper_high_claim = 'Uscite alte'; PLB.errors_led_to_goal = 'Errori che portano a gol'; PLB.blocked_shots = 'Tiri bloccati'; PLB.shots_woodwork = 'Legni'; PLB.big_chance_missed_title = 'Occasioni sbagliate'; PLB.last_man_tackle = 'Ultimo uomo'; PLB.keeper_saves = 'Parate'; PLB.penalties_saved = 'Rigori parati';
  var PLG = {top_stats: 'Principali', attack: 'Attacco', defense: 'Difesa', duels: 'Duelli', physical_metrics: 'Fisico', passes: 'Passaggi', goalkeeping: 'Portiere', keeper: 'Portiere'};
  function fxPRow(r){
    var k = r[0], v = r[2], tot = r[3], ty = r[4]; if(v == null || k === 'rating_title' || k === 'fantasy_points' || ty === 'boolean' || ty === 'fantasyPoints') return null;
    var lab = PLB[k] || r[1], val;
    if(ty === 'double') val = f1(Number(v).toFixed(2));
    else if(ty === 'speed') val = f1(Number(v).toFixed(1)) + ' km/h';
    else if(ty === 'distance' || ty === 'distanceWithPercentage') val = f1((v / 1000).toFixed(1)) + ' km';
    else if(ty === 'fractionWithPercentage') val = Math.round(v) + '/' + Math.round(tot || 0) + (tot ? ' (' + Math.round(100 * v / tot) + '%)' : '');
    else val = String(Math.round(v * 100) / 100).replace('.', ',');
    return [lab, val];
  }
  function shBlock(body, all, name, side){
    var mine = (all || []).filter(function(q){ return q.side === side && shSame(q.n, name); });
    if(!mine.length) return;
    var c = el('div', 'lvgp'), g = 0, ot = 0, xg = 0;
    mine.forEach(function(q){ if(q.ev === 'goal') g++; if(q.ev === 'goal' || q.ev === 'saved') ot++; xg += Number(q.xg) || 0; });
    c.appendChild(el('div', 'lvgt', 'Mappa tiri'));
    var sm = el('div', 'lvshs', mine.length + (mine.length === 1 ? ' tiro' : ' tiri') + ' \u00B7 ' + ot + ' in porta' + (g ? ' \u00B7 ' + g + ' gol' : '') + ' \u00B7 xG ' + f1(xg.toFixed(2))); c.appendChild(sm);
    var mm = el('div', 'shpm'), p1 = el('div', 'p1'), p2 = el('div', 'p2');
    p1.innerHTML = shMiniPitch(mine); p2.innerHTML = shGoal2(mine, -1, side);
    mm.appendChild(p1); mm.appendChild(p2); c.appendChild(mm); body.appendChild(c);
  }
  function fxOpen(F, id, name, side, m){
    var pe = id != null && F.pl && F.pl[id], pid = id;
    if(!pe && F.pl && name){
      var q = nk(name), last = q.split(' ').pop(), ks = Object.keys(F.pl);
      ks.forEach(function(k){ if(!pe && nk(F.pl[k][0] || '') === q){ pe = F.pl[k]; pid = k; } });
      if(!pe) ks.forEach(function(k){ var kk = nk(F.pl[k][0] || ''); if(!pe && kk.split(' ').pop() === last && kk.charAt(0) === q.charAt(0)){ pe = F.pl[k]; pid = k; } });
    }
    if(!pe) return false;
    var sd = side; ['h', 'a'].forEach(function(k){ var o = F[k]; if(!o) return; (o.s || []).concat(o.b || []).forEach(function(x){ if(String(x[7]) === String(pid)) sd = k; }); });
    fxSheet(F, pid, pe, sd, m); return true;
  }
  function fxSheet(F, pid, pe, side, m){
    var team = side === 'h' ? m.h : m.a, db = findPlayer(pe[0], team, true), lp = null, rt = null, shots = 0, seen = {};
    ['h', 'a'].forEach(function(k){ var o = F[k]; if(!o) return; (o.s || []).concat(o.b || []).forEach(function(x){ if(String(x[7]) === String(pid)) lp = x; }); });
    pe[3].forEach(function(g){ g[2].forEach(function(r){ if(r[0] === 'rating_title' && r[2]) rt = Number(r[2]); if(r[0] === 'total_shots') shots = r[2] || 0; }); });
    if(!rt && lp && lp[6]) rt = Number(lp[6]);
    var p = {n: pe[0], j: lp ? lp[1] : null, pos: null, id: null, img: FMIMG + pid + '.png', rt: rt};
    lvSheet(p, team, m, null, function(block, body){
      var any = false;
      if(F.sh && F.sh.length) shBlock(body, shNorm(null, {sh: F.sh, hi: F.hi}), pe[0], side);
      pe[3].forEach(function(g){
        var rows = [];
        g[2].forEach(function(r){ if(seen[r[0]]) return; var x = fxPRow(r); if(x){ seen[r[0]] = 1; rows.push(x); } });
        if(rows.length){ block(PLG[g[0]] || g[1], rows); any = true; }
      });
      if(!any) body.appendChild(el('div', 'hempty', 'Non ancora in campo'));
      if(db){ var lk = el('button', 'lvlink', 'Scheda giocatore ›'); lk.type = 'button'; lk.addEventListener('click', function(){ lvSheetClose(); openPlayer(db); }); body.appendChild(lk); }
    });
  }
  function refCardFx(box, r){
    var c = el('div', 'hcard href');
    var h = el('div', 'rfh'), nm = el('div', 'rfn'); nm.appendChild(el('b', '', r.n)); nm.appendChild(el('small', '', (r.cc ? flagCode(r.cc) + ' ' : '') + (r.mt != null ? r.mt + ' partite · ' : '') + 'Arbitro'));
    var ic = refIc(r.n); h.appendChild(ic); h.appendChild(nm); c.appendChild(h);
    var g = el('div', 'rfg');
    [['Ammonizioni', r.y, r.ya], ['Falli', r.fo, r.foa]].forEach(function(x){
      if(x[1] == null) return;
      var d = el('div', 'rfc'); d.appendChild(el('small', '', x[0]));
      var v = el('div', 'rfv'); v.appendChild(el('b', '', f1(String(Math.round(x[1] * 10) / 10)))); v.appendChild(el('span', '', ' / partita')); d.appendChild(v);
      if(x[2] > 0){ var br = barEl(x[1], x[2], false); d.appendChild(br); var t = el('div', 'rft', barTxt(br)); t.style.color = br.getAttribute('data-c'); d.appendChild(t); }
      g.appendChild(d);
    });
    c.appendChild(g); box.appendChild(c);
  }
  function fxPhoto(u){ return typeof u === 'string' && /^https?:/.test(u) ? u : null; }
  var IBALL = "<svg viewBox=\"0 0 32 32\" width=\"16\" height=\"16\" ><g fill=\"none\"><circle cx=\"16.047\" cy=\"16\" r=\"12.778\" fill=\"#00041D\"/><g filter=\"url(#ifNNUTc)\"><path fill=\"url(#irQDFNc)\" d=\"M14.786 3.004c-.407.038-.592.151-.633.203c.15.106.14.305.117.39l4.61 1.095l4.218.765c.04-.164.008-.383-.32-.57c-3.75-2.063-7.485-1.93-7.992-1.883\"/></g><path fill=\"url(#iqZPZEe)\" d=\"M14.786 3.004c-.407.038-.592.151-.633.203c.15.106.14.305.117.39l4.61 1.095l4.218.765c.04-.164.008-.383-.32-.57c-3.75-2.063-7.485-1.93-7.992-1.883\"/><g filter=\"url(#irC3Iid)\"><path fill=\"url(#iQxxUxe)\" d=\"M3.375 19.965a.56.56 0 0 1 .043-.441l.563-.13c.805 1.082 2.458 3.277 2.633 3.415s.27.375.297.476l2.265 3.368c-.047.145-.269.367-.781.085c-2.344-1.343-4.656-5.437-5.02-6.773\"/></g><path fill=\"url(#iMi9ZNc)\" d=\"M3.375 19.965a.56.56 0 0 1 .043-.441l.563-.13c.805 1.082 2.458 3.277 2.633 3.415s.27.375.297.476l2.265 3.368c-.047.145-.269.367-.781.085c-2.344-1.343-4.656-5.437-5.02-6.773\"/><path fill=\"url(#iSFFV0b)\" d=\"M7.028 6.414c-.15.213-.133.33-.125.364l3.101-1.008l4.282-2.207c.1-.306-.15-.42-.247-.43c-.636-.09-2.191.207-3.894 1.043c-2.133 1.152-2.93 1.973-3.117 2.238\"/><path fill=\"url(#i212YIw)\" d=\"M7.028 6.414c-.15.213-.133.33-.125.364l3.101-1.008l4.282-2.207c.1-.306-.15-.42-.247-.43c-.636-.09-2.191.207-3.894 1.043c-2.133 1.152-2.93 1.973-3.117 2.238\"/><path fill=\"url(#iVsNJ9b)\" d=\"M7.028 6.414c-.15.213-.133.33-.125.364l3.101-1.008l4.282-2.207c.1-.306-.15-.42-.247-.43c-.636-.09-2.191.207-3.894 1.043c-2.133 1.152-2.93 1.973-3.117 2.238\"/><path fill=\"url(#i1y9Qbc)\" d=\"m17.758 28.946l.152-.274l6.907-3.394c.112.096.203.28 0 .585c-2.383 2.344-5.703 3.102-6.282 3.188c-.333.05-.576.043-.717.024c-.062-.008-.09-.075-.06-.13\"/><path fill=\"url(#ihKrmUD)\" d=\"M28.715 12.887c-.093-.203-.228-.281-.293-.297l-.175 4.766v3.312c1.413-2.601.851-7.101.468-7.781\"/><path fill=\"#EDEDEE\" d=\"M23.38 5.285c-.238-.125-.44-.03-.528 0l2.691 3.477l2.766 4.187a.69.69 0 0 0 .188-.617c-1.11-5.203-4.82-6.89-5.118-7.047\"/><path fill=\"url(#iHq3Rle)\" d=\"M23.38 5.285c-.238-.125-.44-.03-.528 0l2.691 3.477l2.766 4.187a.69.69 0 0 0 .188-.617c-1.11-5.203-4.82-6.89-5.118-7.047\"/><g filter=\"url(#iYTCAad)\"><path fill=\"#3D5CBC\" d=\"M3.155 19.297c-.905-3.009-.287-6.102.384-7.594a.43.43 0 0 1 .297-.238l.414 2.707q.051.332.027.668l-.327 4.567l-.254.122a.387.387 0 0 1-.541-.232\"/></g><g filter=\"url(#ijRngnb)\"><path fill=\"url(#i8fZAMb)\" d=\"M14.016 3.568a13.5 13.5 0 0 0-3.67 1.785a.89.89 0 0 0-.367.754c.02.821.089 1.665.156 2.212c.037.298.293.504.593.516c1.607.069 2.854.446 3.597.772c.345.15.749.155 1.078-.03a35 35 0 0 1 3.204-1.566a.79.79 0 0 0 .48-.826a22 22 0 0 1-.186-2.238a.64.64 0 0 0-.42-.597c-1.387-.488-2.865-.736-3.742-.844c-.243-.03-.49-.01-.723.062\"/></g><g filter=\"url(#iqn1olc)\"><path fill=\"url(#iygLImc)\" d=\"M3.998 10.822c1.174-2.227 2.05-3.282 2.522-3.74c.66-.698 2.213-1.233 3.025-1.335c.224-.029.396.148.417.373l.213 2.276a1.08 1.08 0 0 1-.322.856c-1.176 1.185-1.917 2.659-2.259 3.445a1.38 1.38 0 0 1-.788.76l-2.168.776a.475.475 0 0 1-.634-.35a18 18 0 0 1-.253-2.027a2 2 0 0 1 .247-1.034\"/></g><path fill=\"url(#iz4f9bd)\" d=\"M3.998 10.822c1.174-2.227 2.05-3.282 2.522-3.74c.66-.698 2.213-1.233 3.025-1.335c.224-.029.396.148.417.373l.213 2.276a1.08 1.08 0 0 1-.322.856c-1.176 1.185-1.917 2.659-2.259 3.445a1.38 1.38 0 0 1-.788.76l-2.168.776a.475.475 0 0 1-.634-.35a18 18 0 0 1-.253-2.027a2 2 0 0 1 .247-1.034\"/><g filter=\"url(#iGKXIvY)\"><path fill=\"#867CFF\" d=\"M17.348 29.176c-4.492.117-7.268-1.263-8.398-2.055c-.125-.084-.154-.207-.149-.25a.47.47 0 0 0 .313-.113l4.836.91l3.921.977c.04.146-.03.475-.523.531\"/></g><path fill=\"url(#iTL9fbN)\" d=\"M17.348 29.176c-4.492.117-7.268-1.263-8.398-2.055c-.125-.084-.154-.207-.149-.25a.47.47 0 0 0 .313-.113l4.836.91l3.921.977c.04.146-.03.475-.523.531\"/><g filter=\"url(#ijQ0NVc)\"><path fill=\"url(#iOiUBtb)\" d=\"m23.515 15.125l.023-4.153a.51.51 0 0 1 .326-.47c.936-.373 1.504-.73 1.836-1.002c.178-.145.446-.16.603.007c.713.762 1.407 1.82 1.87 2.617a3.76 3.76 0 0 1 .496 1.712a25 25 0 0 1-.09 3.545a.96.96 0 0 1-.509.747l-1.735.93a.313.313 0 0 1-.438-.176c-.517-1.437-1.414-2.415-2.02-2.964a1.07 1.07 0 0 1-.362-.793\"/></g><g filter=\"url(#iLuVBge)\"><path fill=\"url(#i6Z1Oac)\" d=\"M14.008 27.385c.228-.687.295-1.466.29-2.049a.83.83 0 0 1 .467-.768l3.717-1.692c.315-.144.679-.107.991.042c1.091.521 2.505.663 3.238.643c.189-.006.364.144.36.333c-.024 1.156-.16 1.92-.32 2.44a1.18 1.18 0 0 1-.496.634c-1.441.934-3.065 1.549-3.989 1.755a1.6 1.6 0 0 1-.573.012a20.6 20.6 0 0 1-3.446-.816c-.215-.075-.31-.318-.24-.534\"/></g><g filter=\"url(#i2cHhrc)\"><path fill=\"url(#icv3Kyd)\" d=\"m6.734 13.349l-2.132.877a.85.85 0 0 0-.527.596c-.194.893-.326 2.481-.265 3.805c.02.412.11.819.307 1.181c.513.953 1.475 2.197 2.17 2.897c.28.283.707.292 1.057.104c.627-.338 1.194-.546 2.117-.826a.76.76 0 0 0 .537-.675l.238-3.845a1.08 1.08 0 0 0-.404-.891c-1.123-.938-1.826-2.07-2.238-2.888a.68.68 0 0 0-.86-.335\"/></g><g filter=\"url(#iev6p7b)\"><path fill=\"url(#ilNcBGc)\" d=\"M25.772 19.504c-.795 1.681-1.894 3.15-2.523 3.883a1.06 1.06 0 0 0-.255.583l-.236 2.314c-.012.115.045.232.16.244c.287.03.849-.112 1.97-.828c1.35-1.165 2.827-3.72 3.327-4.875c.314-.82.348-1.88.298-2.555c-.015-.203-.231-.311-.411-.218l-1.871.97a1.04 1.04 0 0 0-.459.482\"/></g><path fill=\"url(#iOoKzZc)\" d=\"M25.772 19.504c-.795 1.681-1.894 3.15-2.523 3.883a1.06 1.06 0 0 0-.255.583l-.236 2.314c-.012.115.045.232.16.244c.287.03.849-.112 1.97-.828c1.35-1.165 2.827-3.72 3.327-4.875c.314-.82.348-1.88.298-2.555c-.015-.203-.231-.311-.411-.218l-1.871.97a1.04 1.04 0 0 0-.459.482\"/><g filter=\"url(#iup3OMd)\"><path fill=\"url(#iXoQHed)\" d=\"M23.08 15.727c-1.121.463-2.694 1.266-3.514 1.732a.91.91 0 0 0-.451.683c-.19 1.485-.27 3-.249 3.962a.88.88 0 0 0 .525.786c1.28.569 2.346.72 3.09.74c.378.011.747-.12 1.023-.377c1.034-.965 1.898-2.525 2.303-3.476c.15-.35.156-.744.015-1.1c-.495-1.253-1.36-2.333-1.96-2.85c-.216-.188-.517-.209-.781-.1\"/></g><g filter=\"url(#ivsQ9Wc)\"><path fill=\"url(#im5it8d)\" d=\"M9.513 21.946a22 22 0 0 0-2.336.928a.534.534 0 0 0-.288.665c.382 1.058 1.274 2.695 2.467 3.403c1.503.74 3.114.909 4.034.894c.223-.003.443-.095.547-.294c.3-.58.38-1.645.36-2.453a.76.76 0 0 0-.344-.606l-3.61-2.416a.96.96 0 0 0-.83-.121\"/></g><path fill=\"url(#iuyecPg)\" d=\"M9.513 21.946a22 22 0 0 0-2.336.928a.534.534 0 0 0-.288.665c.382 1.058 1.274 2.695 2.467 3.403c1.503.74 3.114.909 4.034.894c.223-.003.443-.095.547-.294c.3-.58.38-1.645.36-2.453a.76.76 0 0 0-.344-.606l-3.61-2.416a.96.96 0 0 0-.83-.121\"/><g filter=\"url(#iRiCLEb)\"><path fill=\"url(#i8nTCnc)\" d=\"M14.22 15.19c-1.027.598-2.428 1.166-3.412 1.522c-.36.13-.626.448-.666.83a37 37 0 0 0-.188 3.848a.93.93 0 0 0 .366.728a36 36 0 0 0 3.452 2.295c.368.211.81.232 1.2.071a56 56 0 0 0 3.364-1.528c.344-.172.547-.532.542-.917c-.02-1.537.114-2.937.21-3.76a.97.97 0 0 0-.414-.924c-.833-.562-2.278-1.492-3.296-2.158c-.348-.228-.799-.217-1.158-.007\"/></g><g filter=\"url(#ibduH6d)\"><path fill=\"url(#ieOujrc)\" d=\"M7.487 12.75c.685-1.73 1.736-3.021 2.52-3.72a.87.87 0 0 1 .609-.216c1.73.05 2.983.47 3.739.794c.316.136.524.44.554.783c.168 1.918.094 3.05 0 3.916a.93.93 0 0 1-.408.677c-1.132.743-2.512 1.294-3.651 1.714c-.33.122-.7.103-.98-.11c-.934-.71-1.84-2.017-2.335-2.936a1.07 1.07 0 0 1-.048-.903\"/></g><g filter=\"url(#ijd1rLd)\"><path fill=\"url(#iUm1vId)\" d=\"M19.103 7.342a13 13 0 0 1-.168-2.418c.008-.251.167-.417.418-.427c.974-.04 2.828.204 4.01 1.046c1.244.943 2.122 2.36 2.5 3.244a.605.605 0 0 1-.146.7c-.523.458-1.261.778-1.787.99a.75.75 0 0 1-.691-.07l-3.706-2.413a.96.96 0 0 1-.43-.652\"/></g><g filter=\"url(#iDC723c)\"><path fill=\"url(#iA7tOUb)\" d=\"M14.924 14.303c.097-1.565.042-2.97-.008-3.851a.96.96 0 0 1 .5-.908a100 100 0 0 1 3.289-1.636a.96.96 0 0 1 .895.031c1.096.64 2.451 1.584 3.458 2.25c.298.198.505.509.536.864c.098 1.148.054 2.749.008 3.845a.99.99 0 0 1-.56.85l-3.405 1.658a1 1 0 0 1-.981-.06l-3.272-2.117a1.02 1.02 0 0 1-.46-.926\"/></g><defs><radialGradient id=\"iqZPZEe\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-3.35938 -.87499 3.169 -12.16687 22.997 4.996)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#EDEDED\"/><stop offset=\"1\" stop-color=\"#EDEDED\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iMi9ZNc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-.5039 .41797 -.16027 -.19322 3.907 19.317)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".267\" stop-color=\"#07216D\"/><stop offset=\"1\" stop-color=\"#07216D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i212YIw\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-113.199 7.932 -2.162)scale(.71398 4.17951)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".287\" stop-color=\"#3496FF\"/><stop offset=\"1\" stop-color=\"#3496FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iVsNJ9b\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(2.30315 -.42802 .16003 .8611 8.634 6.485)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".214\" stop-color=\"#084AA0\"/><stop offset=\"1\" stop-color=\"#084AA0\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i1y9Qbc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(58.363 -13.406 33.166)scale(.52678 3.04618)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#2C77FF\"/><stop offset=\"1\" stop-color=\"#4A67FF\"/></radialGradient><radialGradient id=\"iHq3Rle\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-36.431 27.344 -34.71)scale(.52525 5.42054)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#A2A4B1\"/><stop offset=\"1\" stop-color=\"#A2A4B1\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i8fZAMb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-155.98 9.208 2.22)scale(6.29515 9.01384)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#DFDFE1\"/><stop offset=\"1\" stop-color=\"#BFBEC0\"/></radialGradient><radialGradient id=\"iTL9fbN\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-.14062 .57812 -3.1522 -.76673 16.074 28.059)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".417\" stop-color=\"#6C5DBB\"/><stop offset=\"1\" stop-color=\"#6C5DBB\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iOiUBtb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-1.28606 9.1531 -4.73258 -.66495 27.39 10.078)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#F0EFF3\"/><stop offset=\"1\" stop-color=\"#E0DEF0\"/></radialGradient><radialGradient id=\"i6Z1Oac\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(90.9 -1.995 20.886)scale(5.03802 11.0941)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#B4A6F7\"/><stop stop-color=\"#B2A8F8\"/><stop offset=\"0\" stop-color=\"#B2A8F8\"/><stop offset=\"1\" stop-color=\"#8D7FFE\"/></radialGradient><radialGradient id=\"ilNcBGc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-70.017 30.78 -4.72)scale(7.53699 25.223)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".341\" stop-color=\"#B3ADEB\"/><stop offset=\"1\" stop-color=\"#DBD8F2\"/></radialGradient><radialGradient id=\"iOoKzZc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(.26563 .54687 -4.66163 2.26423 27.325 18.418)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".208\" stop-color=\"#E8E7EE\"/><stop offset=\"1\" stop-color=\"#E8E7EE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iXoQHed\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(.48736 7.14884 -6.39136 .43572 21.95 16.483)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#2987FF\"/><stop offset=\"1\" stop-color=\"#1473FF\"/></radialGradient><radialGradient id=\"im5it8d\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(136.032 1.472 14.039)scale(4.90635 4.47561)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#1153FF\"/><stop offset=\"1\" stop-color=\"#254DFF\"/></radialGradient><radialGradient id=\"iuyecPg\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-.17969 .26172 -2.59515 -1.78173 12.153 23.313)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".277\" stop-color=\"#0D44E2\"/><stop offset=\"1\" stop-color=\"#0D44E2\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ieOujrc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(143.771 5.587 7.291)scale(7.82549 8.00689)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#197AFF\"/><stop offset=\"1\" stop-color=\"#1462E6\"/></radialGradient><radialGradient id=\"iUm1vId\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-2.62496 5.00002 -5.77772 -3.03324 24.153 4.934)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#3697FF\"/><stop offset=\"1\" stop-color=\"#2890FF\"/></radialGradient><radialGradient id=\"iA7tOUb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(155.871 10.726 7.675)scale(5.81581 7.75469)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#ECEAF2\"/><stop offset=\"1\" stop-color=\"#D5CEEA\"/></radialGradient><filter id=\"ifNNUTc\" width=\"9.209\" height=\"2.674\" x=\"14.153\" y=\"2.784\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".25\" dy=\"-.2\"/><feGaussianBlur stdDeviation=\".125\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.65098 0 0 0 0 0.65098 0 0 0 0 0.670588 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"irC3Iid\" width=\"5.975\" height=\"7.479\" x=\"3.201\" y=\"19.395\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.5\"/><feGaussianBlur stdDeviation=\".075\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.54902 0 0 0 0 0.505882 0 0 0 0 0.768627 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"iYTCAad\" width=\"1.883\" height=\"8.103\" x=\"2.401\" y=\"11.465\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.3\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.175833 0 0 0 0 0.4336 0 0 0 0 0.879167 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"ijRngnb\" width=\"9.464\" height=\"6.575\" x=\"9.729\" y=\"3.293\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.25\" dy=\".15\"/><feGaussianBlur stdDeviation=\".25\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.92549 0 0 0 0 0.921569 0 0 0 0 0.929412 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".1\" dy=\"-.2\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.580392 0 0 0 0 0.572549 0 0 0 0 0.6 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_1660\" result=\"effect2_innerShadow_18_1660\"/></filter><filter id=\"iqn1olc\" width=\"6.732\" height=\"8.619\" x=\"3.448\" y=\"5.744\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.3\" dy=\".1\"/><feGaussianBlur stdDeviation=\".225\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.796078 0 0 0 0 0.788235 0 0 0 0 0.858824 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"iGKXIvY\" width=\"9.08\" height=\"2.675\" x=\"8.801\" y=\"26.758\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dy=\".25\"/><feGaussianBlur stdDeviation=\".125\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.576471 0 0 0 0 0.513726 0 0 0 0 0.909804 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"ijQ0NVc\" width=\"5.33\" height=\"9.857\" x=\"23.515\" y=\"9.236\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".15\" dy=\"-.15\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.564706 0 0 0 0 0.541176 0 0 0 0 0.682353 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"iLuVBge\" width=\"9.237\" height=\"6.221\" x=\"13.834\" y=\"22.785\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.15\" dy=\".25\"/><feGaussianBlur stdDeviation=\".2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.8 0 0 0 0 0.772549 0 0 0 0 0.92549 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"i2cHhrc\" width=\"6.742\" height=\"9.736\" x=\"3.495\" y=\"13.3\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.3\" dy=\".1\"/><feGaussianBlur stdDeviation=\".2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.72549 0 0 0 0 0.690196 0 0 0 0 0.878431 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"iev6p7b\" width=\"6.025\" height=\"8.514\" x=\"22.756\" y=\"18.018\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".25\"/><feGaussianBlur stdDeviation=\".2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.564706 0 0 0 0 0.505882 0 0 0 0 0.898039 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"iup3OMd\" width=\"7.261\" height=\"8.27\" x=\"18.863\" y=\"15.561\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dy=\".2\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.270588 0 0 0 0 0.596078 0 0 0 0 1 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".2\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.00392157 0 0 0 0 0.266667 0 0 0 0 0.666667 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_1660\" result=\"effect2_innerShadow_18_1660\"/></filter><filter id=\"ivsQ9Wc\" width=\"7.592\" height=\"6.037\" x=\"6.708\" y=\"21.9\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.15\" dy=\".1\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.15 0 0 0 0 0.478913 0 0 0 0 1 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"iRiCLEb\" width=\"9.441\" height=\"9.861\" x=\"9.753\" y=\"14.929\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".1\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.521569 0 0 0 0 0.490196 0 0 0 0 0.662745 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.2\" dy=\".2\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.886275 0 0 0 0 0.870588 0 0 0 0 0.929412 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_1660\" result=\"effect2_innerShadow_18_1660\"/></filter><filter id=\"ibduH6d\" width=\"7.899\" height=\"8.21\" x=\"7.26\" y=\"8.663\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".15\" dy=\"-.15\"/><feGaussianBlur stdDeviation=\".25\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.129412 0 0 0 0 0.313726 0 0 0 0 0.854902 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.15\" dy=\".1\"/><feGaussianBlur stdDeviation=\".1\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.219608 0 0 0 0 0.580392 0 0 0 0 1 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_1660\" result=\"effect2_innerShadow_18_1660\"/></filter><filter id=\"ijd1rLd\" width=\"7.136\" height=\"6.188\" x=\"18.93\" y=\"4.343\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".15\" dy=\"-.15\"/><feGaussianBlur stdDeviation=\".125\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.231373 0 0 0 0 0.435294 0 0 0 0 0.866667 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/></filter><filter id=\"iDC723c\" width=\"9.139\" height=\"9.995\" x=\"14.664\" y=\"7.662\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".15\" dy=\"-.15\"/><feGaussianBlur stdDeviation=\".2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.611765 0 0 0 0 0.568627 0 0 0 0 0.776471 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_1660\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.25\" dy=\".15\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.94902 0 0 0 0 0.941176 0 0 0 0 0.964706 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_1660\" result=\"effect2_innerShadow_18_1660\"/></filter><linearGradient id=\"irQDFNc\" x1=\"21.465\" x2=\"15.559\" y1=\"4.84\" y2=\"3.402\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#E6E6E6\"/><stop offset=\"1\" stop-color=\"#D9D9D9\"/></linearGradient><linearGradient id=\"iQxxUxe\" x1=\"8.35\" x2=\"4.065\" y1=\"26.302\" y2=\"19.395\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#8078D1\"/><stop offset=\"1\" stop-color=\"#807AB0\"/></linearGradient><linearGradient id=\"iSFFV0b\" x1=\"8.891\" x2=\"13.6\" y1=\"5.944\" y2=\"4.133\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#4876CD\"/><stop offset=\"1\" stop-color=\"#4386F5\"/></linearGradient><linearGradient id=\"ihKrmUD\" x1=\"29.497\" x2=\"28.247\" y1=\"16.629\" y2=\"16.629\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".775\" stop-color=\"#5193FF\"/><stop offset=\"1\" stop-color=\"#125DCE\"/></linearGradient><linearGradient id=\"iygLImc\" x1=\"5.099\" x2=\"9.719\" y1=\"8.732\" y2=\"10.878\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#A09FA2\"/><stop offset=\"1\" stop-color=\"#B7B6BA\"/></linearGradient><linearGradient id=\"iz4f9bd\" x1=\"5.996\" x2=\"5.762\" y1=\"13.903\" y2=\"13.309\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#847D9D\"/><stop offset=\"1\" stop-color=\"#847D9D\" stop-opacity=\"0\"/></linearGradient><linearGradient id=\"icv3Kyd\" x1=\"10.27\" x2=\"3.796\" y1=\"17.059\" y2=\"19.278\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#A39AC6\"/><stop offset=\"1\" stop-color=\"#8A82B2\"/></linearGradient><linearGradient id=\"i8nTCnc\" x1=\"16.778\" x2=\"12.465\" y1=\"17.809\" y2=\"24.731\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#CCC5EB\"/><stop offset=\"1\" stop-color=\"#AB9EEA\"/></linearGradient></defs></g></svg>",
    IBOOT = "<svg viewBox=\"0 0 24 24\" width=\"20\" height=\"20\" fill=\"#fff\" style=\"color:#fff;filter:drop-shadow(0 0 1px #000) drop-shadow(0 0 1px #000)\"><path fill=\"currentColor\" d=\"M21 8h-.7l-.05-.03c-2.11-.13-3.87-.8-4.72-1.74L14 7c-.05.1-.11.19-.16.28c.71.61 1.16 1.37 1.16 2.22c0 .33-.09.64-.21.95l-1.87-1.87c-.22.25-.45.49-.7.71l2.03 2.03c-.21.25-.45.47-.75.68l-2.07-2.09c-.29.2-.58.37-.88.54l2.03 2.05c-.33.13-.69.24-1.08.32l-1.91-1.91c-.34.14-.68.27-1.03.38l1.7 1.71H10c-1.5 0-2.8-.46-3.72-1.18c-.82.13-1.6.18-2.28.18c-2 0-2 3-2 3c0 1.11.89 2 2 2v1c0 .55.45 1 1 1s1-.45 1-1v-1h1v1c0 .55.45 1 1 1s1-.45 1-1v-1h1v1c0 .55.45 1 1 1s1-.45 1-1v-1h3v1c0 .55.45 1 1 1s1-.45 1-1v-1h1v1c0 .55.45 1 1 1s1-.45 1-1v-1h1s1 0 1-4.5C22 9 21 8 21 8\"/></svg>";
  function icCard(c){ return '<svg viewBox="0 0 14 20" width="11" height="15"><rect x="1.5" y="1.5" width="11" height="17" rx="2" fill="' + c + '" stroke="rgba(0,0,0,.35)" stroke-width="1"/></svg>'; }
  function lineIcons(fc, d){
    if(!d || !(d.g || d.a || d.y || d.r || d.s)) return;
    fc.style.overflow = 'visible'; var im = fc.querySelector('img'); if(im) im.style.borderRadius = '50%';
    var mk = function(css, html){ var x = el('span'); x.style.cssText = 'position:absolute;display:flex;align-items:center;z-index:5;' + css; x.innerHTML = html; fc.appendChild(x); };
    if(d.g) mk('right:-13px;top:-4px;', IBALL + (d.g > 1 ? '<b style="font:800 11px Poppins,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.75);margin-left:1px">' + d.g + '</b>' : ''));
    if(d.a) mk('left:-17px;bottom:-3px;', IBOOT + (d.a > 1 ? '<b style="font:800 11px Poppins,sans-serif;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.75);margin-left:1px">' + d.a + '</b>' : ''));
    if(d.y || d.r) mk('left:-9px;top:-4px;gap:1px;', (d.y ? icCard('#F2C230') : '') + (d.r ? icCard('#D93A3A') : ''));
    if(d.s) mk('left:-13px;top:13px;background:rgba(255,255,255,.92);border-radius:50%;padding:1px;', subSvg('both').replace('width="22" height="22"', 'width="13" height="13"'));
  }
  function benchIcons(b, d){
    if(!d || !(d.g || d.a || d.y || d.r || d.s)) return;
    var w = el('span', 'bic'), n = function(v){ return v > 1 ? '<b>' + v + '</b>' : ''; };
    w.innerHTML = (d.g ? IBALL.replace('width="16" height="16"', 'width="13" height="13"') + n(d.g) : '') + (d.a ? IBOOT.replace('width="20" height="20"', 'width="15" height="15"') + n(d.a) : '') + (d.y ? icCard('#F2C230').replace('width="11" height="15"', 'width="8" height="12"') : '') + (d.r ? icCard('#D93A3A').replace('width="11" height="15"', 'width="8" height="12"') : '') + (d.s ? subSvg('both').replace('width="22" height="22"', 'width="14" height="14"') : '');
    b.appendChild(w);
  }
  function iconMap(PL0, rc, FLV){
    var M = {};
    var add = function(k, f, n){ if(k == null || k === '') return; var o = M[k] || (M[k] = {g: 0, a: 0, y: 0, r: 0, s: 0}); o[f] += n || 1; };
    if(FLV){
      (FLV.ev || []).forEach(function(e){
        if(e.ty === 'Goal'){ if(!e.og) add(e.id, 'g'); if(e.aid) add(e.aid, 'a'); }
        else if(e.ty === 'Card'){ var cd = e.cd || ''; if(/red/i.test(cd)) add(e.id, 'r'); else add(e.id, 'y'); }
        else if(e.ty === 'Substitution'){ add(e.id, 's'); add(e.oid, 's'); }
      });
    } else if(rc){
      (rc.ev || []).forEach(function(e){
        var k = norm(e[5] || '');
        if(e[0] === 'goal'){ if(!e[8]) add(k, 'g'); }
        else if(e[0] === 'substitution'){ add(k, 's'); add(norm(e[10] || ''), 's'); }
        else if(e[0] === 'yellowcard') add(k, 'y'); else if(e[0] === 'redcard') add(k, 'r'); else if(e[0] === 'yellowredcard'){ add(k, 'y'); add(k, 'r'); }
      });
      var ig = (rc.plk || []).indexOf('assists');
      if(ig >= 0) (rc.pl || []).forEach(function(p){ var v = p[ig + 2]; if(v > 0) add(norm(p[0]), 'a', v); });
    }
    return M;
  }
  function tabLineup(box){
    var PL = null, L;
    if(pastScore(HSEL)){
      var rc = matchRec(HSEL);
      if(rc === 0 || (rc === null && stiId(HSEL) && MF[stiId(HSEL)] === 0)){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
      if(!rc || !rc.lu){ box.appendChild(el('div', 'hempty', 'Formazioni non disponibili')); return; }
      var rt = {}; (rc.pl || []).forEach(function(x){ rt[norm(x[0])] = x[2]; }); PL = rt; L = {};
      ['h', 'a'].forEach(function(k){ var o = rc.lu[k]; if(!o) return; L[k] = {f: o.f, c: true, co: o.co, cn: o.cn, cp: o.cp, s: (o.st || []).map(function(x){ return [x[0], x[1], x[3], x[4], x[5], null, rt[norm(x[0])]]; }), b: (o.su || []).map(function(x){ return [x[0], x[1], null]; }) }; });
    } else {
      L = HD.lin && HD.lin[HSEL.id];
      var fxj = fxGet(HSEL);
      if(fxj && (fxj.h || fxj.a)){
        L = L ? {h: L.h, a: L.a} : {};
        var fconf = fxj.ty && fxj.ty !== 'predicted';
        ['h', 'a'].forEach(function(k){
          var o = fxj[k]; if(!o) return; var cur = L[k];
          L[k] = {f: o.f, c: !!fconf, co: o.co && o.co.n, cn: o.co && o.co.cc, s: o.s, b: o.b};
        });
      }
      if((!L || (!L.h && !L.a)) && fxj === undefined){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
    }
    if(!L || (!L.h && !L.a)){ box.appendChild(el('div', 'hempty', 'Formazioni non ancora disponibili')); return; }
    var sw = el('div', 'hsw');
    [['h', HSEL.h, HSEL.hl], ['a', HSEL.a, HSEL.al]].forEach(function(o){
      var b = el('button', HSIDE === o[0] ? 'on' : ''); b.type = 'button';
      b.appendChild(crestEl(o[2], o[1], 22)); b.appendChild(el('span', '', o[1]));
      b.addEventListener('click', function(){ HSIDE = o[0]; drawMatch(); }); sw.appendChild(b);
    });
    box.appendChild(sw);
    var S = L[HSIDE], team = HSIDE === 'h' ? HSEL.h : HSEL.a;
    if(!S || !S.s || !S.s.length){ box.appendChild(el('div', 'hempty', 'Formazione non ancora disponibile')); return; }
    var top = el('div', 'hsec', (S.c ? 'Formazione ufficiale' : 'Formazione probabile') + (S.f ? ' · ' + S.f : ''));
    top.style.padding = '0 2px 8px'; box.appendChild(top);
    var pos = S.s.map(function(pl){
      var x = pl[2] == null ? .5 : pl[2], y = pl[3] == null ? .5 : pl[3];
      return {p: pl, x: (HSIDE === 'h' ? (1 - y) : y) * 100, y: 88 - (x - 0.1) * 101};
    });
    var pitch = el('div', 'hpitch');
    pitch.innerHTML = '<svg class="ln" viewBox="0 0 68 100" preserveAspectRatio="none" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".45">'
      + '<rect x="1.5" y="1.5" width="65" height="97"/><path d="M1.5 50h65"/><circle cx="34" cy="50" r="8"/>'
      + '<rect x="14" y="1.5" width="40" height="15"/><rect x="25" y="1.5" width="18" height="6"/><rect x="14" y="83.5" width="40" height="15"/><rect x="25" y="92.5" width="18" height="6"/></svg>';
    var FLV = null; if(!PL){ var fq = fxData(HSEL); if(fq && (fq.st || fq.fin)) FLV = fq; }
    var IM = (PL || FLV) ? iconMap(PL, PL ? rc : null, FLV) : null;
    pos.forEach(function(o){
      var pl = o.p, dbp = findPlayer(pl[0], team);
      var b = el('button', 'hp'); b.type = 'button'; b.style.left = o.x + '%'; b.style.top = o.y + '%';
      var fc = el('span', 'fc'), fu = (pl[5] && (fxPhoto(pl[5]) || (FOTO[pl[5]] && FOTO[pl[5]].u) || (ST && ST.ph && ST.ph[pl[5]]))) || (PL ? lvPhoto({n: pl[0]}, team) : null);
      if(fu){ var im = el('img'); im.src = fu; im.alt = ''; im.decoding = 'async'; im.onerror = function(){ im.remove(); fc.insertBefore(document.createTextNode(inits(pl[0])), fc.firstChild); }; fc.appendChild(im); } else fc.textContent = inits(pl[0]);
      b.appendChild(fc);
      if(IM) lineIcons(fc, FLV ? IM[pl[7]] : IM[norm(pl[0])]);
      if(pl[4]) b.appendChild(el('span', 'cp2', 'C'));
      b.appendChild(el('span', 'pn', (pl[1] != null ? pl[1] + ' ' : '') + shortName(pl[0])));
      var vt = dbp && !PL && !FLV ? votoOf(dbp, HSEL, 1.5) : null, plr = pl[6];
      if(FLV && !(plr > 0)) plr = 6;
      if(PL || FLV || (plr != null && plr > 0)){ pl = pl.slice(); pl[6] = plr; if(pl[6] != null && pl[6] > 0){ var rb = el('span', 'vb', f1(Number(pl[6]).toFixed(1))); rb.style.background = ratCol(pl[6]); if(pl[6] >= 6 && pl[6] < 7) rb.style.color = '#241800'; b.appendChild(rb); } }
      else if(vt){ var vv = vt.v, vb = el('span', 'vb', f1(vv.toFixed(1)));
        vb.style.background = vv < 5 ? '#D93A3A' : vv < 6 ? '#E8731C' : vv < 7 ? '#E5B400' : vv < 8 ? '#7BC043' : vv < 9 ? '#1E8E3E' : '#1CA3E6';
        if(vv >= 6 && vv < 7) vb.style.color = '#241800';
        b.appendChild(vb); }
      else if(!FLV) b.appendChild(el('span', 'vb nd', 'N/D'));
      if(PL){ b.addEventListener('click', function(){ pastSheet(pl[0], HSIDE, MF[stiId(HSEL)], HSEL, pl[1]); }); }
      else if(FLV) b.addEventListener('click', function(){ if(!fxOpen(FLV, pl[7], pl[0], HSIDE, HSEL) && dbp) openPlayer(dbp); });
      else if(dbp) b.addEventListener('click', function(){ openPlayer(dbp); }); else b.style.cursor = 'default';
      pitch.appendChild(b);
    });
    box.appendChild(pitch);
    var fmc = coachFM(HSEL), fc0 = fmc && fmc[HSIDE === 'h' ? 0 : 1], crw = PL && rc && rc.lu && rc.lu[HSIDE] && rc.lu[HSIDE].cr;
    var cnm = (fc0 && fc0.n) || S.co;
    if(cnm){
      coachCard(box, cnm, fc0 && fc0.id, S.cp || (crw && (crw.image || crw.photo || crw.image_url)) || null, (fc0 && fc0.cc) || S.cn || (crw && (crw.country_code || crw.countryCode || crw.nationality || crw.country)) || null);
    }
    if(S.b && S.b.length){
      var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', 'Panchina'));
      var bn = el('div', 'hbg');
      S.b.forEach(function(x){
        var b = el('button', 'hbp'); b.type = 'button';
        var id = x.length > 3 ? x[5] : x[2], pu = fxPhoto(id) || (id && FOTO[id] && FOTO[id].u), dbp = findPlayer(x[0], team), pf = el('span', 'pfc');
        if(!pu && dbp) pu = photoFor(dbp);
        if(!pu) pu = lvPhoto({n: x[0]}, team);
        if(pu){ var im = el('img'); im.src = pu; im.alt = ''; im.decoding = 'async'; im.onerror = function(){ im.remove(); pf.textContent = inits(x[0]); }; pf.appendChild(im); } else pf.textContent = inits(x[0]);
        b.appendChild(pf); b.appendChild(el('span', 'bn', x[1] != null ? String(x[1]) : '')); b.appendChild(el('span', 'bm', shortName(x[0])));
        if(PL) b.addEventListener('click', function(){ pastSheet(x[0], HSIDE, MF[stiId(HSEL)], HSEL, x[1]); });
        else if(FLV) b.addEventListener('click', function(){ if(!fxOpen(FLV, x.length > 3 ? x[7] : null, x[0], HSIDE, HSEL) && dbp) openPlayer(dbp); });
        else if(dbp) b.addEventListener('click', function(){ openPlayer(dbp); });
        if(IM) benchIcons(b, FLV ? IM[x.length > 3 ? x[7] : null] : IM[norm(x[0])]);
        bn.appendChild(b);
      });
      c.appendChild(bn); box.appendChild(c);
    }
  }
  function lineBar(box){
    var sw = el('div', 'hpills');
    [0.5, 1.5, 2.5].forEach(function(l){
      var b = el('button', 'hpill' + (HLINE === l ? ' on' : ''), 'Over ' + f1(l)); b.type = 'button';
      b.addEventListener('click', function(){ HLINE = l; drawMatch(); }); sw.appendChild(b);
    });
    box.appendChild(sw);
  }
  function tabPlayers(box){
    if(!PDATA){ box.appendChild(el('div', 'hempty', 'Carico i giocatori…')); return; }
    lineBar(box);
    var out = [];
    PDATA.forEach(function(p){
      if(p.t !== HSEL.h && p.t !== HSEL.a) return;
      var v = votoOf(p, HSEL, HLINE); if(!v || v.v < BMIN) return;
      out.push({p: p, v: v});
    });
    out.sort(function(a, b){ return b.v.v - a.v.v || b.v.t.lam - a.v.t.lam; });
    if(!out.length){ box.appendChild(el('div', 'hempty', 'Nessun giocatore con voto ' + f1(BMIN.toFixed(2)) + ' o più')); return; }
    out.slice(0, 16).forEach(function(r, i){
      var c = el('button', 'hpc'); c.type = 'button';
      c.appendChild(el('span', 'rk', String(i + 1)));
      var pu = photoFor(r.p), pf = el('span', 'pfc');
      if(pu){ var pim = el('img'); pim.src = pu; pim.alt = ''; pim.decoding = 'async'; pim.onerror = function(){ pim.remove(); pf.textContent = inits(r.p.n); }; pf.appendChild(pim); } else pf.textContent = inits(r.p.n);
      c.appendChild(pf);
      var mid = el('span', 'mid'), nb2 = el('b', ''); nb2.appendChild(crestEl(r.p.t === HSEL.h ? HSEL.hl : HSEL.al, r.p.t, 15)); nb2.appendChild(document.createTextNode(' ' + r.p.n)); mid.appendChild(nb2);
      mid.appendChild(el('small', '', 'Media attesa ' + f1(r.v.t.lam.toFixed(2)) + ' · ' + Math.round(r.v.t.mn) + '’ medi')); c.appendChild(mid);
      c.appendChild(el('span', 'vt', f1(r.v.v.toFixed(2))));
      c.addEventListener('click', function(){ openPlayer(r.p); });
      box.appendChild(c);
    });
  }
  function ctxMatch(p){
    if(HSEL && (p.t === HSEL.h || p.t === HSEL.a)) return HSEL;
    var today = romeDay(new Date());
    return ((HD && HD.matches) || []).filter(function(m){ return (m.h === p.t || m.a === p.t) && m.d >= today; })[0] || null;
  }
  function aCard(box, title, rows){
    var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', title));
    var hd = el('div', 'hhd'); hd.appendChild(el('span')); hd.appendChild(el('span', '', 'Stagione')); hd.appendChild(el('span', '', 'Ultime 5')); c.appendChild(hd);
    rows.forEach(function(r){
      var d = el('div', 'hr2'); d.appendChild(el('span', 'l', r[0])); d.appendChild(el('b', '', r[1])); d.appendChild(el('b', 'g', r[2]));
      if(r[3]){ var w = el('div', 'hrw'); w.appendChild(d); w.appendChild(barP(r[3].v, r[3].a, r[3].mx, r[3].inv)); c.appendChild(w); } else c.appendChild(d);
    });
    box.appendChild(c);
  }
  var PAV = {};
  function playerAvg(p, key){
    var s = statOf(p); if(!s || !ST) return null; var pos = s[SC.pos] || '', lgk = s[SC.lg], k = pos + '|' + lgk + '|' + key; if(k in PAV) return PAV[k];
    var vals = [];
    ST.players.forEach(function(r){ if((r[SC.pos] || '') === pos && r[SC.lg] === lgk && r[SC.min] >= 450 && !CUPK[r[SC.lg]]) vals.push(r[SC[key]] / r[SC.min] * 90); });
    if(vals.length < 12){ vals = []; ST.players.forEach(function(r){ if((r[SC.pos] || '') === pos && r[SC.min] >= 450 && !CUPK[r[SC.lg]]) vals.push(r[SC[key]] / r[SC.min] * 90); }); }
    if(vals.length < 12) return PAV[k] = null;
    var sum = 0; vals.forEach(function(x){ sum += x; }); vals.sort(function(a, b){ return a - b; });
    var a = sum / vals.length, p95 = vals[Math.min(vals.length - 1, Math.floor(vals.length * 0.95))];
    return PAV[k] = a > 0 ? {a: a, mx: Math.max(p95, a * 1.6)} : null;
  }
  function barP(v, avg, mx, inv){
    var top = Math.max(mx, v, avg * 1.2), w = Math.max(2, Math.min(100, v / top * 100)), lp = avg / top * 100;
    var r = avg > 0 ? v / avg : 1, up = r > 1, near = Math.abs(r - 1) <= 0.1, col = near ? '#E5B400' : ((up !== !!inv) ? '#1E8E3E' : '#D93A3A');
    var b = el('div', 'abar'), f = el('i'), u = el('u'); f.style.width = w + '%'; f.style.background = col; u.style.left = lp + '%'; b.appendChild(f); b.appendChild(u); abLabel(b, avg, lp);
    b.setAttribute('data-c', col); return b;
  }
  function n1(x, d){ return x == null || isNaN(x) ? '–' : f1(x.toFixed(d == null ? 1 : d)); }
  var PAX = {};
  function paxAvg(pos, k, pc){
    var kk = pos + '|' + k; if(kk in PAX) return PAX[kk];
    var sum = 0, n = 0;
    if(SX) SX.rows.forEach(function(x){ if((x[SXH.pos] || '') !== pos || !(x[SXH.min] >= 450) || CUPK[x[SXH.lg]]) return; sum += pc ? sxv(x, k) : sxv(x, k) / x[SXH.min] * 90; n++; });
    return PAX[kk] = n ? sum / n : null;
  }
  function extCards(box, p, s){
    var x = SXR[s[0]]; if(!x || !SX || !SX.lab) return;
    var mn = x[SXH.min], l5m = x[SXH.l5min]; if(!(mn > 0)) return;
    var tot = {}; SX.cols.forEach(function(k){ if(/\|t$/.test(k)) tot[k.slice(0, -2)] = 1; });
    var groups = [], gm = {};
    Object.keys(SX.lab).forEach(function(k){
      if(PSKIP[k]) return;
      var mt = SX.lab[k], pc = !tot[k] && /percent/i.test(mt[2] || ''), g = pgName(mt[1]);
      var sv = sxv(x, k), lv = sxv(x, k, true);
      if(!sv && !lv) return;
      var a = pc ? sv : sv / mn * 90, b = pc ? lv : (l5m > 0 ? lv / l5m * 90 : 0);
      var avg = null, lab = PIT[k] || mt[0] || k;
      var row = [lab + (pc ? '' : ' ogni 90\u2019'), n1(a) + (pc ? '%' : ''), n1(b) + (pc ? '%' : ''), avg ? {v: a, a: avg, inv: !!PINV[k]} : null];
      if(!gm[g]){ gm[g] = []; groups.push(g); }
      gm[g].push(row);
      if(tot[k]){
        var t = sxv(x, k + '|t'), tl = sxv(x, k + '|t', true);
        if(t >= 10){ gm[g].push([lab + ' \u00B7 precisione', Math.round(100 * sv / t) + '%', tl >= 3 ? Math.round(100 * lv / tl) + '%' : '–', null]); }
      }
    });
    groups.forEach(function(g){ aCard(box, g, gm[g]); });
  }
  function drawPlayerPage(days, body){
    var p = HPL, m = ctxMatch(p), box = body, s = statOf(p);
    var hero = el('div', 'hhero'); hero.appendChild(backBtn());
    var tt = el('div', 'tt'), tn = el('div', 'tn');
    tn.style.width = '100%';
    var ph = photoFor(p);
    if(ph){ var pf = el('div', 'hpf'), im = el('img'); im.src = ph; im.alt = ''; im.onerror = function(){ pf.remove(); }; pf.appendChild(im); tn.appendChild(pf); }
    var pn = el('div', 'hpn'); pn.appendChild(crestEl(m ? (p.t === m.h ? m.hl : m.al) : tLogo(p.t), p.t, 22)); pn.appendChild(el('span', '', p.n)); tn.appendChild(pn);
    tt.appendChild(tn); hero.appendChild(tt);
    if(m){ var sub = el('div', 'sm', m.h + ' – ' + m.a + ' · ' + timeOf(m.t)); hero.appendChild(sub); sub.style.cssText += ';text-align:center;padding-bottom:14px;'; }
    else tn.style.paddingBottom = '14px';
    box.appendChild(hero);
    var g = p.l[0] + p.c[0], mi = p.l[3] + p.c[3];
    if(needExtra() && !ST){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
    if(s){
      var C = SC, per = function(k){ return s[C[k]] > 0 || s[C.min] > 0 ? p90(s, k) : null; };
      var bar = function(k, inv){ var v = per(k), a = playerAvg(p, k); return (v != null && a) ? {v: v, a: a.a, mx: a.mx, inv: inv} : null; };
      var l5 = function(k){ return s[C.l5min] > 0 ? s[C[k]] / s[C.l5min] * 90 : 0; }, iv = function(k){ return s[C[k]] == null ? '–' : String(s[C[k]]); };
      aCard(box, 'Generale', [['Partite giocate', String(s[C.g]), iv('l5g')], ['Gol', String(s[C.go]), iv('l5go')], ['Assist', String(s[C.as]), iv('l5as')],
        ['Minuti a partita', s[C.g] ? Math.round(s[C.min] / s[C.g]) + '’' : '–', s[C.l5g] ? Math.round(s[C.l5min] / s[C.l5g]) + '’' : '0’']]);
      aCard(box, 'Tiri', [['Tiri ogni 90’', n1(per('sh')), n1(l5('l5sh')), bar('sh', false)], ['Tiri in porta ogni 90’', n1(per('st')), n1(l5('l5st')), bar('st', false)]]);
      aCard(box, 'Disciplina', [['Gialli', String(s[C.y]), iv('l5y'), bar('y', true)], ['Rossi', String(s[C.r]), iv('l5r')],
        ['Falli commessi ogni 90’', n1(per('fo')), n1(l5('l5fo')), bar('fo', true)], ['Falli subiti ogni 90’', n1(per('fs')), n1(l5('l5fs')), bar('fs', false)]]);
      aCard(box, 'Fuorigioco', [['Fuorigioco ogni 90’', n1(per('of')), n1(l5('l5of')), bar('of', true)]]);
      try{ extCards(box, p, s); }catch(e){}
    } else {
      var sea = mi > 0 ? (p.l[1] + p.c[1]) / mi * 90 : null, seaS = mi > 0 ? (p.l[2] + p.c[2]) / mi * 90 : null;
      var lr = lastRows(p).r.slice(0, 5), mn = lr.reduce(function(a, x){ return a + x[2]; }, 0);
      var q5 = mn > 0 ? lr.reduce(function(a, x){ return a + x[0]; }, 0) / mn * 90 : null, q5s = mn > 0 ? lr.reduce(function(a, x){ return a + x[1]; }, 0) / mn * 90 : null;
      aCard(box, 'Generale', [['Partite giocate', String(g), '–'], ['Minuti a partita', g ? Math.round(mi / g) + '’' : '–', '–']]);
      aCard(box, 'Tiri', [['Tiri ogni 90’', n1(sea), n1(q5)], ['Tiri in porta ogni 90’', n1(seaS), n1(q5s)]]);
    }
    var v = {}; if(m) [0.5, 1.5, 2.5].forEach(function(l){ v[l] = votoOf(p, m, l); });
    if(v[1.5]){
      var c2 = el('div', 'hcard'); c2.appendChild(el('div', 'hsec', 'Affidabilità in questa partita'));
      var g3 = el('div', 'hgrid');
      [0.5, 1.5, 2.5].forEach(function(l){ var d = el('div'); d.appendChild(el('b', '', f1(v[l].v.toFixed(2)))); d.appendChild(el('small', '', 'Over ' + f1(l))); g3.appendChild(d); });
      c2.appendChild(g3); box.appendChild(c2);
    }
    var cb = el('button', 'hbtn'); cb.type = 'button'; cb.innerHTML = IC.calc + '<span>Apri nel Calcolatore</span>';
    cb.addEventListener('click', function(){ HPL = null; if(GOFN) GOFN('players'); if(PICKFN) PICKFN(p, HLINE); });
    box.appendChild(cb);
  }


  // === gesti iPhone: la pagina segue il dito, quella accanto compare gia' di lato (gia' disegnata, poi viene adottata senza ridisegnare); l'indietro e' identico alla freccia ===
  var NOANIM = false;
  (function(){
    var X0 = 0, Y0 = 0, T0 = 0, OK = false, MODE = 0, PK = null, GAP = 14;
    function skip(t){ while(t && t !== document){ if(t.classList && (t.classList.contains('hscr') || t.classList.contains('sc') || t.classList.contains('lvov') || t.classList.contains('hmom') || t.classList.contains('hpin') || t.tagName === 'INPUT')) return true; if(t.scrollWidth > t.clientWidth + 4 && t.clientWidth > 0 && /(auto|scroll)/.test(getComputedStyle(t).overflowX)) return true; t = t.parentNode; } return false; }
    function rootEl(){ return document.getElementById('slbMatch'); }
    function plan(dir){
      var r = rootEl(); if(!r) return null; var next = dir < 0;
      var tabs = r.querySelector('.hhero .htabs') || r.querySelector('.htabs');
      if(tabs && (HSEL || HTEAM || HLV)){
        var on = tabs.querySelector('button.on'), tg = on && (next ? on.nextElementSibling : on.previousElementSibling);
        if(tg && tg.getAttribute('data-k')){ var hc0 = r.querySelector('.hc'); if(hc0) return {kind: 'tab', dir: dir, tg: tg, on: on, bar: tabs, key: tg.getAttribute('data-k'), el: hc0}; }
        if(!next && r.querySelector('.hback')) return {kind: 'back', dir: dir};
        return null;
      }
      if(HSEL || HPL || HTEAM || HLV || HREF || HSTK){ if(!next && r.querySelector('.hback')) return {kind: 'back', dir: dir}; return null; }
      var ds = r.querySelector('.hdates'); if(!ds) return null;
      var bs = [].slice.call(ds.querySelectorAll('button')).filter(function(b){ return !/hcal|lvb/.test(b.className); });
      var ix = -1; bs.forEach(function(b, i){ if(b.classList.contains('on')) ix = i; });
      var tg2 = bs[ix + (next ? 1 : -1)]; var mb = r.querySelector('.mbody');
      if(ix < 0 || !tg2 || !mb || !tg2.getAttribute('data-k')) return null;
      return {kind: 'day', dir: dir, tg: tg2, on: bs[ix], bar: ds, key: tg2.getAttribute('data-k'), el: mb};
    }
    function build(p){
      var sv = {a: HTAB, b: HTTAB, c: HLTAB, d: HSTV, e: HDAY}, h = null;
      try{
        if(p.kind === 'day'){ h = el('div', 'swpk'); HDAY = p.key; drawDayBody(h, romeDay(new Date())); }
        else {
          h = el('div', 'hc');
          if(HSEL){ HTAB = p.key; var m = HSEL, psc = pastScore(m), LE = lvOf(m); hmContent(h, m, LE, !!(LE && (LE.st !== 'pre' || m.cup) && !psc), !!psc); }
          else if(HTEAM){ HTTAB = p.key; teamTabInto(h, HTEAM, HTLG); }
          else if(HLV){ HLTAB = p.key; leagueTabInto(h, HLV, !!CUPK[HLV], null); }
        }
        p.st = {a: HTAB, b: HTTAB, c: HLTAB, d: HSTV, e: HDAY};
      }catch(e){ h = null; }
      HTAB = sv.a; HTTAB = sv.b; HLTAB = sv.c; HSTV = sv.d; HDAY = sv.e;
      return h;
    }
    function tr(x){ return 'translate3d(' + x + 'px,0,0)'; }
    function mount(p){
      var h = build(p); if(!h) return false;
      var host = p.el.parentNode, cs = getComputedStyle(host), pcs = getComputedStyle(p.el);
      if(cs.position === 'static'){ host.style.position = 'relative'; p.undo = true; }
      p.W = p.el.offsetWidth;
      h.style.cssText += ';position:absolute;left:0;top:' + p.el.offsetTop + 'px;width:' + p.W + 'px;box-sizing:border-box;padding:' + pcs.padding + ';pointer-events:none;will-change:transform;transform:' + tr(-p.dir * (p.W + GAP));
      host.appendChild(h); p.h = h; p.host = host;
      p.el.style.willChange = 'transform'; p.el.style.transition = 'none';
      // linea sotto le schede / giorni: segue il dito
      var bar = p.bar, on = p.on, tg = p.tg;
      p.L0 = on.offsetLeft; p.W0 = on.offsetWidth; p.L1 = tg.offsetLeft; p.W1 = tg.offsetWidth; p.s0 = bar.scrollLeft;
      p.s1 = Math.max(0, Math.min(bar.scrollWidth - bar.clientWidth, tg.offsetLeft - (bar.clientWidth - tg.offsetWidth) / 2));
      var ind = document.createElement('i'); ind.className = 'tind'; ind.style.cssText = 'position:absolute;left:0;bottom:0;height:3px;pointer-events:none;will-change:transform,width;background:' + getComputedStyle(on).borderBottomColor + ';width:' + p.W0 + 'px;transform:' + tr(p.L0);
      bar.classList.add('swp'); bar.appendChild(ind); p.ind = ind;
      return true;
    }
    function prog(p, f){
      f = Math.max(0, Math.min(1, f));
      p.ind.style.width = (p.W0 + (p.W1 - p.W0) * f) + 'px'; p.ind.style.transform = tr(p.L0 + (p.L1 - p.L0) * f);
      p.bar.scrollLeft = p.s0 + (p.s1 - p.s0) * f;
    }
    function drop(p){
      if(!p) return;
      try{ if(p.el){ p.el.getAnimations().forEach(function(x){ x.cancel(); }); p.el.style.transform = ''; p.el.style.willChange = ''; p.el.style.transition = ''; } }catch(e){}
      if(p.h && p.h.parentNode) p.h.parentNode.removeChild(p.h);
      if(p.ind && p.ind.parentNode) p.ind.parentNode.removeChild(p.ind);
      if(p.bar) p.bar.classList.remove('swp');
      if(p.undo && p.host) p.host.style.position = '';
    }
    // la pagina gia' disegnata prende il posto di quella vecchia: nessun ridisegno, nessun lampeggio di icone
    function adopt(p){
      var st = p.st; HTAB = st.a; HTTAB = st.b; HLTAB = st.c; HSTV = st.d; HDAY = st.e;
      try{ p.on.classList.remove('on'); p.tg.classList.add('on'); }catch(e){}
      if(p.kind === 'day'){
        HCAL = false;
        var mb = p.el; mb.style.transform = ''; mb.style.willChange = ''; mb.style.transition = '';
        while(mb.firstChild) mb.removeChild(mb.firstChild);
        while(p.h.firstChild) mb.appendChild(p.h.firstChild);
        try{ var ci = p.bar.querySelector('input[type=date]'); if(ci) ci.value = p.key; }catch(e){}
      } else {
        HSTK = null;
        var nh = p.h; nh.style.position = nh.style.left = nh.style.top = nh.style.width = nh.style.boxSizing = nh.style.padding = nh.style.pointerEvents = nh.style.willChange = nh.style.transform = '';
        p.el.parentNode.replaceChild(nh, p.el); p.h = null;
      }
    }
    document.addEventListener('touchstart', function(e){
      var t = e.touches[0]; X0 = t.clientX; Y0 = t.clientY; T0 = Date.now(); MODE = 0; if(PK){ drop(PK); PK = null; }
      OK = e.touches.length === 1 && X0 > 24 && X0 < window.innerWidth - 12 && typeof MCAT !== 'undefined' && MCAT === 'home' && lvVisible() && !LVSH && !skip(e.target);
    }, {passive: true});
    document.addEventListener('touchmove', function(e){
      if(!OK) return; var t = e.touches[0], dx = t.clientX - X0, dy = t.clientY - Y0;
      if(!MODE && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) MODE = Math.abs(dx) > Math.abs(dy) ? 1 : 2;
      if(MODE !== 1) return;
      if(e.cancelable) e.preventDefault();
      var dir = dx > 0 ? 1 : dx < 0 ? -1 : 0; if(!dir) return;
      if(!PK || PK.dir !== dir){
        if(PK){ drop(PK); PK = null; }
        var p = plan(dir);
        if(!p){ PK = {kind: 'none', dir: dir}; return; }
        if(p.kind === 'back'){ PK = p; return; }
        if(!mount(p)){ PK = {kind: 'none', dir: dir}; return; }
        PK = p;
      }
      if(PK.kind === 'tab' || PK.kind === 'day'){ PK.el.style.transform = tr(dx); PK.h.style.transform = tr(dx - PK.dir * (PK.W + GAP)); prog(PK, Math.abs(dx) / (PK.W + GAP)); }
    }, {passive: false});
    document.addEventListener('touchcancel', function(){ OK = false; if(PK){ drop(PK); PK = null; } }, {passive: true});
    document.addEventListener('touchend', function(e){
      if(!OK) return; OK = false;
      var t = e.changedTouches[0], dx = t.clientX - X0, p = PK; PK = null;
      if(MODE !== 1 || !p || p.kind === 'none'){ drop(p); return; }
      var dt = Date.now() - T0, dir = dx > 0 ? 1 : -1, go = p.dir === dir && (Math.abs(dx) >= 56 || (Math.abs(dx) >= 30 && dt < 260)) && dt < 1200;
      if(p.kind === 'back'){ if(go){ if(history.state && history.state.slb) history.back(); else navBack(); } return; }
      var W = p.W, el0 = p.el, h = p.h, done = false, D = 180, ease = {duration: D, easing: 'cubic-bezier(.25,.8,.3,1)', fill: 'forwards'};
      var f0 = Math.min(1, Math.abs(dx) / (W + GAP)), f1 = go ? 1 : 0, t0 = performance.now();
      var fin = function(){
        if(done) return; done = true;
        if(go){
          try{ var keep = p.h, kel = p.el; p.el.getAnimations().forEach(function(x){ x.cancel(); }); if(keep) keep.getAnimations().forEach(function(x){ x.cancel(); }); }catch(e){}
          if(p.ind && p.ind.parentNode) p.ind.parentNode.removeChild(p.ind); p.bar.classList.remove('swp'); p.bar.scrollLeft = p.s1;
          try{ adopt(p); }catch(err){ drop(p); NOANIM = true; try{ p.tg.click(); }finally{ NOANIM = false; HANIM = null; } }
          if(p.undo && p.host) p.host.style.position = '';
        } else drop(p);
      };
      if(!el0.animate || !h.animate){ fin(); return; }
      var a = el0.animate([{transform: tr(dx)}, {transform: tr(go ? p.dir * (W + GAP) : 0)}], ease);
      h.animate([{transform: tr(dx - p.dir * (W + GAP))}, {transform: tr(go ? 0 : -p.dir * (W + GAP))}], ease);
      var tick = function(now){ if(done) return; var k = Math.min(1, (now - t0) / D), e2 = 1 - Math.pow(1 - k, 3); prog(p, f0 + (f1 - f0) * e2); if(k < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      a.onfinish = fin; setTimeout(fin, D + 160);
    }, {passive: true});
    // niente zoom a due dita / doppio tocco
    document.addEventListener('gesturestart', function(e){ e.preventDefault(); }, {passive: false});
    document.addEventListener('gesturechange', function(e){ e.preventDefault(); }, {passive: false});
    document.addEventListener('touchmove', function(e){ if(e.touches.length > 1 && e.cancelable) e.preventDefault(); }, {passive: false});
  })();
  // --- ricerca (lente) ---
  function searchSetup(bar){
    var btn = document.createElement('button'); btn.type = 'button'; btn.id = 'slbSearchBtn'; btn.setAttribute('aria-label', 'Cerca');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>';
    bar.insertBefore(btn, document.getElementById('slbBurger'));
    var ov = document.createElement('div'); ov.id = 'slbSearch';
    ov.innerHTML = '<div class="sb"><input type="text" placeholder="Cerca" autocomplete="off" autocapitalize="off" spellcheck="false"><button type="button" class="sx" aria-label="Chiudi">&times;</button></div><div class="sr"></div>';
    document.body.appendChild(ov);
    var inp = ov.querySelector('input'), res = ov.querySelector('.sr');
    function close(){ ov.classList.remove('on'); inp.blur(); }
    function item(lead, name, sub, fn){
      var b = el('button', 'si'); b.type = 'button'; b.appendChild(lead);
      var d = el('div'); d.appendChild(el('span', '', name)); if(sub) d.appendChild(el('small', '', sub)); b.appendChild(d);
      b.addEventListener('click', function(){ close(); fn(); }); return b;
    }
    function toHome(fn){ if(MCAT !== 'home' && GOFN) GOFN('home'); fn(); }
    function render(){
      res.innerHTML = '';
      var q = norm(inp.value); if(q.length < 2) return;
      var n = 0;
      function sec(t, arr){ if(!arr.length) return; res.appendChild(el('div', 'sh', t)); arr.forEach(function(b){ res.appendChild(b); }); n += arr.length; }
      sec('Campionati', HLG.concat([['champions-league', 'Champions League'], ['europa-league', 'Europa League']]).filter(function(l){ return norm(l[1]).indexOf(q) >= 0; }).slice(0, 4).map(function(l){
        var im = lgImg(l[0]) || el('span'); im.style.width = '28px'; im.style.height = '28px'; im.style.objectFit = 'contain';
        return item(im, l[1], '', function(){ toHome(function(){ openLeague(l[0]); }); });
      }));
      var seen = {}, tl = [];
      if(TM && TM.res) Object.keys(TM.res).forEach(function(lg){ Object.keys(TM.res[lg]).forEach(function(t){ if(!seen[t] && norm(t).indexOf(q) >= 0){ seen[t] = 1; tl.push([t, lg]); } }); });
      sec('Squadre', tl.slice(0, 6).map(function(x){ return item(crestEl(tLogo(x[0]), x[0], 28), x[0], lgLabel(x[1]), function(){ toHome(function(){ openTeam(x[0], x[1]); }); }); }));
      var pl = [];
      if(ST && ST.players){ ST.players.forEach(function(r){ if(CUPK[r[SC.lg]]) return; var k = norm(r[SC.n]).split(' ').some(function(w){ return w.indexOf(q) === 0; }) || norm(r[SC.n]).indexOf(q) === 0; if(k) pl.push(r); }); pl = pl.slice(0, 8); }
      sec('Giocatori', pl.map(function(r){
        var p = dbById(r[0]) || {i: r[0], n: r[SC.n], t: r[SC.t]};
        var pu = photoFor(p), fc = el('span', 'sface'); if(pu){ var im2 = el('img'); im2.src = pu; im2.alt = ''; im2.loading = 'lazy'; im2.onerror = function(){ im2.remove(); fc.textContent = inits(p.n); }; fc.appendChild(im2); } else fc.textContent = inits(p.n);
        return item(fc, r[SC.n], r[SC.t], function(){ toHome(function(){ openPlayer(p); }); });
      }));
      if(!n) res.appendChild(el('div', 'hempty', 'Nessun risultato'));
    }
    btn.addEventListener('click', function(){ ov.classList.add('on'); inp.value = ''; res.innerHTML = ''; loadExtra().then(function(){ if(inp.value) render(); }); setTimeout(function(){ inp.focus(); }, 60); });
    ov.querySelector('.sx').addEventListener('click', close);
    inp.addEventListener('input', render);
  }
  // --- Panoramica: Numeri da tenere d'occhio (storie), forma, migliori giocatori ---
  var STT = null;
  function storyList(m){
    var out = [];
    if(!SQ || !SQ.lg || !SQ.lg[m.lg]) return out;
    TMET.forEach(function(d){
      [0, 1].forEach(function(sd){
        var rk = tRank(m.lg, d[0], sd, 0), n = rk.length; if(n < 6) return;
        [m.h, m.a].forEach(function(tn){
          var pos = 0, val = 0; rk.forEach(function(x, i){ if(x.n === tn){ pos = i + 1; val = x.v; } });
          if(!pos) return;
          var top = pos <= 3, bot = pos > n - 3; if(!top && !bot) return;
          out.push({t: tn, lbl: sd === 0 ? d[1] : d[2], v: val, pos: pos, n: n, good: (POL[d[0]][sd] > 0) === top, sc: top ? 4 - pos : pos - (n - 3) });
        });
      });
    });
    out.sort(function(a, b){ return b.sc - a.sc; });
    return out.slice(0, 8);
  }
  function storiesBox(box, m){
    var L = storyList(m); if(!L.length) return;
    var c = el('div', 'hcard hstory'); c.appendChild(el('div', 'hsec', 'Numeri da tenere d’occhio'));
    var bars = el('div', 'hsbars'), body = el('div', 'hsbody'), cur = 0, tm = null, st0 = 0;
    var fills = L.map(function(){ var b = el('i'), u = el('u'); b.appendChild(u); bars.appendChild(b); return u; });
    c.appendChild(bars); c.appendChild(body); box.appendChild(c);
    function show(i){
      cur = (i + L.length) % L.length; clearTimeout(tm);
      fills.forEach(function(u, k){ u.style.transition = 'none'; u.style.width = k < cur ? '100%' : '0'; });
      var x = L[cur]; body.innerHTML = '';
      var bgc = crestEl(x.t === m.h ? m.hl : m.al, x.t, 150); bgc.className += ' hsbg'; body.appendChild(bgc); body.appendChild(el('div', 'hst', x.t));
      body.appendChild(el('div', 'hsv', f1(x.v.toFixed(1))));
      body.appendChild(el('div', 'hsl', x.lbl + ' a partita'));
      body.appendChild(el('span', 'hsr ' + (x.good ? 'u' : 'd'), x.pos + 'ª su ' + x.n));
      void bars.offsetWidth;
      fills[cur].style.transition = 'width 5s linear'; fills[cur].style.width = '100%';
      tm = setTimeout(function(){ if(!document.body.contains(c)) return; show(cur + 1); }, 5000);
    }
    c.addEventListener('click', function(e){
      var r = c.getBoundingClientRect(); show(e.clientX - r.left > r.width / 2 ? cur + 1 : cur - 1);
    });
    show(0);
  }
  function formOf(name, lg){
    var res = TM && TM.res && TM.res[lg] && TM.res[lg][name]; if(!res) return '';
    return res.filter(function(x){ return x[3] != null; }).slice(-5).map(function(x){ return x[3] > x[4] ? 'V' : x[3] === x[4] ? 'P' : 'S'; }).join('');
  }
  // === LIVE (ESPN tramite ponte Cloudflare) ===
  var LVURL = 'https://scalperlab-live.matteo-giampaoletti04.workers.dev';
  var LVMAP = {'ita.1': 'serie-a', 'eng.1': 'premier-league', 'esp.1': 'la-liga', 'ger.1': 'bundesliga', 'fra.1': 'ligue-1'};
  var LV = {ev: [], sig: ''}, LVM = {}, LVC = {}, LVP = null;
  var LVSKIP = ['fc', 'ac', 'as', 'ss', 'us', 'afc', 'cf', 'sc', 'fk', 'cd', 'ud', 'rc', 'rcd', 'vfb', 'tsg', 'fsv', 'sv', '1', 'calcio', 'de', 'the'];
  function lvN(s){ return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(function(w){ return w && LVSKIP.indexOf(w) < 0; }); }
  function lvSame(a, b){
    var x = lvN(a), y = lvN(b); if(!x.length || !y.length) return false;
    var jx = x.join(''), jy = y.join('');
    if(jx === jy) return true;
    if(jx.length >= 4 && jy.length >= 4 && (jx.indexOf(jy) >= 0 || jy.indexOf(jx) >= 0)) return true;
    return x.some(function(w){ return w.length >= 5 && y.indexOf(w) >= 0; });
  }
  var CUPS = [['uefa.champions', 'Champions League'], ['uefa.europa', 'Europa League'], ['uefa.europa.conf', 'Conference League'], ['uefa.nations', 'Nations League'], ['fifa.friendly', 'Amichevoli']], LVD = {};
  function cupLabel(k){ for(var i = 0; i < CUPS.length; i++){ if(CUPS[i][0] === k) return CUPS[i][1]; } return null; }
  function lvCupM(e){ var o = {d: romeDay(new Date(e.d)), lg: e.lg, h: e.h, a: e.a, hl: tLogo(e.h) || e.hl, al: tLogo(e.a) || e.al, t: e.d, es: e, cup: true, id: 'es' + e.id}; if(e.fm && e.st === 'post' && e.sh != null){ o.sh = +e.sh; o.sa = +e.sa; } return o; }
  function lvDomM(e){ var o = {d: romeDay(new Date(e.d)), lg: LVMAP[e.lg], h: e.h, a: e.a, hl: tLogo(e.h) || e.hl, al: tLogo(e.a) || e.al, t: e.d, es: e, id: 'es' + e.id}; if(e.st === 'post' && e.sh != null){ o.sh = +e.sh; o.sa = +e.sa; } return o; }
  function lvTs(m){ var x = m && m.t ? new Date(m.t).getTime() : NaN; return isNaN(x) ? 9e15 : x; }
  function lvCups(day){
    var out = {}, v = LVD[day], now = Date.now();
    LV.ev.forEach(function(e){ if(cupLabel(e.lg) && romeDay(new Date(e.d)) === day) out[e.id] = e; });
    (v && v.l || []).forEach(function(e){ if(!out[e.id] && romeDay(new Date(e.d)) === day) out[e.id] = e; });
    var today = romeDay(new Date());
    if(!v || (day >= today && now - v.ts > 300000)){
      if(!(v && v.busy)){
        LVD[day] = {l: v ? v.l : [], ts: v ? v.ts : 0, busy: true};
        fetch(LVURL + '/d?date=' + day.replace(/-/g, '') + (day < today ? '&dom=1' : '')).then(function(r){ return r.json(); }).then(function(j){ LVD[day] = {l: (j && j.ev) || [], ts: Date.now()}; lvRedraw(); }).catch(function(){ LVD[day] = {l: [], ts: Date.now()}; });
      }
    }
    return Object.keys(out).map(function(k){ return lvCupM(out[k]); }).sort(function(a, b){ return a.t < b.t ? -1 : 1; });
  }
  function lvOf(m){
    if(m && m.es){ for(var q = 0; q < LV.ev.length; q++){ if(LV.ev[q].id === m.es.id && LV.ev[q].lg === m.es.lg) return LV.ev[q]; } return m.es; }
    if(!m || !LV.ev.length) return null;
    var k = m.d + '|' + m.h + '|' + m.a, hit = null;
    for(var i = 0; i < LV.ev.length; i++){
      var e = LV.ev[i];
      if(LVMAP[e.lg] !== m.lg || romeDay(new Date(e.d)) !== m.d) continue;
      if(lvSame(e.h, m.h) && lvSame(e.a, m.a)){ hit = e; break; }
    }
    return hit;
  }
  function lvMin(e){ if(e.nm === 'STATUS_HALFTIME') return 'HT'; if(e.nm === 'STATUS_FULL_TIME') return 'FT'; return e.clk || e.det || ''; }
  function lvList(){ var a = (HD && HD.matches || []).filter(function(m){ var e = lvOf(m); return e && e.st === 'in'; }); LV.ev.forEach(function(e){ if(cupLabel(e.lg) && e.st === 'in') a.push(lvCupM(e)); }); return a; }
  function lvFetchM(e){
    return fetch(LVURL + '/m?lg=' + encodeURIComponent(e.lg) + '&id=' + e.id).then(function(r){ return r.json(); }).then(function(s){
      if(!s || s.errore || !s.teams) return false;
      var sig = JSON.stringify([s.events, s.teams, s.rosters, s.sh, s.sa, (s.comm || []).length]);
      var ch = !LVM[e.id] || LVC[e.id] !== sig; LVM[e.id] = s; LVC[e.id] = sig; return ch;
    }).catch(function(){ return false; });
  }
  function lvVisible(){ var r = document.getElementById('slbMatch'); return !!(r && r.offsetParent !== null); }
  var LASTSCR = 0, TCHD = false, LVRT = 0;
  window.addEventListener('scroll', function(){ LASTSCR = Date.now(); }, {passive: true});
  document.addEventListener('touchstart', function(){ TCHD = true; }, {passive: true});
  document.addEventListener('touchend', function(){ TCHD = false; LASTSCR = Date.now(); }, {passive: true});
  document.addEventListener('touchcancel', function(){ TCHD = false; }, {passive: true});
  function lvRedraw(){
    if(!lvVisible() || MCAT !== 'home') return;
    if(HREF || HPL || HTEAM || HLV) return;
    if(TCHD || Date.now() - LASTSCR < 500){ if(!LVRT) LVRT = setTimeout(function(){ LVRT = 0; lvRedraw(); }, 600); return; }
    drawMatch();
  }
  function lvPoll(){
    if(document.hidden) return;
    fetch(LVURL + '/s').then(function(r){ return r.json(); }).then(function(j){
      if(!j || !j.ev) return;
      LV.ev = j.ev.filter(function(e){ return LVMAP[e.lg] || cupLabel(e.lg); });
      var sig = JSON.stringify(LV.ev.filter(function(e){ return e.st !== 'pre'; }).map(function(e){ return [e.id, e.st, e.sh, e.sa, e.clk, e.nm]; }));
      var ch = sig !== LV.sig; LV.sig = sig;
      var now = Date.now(); LV.ev.forEach(function(e){ var o = FXO[e.id]; if(o && now - o.t < 60000) fxPut(e, o); });
      var cur = HSEL && lvVisible() ? lvOf(HSEL) : null;
      fmScores().then(function(c3){ if(c3 && !(cur && cur.st !== 'pre')) lvRedraw(); });
      if(cur && cur.st !== 'pre'){ fxGet(HSEL); return lvFetchM(cur).then(function(c2){ if(ch || c2) lvRedraw(); }); }
      if(ch) lvRedraw();
    }).catch(function(){});
  }
  var FMSC = {busy: 0};
  function fmScores(){
    var live = LV.ev.filter(function(e){ return e.st === 'in'; });
    if(!live.length || FMSC.busy) return Promise.resolve(false);
    FMSC.busy = 1;
    return fetch(LVURL + '/f?date=' + romeDay(new Date()).replace(/-/g, '')).then(function(r){ return r.json(); }).then(function(j){
      FMSC.busy = 0; var ch = false;
      live.forEach(function(e){
        (j.m || []).forEach(function(x){
          if(!x.sc || !x.s || !lvSame(x.h, e.h) || !lvSame(x.a, e.a)) return;
          var q = /(\d+)\s*-\s*(\d+)/.exec(x.sc); if(!q) return;
          var o = {sh: q[1], sa: q[2], st: x.f ? 'post' : 'in', nm: x.f ? 'STATUS_FULL_TIME' : e.nm, clk: x.lt || e.clk, t: Date.now()};
          if(e.sh !== o.sh || e.sa !== o.sa || e.clk !== o.clk || e.st !== o.st) ch = true;
          FXO[e.id] = o; fxPut(e, o);
        });
      });
      return ch;
    }).catch(function(){ FMSC.busy = 0; return false; });
  }
  setTimeout(lvPoll, 2500); setInterval(lvPoll, 10000); setTimeout(cupPrefetch, 1500);
  document.addEventListener('visibilitychange', function(){ if(!document.hidden) lvPoll(); });
  function lvSwitch(){
    var w = el('div', 'lvt'), b = el('button', 'lvsw' + (HLVON ? ' on' : '')); b.type = 'button'; b.setAttribute('aria-pressed', HLVON ? 'true' : 'false');
    b.appendChild(el('i', 'lvd')); b.appendChild(el('span', '', 'Live')); b.appendChild(el('u', 'lvk'));
    b.addEventListener('click', function(){ HLVON = !HLVON; b.classList.toggle('on', HLVON); HFI = true; setTimeout(function(){ drawMatch(); HFI = false; }, 140); });
    w.appendChild(b); return w;
  }
  function lvSide(s, e){ return String(e.team) === String(s.hid) ? 'h' : 'a'; }
  function cnm(x){ return /^\s*<?\s*(tbd|tba|unknown)\s*>?\s*$/i.test(x || '') ? '' : (x || ''); }
  function lvRows(s){
    var out = [], sc = [0, 0];
    (s.events || []).forEach(function(e){
      var t = e.t || '', tx = e.tx || '', min = e.min || '';
      if(e.goal || /^(goal|own-goal|penalty---scored)/.test(t)){
        var mm = /(\d+),\s.*?\s(\d+)\./.exec(tx), side = lvSide(s, e);
        if(mm){ var n0 = +mm[1], n1 = +mm[2]; side = n0 > sc[0] ? 'h' : n1 > sc[1] ? 'a' : side; sc = [n0, n1]; }
        else { sc[side === 'h' ? 0 : 1]++; }
        out.push({k: 'g', min: min, side: side, n: cnm((e.pl || [])[0]), as: cnm((e.pl || [])[1]), og: /own/.test(t), pen: /penalty/.test(t), sc: sc[0] + ' - ' + sc[1], p: e.p});
      } else if(/yellow-card|red-card/.test(t)){
        out.push({k: /red/.test(t) ? 'r' : 'y', min: min, side: lvSide(s, e), n: cnm((e.pl || [])[0]), p: e.p});
      } else if(t === 'substitution'){
        var q = /\.\s+(.+?)\s+replaces\s+(.+?)(?:\s+because.*|\.\s*)?$/.exec(tx), pi = q ? q[1] : (e.pl || [])[0], po = q ? q[2] : (e.pl || [])[1];
        out.push({k: 's', min: min, side: lvSide(s, e), n: cnm(pi), o: cnm(po), p: e.p});
      }
    });
    return out;
  }
  function lvOpenByName(s, name, side, m){
    var R = null; (s.rosters || []).forEach(function(r){ if((r.side === 'home') === (side === 'h')) R = r; });
    if(!R || !name) return;
    var q = nk(name), last = q.split(' ').pop(), best = null;
    (R.players || []).forEach(function(p){ var k = nk(p.n || ''); if(k === q) best = p; else if(!best && k.split(' ').pop() === last && k.charAt(0) === q.charAt(0)) best = p; });
    if(best) lvSheet(best, side === 'h' ? m.h : m.a, m, s);
  }
  function lvPano(box, m, e){
    var s = LVM[e.id]; fxGet(m); var F = fxData(m);
    if(!s && !F){ box.appendChild(el('div', 'hempty', 'Carico…')); lvFetchM(e).then(function(){ lvRedraw(); }); return; }
    s = s || {events: []};
    if(F && F.mo) momentumBox(box, {ev: (F.ev || []).filter(function(q){ return q.ty === 'Goal'; }).map(function(q){ return ['goal', q.t, 0, '', q.h ? 'h' : 'a']; })}, m, F.mo);
    var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec hsc2', 'Riassunto'));
    var rows = F && F.ev ? fxRows(F) : lvRows(s);
    if(!rows.length && e.st === 'pre'){ c = null; }
    else if(!rows.length) c.appendChild(el('div', 'hempty', 'Nessun evento'));
    if(c){
    var half = false, ptS = null;
    rows.forEach(function(x){ if(x.k === 'g' && (x.p || 1) === 1) ptS = x.sc; });
    rows.forEach(function(x){
      if(!half && (x.p || 1) >= 2){ half = true; c.appendChild(el('div', 'hevs', 'PT ' + (ptS || '0 - 0'))); }
      var r = el('div', 'hev ' + (x.side === 'h' ? 'l' : 'r')), mn = el('span', 'mn', x.min), ic = el('span', 'ic'), nm = el('span', 'nm2');
      var lsd = x.side === 'h' ? 'h' : 'a', lpf = function(n, id){ return function(){ if(F && fxOpen(F, id, n, lsd, m)) return; lvOpenByName(s, n, lsd, m); }; };
      if(x.k === 'g'){ ic.textContent = '⚽'; nm.appendChild(nameTap(el('b', '', x.n), lpf(x.n, x.pid))); nm.appendChild(el('small', '', (x.og ? 'autogol · ' : x.pen ? 'rigore · ' : '') + (x.as ? 'assist ' + x.as + ' · ' : '') + x.sc)); }
      else if(x.k === 's'){ ic.innerHTML = subSvg('both'); ic.className = 'ic sb'; nm.appendChild(nameTap(el('b', '', x.n), lpf(x.n, x.pid))); nm.appendChild(nameTap(el('small', 'fd', x.o || ''), lpf(x.o || '', x.opid))); }
      else { ic.appendChild(yc()); if(x.k === 'r') ic.firstChild.className += ' rd'; nm.appendChild(nameTap(el('b', '', x.n), lpf(x.n, x.pid))); }
      if(x.side === 'h'){ r.appendChild(mn); r.appendChild(ic); r.appendChild(nm); } else { r.appendChild(nm); r.appendChild(ic); r.appendChild(mn); }
      c.appendChild(r);
    });
    if(e.st === 'post') c.appendChild(el('div', 'hevs', 'FT ' + e.sh + ' - ' + e.sa));
    box.appendChild(c); }
    var fmap = {W: 'V', D: 'P', L: 'S'}, fo = {};
    (s.form || []).forEach(function(f){ fo[String(f.id)] = String(f.r || '').split('').map(function(x){ return fmap[x] || ''; }).join('').slice(-5); });
    var fh2 = fo[String(s.hid)], fa2 = fo[String(s.aid)];
    if(fh2 || fa2){
      var fc2 = el('div', 'hcard'); fc2.appendChild(el('div', 'hsec', 'Forma'));
      [[m.h, fh2 || '', m.hl], [m.a, fa2 || '', m.al]].forEach(function(r){
        var d = el('div', 'hr2 t2'); var l = el('span', 'l'); l.appendChild(crestEl(r[2], r[0], 20)); l.appendChild(document.createTextNode(' ' + r[0])); d.appendChild(l);
        var b = el('b', ''); b.appendChild(formBoxes(r[1])); d.appendChild(b); fc2.appendChild(d);
      });
      box.appendChild(fc2);
    }
    var of = (s.officials || [])[0], ref = of && (of.fullName || of.displayName);
    var fxr = fxGet(m), fref = fxr && fxr.ref;
    infoBand(box, m, s.venue && s.venue.fullName, ref || (fref && fref.n) || null);
    if(!ref && fref) refCardFx(box, fref);
  }
  var LVST = [['possessionPct', 'Possesso palla', 0], ['totalShots', 'Tiri totali'], ['shotsOnTarget', 'Tiri in porta'], ['blockedShots', 'Tiri bloccati'], ['totalPasses', 'Passaggi'], ['passPct', 'Precisione passaggi %', 0, 100], ['wonCorners', 'Corner'], ['foulsCommitted', 'Falli'], ['yellowCards', 'Gialli'], ['redCards', 'Rossi'], ['offsides', 'Fuorigiochi'], ['saves', 'Parate'], ['totalCrosses', 'Cross'], ['totalTackles', 'Contrasti'], ['interceptions', 'Intercetti'], ['totalClearance', 'Rinvii']];
  function lvStat(box, m, e){
    fxGet(m); var F = fxData(m);
    if(F && F.stats && F.stats.All){ fxStats(box, m, F); return; }
    var s = LVM[e.id];
    if(!s){ box.appendChild(el('div', 'hempty', 'Carico…')); lvFetchM(e).then(function(){ lvRedraw(); }); return; }
    var H = null, A = null; (s.teams || []).forEach(function(t){ if(t.side === 'home') H = t.s; else A = t.s; });
    if(!H || !A){ box.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili')); return; }
    segmented(box, [['d', 'Dati'], ['t', 'Mappa tiri']], HSM, function(v){ HSM = v; HSHOT = null; drawMatch(); });
    if(HSM === 't'){ shotsView(box, m, null); return; }
    var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', 'Statistiche'));
    LVST.forEach(function(d){
      var a = parseFloat(H[d[0]]), b = parseFloat(A[d[0]]); if(isNaN(a) && isNaN(b)) return;
      var k = d[3] || 1; c.appendChild(statRow(d[1], isNaN(a) ? null : a * k, isNaN(b) ? null : b * k, 0));
    });
    box.appendChild(c);
  }
  function lvKey(p){ var q = p.pos || ''; return /^L/.test(q) ? 0 : /-L$/.test(q) ? 1 : /^R/.test(q) ? 4 : /-R$/.test(q) ? 3 : 2; }
  function lvStats(p){
    var d = p.s || {}, o = [];
    function add(k, l){ var v = d[k]; if(v) o.push([l, String(Math.round(v))]); }
    add('totalGoals', 'Gol'); add('goalAssists', 'Assist'); add('totalShots', 'Tiri'); add('shotsOnTarget', 'In porta'); add('foulsCommitted', 'Falli fatti'); add('foulsSuffered', 'Falli subiti'); add('offsides', 'Fuorigioco'); add('yellowCards', 'Gialli'); add('redCards', 'Rossi'); add('saves', 'Parate'); add('goalsConceded', 'Gol subiti'); add('ownGoals', 'Autogol');
    return o;
  }
  var FCUP = null, FCT = {};
  function fcLoad(){ if(FCUP === null){ FCUP = 0; gj('fotocoppe.json').then(function(j){ FCUP = j || {t: {}}; if(lvVisible() && j) drawMatch(); }); } return FCUP || null; }
  function fcTeam(team){
    var C = FCUP; if(!C || !C.t) return null; if(team in FCT) return FCT[team];
    var r = null; Object.keys(C.t).some(function(k){ if(k === team || lvSame(k, team)){ r = k; return true; } return false; }); return FCT[team] = r;
  }
  function lvPhoto(p, team){
    var db = findPlayer(p.n, team, true), u = db ? photoFor(db) : null; if(u) return u;
    var C = fcLoad(); if(!C) return null; var k = fcTeam(team); if(!k) return null;
    var T = C.t[k], n = norm(p.n).replace(/[^a-z ]/g, '').trim(); if(T[n]) return T[n];
    var tk = n.split(' '), last = tk[tk.length - 1];
    for(var q in T){ var qt = q.split(' '); if(qt[qt.length - 1] === last && qt[0].charAt(0) === tk[0].charAt(0)) return T[q]; }
    return null;
  }
  function lvHead(p){ return p && p.id ? 'https://a.espncdn.com/i/headshots/soccer/players/full/' + p.id + '.png' : null; }

  function lvElapsed(s){ var c = s && s.status && s.status.displayClock || '', q = /(\d+)'(?:\+(\d+))?/.exec(c); return q ? (+q[1] + (+q[2] || 0)) : null; }
  function lvMinutes(p, s){
    var end = lvElapsed(s), st = s && s.status && s.status.type && s.status.type.state; if(st === 'post') end = Math.max(end || 0, 90);
    if(end == null) return null;
    var ins = null, outs = null, nm = String(p.n || '');
    (s.events || []).forEach(function(e){
      if(e.t !== 'substitution') return;
      var q = /\.\s+(.+?)\s+replaces\s+(.+?)(?:\s+because.*|\.\s*)?$/.exec(e.tx || ''), mm = /(\d+)/.exec(e.min || ''); if(!q || !mm) return;
      if(q[1] === nm) ins = +mm[1]; if(q[2] === nm) outs = +mm[1];
    });
    if(p.st) return outs != null ? outs : (p.out ? null : end);
    if(!p.in && ins == null) return 0;
    return Math.max(0, (outs != null ? outs : end) - (ins != null ? ins : end));
  }
  var LVSG = [
    ['Attacco', [['totalGoals', 'Gol'], ['goalAssists', 'Assist'], ['totalShots', 'Tiri totali'], ['shotsOnTarget', 'Tiri in porta'], ['offsides', 'Fuorigioco']]],
    ['Difesa e disciplina', [['foulsCommitted', 'Falli commessi'], ['foulsSuffered', 'Falli subiti'], ['yellowCards', 'Gialli'], ['redCards', 'Rossi'], ['ownGoals', 'Autogol']]],
    ['Portiere', [['saves', 'Parate'], ['shotsFaced', 'Tiri subiti'], ['goalsConceded', 'Gol subiti']], 1]
  ];
  var LVSH = null;

  var ISO3 = {ITA: 'IT', ESP: 'ES', GER: 'DE', DEU: 'DE', FRA: 'FR', POR: 'PT', NED: 'NL', NLD: 'NL', BEL: 'BE', ARG: 'AR', BRA: 'BR', CRO: 'HR', HRV: 'HR', SRB: 'RS', SUI: 'CH', CHE: 'CH', AUT: 'AT', DEN: 'DK', DNK: 'DK', SWE: 'SE', NOR: 'NO', POL: 'PL', ROU: 'RO', ROM: 'RO', TUR: 'TR', GRE: 'GR', GRC: 'GR', URU: 'UY', CHI: 'CL', CHL: 'CL', COL: 'CO', MEX: 'MX', USA: 'US', CZE: 'CZ', SVK: 'SK', SVN: 'SI', HUN: 'HU', UKR: 'UA', RUS: 'RU', IRL: 'IE', ISR: 'IL', JPN: 'JP', KOR: 'KR', AUS: 'AU', MAR: 'MA', ALG: 'DZ', DZA: 'DZ', TUN: 'TN', SEN: 'SN', NGA: 'NG', GHA: 'GH', CIV: 'CI', CMR: 'CM', BIH: 'BA', MNE: 'ME', MKD: 'MK', ALB: 'AL', KVX: 'XK', FIN: 'FI', ISL: 'IS', BUL: 'BG', BGR: 'BG', CYP: 'CY', GEO: 'GE', ARM: 'AM', CAN: 'CA', PAR: 'PY', PRY: 'PY', ECU: 'EC', PER: 'PE', VEN: 'VE', LUX: 'LU', EGY: 'EG', CHN: 'CN', AZE: 'AZ', KAZ: 'KZ', BLR: 'BY', LVA: 'LV', LTU: 'LT', EST: 'EE', MLT: 'MT', FRO: 'FO'};
  var FMIMG = 'https://images.fotmob.com/image_resources/playerimages/';
  function tagFlag(t){ return String.fromCodePoint.apply(null, [0x1F3F4].concat(t.split('').map(function(c){ return 0xE0000 + c.charCodeAt(0); }), [0xE007F])); }
  function flagCode(c){
    if(!c) return '';
    c = String(c).trim(); var u = c.toUpperCase();
    if(u === 'ENG') return tagFlag('gbeng'); if(u === 'SCO') return tagFlag('gbsct'); if(u === 'WAL') return tagFlag('gbwls'); if(u === 'NIR') return '\u{1F1EC}\u{1F1E7}';
    if(ISO3[u]) return flagOf(ISO3[u]);
    if(u === 'GBR' || u === 'GB' || u === 'UK') return '\u{1F1EC}\u{1F1E7}';
    return flagOf(c);
  }
  function coachFM(m){
    var f = fmFind(m);
    var redo = function(){ if(HSEL && HSEL.d === m.d && HSEL.h === m.h && lvVisible() && /form/.test(HTAB) && !LVSH && !HPL && !HTEAM && !HREF) drawMatch(); };
    if(f === undefined){ fmDay(m.d, redo); return null; }
    if(!f) return null;
    var c = FMS[f.id];
    if(c && c.co) return c.co;
    if(!c){ fmFetch(f, function(){ redo(); }); }
    return null;
  }
  function coachCard(box, name, id, fallbackPhoto, cc){
    var cc2 = el('div', 'hcard hcoach'), cfw = el('span', 'cf'), cph = el('span', 'ph');
    var url = id ? FMIMG + id + '.png' : fallbackPhoto;
    if(url){ var cim = el('img'); cim.src = url; cim.alt = ''; cim.onerror = function(){ cim.remove(); cph.textContent = inits(name); }; cph.appendChild(cim); } else cph.textContent = inits(name);
    cfw.appendChild(cph); cc2.appendChild(cfw);
    var cnn = el('div', 'cn'); cnn.appendChild(el('small', '', 'Allenatore'));
    var b = el('b', '', name), fg = flagCode(cc); if(fg) b.appendChild(el('span', 'fl2', fg));
    cnn.appendChild(b); cc2.appendChild(cnn); box.appendChild(cc2);
  }
  var PFET = {}, PCON = {};
  function prefetch(urls){
    (urls || []).forEach(function(u){
      if(!u || PFET[u]) return; PFET[u] = 1;
      try{
        var o = new URL(u, location.href).origin;
        if(!PCON[o]){ PCON[o] = 1; var l = document.createElement('link'); l.rel = 'preconnect'; l.href = o; l.crossOrigin = 'anonymous'; document.head.appendChild(l); }
      }catch(e){}
      var i = new Image(); i.decoding = 'async'; i.src = u;
    });
  }
  function prefetchMatch(m){
    if(!m) return;
    var u = [];
    try{
      if(PDATA) PDATA.forEach(function(p){ if(p.t === m.h || p.t === m.a){ var x = photoFor(p); if(x) u.push(x); } });
      var L = HD && HD.lin && HD.lin[m.id];
      [m.h, m.a].forEach(function(t){ var C = fcLoad && fcLoad(); if(C){ var k = fcTeam(t); if(k && C.t[k]) Object.keys(C.t[k]).forEach(function(n){ u.push(C.t[k][n]); }); } });
    }catch(e){}
    var i = 0, step = function(){ prefetch(u.slice(i, i + 12)); i += 12; if(i < u.length) setTimeout(step, 60); };
    setTimeout(step, 0);
  }
  function prefetchCrests(){
    if(!HD || !HD.matches) return;
    var u = [], seen = {};
    HD.matches.forEach(function(m){ [m.hl, m.al].forEach(function(x){ if(x && !seen[x]){ seen[x] = 1; u.push(x); } }); });
    var i = 0, step = function(){ prefetch(u.slice(i, i + 15)); i += 15; if(i < u.length) setTimeout(step, 80); };
    setTimeout(step, 400);
  }
  var PKEYS = null;
  var PIT = {goals: 'Gol', assists: 'Assist', total_shots: 'Tiri totali', ShotsOnTarget: 'Tiri in porta', ShotsOffTarget: 'Tiri fuori', expected_goals: 'xG', expected_assists: 'xA', expected_goals_on_target: 'xGOT', chances_created: 'Occasioni create', touches: 'Tocchi', accurate_passes: 'Passaggi riusciti', passes: 'Passaggi', passes_into_final_third: 'Passaggi nell’ultimo terzo', long_balls_accurate: 'Lanci lunghi riusciti', accurate_long_balls: 'Lanci lunghi riusciti', accurate_crosses: 'Cross riusciti', dribbles_succeeded: 'Dribbling riusciti', ground_duels_won: 'Duelli a terra vinti', aerials_won: 'Duelli aerei vinti', duel_won: 'Duelli vinti', tackles_won: 'Contrasti vinti', 'matchstats.headers.tackles': 'Contrasti', interceptions: 'Intercetti', clearances: 'Respinte', recoveries: 'Recuperi', dispossessed: 'Palloni persi', was_fouled: 'Falli subiti', fouls: 'Falli commessi', shot_blocks: 'Tiri bloccati', keeper_saves: 'Parate', goals_conceded: 'Gol subiti', touches_opp_box: 'Tocchi in area avversaria', big_chance: 'Grandi occasioni', big_chance_missed_title: 'Grandi occasioni sbagliate', yellow_cards: 'Gialli', red_cards: 'Rossi', Offsides: 'Fuorigiochi', offsides: 'Fuorigiochi', blocked_shots: 'Tiri murati', shots_woodwork: 'Pali e traverse', penalties_won: 'Rigori procurati', penalty_won: 'Rigori procurati', own_goals: 'Autogol', error_led_to_goal: 'Errori che portano a gol', error_led_to_shot: 'Errori che portano a tiro', pass_value: 'Valore dei passaggi', defensive_actions: 'Azioni difensive', dribbled_past: 'Dribblato', clearances_off_line: 'Salvataggi sulla linea', xg_and_xa: 'xG + xA', expected_goals_non_penalty: 'xG senza rigori', punches: 'Pugni', high_claim: 'Uscite alte', saves_inside_box: 'Parate in area', diving_save: 'Parate in tuffo', keeper_sweeper: 'Uscite basse', goals_prevented: 'Gol evitati', expected_goals_prevented: 'Gol evitati (xGP)', accurate_passes_own_half: 'Passaggi nella propria metà', opposition_half_passes: 'Passaggi nella metà avversaria', distance_covered: 'Distanza percorsa', top_speed: 'Velocità massima', sprints: 'Sprint'};
  var PIT2 = {big_chance_created_team_title: 'Grandi occasioni create', clearance_off_the_line: 'Salvataggi sulla linea', conceded_penalties: 'Rigori concessi', duel_lost: 'Duelli persi', errors_led_to_goal: 'Errori che portano a gol', expected_goals_on_target_faced: 'xGOT subiti', expected_goals_on_target_variant: 'xGOT', fantasy_points: 'Punti fantacalcio', goals_prevented: 'Gol evitati', headed_clearance: 'Respinte di testa', keeper_diving_save: 'Parate in tuffo', keeper_high_claim: 'Uscite alte', keeper_sweeper: 'Uscite basse', last_man_tackle: 'Contrasti da ultimo uomo', line_breaking_passes: 'Passaggi che rompono la linea', missed_penalty: 'Rigori sbagliati', owngoal: 'Autogol', penalties_won: 'Rigori procurati', physical_metrics_distance_covered: 'Distanza percorsa', physical_metrics_number_of_sprints: 'Sprint', physical_metrics_running: 'Distanza in corsa', physical_metrics_sprinting: 'Distanza in sprint', physical_metrics_topspeed: 'Velocit\u00E0 massima', saved_penalties: 'Rigori parati', saves: 'Parate', shot_accuracy: 'Precisione tiri', xg_and_xa: 'xG + xA', ShotsOffTarget: 'Tiri fuori', blocked_shots: 'Tiri murati', player_throws: 'Rimesse laterali', punches: 'Pugni', defensive_actions: 'Azioni difensive', dribbled_past: 'Dribblato', dispossessed: 'Palloni persi', recoveries: 'Recuperi'};
  Object.keys(PIT2).forEach(function(k){ PIT[k] = PIT2[k]; });
  var PGR = {'physical metrics': 'Fisico', 'physical_metrics': 'Fisico', 'top stats': 'Principali', 'top_stats': 'Principali', attack: 'Attacco', defense: 'Difesa', defence: 'Difesa', duels: 'Duelli', passing: 'Passaggi', passes: 'Passaggi', goalkeeping: 'Portiere', keeper: 'Portiere', discipline: 'Disciplina', physical: 'Fisico', general: 'Generale', shooting: 'Tiri', shots: 'Tiri', possession: 'Possesso', dribbling: 'Dribbling'};
  function pgName(g){ var k = String(g || '').toLowerCase().trim(); return PGR[k] || PGR[k.replace(/ /g, '_')] || (g ? String(g).charAt(0).toUpperCase() + String(g).slice(1) : 'Altro'); }
  function fmtPV(v, type){
    var n = function(x){ return f1(String(Math.round(x * 100) / 100)); };
    if(v instanceof Array){ var a = v[0], t = v[1]; return n(a) + '/' + n(t) + (t > 0 ? ' (' + Math.round(100 * a / t) + '%)' : ''); }
    return n(v) + (/percent/i.test(type || '') ? '%' : '');
  }
  function psRow(rec, name, side){
    var q = nk(name), best = null, last = q.split(' ').pop();
    (rec.ps || []).forEach(function(r){ if(r[1] !== side) return; var k = nk(r[0]); if(k === q){ best = r; } else if(!best && k.split(' ').pop() === last && k.charAt(0) === q.charAt(0)) best = r; });
    return best;
  }
  function plRow(rec, name, side){
    var q = nk(name), best = null, last = q.split(' ').pop();
    (rec.pl || []).forEach(function(r){ if(r[1] !== side) return; var k = nk(r[0]); if(k === q){ best = r; } else if(!best && k.split(' ').pop() === last && k.charAt(0) === q.charAt(0)) best = r; });
    return best;
  }
  function pastSheet(name, side, rec, m, shirt){
    if(!name) return;
    var team = side === 'h' ? m.h : m.a;
    var go = function(keys){
      var ps = psRow(rec, name, side), pl = plRow(rec, name, side);
      var lu = rec.lu && rec.lu[side], pos = null;
      ['st', 'su'].forEach(function(k){ ((lu && lu[k]) || []).forEach(function(x){ if(nk(x[0]) === nk(name)){ if(shirt == null) shirt = x[1]; if(k === 'st' && x[3] != null) pos = x[3] <= .15 ? 'P' : x[3] < .45 ? 'D' : x[3] < .8 ? 'C' : 'A'; else if(k === 'su' && typeof x[2] === 'number' && x[2] >= 0 && x[2] <= 3) pos = 'PDCA'.charAt(x[2]); } }); });
      var p = {n: name, j: shirt, pos: pos, id: null, rt: (pl && pl[2] != null && pl[2] > 0) ? Number(pl[2]) : null};
      var db = findPlayer(name, team, true);
      lvSheet(p, team, m, null, function(block, body){
        var fmq = fmFind(m), fmc = fmq && FMS[fmq.id], shAll = shNorm(rec, fmc && fmc.sh && fmc.sh.length ? fmc : null);
        shBlock(body, shAll, name, side);
        var rt = pl && pl[2] != null && pl[2] > 0 ? Number(pl[2]) : null, mn = ps && ps[2].minutes_played != null ? (ps[2].minutes_played instanceof Array ? ps[2].minutes_played[0] : ps[2].minutes_played) : (pl && pl[3]);
        var gen = [['Voto', rt == null ? '–' : f1(rt.toFixed(1)), rt == null ? null : ratCol(rt)], ['Minuti', mn == null ? '–' : Math.round(mn) + '’']];
        if(pos) gen.push(['Ruolo', pos]);
        block('Generale', gen);
        if(ps){
          var groups = [], gm = {}, full = ps[2];
          Object.keys(full).forEach(function(k){
            if(k === 'minutes_played' || k === 'rating_title' || !k || /shotmap|fantasy/i.test(k)) return;
            var v = full[k], tot = v instanceof Array ? v[1] : null, val = v instanceof Array ? v[0] : v;
            if(!val && !tot) return;
            var mt = keys[k] || ['', '', ''], g = pgName(mt[1]);
            if(!gm[g]){ gm[g] = []; groups.push(g); }
            gm[g].push([PIT[k] || mt[0] || k, fmtPV(v, mt[2])]);
          });
          groups.forEach(function(g){ block(g, gm[g]); });
        } else if(pl){
          var KS = rec.plk || [], rows = [];
          KS.forEach(function(k, i){ if(k === 'rating_title' || k === 'minutes_played') return; var v = pl[2 + i]; if(v == null || v === 0) return; rows.push([PIT[k] || k, fmtPV(v, '')]); });
          if(rows.length) block('Statistiche', rows); else body.appendChild(el('div', 'hempty', 'Statistiche dettagliate non disponibili'));
        } else body.appendChild(el('div', 'hempty', 'Statistiche dettagliate non disponibili'));
        if(db){
          var lk = el('button', 'lvlink', 'Scheda giocatore ›'); lk.type = 'button';
          lk.addEventListener('click', function(){ lvSheetClose(); openPlayer(db); }); body.appendChild(lk);
        }
      });
    };
    if(PKEYS) go(PKEYS); else gj('player_keys.json').then(function(k){ PKEYS = k || {}; go(PKEYS); });
  }
  function nameTap(node, fn){ node.style.cursor = 'pointer'; node.classList.add('nlink'); node.addEventListener('click', function(ev){ ev.stopPropagation(); fn(); }); return node; }
  function lvSheetClose(){
    var o = LVSH; if(!o) return; LVSH = null; o.classList.remove('on'); try{ document.documentElement.style.overflow = ''; }catch(e){}
    setTimeout(function(){ if(o.parentNode) o.parentNode.removeChild(o); }, 300);
  }
  function lvSheet(p, team, m, s, custom){
    if(LVSH) lvSheetClose();
    var ov = el('div', 'lvov'), pn = el('div', 'lvpn');
    ov.addEventListener('click', function(ev){ if(ev.target === ov) lvSheetClose(); });
    var hd = el('div', 'lvhd'); hd.appendChild(el('i', 'lvgrip'));
    var top = el('div', 'lvtop'), pf = el('span', 'lvf'), pu = lvPhoto(p, team) || p.img || lvHead(p);
    if(pu){ var im = el('img'); im.src = pu; im.alt = ''; im.onerror = function(){ im.remove(); pf.textContent = inits(p.n); }; pf.appendChild(im); } else pf.textContent = inits(p.n);
    top.appendChild(pf);
    var nb = el('div', 'lvnm'); nb.appendChild(el('b', '', p.n || ''));
    nb.appendChild(el('small', '', (p.j != null ? '#' + p.j : '') + (p.pos ? ' · ' + p.pos : '') + ' · ' + team));
    top.appendChild(nb);
    if(p.rt){ var rtb = el('span', 'lvrt', f1(p.rt.toFixed(1))); rtb.style.background = ratCol(p.rt); if(p.rt >= 6 && p.rt < 7) rtb.style.color = '#241800'; top.appendChild(rtb); }
    hd.appendChild(top); pn.appendChild(hd);
    var mn = custom ? null : lvMinutes(p, s), d = p.s || {}, body = el('div', 'lvbd');
    function block(title, rows){
      var c = el('div', 'lvgp'); c.appendChild(el('div', 'lvgt', title));
      rows.forEach(function(r){ var x = el('div', 'lvrw'), bb = el('b', '', r[1]); if(r[2]) bb.style.color = r[2]; x.appendChild(el('span', '', r[0])); x.appendChild(bb); c.appendChild(x); });
      body.appendChild(c);
    }
    if(custom) custom(block, body);
    else {
    block('Generale', [['Minuti', mn == null ? '–' : mn + '’'], ['Ruolo', p.pos || '–'], ['Stato', p.st ? (p.out ? 'Titolare, sostituito' : 'Titolare') : (p.in ? 'Subentrato' : 'In panchina')]]);
    LVSG.forEach(function(g){
      if(g[2] && !(/^G/.test(p.pos || '') || d.saves || d.shotsFaced)) return;
      block(g[0], g[1].map(function(r){ var v = d[r[0]]; return [r[1], v == null ? '0' : String(Math.round(v))]; }));
    });
    }
    pn.appendChild(body); ov.appendChild(pn); document.body.appendChild(ov); LVSH = ov;
    var y0 = null, dy = 0, drag = false;
    pn.addEventListener('touchstart', function(ev){ y0 = ev.touches[0].clientY; dy = 0; drag = false; }, {passive: true});
    pn.addEventListener('touchmove', function(ev){
      if(y0 == null) return;
      var d = ev.touches[0].clientY - y0;
      if(!drag){ if(d > 3 && pn.scrollTop <= 0){ drag = true; pn.style.transition = 'none'; ov.style.transition = 'none'; } else return; }
      ev.preventDefault(); dy = Math.max(0, d);
      pn.style.transform = 'translateY(' + dy + 'px)'; ov.style.background = 'rgba(0,0,0,' + (0.55 * (1 - Math.min(1, dy / 420))).toFixed(3) + ')';
    }, {passive: false});
    function endDrag(){
      if(!drag){ y0 = null; return; }
      drag = false; y0 = null; pn.style.transition = ''; ov.style.transition = '';
      if(dy > 90){ ov.style.background = ''; pn.style.transform = ''; lvSheetClose(); }
      else { pn.style.transform = ''; ov.style.background = ''; }
    }
    pn.addEventListener('touchend', endDrag); pn.addEventListener('touchcancel', endDrag);
    ov.addEventListener('touchmove', function(ev){ if(!pn.contains(ev.target)) ev.preventDefault(); }, {passive: false});
    try{ document.documentElement.style.overflow = 'hidden'; }catch(e){}
    void ov.offsetWidth; ov.classList.add('on');
  }
  function lvForm(box, m, e){
    var fx0 = fxGet(m);
    if(fx0 && (fx0.h || fx0.a)){ tabLineup(box); return; }
    if(fx0 === undefined){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
    var s = LVM[e.id];
    if(!s){ box.appendChild(el('div', 'hempty', 'Carico…')); lvFetchM(e).then(function(){ lvRedraw(); }); return; }
    var sw = el('div', 'hsw');
    [['h', m.h, m.hl], ['a', m.a, m.al]].forEach(function(o){
      var b = el('button', HSIDE === o[0] ? 'on' : ''); b.type = 'button'; b.appendChild(crestEl(o[2], o[1], 22)); b.appendChild(el('span', '', o[1]));
      b.addEventListener('click', function(){ HSIDE = o[0]; LVP = null; drawMatch(); }); sw.appendChild(b);
    });
    box.appendChild(sw);
    var R = null; (s.rosters || []).forEach(function(r){ if((r.side === 'home') === (HSIDE === 'h')) R = r; });
    var team = HSIDE === 'h' ? m.h : m.a;
    if(!R || !(R.players || []).length){
      var fxl = fxGet(m);
      if(fxl && fxl[HSIDE]){ box.removeChild(sw); tabLineup(box); return; }
      box.appendChild(el('div', 'hempty', fxl === undefined ? 'Carico…' : 'Formazione non ancora disponibile')); return;
    }
    var st = R.players.filter(function(p){ return p.st; }).sort(function(a, b){ return (+a.fp || 0) - (+b.fp || 0); });
    var bn = R.players.filter(function(p){ return !p.st; });
    var top = el('div', 'hsec', 'Formazione' + (R.formation ? ' · ' + R.formation : '')); top.style.padding = '0 2px 8px'; box.appendChild(top);
    var fm = String(R.formation || '').split('-').map(Number).filter(function(x){ return x > 0; });
    if(fm.reduce(function(a, b){ return a + b; }, 0) !== st.length - 1) fm = [4, 4, 2];
    var lines = [[st[0]]], idx = 1; fm.forEach(function(n){ lines.push(st.slice(idx, idx + n)); idx += n; });
    var pitch = el('div', 'hpitch');
    pitch.innerHTML = '<svg class="ln" viewBox="0 0 68 100" preserveAspectRatio="none" fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".45"><rect x="1.5" y="1.5" width="65" height="97"/><path d="M1.5 50h65"/><circle cx="34" cy="50" r="8"/><rect x="14" y="1.5" width="40" height="15"/><rect x="25" y="1.5" width="18" height="6"/><rect x="14" y="83.5" width="40" height="15"/><rect x="25" y="92.5" width="18" height="6"/></svg>';
    lines.forEach(function(L, li){
      var srt = L.map(function(p, i){ return {p: p, i: i}; }).filter(function(o){ return o.p; }).sort(function(a, b){ return lvKey(a.p) - lvKey(b.p) || a.i - b.i; });
      srt.forEach(function(o, i){
        var p = o.p, b = el('button', 'hp'); b.type = 'button';
        b.style.left = ((i + 1) / (srt.length + 1) * 100) + '%'; b.style.top = (lines.length > 1 ? 88 - 78 * li / (lines.length - 1) : 50) + '%';
        var fc = el('span', 'fc'), fu = lvPhoto(p, team) || p.img || lvHead(p);
        if(fu){ var im = el('img'); im.src = fu; im.alt = ''; im.onerror = function(){ im.remove(); fc.textContent = inits(p.n); }; fc.appendChild(im); } else fc.textContent = inits(p.n);
        b.appendChild(fc); b.appendChild(el('span', 'pn', (p.j != null ? p.j + ' ' : '') + shortName(p.n || '')));
        var g = (p.s || {}).totalGoals || 0, y = (p.s || {}).yellowCards || 0, rd = (p.s || {}).redCards || 0, bd = null;
        if(g){ bd = el('span', 'vb', '⚽' + (g > 1 ? g : '')); bd.style.background = '#1E8E3E'; }
        else if(rd){ bd = el('span', 'vb'); bd.style.background = '#D93A3A'; }
        else if(y){ bd = el('span', 'vb'); bd.style.background = '#F2C230'; }
        else if(p.out){ bd = el('span', 'vb', '▼'); bd.style.background = '#D93A3A'; }
        if(bd) b.appendChild(bd);
        b.addEventListener('click', function(){ lvSheet(p, team, m, s); });
        pitch.appendChild(b);
      });
    });
    box.appendChild(pitch);
    var lfm = coachFM(m), lc0 = lfm && lfm[HSIDE === 'h' ? 0 : 1];
    if(lc0 && lc0.n) coachCard(box, lc0.n, lc0.id, null, lc0.cc);
    if(bn.length){
      var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', 'Panchina'));
      var gr = el('div', 'hbg');
      bn.forEach(function(p){
        var b = el('button', 'hbp'); b.type = 'button';
        var pf = el('span', 'pfc'), pu = lvPhoto(p, team) || p.img || lvHead(p);
        if(pu){ var im = el('img'); im.src = pu; im.alt = ''; im.onerror = function(){ im.remove(); pf.textContent = inits(p.n); }; pf.appendChild(im); } else pf.textContent = inits(p.n);
        b.appendChild(pf); b.appendChild(el('span', 'bn', p.j != null ? String(p.j) : '')); b.appendChild(el('span', 'bm', shortName(p.n || '') + (p.in ? ' ▲' : '')));
        b.addEventListener('click', function(){ lvSheet(p, team, m, s); });
        gr.appendChild(b);
      });
      c.appendChild(gr); box.appendChild(c);
    }
  }
  var STID = null;
  function stiId(m){
    if(!STI || !m) return null;
    var id = STI[m.d + '|' + m.h + '|' + m.a]; if(id) return id;
    if(!m.cup) return null;
    if(!STID){ STID = {}; Object.keys(STI).forEach(function(q){ var p = q.split('|'); (STID[p[0]] = STID[p[0]] || []).push([p[1], p[2], STI[q]]); }); }
    var r = null; (STID[m.d] || []).some(function(x){ if(lvSame(x[0], m.h) && lvSame(x[1], m.a)){ r = x[2]; return true; } return false; });
    return r;
  }
  function pastScore(m){
    if(m.es && !m.cup && !stiId(m)) return null;
    if(m.sh != null) return [m.sh, m.sa];
    var R = resIdx(), x = R && R[m.d + '|' + m.h + '|' + m.a]; if(x) return [x[0], x[1]];
    if(stiId(m)){ var rr = matchRec(m); if(rr && rr.sh != null) return [rr.sh, rr.sa]; }
    return null;
  }
  function matchRec(m){
    var id = stiId(m); if(!id) return null;
    if(MF[id] === undefined){ MF[id] = 0; gj('match/' + id + '.json').then(function(r){ MF[id] = r || null; if(HSEL && stiId(HSEL) === id && MCAT === 'home') drawMatch(); }); }
    return MF[id] || null;
  }

  function subSvg(k){
    var dn = '<path d="M7 3v14M3 13l4 4 4-4" stroke="#E5484D" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    var up = '<path d="M15 19V5M11 9l4-4 4 4" stroke="#2DBE60" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
    return '<svg width="22" height="22" viewBox="0 0 22 22">' + (k === 'out' ? dn : k === 'in' ? up : dn + up) + '</svg>';
  }
  function yc(){ var i = el('i', 'hyc'); return i; }
  function minTxt(e){ return (e[1] != null ? e[1] : '') + (e[2] ? '+' + e[2] : '') + '’'; }
  function eventsBox(box, rec, m){
    var ev = (rec.ev || []).filter(function(e){ return e[0] === 'goal' || e[0] === 'yellowcard' || e[0] === 'redcard' || e[0] === 'yellowredcard' || e[0] === 'substitution'; });
    ev.sort(function(a, b){ return ((a[1] || 0) + (a[2] || 0) / 100) - ((b[1] || 0) + (b[2] || 0) / 100); });
    var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec hsc2', 'Riassunto'));
    if(!ev.length){ c.appendChild(el('div', 'hempty', 'Nessun evento')); box.appendChild(c); return; }
    var half = false, ptS = null;
    ev.forEach(function(e){ if(e[0] === 'goal' && (e[1] || 0) <= 45 && e[6] != null) ptS = e[6] + ' - ' + e[7]; });
    function sep(t){ c.appendChild(el('div', 'hevs', t)); }
    ev.forEach(function(e){
      if(!half && (e[1] || 0) > 45){ half = true; sep('PT ' + (ptS || '0 - 0')); }
      var r = el('div', 'hev ' + (e[4] === 'h' ? 'l' : 'r'));
      var mn = el('span', 'mn', minTxt(e)), ic = el('span', 'ic');
      var nm = el('span', 'nm2');
      var sdn = e[4];
      if(e[0] === 'goal'){ ic.textContent = '⚽'; nm.appendChild(nameTap(el('b', '', e[5] || ''), function(){ pastSheet(e[5], sdn, rec, m); })); var sub = (e[8] ? 'autogol' : e[9] ? 'rigore' : '') + (e[6] != null ? (e[8] || e[9] ? ' · ' : '') + e[6] + ' - ' + e[7] : ''); if(sub) nm.appendChild(el('small', '', sub)); }
      else if(e[0] === 'substitution'){
        if(e[10]){ ic.innerHTML = subSvg('both'); ic.className = 'ic sb'; nm.appendChild(nameTap(el('b', '', e[10]), function(){ pastSheet(e[10], sdn, rec, m); })); nm.appendChild(nameTap(el('small', 'fd', e[5] || ''), function(){ pastSheet(e[5], sdn, rec, m); })); }
        else {
        var sd = rec.lu && rec.lu[e[4]], isOut = sd ? (sd.st || []).some(function(q){ return q[0] === e[5]; }) : null;
        ic.innerHTML = subSvg(isOut === null ? 'both' : isOut ? 'out' : 'in'); ic.className = 'ic sb';
        nm.appendChild(nameTap(el(isOut ? 'small' : 'b', isOut ? 'fd' : '', e[5] || ''), function(){ pastSheet(e[5], sdn, rec, m); })); } }
      else { ic.appendChild(yc()); if(e[0] !== 'yellowcard') ic.firstChild.className += ' rd'; nm.appendChild(nameTap(el('b', '', e[5] || ''), function(){ pastSheet(e[5], sdn, rec, m); })); }
      if(e[4] === 'h'){ r.appendChild(mn); r.appendChild(ic); r.appendChild(nm); } else { r.appendChild(nm); r.appendChild(ic); r.appendChild(mn); }
      c.appendChild(r);
    });
    sep('FT ' + (rec.sh != null ? rec.sh + ' - ' + rec.sa : ''));
    box.appendChild(c);
  }
  var RAV = {}, NAT = {'serie-a': '\u{1F1EE}\u{1F1F9} Italia', 'premier-league': '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F} Inghilterra', 'la-liga': '\u{1F1EA}\u{1F1F8} Spagna', 'bundesliga': '\u{1F1E9}\u{1F1EA} Germania', 'ligue-1': '\u{1F1EB}\u{1F1F7} Francia'};
  function refAvg(lg){
    if(RAV[lg]) return RAV[lg];
    var o = {y: 0, r: 0, fo: 0, pen: 0, n: 0};
    Object.keys(ARB && ARB.ref || {}).forEach(function(k){ var x = ARB.ref[k]; if(x.lg !== lg || !x.n) return; ['y', 'r', 'fo', 'pen'].forEach(function(f){ o[f] += (x[f] || 0) * x.n; }); o.n += x.n; });
    if(o.n) ['y', 'r', 'fo', 'pen'].forEach(function(f){ o[f] = o[f] / o.n; });
    return RAV[lg] = o;
  }
  function avTxt(a){ return f1((a >= 10 ? Math.round(a * 10) / 10 : a >= 1 ? Math.round(a * 10) / 10 : Math.round(a * 100) / 100).toString()); }
  function abLabel(b, a, lp){ var t = el('s', '', avTxt(a)); t.style.left = Math.max(7, Math.min(93, lp)) + '%'; b.appendChild(t); }
  function barEl(v, avg, inv){
    var r = avg > 0 ? v / avg : (v > 0 ? 2 : 1), w = Math.max(2, Math.min(96, r * 50));
    var up = r > 1, near = Math.abs(r - 1) <= 0.1, col = near ? '#E5B400' : ((up !== !!inv) ? '#1E8E3E' : '#D93A3A');
    var b = el('div', 'abar'), f = el('i'); f.style.width = w + '%'; f.style.background = col; b.appendChild(f); b.appendChild(el('u'));
    if(avg > 0) abLabel(b, avg, 50);
    b.setAttribute('data-c', col); return b;
  }
  function barTxt(b){ var c = b.getAttribute('data-c'); return c === '#E5B400' ? 'In media' : c === '#1E8E3E' ? 'Sopra la media' : 'Sotto la media'; }
  var RPH = null;
  function rphLoad(){ if(RPH === null){ RPH = 0; gj('refphoto.json').then(function(j){ RPH = (j && j.p) || {}; if(Object.keys(RPH).length && lvVisible() && !LVSH) drawMatch(); }); } return RPH || null; }
  function refPh(name){
    return null; // volti arbitri disattivati: nessuna fonte con ritratti puliti
    var R = rphLoad(); if(!R || !name) return null; if(R[name]) return R[name];
    var q = nk(name), qt = q.split(' '), hit = null;
    Object.keys(R).some(function(k){ var x = nk(k), xt = x.split(' '); if(x === q || (xt[xt.length - 1] === qt[qt.length - 1] && xt[0].charAt(0) === qt[0].charAt(0))){ hit = R[k]; return true; } return false; });
    return hit;
  }
  function refAv(name, cls){
    var u = refPh(name); if(!u) return null; var sp = el('span', cls || 'rfi rfp'), im = el('img'); im.src = u; im.alt = ''; im.loading = 'lazy'; im.decoding = 'async';
    im.onerror = function(){ sp.innerHTML = ''; sp.classList.remove('rfp'); if(!cls) sp.appendChild(yc()); }; sp.appendChild(im); return sp;
  }
  function refIc(name){ var a = refAv(name); if(a) return a; var q = el('span', 'rfi'); q.appendChild(yc()); return q; }
  function refCard(box, name){
    var o = ARB && ARB.ref && ARB.ref[name];
    var c = el('button', 'hcard href'); c.type = 'button';
    var h = el('div', 'rfh'), nm = el('div', 'rfn'); nm.appendChild(el('b', '', name)); nm.appendChild(el('small', '', (o && NAT[o.lg]) || ((refFlag(name) ? refFlag(name) + ' ' : '') + 'Arbitro')));
    var ic = refIc(name); h.appendChild(ic); h.appendChild(nm); h.appendChild(el('span', 'chev2', '›')); c.appendChild(h);
    if(o){
      var av = refAvg(o.lg), g = el('div', 'rfg');
      [['Ammonizioni', o.y, av.y, 'y'], ['Falli', o.fo, av.fo, 'fo']].forEach(function(x){
        var d = el('div', 'rfc'); d.appendChild(el('small', '', x[0]));
        var v = el('div', 'rfv'); v.appendChild(el('b', '', x[1] == null ? '–' : f1(String(x[1])))); v.appendChild(el('span', '', ' / partita')); d.appendChild(v);
        if(x[1] != null && x[2] > 0){ var br = barEl(x[1], x[2], false); d.appendChild(br); var t = el('div', 'rft', barTxt(br)); t.style.color = br.getAttribute('data-c'); d.appendChild(t); }
        g.appendChild(d);
      });
      c.appendChild(g);
    }
    c.addEventListener('click', function(){ openRef(name); });
    box.appendChild(c);
  }
  var WMAP = [[0, 'sereno'], [2, 'poco nuvoloso'], [3, 'nuvoloso'], [48, 'nebbia'], [57, 'pioggerella'], [67, 'pioggia'], [77, 'neve'], [82, 'rovesci'], [99, 'temporale']];
  function wDesc(c){ for(var i = 0; i < WMAP.length; i++){ if(c <= WMAP[i][0]) return WMAP[i][1]; } return ''; }
  function weatherInto(slot, wslot, st, m, cb){
    try{
      if(!st || st.lat == null || !m.t) return;
      var d = m.d, hh = timeOf(m.t).slice(0, 2);
      var diff = (new Date(d + 'T12:00:00') - new Date()) / 86400000; if(diff > 15 || diff < -1) return;
      fetch('https://api.open-meteo.com/v1/forecast?latitude=' + st.lat + '&longitude=' + st.lon + '&hourly=temperature_2m,weathercode,wind_speed_10m&timezone=Europe%2FRome&start_date=' + d + '&end_date=' + d)
        .then(function(r){ return r.json(); }).then(function(j){
          var i = (j.hourly.time || []).indexOf(d + 'T' + hh + ':00'); if(i < 0) return;
          if(cb){ cb(Math.round(j.hourly.temperature_2m[i]), j.hourly.weathercode[i], Math.round(j.hourly.wind_speed_10m[i])); return; }
          slot.textContent = Math.round(j.hourly.temperature_2m[i]) + '° ' + wDesc(j.hourly.weathercode[i]);
          wslot.textContent = Math.round(j.hourly.wind_speed_10m[i]) + ' km/h';
          slot.parentNode.style.display = ''; wslot.parentNode.style.display = '';
        }).catch(function(){});
    }catch(e){}
  }
  var ICO = {"sun":[32,32,"<g fill=\"none\"><g filter=\"url(#iUkShgb)\"><path fill=\"url(#if0RPBd)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#iUCq4qd)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#im8mtXb)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#iy4Y6wv)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#ioVfymm)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#i8uZ4zJ)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#iTXTuKc)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#i3CI4Zd)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#ipgzEkc)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/><path fill=\"url(#iCDpCid)\" d=\"M13.05 3.33c1.532-1.723 3.614-1.448 4.946 0l.812.941c.282.307.689.465 1.103.43l1.444-.43c1.969-.422 3.758 1.047 3.758 3.328v.86c.042.469.452.787.875.994l1.305.545c1.887.922 2.36 3.11.984 4.945l-.39.516c-.35.473-.279 1.095.07 1.57l.39.547c1.422 1.75.62 4.15-1.388 4.99l-1.123.469c-.423.177-.59.48-.668.932l-.078 1.468c-.274 2.016-2.064 2.926-3.5 2.723l-1.711-.457c-.411-.058-.922.078-1.196.508l-.617.844c-1.531 1.726-3.598 1.439-4.64.43l-1.139-1.38c-.298-.288-.674-.535-1.124-.365l-1.722.47c-1.421.202-3.096-.89-3.363-2.301l-.2-2.042a1.34 1.34 0 0 0-.752-.968l-1.208-.415c-1.817-.846-2.425-2.896-1.382-4.607l.68-.942a1.34 1.34 0 0 0-.033-1.45l-.507-.72c-1.438-2.046-.444-4.334 1.686-5.02l.47-.151c.518-.167 1.02-.598 1.062-1.141L6 7.133c.17-2.14 2.122-3.368 4.176-2.743l.665.202c.64.25 1.142.037 1.492-.344z\"/></g><g filter=\"url(#ilje9gb)\"><path fill=\"url(#i0GoTwA)\" d=\"M15.534 26.934c5.934 0 10.743-4.81 10.743-10.743S21.467 5.448 15.534 5.448S4.791 10.258 4.791 16.191s4.81 10.743 10.743 10.743\"/></g><defs><radialGradient id=\"iUCq4qd\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(138.155 8.402 5.182)scale(3.77864 3.33393)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13A\"/><stop offset=\"1\" stop-color=\"#FFA13A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"im8mtXb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(2.26873 5.56226 -4.90764 2.00172 8.288 2.244)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FF942A\"/><stop offset=\"1\" stop-color=\"#FF942A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iy4Y6wv\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-164.745 12.736 2.29)scale(2.39513 3.31637)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13D\"/><stop offset=\"1\" stop-color=\"#FFA13D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ioVfymm\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-3.8232 1.84862 -1.36534 -2.82372 29.252 11.336)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13D\"/><stop offset=\"1\" stop-color=\"#FFA13D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i8uZ4zJ\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-4.7055 -.5462 .3078 -2.65172 30.177 18.52)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13D\"/><stop offset=\"1\" stop-color=\"#FFA13D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iTXTuKc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-43.964 42.724 -20.11)scale(4.29693 4.13959)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#E0762A\"/><stop offset=\"1\" stop-color=\"#E0762A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i3CI4Zd\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-2.01665 -2.60483 2.50944 -1.9428 6.019 23.015)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#E0762A\"/><stop offset=\"1\" stop-color=\"#E0762A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ipgzEkc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(3.02497 1.42845 -1.7265 3.6561 1.523 11.882)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#F0851D\"/><stop offset=\"1\" stop-color=\"#F0851D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iCDpCid\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-142.487 15.635 10.748)scale(3.90025 3.67954)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".337\" stop-color=\"#E3745B\"/><stop offset=\"1\" stop-color=\"#E3745B\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i0GoTwA\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(117.739 7.806 11.516)scale(19.1699 23.673)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".172\" stop-color=\"#FFD13D\"/><stop offset=\"1\" stop-color=\"#DCA21C\"/><stop offset=\"1\" stop-color=\"#D89A29\"/></radialGradient><filter id=\"iUkShgb\" width=\"27.269\" height=\"28.355\" x=\"2\" y=\"1.939\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".2\" dy=\"-.2\"/><feGaussianBlur stdDeviation=\".375\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.839216 0 0 0 0 0.45098 0 0 0 0 0.211765 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_14692\"/></filter><filter id=\"ilje9gb\" width=\"22.086\" height=\"22.086\" x=\"4.191\" y=\"5.448\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.3\" dy=\".3\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" operator=\"out\"/><feColorMatrix values=\"0 0 0 0 0.921569 0 0 0 0 0.47451 0 0 0 0 0.133333 0 0 0 1 0\"/><feBlend in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_18_14692\"/><feBlend in=\"SourceGraphic\" in2=\"effect1_dropShadow_18_14692\" result=\"shape\"/></filter><linearGradient id=\"if0RPBd\" x1=\"23.878\" x2=\"8.528\" y1=\"6.867\" y2=\"26.451\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#FC8B23\"/><stop offset=\"1\" stop-color=\"#E67639\"/></linearGradient></defs></g>"],"pc":[32,32,"<defs><path id=\"ihLmjXb\" fill=\"#E0D3FF\" d=\"M27.24 14.59c-3.55-3.46-9.23-3.4-12.69.15a8.95 8.95 0 0 0-2.016 3.201a.268.268 0 0 1-.399.13a6 6 0 0 0-.985-.531A6.457 6.457 0 0 0 2 23.41c0 1.52.53 2.92 1.41 4.03A6.48 6.48 0 0 0 8.58 30h12.69c2.82 0 5.31-1.39 6.83-3.52c2.72-3.56 2.42-8.68-.86-11.89\"/></defs><g fill=\"none\"><path fill=\"url(#ivrj1xd)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#id0oXKP)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#id1cfsb)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#i85Leie)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#izwUbHe)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#i86ll3b)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#iGL21cd)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#iFzUCnd)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#iaGbNtj)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><path fill=\"url(#i5s895c)\" d=\"M10.325 4.89c1.116-1.256 2.634-1.056 3.605 0l.592.686a.98.98 0 0 0 .803.313l1.053-.313c1.435-.308 2.739.763 2.739 2.425v.627c.03.341.329.573.637.724l.951.397c1.376.672 1.72 2.266.718 3.605l-.285.375c-.255.346-.203.799.051 1.145l.285.399c1.037 1.275.452 3.025-1.012 3.636l-.818.342c-.309.129-.43.35-.487.68L19.1 21a2.267 2.267 0 0 1-2.551 1.984l-1.247-.333c-.3-.042-.672.057-.871.37l-.45.615c-1.116 1.258-2.623 1.05-3.382.313l-.83-1.005c-.218-.21-.491-.39-.82-.266l-1.254.343c-1.037.147-2.257-.65-2.452-1.678l-.145-1.488a.98.98 0 0 0-.549-.705l-.88-.303c-1.324-.617-1.767-2.11-1.007-3.357l.496-.687a.98.98 0 0 0-.024-1.058l-.37-.523c-1.048-1.492-.324-3.16 1.229-3.66l.342-.11c.378-.122.743-.435.775-.831l.076-.96c.124-1.56 1.547-2.455 3.043-2l.485.147c.467.182.833.027 1.087-.25z\"/><g filter=\"url(#i71xvwe)\"><path fill=\"url(#i1zDHDc)\" d=\"M12.136 22.093a7.83 7.83 0 1 0 0-15.66a7.83 7.83 0 0 0 0 15.66\"/><path fill=\"url(#imoCehd)\" d=\"M12.136 22.093a7.83 7.83 0 1 0 0-15.66a7.83 7.83 0 0 0 0 15.66\"/><path fill=\"url(#iwU8h4d)\" d=\"M12.136 22.093a7.83 7.83 0 1 0 0-15.66a7.83 7.83 0 0 0 0 15.66\"/></g><path fill=\"url(#i8kOCDb)\" d=\"M12.26 22.68a4.04 4.04 0 1 0 0-8.08a4.04 4.04 0 0 0 0 8.08\"/><path fill=\"url(#iDhPpve)\" d=\"M12.26 22.68a4.04 4.04 0 1 0 0-8.08a4.04 4.04 0 0 0 0 8.08\"/><g filter=\"url(#iehzpeL)\"><use href=\"#ihLmjXb\"/></g><g filter=\"url(#iz03Vfe)\"><use href=\"#ihLmjXb\"/><path fill=\"url(#iouQj6d)\" d=\"M27.24 14.59c-3.55-3.46-9.23-3.4-12.69.15a8.95 8.95 0 0 0-2.016 3.201a.268.268 0 0 1-.399.13a6 6 0 0 0-.985-.531A6.457 6.457 0 0 0 2 23.41c0 1.52.53 2.92 1.41 4.03A6.48 6.48 0 0 0 8.58 30h12.69c2.82 0 5.31-1.39 6.83-3.52c2.72-3.56 2.42-8.68-.86-11.89\"/><path fill=\"url(#i5zZIsW)\" d=\"M27.24 14.59c-3.55-3.46-9.23-3.4-12.69.15a8.95 8.95 0 0 0-2.016 3.201a.268.268 0 0 1-.399.13a6 6 0 0 0-.985-.531A6.457 6.457 0 0 0 2 23.41c0 1.52.53 2.92 1.41 4.03A6.48 6.48 0 0 0 8.58 30h12.69c2.82 0 5.31-1.39 6.83-3.52c2.72-3.56 2.42-8.68-.86-11.89\"/><path fill=\"url(#iowq3gc)\" d=\"M27.24 14.59c-3.55-3.46-9.23-3.4-12.69.15a8.95 8.95 0 0 0-2.016 3.201a.268.268 0 0 1-.399.13a6 6 0 0 0-.985-.531A6.457 6.457 0 0 0 2 23.41c0 1.52.53 2.92 1.41 4.03A6.48 6.48 0 0 0 8.58 30h12.69c2.82 0 5.31-1.39 6.83-3.52c2.72-3.56 2.42-8.68-.86-11.89\"/><path fill=\"url(#iiEt9yc)\" d=\"M27.24 14.59c-3.55-3.46-9.23-3.4-12.69.15a8.95 8.95 0 0 0-2.016 3.201a.268.268 0 0 1-.399.13a6 6 0 0 0-.985-.531A6.457 6.457 0 0 0 2 23.41c0 1.52.53 2.92 1.41 4.03A6.48 6.48 0 0 0 8.58 30h12.69c2.82 0 5.31-1.39 6.83-3.52c2.72-3.56 2.42-8.68-.86-11.89\"/></g><defs><radialGradient id=\"id0oXKP\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-2.05161 1.83726 -1.62103 -1.81016 14.02 4.968)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13A\"/><stop offset=\"1\" stop-color=\"#FFA13A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"id1cfsb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(1.65354 4.054 -3.57688 1.45893 6.854 4.098)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FF942A\"/><stop offset=\"1\" stop-color=\"#FF942A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i85Leie\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-164.745 9.854 2.845)scale(1.74567 2.4171)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13D\"/><stop offset=\"1\" stop-color=\"#FFA13D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"izwUbHe\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(154.195 9.838 7.897)scale(3.09515 2.28599)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13D\"/><stop offset=\"1\" stop-color=\"#FFA13D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i86ll3b\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-173.379 11.865 7.32)scale(3.45258 1.94565)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".3\" stop-color=\"#FFA13D\"/><stop offset=\"1\" stop-color=\"#FFA13D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iGL21cd\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-43.964 34.596 -14.434)scale(3.13177 3.01709)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#E0762A\"/><stop offset=\"1\" stop-color=\"#E0762A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iFzUCnd\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-127.747 7.318 8.343)scale(2.40097 2.31305)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#E0762A\"/><stop offset=\"1\" stop-color=\"#E0762A\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iaGbNtj\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(2.2047 1.04112 -1.25835 2.6647 1.924 11.122)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#F0851D\"/><stop offset=\"1\" stop-color=\"#F0851D\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i5s895c\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-2.25483 -1.731 1.63306 -2.12724 16.478 23.45)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".337\" stop-color=\"#E3745B\"/><stop offset=\"1\" stop-color=\"#E3745B\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i1zDHDc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-6.5031 12.36612 -15.27094 -8.03069 16.579 9.727)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".172\" stop-color=\"#FFD13D\"/><stop offset=\"1\" stop-color=\"#DCA21C\"/><stop offset=\"1\" stop-color=\"#D89A29\"/></radialGradient><radialGradient id=\"imoCehd\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-140.631 8.034 7.713)scale(4.87402 4.11509)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".341\" stop-color=\"#DCA225\"/><stop offset=\"1\" stop-color=\"#DCA225\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iwU8h4d\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-16.3279 3.38164 -2.85508 -13.78545 18.531 12.926)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".62\" stop-color=\"#DCA225\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#DCA225\"/></radialGradient><radialGradient id=\"i8kOCDb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-110.468 12.222 4.816)scale(3.57559 3.47283)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".307\" stop-color=\"#CECDFF\"/><stop offset=\"1\" stop-color=\"#B7B6FA\"/></radialGradient><radialGradient id=\"iDhPpve\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-148.811 9.13 6.642)scale(1.44966 4.82062)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".401\" stop-color=\"#B8B7FF\"/><stop offset=\"1\" stop-color=\"#B8B7FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iouQj6d\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-106.955 16.847 5.586)scale(12.992 7.29952)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#D6CCFF\"/><stop offset=\"1\" stop-color=\"#D6CCFF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i5zZIsW\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-10.15397 6.59255 -7.36397 -11.34211 28.314 17.192)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".19\" stop-color=\"#F2F0FF\"/><stop offset=\"1\" stop-color=\"#F2F0FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iowq3gc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(147.319 1.535 11.554)scale(9.543 11.6289)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#F2F0FF\"/><stop offset=\".696\" stop-color=\"#F2F0FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iiEt9yc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(2.50063 7.6534 -2.85323 .93225 11.264 16.434)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#F2F0FF\"/><stop offset=\"1\" stop-color=\"#F2F0FF\" stop-opacity=\"0\"/></radialGradient><filter id=\"i71xvwe\" width=\"16.26\" height=\"16.26\" x=\"3.706\" y=\"6.433\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"-.3\" dy=\".3\"/><feGaussianBlur stdDeviation=\".15\"/><feComposite in2=\"hardAlpha\" operator=\"out\"/><feColorMatrix values=\"0 0 0 0 0.921569 0 0 0 0 0.47451 0 0 0 0 0.133333 0 0 0 1 0\"/><feBlend in2=\"BackgroundImageFix\" result=\"effect1_dropShadow_18_15000\"/><feBlend in=\"SourceGraphic\" in2=\"effect1_dropShadow_18_15000\" result=\"shape\"/></filter><filter id=\"iehzpeL\" width=\"27.941\" height=\"17.964\" x=\"2\" y=\"12.036\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset/><feGaussianBlur stdDeviation=\"2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.701961 0 0 0 0 0.698039 0 0 0 0 0.992157 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15000\"/></filter><filter id=\"iz03Vfe\" width=\"27.941\" height=\"17.964\" x=\"2\" y=\"12.036\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset/><feGaussianBlur stdDeviation=\"3\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.701961 0 0 0 0 0.698039 0 0 0 0 0.992157 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15000\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset/><feGaussianBlur stdDeviation=\"1\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.701961 0 0 0 0 0.698039 0 0 0 0 0.992157 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_15000\" result=\"effect2_innerShadow_18_15000\"/></filter><linearGradient id=\"ivrj1xd\" x1=\"18.217\" x2=\"7.029\" y1=\"7.467\" y2=\"21.741\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#FC8B23\"/><stop offset=\"1\" stop-color=\"#E67639\"/></linearGradient></defs></g>"],"cl":[32,32,"<g fill=\"none\"><path fill=\"url(#iWdIwne)\" d=\"M12.26 17.644a4.04 4.04 0 1 0 0-8.08a4.04 4.04 0 0 0 0 8.08\"/><path fill=\"url(#iBpZDia)\" d=\"M12.26 17.644a4.04 4.04 0 1 0 0-8.08a4.04 4.04 0 0 0 0 8.08\"/><g filter=\"url(#in761Je)\"><path fill=\"#D5D4DA\" d=\"M27.29 9.56c-3.557-3.467-9.248-3.407-12.715.15a9 9 0 0 0-2.02 3.208a.268.268 0 0 1-.399.129a6 6 0 0 0-.988-.532A6.47 6.47 0 0 0 2 18.397a6.48 6.48 0 0 0 1.413 4.038A6.5 6.5 0 0 0 8.593 25h12.715a8.39 8.39 0 0 0 6.844-3.527c2.725-3.567 2.435-8.697-.862-11.914\"/><path fill=\"url(#i3D0DOd)\" d=\"M27.29 9.56c-3.557-3.467-9.248-3.407-12.715.15a9 9 0 0 0-2.02 3.208a.268.268 0 0 1-.399.129a6 6 0 0 0-.988-.532A6.47 6.47 0 0 0 2 18.397a6.48 6.48 0 0 0 1.413 4.038A6.5 6.5 0 0 0 8.593 25h12.715a8.39 8.39 0 0 0 6.844-3.527c2.725-3.567 2.435-8.697-.862-11.914\"/></g><path fill=\"url(#iZiUR4b)\" d=\"M27.29 9.56c-3.557-3.467-9.248-3.407-12.715.15a9 9 0 0 0-2.02 3.208a.268.268 0 0 1-.399.129a6 6 0 0 0-.988-.532A6.47 6.47 0 0 0 2 18.397a6.48 6.48 0 0 0 1.413 4.038A6.5 6.5 0 0 0 8.593 25h12.715a8.39 8.39 0 0 0 6.844-3.527c2.725-3.567 2.435-8.697-.862-11.914\"/><path fill=\"url(#ioKUpCc)\" d=\"M27.29 9.56c-3.557-3.467-9.248-3.407-12.715.15a9 9 0 0 0-2.02 3.208a.268.268 0 0 1-.399.129a6 6 0 0 0-.988-.532A6.47 6.47 0 0 0 2 18.397a6.48 6.48 0 0 0 1.413 4.038A6.5 6.5 0 0 0 8.593 25h12.715a8.39 8.39 0 0 0 6.844-3.527c2.725-3.567 2.435-8.697-.862-11.914\"/><path fill=\"url(#ikIIXOc)\" d=\"M27.29 9.56c-3.557-3.467-9.248-3.407-12.715.15a9 9 0 0 0-2.02 3.208a.268.268 0 0 1-.399.129a6 6 0 0 0-.988-.532A6.47 6.47 0 0 0 2 18.397a6.48 6.48 0 0 0 1.413 4.038A6.5 6.5 0 0 0 8.593 25h12.715a8.39 8.39 0 0 0 6.844-3.527c2.725-3.567 2.435-8.697-.862-11.914\"/><path fill=\"url(#iOXtFhc)\" d=\"M27.29 9.56c-3.557-3.467-9.248-3.407-12.715.15a9 9 0 0 0-2.02 3.208a.268.268 0 0 1-.399.129a6 6 0 0 0-.988-.532A6.47 6.47 0 0 0 2 18.397a6.48 6.48 0 0 0 1.413 4.038A6.5 6.5 0 0 0 8.593 25h12.715a8.39 8.39 0 0 0 6.844-3.527c2.725-3.567 2.435-8.697-.862-11.914\"/><defs><radialGradient id=\"iWdIwne\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-172.463 7.257 5.601)scale(5.54446)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".309\" stop-color=\"#E8E8E9\"/><stop offset=\"1\" stop-color=\"#D2D2D2\"/></radialGradient><radialGradient id=\"iBpZDia\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-2.34711 -1.8843 1.72645 -2.1505 12.692 13.262)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#CDCDCE\"/><stop offset=\"1\" stop-color=\"#CDCDCE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iZiUR4b\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(136.5 10.583 11.787)scale(11.1541 11.965)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".179\" stop-color=\"#FCFBFE\"/><stop offset=\"1\" stop-color=\"#FCFBFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ioKUpCc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(144.444 1.551 10.052)scale(6.84295 7.17037)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#FCFBFE\"/><stop offset=\"1\" stop-color=\"#FCFBFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ikIIXOc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-23.2134 5.5071 -4.33701 -18.28129 25.213 15.466)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".815\" stop-color=\"#CECCD7\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#CECCD7\"/></radialGradient><radialGradient id=\"iOXtFhc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(4.42537 -4.7109 6.50116 6.10713 5.644 26.019)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#D0C9EE\"/><stop offset=\"1\" stop-color=\"#D0C9EE\" stop-opacity=\"0\"/></radialGradient><linearGradient id=\"i3D0DOd\" x1=\"18.86\" x2=\"18.86\" y1=\"24.032\" y2=\"16.519\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#DED7FA\"/><stop offset=\"1\" stop-color=\"#DED7FA\" stop-opacity=\"0\"/></linearGradient><filter id=\"in761Je\" width=\"28\" height=\"19\" x=\"2\" y=\"6\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dy=\"-1\"/><feGaussianBlur stdDeviation=\"1\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.815686 0 0 0 0 0.784314 0 0 0 0 0.956863 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_14985\"/></filter></defs></g>"],"rn":[32,32,"<defs><path id=\"iaHaZnc\" fill=\"#E0D3FF\" d=\"M27.202 4.55c-3.544-3.454-9.216-3.394-12.67.15a8.9 8.9 0 0 0-2.014 3.196a.268.268 0 0 1-.398.13a6 6 0 0 0-.984-.53A6.447 6.447 0 0 0 2 13.357a6.46 6.46 0 0 0 1.408 4.024a6.47 6.47 0 0 0 5.162 2.557h12.671a8.36 8.36 0 0 0 6.82-3.515c2.716-3.555 2.416-8.667-.859-11.872\"/></defs><g fill=\"none\"><path fill=\"url(#i6waHsf)\" d=\"M12.367 12.303a4.034 4.034 0 1 0 0-8.068a4.034 4.034 0 0 0 0 8.068\"/><path fill=\"url(#iHMpble)\" d=\"M12.367 12.303a4.034 4.034 0 1 0 0-8.068a4.034 4.034 0 0 0 0 8.068\"/><g filter=\"url(#igByPgh)\"><path fill=\"#3239FF\" d=\"m8.789 22.994l-2.39 3.27a1.805 1.805 0 0 1-2.526.393a1.805 1.805 0 0 1-.393-2.524l2.39-3.27a1.805 1.805 0 0 1 2.526-.394c.807.58.983 1.718.393 2.525\"/><path fill=\"url(#i2IZqgb)\" d=\"m8.789 22.994l-2.39 3.27a1.805 1.805 0 0 1-2.526.393a1.805 1.805 0 0 1-.393-2.524l2.39-3.27a1.805 1.805 0 0 1 2.526-.394c.807.58.983 1.718.393 2.525\"/></g><g filter=\"url(#iJRp16b)\"><path fill=\"#3239FF\" d=\"m15.335 22.994l-2.39 3.27a1.805 1.805 0 0 1-2.525.393a1.805 1.805 0 0 1-.393-2.524l2.39-3.27a1.805 1.805 0 0 1 2.525-.394c.807.58.983 1.718.393 2.525\"/><path fill=\"url(#ic5Dxse)\" d=\"m15.335 22.994l-2.39 3.27a1.805 1.805 0 0 1-2.525.393a1.805 1.805 0 0 1-.393-2.524l2.39-3.27a1.805 1.805 0 0 1 2.525-.394c.807.58.983 1.718.393 2.525\"/></g><g filter=\"url(#itfua1c)\"><path fill=\"url(#iMrk5eb)\" d=\"m21.881 22.994l-2.39 3.27a1.805 1.805 0 0 1-2.525.393a1.805 1.805 0 0 1-.393-2.524l2.39-3.27a1.805 1.805 0 0 1 2.525-.394c.807.58.983 1.718.393 2.525\"/><path fill=\"url(#ieRS1Fc)\" d=\"m21.881 22.994l-2.39 3.27a1.805 1.805 0 0 1-2.525.393a1.805 1.805 0 0 1-.393-2.524l2.39-3.27a1.805 1.805 0 0 1 2.525-.394c.807.58.983 1.718.393 2.525\"/></g><g filter=\"url(#ih2lpFd)\"><use href=\"#iaHaZnc\"/></g><g filter=\"url(#i5lrGPd)\"><use href=\"#iaHaZnc\"/><path fill=\"url(#i3Zh2Km)\" d=\"M27.202 4.55c-3.544-3.454-9.216-3.394-12.67.15a8.9 8.9 0 0 0-2.014 3.196a.268.268 0 0 1-.398.13a6 6 0 0 0-.984-.53A6.447 6.447 0 0 0 2 13.357a6.46 6.46 0 0 0 1.408 4.024a6.47 6.47 0 0 0 5.162 2.557h12.671a8.36 8.36 0 0 0 6.82-3.515c2.716-3.555 2.416-8.667-.859-11.872\"/><path fill=\"url(#idHhmPb)\" d=\"M27.202 4.55c-3.544-3.454-9.216-3.394-12.67.15a8.9 8.9 0 0 0-2.014 3.196a.268.268 0 0 1-.398.13a6 6 0 0 0-.984-.53A6.447 6.447 0 0 0 2 13.357a6.46 6.46 0 0 0 1.408 4.024a6.47 6.47 0 0 0 5.162 2.557h12.671a8.36 8.36 0 0 0 6.82-3.515c2.716-3.555 2.416-8.667-.859-11.872\"/><path fill=\"url(#i2X2RDd)\" d=\"M27.202 4.55c-3.544-3.454-9.216-3.394-12.67.15a8.9 8.9 0 0 0-2.014 3.196a.268.268 0 0 1-.398.13a6 6 0 0 0-.984-.53A6.447 6.447 0 0 0 2 13.357a6.46 6.46 0 0 0 1.408 4.024a6.47 6.47 0 0 0 5.162 2.557h12.671a8.36 8.36 0 0 0 6.82-3.515c2.716-3.555 2.416-8.667-.859-11.872\"/><path fill=\"url(#iaUKqcc)\" d=\"M27.202 4.55c-3.544-3.454-9.216-3.394-12.67.15a8.9 8.9 0 0 0-2.014 3.196a.268.268 0 0 1-.398.13a6 6 0 0 0-.984-.53A6.447 6.447 0 0 0 2 13.357a6.46 6.46 0 0 0 1.408 4.024a6.47 6.47 0 0 0 5.162 2.557h12.671a8.36 8.36 0 0 0 6.82-3.515c2.716-3.555 2.416-8.667-.859-11.872\"/></g><defs><radialGradient id=\"i6waHsf\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(-110.468 8.676 -.406)scale(3.57025 3.46764)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".307\" stop-color=\"#CECDFF\"/><stop offset=\"1\" stop-color=\"#B7B6FA\"/></radialGradient><radialGradient id=\"iHMpble\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-1.23828 -.7496 2.49269 -4.1177 13.605 6.683)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".401\" stop-color=\"#B8B7FF\"/><stop offset=\"1\" stop-color=\"#B8B7FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i2IZqgb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(142.938 1.301 11.974)scale(3.03715 2.64919)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#627AFE\"/><stop offset=\"1\" stop-color=\"#627AFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ic5Dxse\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(142.938 4.574 13.07)scale(3.03715 2.64919)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#627AFE\"/><stop offset=\"1\" stop-color=\"#627AFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ieRS1Fc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(142.938 7.847 14.168)scale(3.03715 2.64919)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#627AFE\"/><stop offset=\"1\" stop-color=\"#627AFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i3Zh2Km\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-3.78308 -12.40873 6.9718 -2.1255 16.395 13.277)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#D6CCFF\"/><stop offset=\"1\" stop-color=\"#D6CCFF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"idHhmPb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(147.006 13.079 7.761)scale(12.0883 13.5028)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".19\" stop-color=\"#F2F0FF\"/><stop offset=\"1\" stop-color=\"#F2F0FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i2X2RDd\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(147.319 3.003 6.529)scale(9.52873 11.6115)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#F2F0FF\"/><stop offset=\".696\" stop-color=\"#F2F0FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iaUKqcc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(2.49688 7.64197 -2.84897 .93085 11.25 6.392)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#F2F0FF\"/><stop offset=\"1\" stop-color=\"#F2F0FF\" stop-opacity=\"0\"/></radialGradient><filter id=\"igByPgh\" width=\"6.606\" height=\"7.086\" x=\"3.131\" y=\"20.02\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".6\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".75\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.196078 0 0 0 0 0.152941 0 0 0 0 0.972549 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15159\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".1\" dy=\".1\"/><feGaussianBlur stdDeviation=\".25\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.65098 0 0 0 0 0.529412 0 0 0 0 0.87451 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_15159\" result=\"effect2_innerShadow_18_15159\"/></filter><filter id=\"iJRp16b\" width=\"6.606\" height=\"7.086\" x=\"9.678\" y=\"20.02\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".6\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".75\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.196078 0 0 0 0 0.152941 0 0 0 0 0.972549 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15159\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".1\" dy=\".1\"/><feGaussianBlur stdDeviation=\".25\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.65098 0 0 0 0 0.529412 0 0 0 0 0.87451 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_15159\" result=\"effect2_innerShadow_18_15159\"/></filter><filter id=\"itfua1c\" width=\"6.606\" height=\"7.086\" x=\"16.224\" y=\"20.02\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".6\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".75\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.196078 0 0 0 0 0.152941 0 0 0 0 0.972549 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15159\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".1\" dy=\".1\"/><feGaussianBlur stdDeviation=\".25\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.65098 0 0 0 0 0.529412 0 0 0 0 0.87451 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_15159\" result=\"effect2_innerShadow_18_15159\"/></filter><filter id=\"ih2lpFd\" width=\"27.899\" height=\"17.938\" x=\"2\" y=\"2\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset/><feGaussianBlur stdDeviation=\"2\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.701961 0 0 0 0 0.698039 0 0 0 0 0.992157 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15159\"/></filter><filter id=\"i5lrGPd\" width=\"27.899\" height=\"17.938\" x=\"2\" y=\"2\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset/><feGaussianBlur stdDeviation=\"3.5\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.701961 0 0 0 0 0.698039 0 0 0 0 0.992157 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15159\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset/><feGaussianBlur stdDeviation=\"1.25\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.701961 0 0 0 0 0.698039 0 0 0 0 0.992157 0 0 0 1 0\"/><feBlend in2=\"effect1_innerShadow_18_15159\" result=\"effect2_innerShadow_18_15159\"/></filter><linearGradient id=\"iMrk5eb\" x1=\"22.23\" x2=\"17.066\" y1=\"20.873\" y2=\"27.748\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#3364FE\"/><stop offset=\"1\" stop-color=\"#3749FF\"/></linearGradient></defs></g>"],"th":[32,32,"<g fill=\"none\"><g filter=\"url(#iVlgNcd)\"><path fill=\"#535DFF\" d=\"m7.467 23.473l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38s.95 1.66.38 2.44\"/><path fill=\"url(#iNYpK4A)\" d=\"m7.467 23.473l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38s.95 1.66.38 2.44\"/></g><g filter=\"url(#iMSKP0b)\"><path fill=\"#535DFF\" d=\"m12.467 26.123l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38c.78.56.95 1.66.38 2.44\"/><path fill=\"url(#irdRKzd)\" d=\"m12.467 26.123l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38c.78.56.95 1.66.38 2.44\"/></g><g filter=\"url(#iVfCAoG)\"><path fill=\"#535DFF\" d=\"m23.567 23.473l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38s.95 1.66.38 2.44\"/><path fill=\"url(#iVV1nqe)\" d=\"m23.567 23.473l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38s.95 1.66.38 2.44\"/></g><g filter=\"url(#iUFbwbd)\"><path fill=\"#535DFF\" d=\"m28.567 26.123l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38c.78.56.95 1.66.38 2.44\"/><path fill=\"url(#iaR154d)\" d=\"m28.567 26.123l-2.31 3.16c-.57.78-1.66.95-2.44.38s-.95-1.66-.38-2.44l2.31-3.16c.57-.78 1.66-.95 2.44-.38c.78.56.95 1.66.38 2.44\"/></g><path fill=\"url(#iPueAEb)\" d=\"M12.457 12.003a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7\"/><g filter=\"url(#isMGCXd)\"><path fill=\"#3124C5\" d=\"M29.957 10.994c0 4.976-4.03 9.009-9 9.009H8.561c-3.648 0-6.604-3.072-6.604-6.506s2.897-6.432 6.545-6.432c.733 0 1.822.266 2.723.614c.67.258 1.57-.064 1.89-.706c1.386-2.773 4.27-4.846 7.868-4.846c4.97 0 8.974 3.892 8.974 8.867\"/><path fill=\"url(#i1aaBXc)\" d=\"M29.957 10.994c0 4.976-4.03 9.009-9 9.009H8.561c-3.648 0-6.604-3.072-6.604-6.506s2.897-6.432 6.545-6.432c.733 0 1.822.266 2.723.614c.67.258 1.57-.064 1.89-.706c1.386-2.773 4.27-4.846 7.868-4.846c4.97 0 8.974 3.892 8.974 8.867\"/><path fill=\"url(#iPCZgIb)\" d=\"M29.957 10.994c0 4.976-4.03 9.009-9 9.009H8.561c-3.648 0-6.604-3.072-6.604-6.506s2.897-6.432 6.545-6.432c.733 0 1.822.266 2.723.614c.67.258 1.57-.064 1.89-.706c1.386-2.773 4.27-4.846 7.868-4.846c4.97 0 8.974 3.892 8.974 8.867\"/></g><path fill=\"url(#ixCddOE)\" d=\"M30 10.994c0 4.976-4.03 9.009-9 9.009H8.604C4.956 20.003 2 16.93 2 13.497s2.897-6.432 6.545-6.432c.733 0 1.822.266 2.723.614c.67.258 1.57-.064 1.89-.706c1.386-2.773 4.27-4.846 7.867-4.846c4.971 0 8.975 3.892 8.975 8.867\"/><path fill=\"url(#i423m7d)\" d=\"M30 10.994c0 4.976-4.03 9.009-9 9.009H8.604C4.956 20.003 2 16.93 2 13.497s2.897-6.432 6.545-6.432c.733 0 1.822.266 2.723.614c.67.258 1.57-.064 1.89-.706c1.386-2.773 4.27-4.846 7.867-4.846c4.971 0 8.975 3.892 8.975 8.867\"/><g filter=\"url(#iBe01kb)\"><path fill=\"url(#iy3SZGe)\" d=\"m19.542 19.625l-4.852 7.279a.4.4 0 0 1-.733-.222v-5.28a.4.4 0 0 0-.4-.4h-.878a.4.4 0 0 1-.34-.611l3.879-6.205c.213-.341.739-.19.739.212v4.205c0 .22.18.4.4.4h1.853a.4.4 0 0 1 .332.622\"/></g><g filter=\"url(#ijgY8QX)\"><path stroke=\"url(#i1JxWUb)\" stroke-linecap=\"round\" stroke-width=\".5\" d=\"M11.957 9.113c.597.694 1.801 2.663 1.84 4.987\"/></g><defs><radialGradient id=\"iNYpK4A\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(145.744 .551 12.076)scale(2.34511 2.04556)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#627AFE\"/><stop offset=\"1\" stop-color=\"#627AFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"irdRKzd\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(145.744 2.643 14.172)scale(2.34511 2.04556)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#627AFE\"/><stop offset=\"1\" stop-color=\"#627AFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iVV1nqe\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(145.744 8.601 14.557)scale(2.34511 2.04556)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#627AFE\"/><stop offset=\"1\" stop-color=\"#627AFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iaR154d\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(145.744 10.693 16.653)scale(2.34511 2.04556)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#627AFE\"/><stop offset=\"1\" stop-color=\"#627AFE\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iPueAEb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-3.07567 2.53665 -2.1672 -2.6277 13.437 5.75)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#4C42D7\"/><stop offset=\"1\" stop-color=\"#35209B\"/></radialGradient><radialGradient id=\"i1aaBXc\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-4.79375 6.77898 -4.2607 -3.01295 14.318 19.572)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".303\" stop-color=\"#381B90\"/><stop offset=\"1\" stop-color=\"#381B90\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"iPCZgIb\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"matrix(-3.97516 4.1976 -3.96355 -3.75352 9.819 11.065)\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#574ADF\"/><stop offset=\"1\" stop-color=\"#574ADF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"ixCddOE\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(142.503 11.128 7.751)scale(10.9332 11.9987)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".142\" stop-color=\"#6051FF\"/><stop offset=\"1\" stop-color=\"#6051FF\" stop-opacity=\"0\"/></radialGradient><radialGradient id=\"i423m7d\" cx=\"0\" cy=\"0\" r=\"1\" gradientTransform=\"rotate(170.656 10 6.018)scale(19.0964 16.315)\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".799\" stop-color=\"#35209A\" stop-opacity=\"0\"/><stop offset=\"1\" stop-color=\"#35209A\"/></radialGradient><filter id=\"iVlgNcd\" width=\"6.404\" height=\"6.754\" x=\"2\" y=\"20.596\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".6\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".75\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.256493 0 0 0 0 0.282719 0 0 0 0 0.741667 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15029\"/></filter><filter id=\"iMSKP0b\" width=\"6.404\" height=\"6.754\" x=\"7\" y=\"23.246\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".6\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".75\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.256493 0 0 0 0 0.282719 0 0 0 0 0.741667 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15029\"/></filter><filter id=\"iVfCAoG\" width=\"6.404\" height=\"6.754\" x=\"18.1\" y=\"20.596\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".6\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".75\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.256493 0 0 0 0 0.282719 0 0 0 0 0.741667 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15029\"/></filter><filter id=\"iUFbwbd\" width=\"6.404\" height=\"6.754\" x=\"23.1\" y=\"23.246\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".6\" dy=\"-.1\"/><feGaussianBlur stdDeviation=\".75\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.256493 0 0 0 0 0.282719 0 0 0 0 0.741667 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15029\"/></filter><filter id=\"isMGCXd\" width=\"29\" height=\"19.876\" x=\"1.957\" y=\".127\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\"1\" dy=\"-2\"/><feGaussianBlur stdDeviation=\"1\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.207843 0 0 0 0 0.12549 0 0 0 0 0.596078 0 0 0 1 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15029\"/></filter><filter id=\"iBe01kb\" width=\"7.832\" height=\"13.586\" x=\"12.278\" y=\"13.497\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feColorMatrix in=\"SourceAlpha\" result=\"hardAlpha\" values=\"0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0\"/><feOffset dx=\".5\" dy=\"-.5\"/><feGaussianBlur stdDeviation=\".25\"/><feComposite in2=\"hardAlpha\" k2=\"-1\" k3=\"1\" operator=\"arithmetic\"/><feColorMatrix values=\"0 0 0 0 0.908333 0 0 0 0 0.312137 0 0 0 0 0.0454167 0 0 0 0.5 0\"/><feBlend in2=\"shape\" result=\"effect1_innerShadow_18_15029\"/></filter><filter id=\"ijgY8QX\" width=\"4.34\" height=\"7.487\" x=\"10.707\" y=\"7.863\" color-interpolation-filters=\"sRGB\" filterUnits=\"userSpaceOnUse\"><feFlood flood-opacity=\"0\" result=\"BackgroundImageFix\"/><feBlend in=\"SourceGraphic\" in2=\"BackgroundImageFix\" result=\"shape\"/><feGaussianBlur result=\"effect1_foregroundBlur_18_15029\" stdDeviation=\".5\"/></filter><linearGradient id=\"iy3SZGe\" x1=\"16.035\" x2=\"16.035\" y1=\"12.613\" y2=\"25.811\" gradientUnits=\"userSpaceOnUse\"><stop offset=\".354\" stop-color=\"#FF9B49\"/><stop offset=\"1\" stop-color=\"#FF4E4B\"/></linearGradient><linearGradient id=\"i1JxWUb\" x1=\"12.284\" x2=\"14.124\" y1=\"10.323\" y2=\"15.843\" gradientUnits=\"userSpaceOnUse\"><stop stop-color=\"#554BD3\"/><stop offset=\"1\" stop-color=\"#554BD3\" stop-opacity=\"0\"/></linearGradient></defs></g>"],"st":[24,24,"<g fill=\"none\" stroke=\"currentColor\" stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\"><path d=\"M4 12a8 2 0 1 0 16 0a8 2 0 1 0-16 0\"/><path d=\"M4 12v7c0 .94 2.51 1.785 6 2v-3h4v3c3.435-.225 6-1.07 6-2v-7m-5-6h4V3h-4v7M7 6h4V3H7v7\"/></g>"],"wi":[24,24,"<path fill=\"currentColor\" d=\"M4 10a1 1 0 0 1-1-1a1 1 0 0 1 1-1h8a2 2 0 0 0 2-2a2 2 0 0 0-2-2c-.55 0-1.05.22-1.41.59a.973.973 0 0 1-1.42 0c-.39-.39-.39-1.03 0-1.42C9.9 2.45 10.9 2 12 2a4 4 0 0 1 4 4a4 4 0 0 1-4 4zm15 2a1 1 0 0 0 1-1a1 1 0 0 0-1-1c-.28 0-.53.11-.71.29a.996.996 0 0 1-1.41 0c-.38-.39-.38-1.02 0-1.41C17.42 8.34 18.17 8 19 8a3 3 0 0 1 3 3a3 3 0 0 1-3 3H5a1 1 0 0 1-1-1a1 1 0 0 1 1-1zm-1 6H4a1 1 0 0 1-1-1a1 1 0 0 1 1-1h14a3 3 0 0 1 3 3a3 3 0 0 1-3 3c-.83 0-1.58-.34-2.12-.88c-.38-.39-.38-1.02 0-1.41a.996.996 0 0 1 1.41 0c.18.18.43.29.71.29a1 1 0 0 0 1-1a1 1 0 0 0-1-1\"/>"],"wh":[24,24,"<path fill=\"currentColor\" d=\"M8.5 9A6.5 6.5 0 0 0 2 15.5A6.5 6.5 0 0 0 8.5 22a6.5 6.5 0 0 0 6.5-6.5v-1.59L22 12V9H11v2H9V9zM11 2v5H9V2zM6.35 7.28q-1.005.24-1.92.72L2.14 4.88L3.76 3.7zm11.51-2.4L16.32 7h-2.47l2.39-3.3z\"/>"],"sw":[24,24,"<path fill=\"currentColor\" d=\"M6 14a1 1 0 0 1 1 1a1 1 0 0 1-1 1a5 5 0 0 1-5-5a5 5 0 0 1 5-5c1-2.35 3.3-4 6-4c3.43 0 6.24 2.66 6.5 6.03L19 8a4 4 0 0 1 4 4a4 4 0 0 1-4 4h-1a1 1 0 0 1-1-1a1 1 0 0 1 1-1h1a2 2 0 0 0 2-2a2 2 0 0 0-2-2h-2V9a5 5 0 0 0-5-5C9.5 4 7.45 5.82 7.06 8.19C6.73 8.07 6.37 8 6 8a3 3 0 0 0-3 3a3 3 0 0 0 3 3m1.88 4.07l2.19-.57l-1.61-1.62c-.39-.38-.39-1.02 0-1.42c.39-.39 1.04-.39 1.42 0l1.62 1.61l.57-2.19a1 1 0 1 1 1.93.52l-.59 2.19L15.6 16a1 1 0 1 1 .52 1.93l-2.19.57l1.61 1.62c.39.38.39 1.03 0 1.42s-1.04.39-1.42 0l-1.62-1.61l-.57 2.19A1 1 0 1 1 10 21.6l.59-2.19L8.4 20a1 1 0 1 1-.52-1.93\"/>"],"fg":[24,24,"<path fill=\"currentColor\" d=\"M3 15h10a1 1 0 0 1 1 1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1a1 1 0 0 1 1-1m13 0h5a1 1 0 0 1 1 1a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1a1 1 0 0 1 1-1M1 12a5 5 0 0 1 5-5c1-2.35 3.3-4 6-4c3.43 0 6.24 2.66 6.5 6.03L19 9c2.19 0 3.97 1.76 4 4h-2a2 2 0 0 0-2-2h-2v-1a5 5 0 0 0-5-5C9.5 5 7.45 6.82 7.06 9.19C6.73 9.07 6.37 9 6 9a3 3 0 0 0-3 3a3 3 0 0 0 .17 1H1.1zm2 7h2a1 1 0 0 1 1 1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1a1 1 0 0 1 1-1m5 0h13a1 1 0 0 1 1 1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1a1 1 0 0 1 1-1\"/>"]};
  function svgI(k, sz, col){ var o = ICO[k]; return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + o[0] + ' ' + o[1] + '" width="' + sz + '" height="' + sz + '"' + (col ? ' style="color:' + col + '"' : '') + '>' + o[2] + '</svg>'; }
  function wIcon(c){ return c === 0 ? 'sun' : c <= 2 ? 'pc' : c <= 3 ? 'cl' : c <= 48 ? 'fg' : c <= 67 ? 'rn' : c <= 77 ? 'sw' : c <= 82 ? 'rn' : 'th'; }
  function infoBand(box, m, stad, ref){
    var st = STD && STD[m.h], name = stad || (st && st.s);
    if(!name && !ref) return;
    var c = el('div', 'hcard hband');
    if(name){ var hh = el('div', 'hbh'); hh.innerHTML = svgI('st', 44, 'var(--accent)'); var tx = el('div'); tx.appendChild(el('small', '', 'STADIO')); tx.appendChild(el('b', 'sn', name)); hh.appendChild(tx); c.appendChild(hh); }
    var row = el('div', 'hbg'), wc = el('div'), wd = el('div'), rc = null;
    wc.style.display = 'none'; wd.style.display = 'none';
    row.appendChild(wc); row.appendChild(wd);
    if(ref){
      rc = el('div'); var w = String(ref).trim().split(/\s+/), sh = w.length > 1 ? w[0].charAt(0) + '. ' + w.slice(1).join(' ') : ref;
      var ri = el('span', 'hbi'); ri.innerHTML = svgI('wh', 36, '#F5C518'); rc.appendChild(ri); rc.appendChild(el('b', '', sh)); rc.appendChild(el('small', '', 'Arbitro')); row.appendChild(rc);
    }
    c.appendChild(row); box.appendChild(c);
    if(!pastScore(m)) weatherInto(null, null, st, m, function(t, code, wnd){
      var wi = el('span', 'hbi'); wi.innerHTML = svgI(wIcon(code), 38); wc.innerHTML = ''; wc.appendChild(wi); wc.appendChild(el('b', '', t + '\u00B0')); wc.appendChild(el('small', '', wDesc(code).replace(/^./, function(x){ return x.toUpperCase(); }))); wc.style.display = '';
      var vi = el('span', 'hbi'); vi.innerHTML = svgI('wi', 36, '#7CC4FF'); wd.innerHTML = ''; wd.appendChild(vi); wd.appendChild(el('b', '', wnd + ' km/h')); wd.appendChild(el('small', '', 'Vento')); wd.style.display = '';
    });
  }
  function bface(p){
    var f = el('span', 'bface'), u = photoFor(p);
    if(u){ var im = el('img'); im.src = u; im.alt = ''; im.onerror = function(){ im.remove(); f.textContent = inits(p.n); }; f.appendChild(im); } else f.textContent = inits(p.n);
    return f;
  }

  function ratCol(v){ return v < 5 ? '#D93A3A' : v < 6 ? '#E8731C' : v < 7 ? '#E5B400' : v < 8 ? '#7BC043' : v < 9 ? '#1E8E3E' : '#1CA3E6'; }
  function bfaceN(it){
    if(it.p) return bface(it.p);
    var f = el('span', 'bface'), db = findPlayer(it.n, it.team, true), u = db ? photoFor(db) : null;
    if(u){ var im = el('img'); im.src = u; im.alt = ''; im.onerror = function(){ im.remove(); f.textContent = inits(it.n); }; f.appendChild(im); } else f.textContent = inits(it.n);
    return f;
  }
  function bestCmp(box, m, lists, title){
    if(!lists[0].length && !lists[1].length) return;
    var cmp = el('div', 'hcard hbest'); cmp.appendChild(el('div', 'hsec ctr', title || 'Giocatori migliori'));
    var th = el('div', 'bth');
    [[m.h, m.hl], [m.a, m.al]].forEach(function(o){ var s = el('span'); s.appendChild(crestEl(o[1], o[0], 20)); s.appendChild(el('span', '', o[0])); th.appendChild(s); });
    cmp.appendChild(th);
    var n = Math.max(lists[0].length, lists[1].length);
    for(var i = 0; i < n; i++){
      var row = el('div', 'brow'), cells = el('div', 'bcells'), tr = el('div', 'btr'), bl = el('div', 'bl'), br = el('div', 'br');
      [0, 1].forEach(function(k){
        var r = lists[k][i], cell = el('div', 'bc' + (k ? ' r' : ''));
        if(r){
          var nb = el('b', '', shortName(r.n)), w = el('span', 'bnm'), cr = crestEl(k ? m.al : m.hl, k ? m.a : m.h, 14);
          if(r.go) nb.addEventListener('click', r.go); else if(r.p) nb.addEventListener('click', function(){ openPlayer(r.p); });
          if(k === 0){ w.appendChild(cr); w.appendChild(nb); } else { w.appendChild(nb); w.appendChild(cr); }
          var vv = el('span', 'bv', r.txt), fc = bfaceN(r);
          if(k === 0){ cell.appendChild(fc); cell.appendChild(w); cell.appendChild(vv); } else { cell.appendChild(vv); cell.appendChild(w); cell.appendChild(fc); }
          var u = el('i'); u.style.width = Math.max(4, Math.min(100, r.v * 10)) + '%'; (k ? br : bl).appendChild(u);
        }
        cells.appendChild(cell);
      });
      row.appendChild(cells); tr.appendChild(bl); tr.appendChild(br); row.appendChild(tr); cmp.appendChild(row);
    }
    box.appendChild(cmp);
  }
  function formCard(box, m){
    var fh = formOf(m.h, m.lg), fa = formOf(m.a, m.lg);
    if(!fh && !fa) return;
    var f = el('div', 'hcard'); f.appendChild(el('div', 'hsec', 'Forma'));
    [[m.h, fh, m.hl], [m.a, fa, m.al]].forEach(function(r){
      var d = el('div', 'hr2 t2'); var l = el('span', 'l'); l.appendChild(crestEl(r[2], r[0], 20)); l.appendChild(document.createTextNode(' ' + r[0])); d.appendChild(l);
      var b = el('b', ''); b.appendChild(formBoxes(r[1])); d.appendChild(b); f.appendChild(d);
    });
    box.appendChild(f);
  }
  function bestPast(box, m, rec){
    if(!rec.pl || !rec.pl.length) return;
    var lists = [0, 1].map(function(k){
      var side = k ? 'a' : 'h';
      return rec.pl.filter(function(x){ return x[1] === side && x[2] != null && x[2] > 0; }).sort(function(a, b){ return b[2] - a[2]; }).slice(0, 3);
    });
    var n = Math.min(lists[0].length, lists[1].length); if(!n) return;
    var out = lists.map(function(L, k){ return L.slice(0, n).map(function(x){ return {n: x[0], team: k ? m.a : m.h, v: x[2], txt: f1(Number(x[2]).toFixed(1)), p: null, go: function(){ pastSheet(x[0], x[1], rec, m); }}; }); });
    bestCmp(box, m, out, 'Migliori in campo');
  }
  function tabPano(box){
    var m = HSEL;
    if(needExtra()){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
    var sc = pastScore(m);
    if(sc){
      var rec = matchRec(m);
      if(rec === 0 || (rec === null && stiId(m) && MF[stiId(m)] === 0)){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
      if(!rec){ box.appendChild(el('div', 'hempty', 'Dettagli della partita non ancora disponibili')); return; }
      momentumBox(box, rec, m);
      eventsBox(box, rec, m);
      bestPast(box, m, rec);
      formCard(box, m);
      storiesBox(box, m);
      infoBand(box, m, rec.stad, null);
      if(rec.ref) refCard(box, rec.ref);
      return;
    }
    formCard(box, m);
    storiesBox(box, m);
    if(PDATA){
      var al = [m.h, m.a].map(function(tn){
        var all = [];
        PDATA.forEach(function(p){ if(p.t !== tn) return; var v = votoOf(p, m, HLINE); if(v) all.push({p: p, v: v}); });
        all.sort(function(a, b){ return b.v.v - a.v.v; });
        return all;
      });
      var c0 = al[0].filter(function(x){ return x.v.v >= BMIN; }).length, c1 = al[1].filter(function(x){ return x.v.v >= BMIN; }).length;
      var nn = Math.min(5, Math.max(c0, c1, 1));
      if(al[0].length && al[1].length) nn = Math.min(nn, al[0].length, al[1].length); else nn = Math.min(nn, Math.max(al[0].length, al[1].length));
      var lists = al.map(function(L){ return L.slice(0, nn).map(function(r){ return {n: r.p.n, team: r.p.t, p: r.p, v: r.v.v, txt: f1(r.v.v.toFixed(2))}; }); });
      bestCmp(box, m, lists, 'Giocatori migliori');
    }
    var fxr = fxGet(m), fref = fxr && fxr.ref;
    infoBand(box, m, null, fref ? fref.n : null);
    if(fref) refCardFx(box, fref);
  }
  var FMO = {};
  function fmMo(m){
    var f = fmFind(m); if(f === undefined){ fmDay(m.d, function(){ if(HSEL === m && lvVisible()) drawMatch(); }); return null; }
    if(!f) return null;
    var c = FMO[f.id], now = Date.now();
    if(c && c.mo) return c.mo;
    if(!c || (!c.busy && now - c.t > 45000)){
      FMO[f.id] = {mo: null, t: now, busy: true};
      fetch(LVURL + '/fx?id=' + f.id).then(function(r){ return r.json(); }).then(function(j){
        var mo = j && j.mo && j.mo.length > 5 ? j.mo : null; FMO[f.id] = {mo: mo, t: Date.now(), busy: false};
        if(mo && HSEL === m && lvVisible() && !LVSH) drawMatch();
      }).catch(function(){ FMO[f.id] = {mo: null, t: Date.now(), busy: false}; });
    }
    return null;
  }
  function momentumBox(box, rec, m, mo0){
    var mo = mo0 || (rec && rec.mo); if(!mo || mo.length < 6) mo = fmMo(m); if(!mo || mo.length < 6) return;
    var n = 0; mo.forEach(function(x){ if(x.minute > n) n = x.minute; }); if(n < 20) return;
    var W = 330, H = 100, mid = 50, bw = W / (n + 1), pts = [];
    mo.slice().sort(function(p, q){ return p.minute - q.minute; }).forEach(function(x){ pts.push([x.minute * bw + bw / 2, mid - Math.max(-100, Math.min(100, x.value || 0)) / 100 * 38]); });
    var p = 'M' + pts.map(function(q){ return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L'), ar = p + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + mid + ' L' + pts[0][0].toFixed(1) + ' ' + mid + 'Z';
    var ev = ((rec && rec.ev) || []).filter(function(e){ return e[0] === 'goal'; }), g = '';
    ev.forEach(function(e){
      var x = (e[1] || 0) * bw + bw / 2, y = e[4] === 'h' ? 9 : H - 9;
      g += '<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="6" fill="#fff" stroke="' + (e[4] === 'h' ? '#2F8DFF' : '#E5484D') + '" stroke-width="1.8"/><text x="' + x.toFixed(1) + '" y="' + (y + 2.6) + '" font-size="7.5" text-anchor="middle">⚽</text>';
    });
    var c = el('div', 'hcard hmom'); c.appendChild(el('div', 'hsec', 'Momentum'));
    var lg = el('div', 'mmlg'); var l1 = el('span'); l1.appendChild(crestEl(m.hl, m.h, 18)); l1.appendChild(document.createTextNode(' ' + m.h)); var l2 = el('span'); l2.appendChild(document.createTextNode(m.a + ' ')); l2.appendChild(crestEl(m.al, m.a, 18)); lg.appendChild(l1); lg.appendChild(l2); c.appendChild(lg);
    var sv = el('div', 'mmsv');
    sv.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '"><defs><clipPath id="mmu"><rect x="0" y="0" width="' + W + '" height="' + mid + '"/></clipPath><clipPath id="mmd"><rect x="0" y="' + mid + '" width="' + W + '" height="' + mid + '"/></clipPath></defs>'
      + '<path d="M0 ' + mid + 'H' + W + '" stroke="currentColor" stroke-opacity=".25" stroke-width=".6"/><path d="M' + (45 * bw).toFixed(1) + ' 4V' + (H - 4) + '" stroke="currentColor" stroke-opacity=".3" stroke-width=".6" stroke-dasharray="2 2"/>'
      + '<path d="' + ar + '" fill="#2F8DFF" opacity=".55" clip-path="url(#mmu)"/><path d="' + ar + '" fill="#E5484D" opacity=".55" clip-path="url(#mmd)"/><path d="' + p + '" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>' + g + '</svg>'
      + '<div class="mmax"><span>0’</span><span>45’</span><span>' + (n >= 88 ? '90' : n) + '’</span></div>';
    c.appendChild(sv); box.appendChild(c);
  }

  // === MAPPA TIRI: PitchAPI per le partite vecchie, FotMob per oggi e live ===
  var FMD = {}, FMS = {}, FMT = null;
  function fmDay(d, cb){
    var k = d.replace(/-/g, ''), e = FMD[k];
    if(e && e.j && Date.now() - e.t < 60000){ cb(e.j); return; }
    if(e && e.p){ e.p.push(cb); return; }
    FMD[k] = {p: [cb], j: e && e.j, t: e ? e.t : 0};
    fetch(LVURL + '/f?date=' + k).then(function(r){ return r.json(); }).then(function(j){ var q = FMD[k].p; FMD[k] = {j: j && j.m ? j : {m: []}, t: Date.now()}; q.forEach(function(f){ f(FMD[k].j); }); }).catch(function(){ var q = FMD[k].p; FMD[k] = {j: {m: []}, t: Date.now()}; q.forEach(function(f){ f(FMD[k].j); }); });
  }
  var FMP = {}, FMTMR = 0;
  function fmFind(m){
    var e = FMD[m.d.replace(/-/g, '')]; if(!e || !e.j) return undefined;
    var f = null; (e.j.m || []).forEach(function(x){ if(!f && lvSame(x.h, m.h) && lvSame(x.a, m.a)) f = x; });
    return f;
  }
  function fmFetch(f, cb){
    if(FMP[f.id]) return; FMP[f.id] = 1;
    fetch(LVURL + '/fs?id=' + f.id).then(function(r){ return r.json(); }).then(function(s){
      FMP[f.id] = 0;
      var co = s && s.co ? s.co : null;
      if(s && s.sh){ var sig = JSON.stringify(s.sh), c = FMS[f.id]; FMS[f.id] = {sh: s.sh, hi: s.hi, ai: s.ai, t: Date.now(), live: !!(s.st && !s.fin), sig: sig, co: co}; cb(!c || c.sig !== sig); }
      else { FMS[f.id] = {sh: [], hi: 0, ai: 0, t: Date.now(), live: false, sig: '', co: co}; cb(true); }
    }).catch(function(){ FMP[f.id] = 0; FMS[f.id] = FMS[f.id] || {sh: [], hi: 0, ai: 0, t: Date.now(), live: false, sig: '', co: null}; cb(false); });
  }
  function shNorm(rec, fm){
    var out = [];
    if(fm){
      fm.sh.forEach(function(s){
        var ev = s[7] ? 'block' : s[6] === 'Goal' ? 'goal' : s[6] === 'Post' ? 'post' : s[8] || s[6] === 'AttemptSaved' ? 'saved' : 'miss';
        out.push({min: s[0], add: s[1], side: s[2] === fm.hi ? 'h' : 'a', n: s[3] || '', x: s[4], y: s[5], ev: ev, bx: s[9], by: s[10], gy: s[11], gz: s[12], xg: s[13], xgot: s[14], ty: s[15], si: s[16], og: s[17]});
      });
    } else if(rec && rec.tr){
      rec.tr.forEach(function(s){
        var ev = s[11] === 'Goal' ? 'goal' : s[11] === 'Post' ? 'post' : s[11] === 'AttemptSaved' ? 'saved' : 'miss';
        out.push({min: s[0], side: s[1], n: s[2], x: s[3], y: s[4], xg: s[5], xgot: s[6], gy: s[8], gz: s[9], ty: s[10], ev: ev, si: s[12]});
      });
    }
    if(fm && rec && rec.tr && rec.tr.length){
      var used = {};
      out.forEach(function(q){
        if(q.gy != null && q.gz != null) return;
        var ln = nk(String(q.n).split(' ').pop()), best = -1, bd = 99;
        rec.tr.forEach(function(t, i){
          if(used[i] || t[1] !== q.side || t[8] == null || t[9] == null) return;
          var d = Math.abs((t[0] || 0) - (q.min || 0));
          if(d <= 1 && nk(String(t[2])).indexOf(ln) >= 0 && d < bd){ bd = d; best = i; }
        });
        if(best >= 0){ used[best] = 1; q.gy = rec.tr[best][8]; q.gz = rec.tr[best][9]; }
      });
    }
    return out.filter(function(s){ return s.x != null && s.y != null; });
  }
  var SHEV = {goal: 'Gol', saved: 'Parato', post: 'Palo', miss: 'Fuori', block: 'Bloccato'};
  var SHSI = {RegularPlay: 'Azione', FromCorner: 'Da corner', SetPiece: 'Palla inattiva', FreeKick: 'Punizione', Penalty: 'Rigore', ThrowInSetPiece: 'Rimessa laterale', FastBreak: 'Contropiede', Assisted: 'Assistito', IndividualPlay: 'Azione personale', ThrowIn: 'Rimessa laterale'};
  var SHTY = {RightFoot: 'Piede destro', LeftFoot: 'Piede sinistro', Header: 'Colpo di testa', OtherBodyPart: 'Altra parte del corpo', Head: 'Colpo di testa'};
  function shPitch(list, sel, m){
    var c = {h: '#2F8DFF', a: '#E5484D'};
    var s = '<svg viewBox="0 -3 68 47" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="-3" width="68" height="47" fill="#2E6B3E"/><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".35">'
      + '<path d="M.2 43.5V0H67.8V43.5"/><rect x="13.84" y="0" width="40.32" height="16.5"/><rect x="24.84" y="0" width="18.32" height="5.5"/><path d="M26.69 16.5A9.15 9.15 0 0 0 41.31 16.5"/><path d="M30.34 0V-1.8H37.66V0" stroke="#fff" stroke-width=".5"/></g><circle cx="34" cy="11" r=".4" fill="rgba(255,255,255,.7)"/>';
    function pos(q){ return [q.y, Math.max(0.6, Math.min(42.4, 105 - q.x))]; }
    if(sel != null && list[sel]){
      var q = list[sel], p = pos(q), ex, ey;
      if(q.ev === 'block' && q.bx != null){ ex = q.by; ey = 105 - q.bx; } else { ex = Math.max(0, Math.min(68, q.gy == null ? 34 : q.gy)); ey = 0; }
      s += '<line x1="' + p[0].toFixed(2) + '" y1="' + p[1].toFixed(2) + '" x2="' + ex.toFixed(2) + '" y2="' + ey.toFixed(2) + '" stroke="' + c[q.side] + '" stroke-width=".4" stroke-dasharray=".9 .8"/>';
    }
    list.forEach(function(q, i){
      var p = pos(q), col = c[q.side], x = p[0].toFixed(2), y = p[1].toFixed(2), on = i === sel;
      if(on) s += '<circle cx="' + x + '" cy="' + y + '" r="2.1" fill="none" stroke="#fff" stroke-width=".3"/>';
      if(q.ev === 'goal') s += '<circle cx="' + x + '" cy="' + y + '" r="1.35" fill="#fff" stroke="' + col + '" stroke-width=".35"/><text x="' + x + '" y="' + (p[1] + .65).toFixed(2) + '" font-size="1.7" text-anchor="middle">⚽</text>';
      else if(q.ev === 'saved') s += '<circle cx="' + x + '" cy="' + y + '" r=".85" fill="' + col + '" opacity=".95"/>';
      else if(q.ev === 'post') s += '<circle cx="' + x + '" cy="' + y + '" r=".85" fill="' + col + '" stroke="#fff" stroke-width=".25"/>';
      else if(q.ev === 'block') s += '<path d="M' + (p[0] - .8).toFixed(2) + ' ' + (p[1] - .8).toFixed(2) + 'l1.6 1.6m0 -1.6l-1.6 1.6" stroke="' + col + '" stroke-width=".4"/>';
      else s += '<circle cx="' + x + '" cy="' + y + '" r=".8" fill="none" stroke="' + col + '" stroke-width=".35"/>';
      s += '<circle class="shh" data-i="' + i + '" cx="' + x + '" cy="' + y + '" r="2" fill="transparent"/>';
    });
    return s + '</svg>';
  }
  function shGoal(q){
    var gy = q.gy, gz = q.gz;
    var s = '<svg viewBox="0 0 200 64"><line x1="0" y1="58" x2="200" y2="58" stroke="currentColor" stroke-opacity=".35"/><rect x="63.4" y="33.6" width="73.2" height="24.4" fill="rgba(255,255,255,.07)" stroke="currentColor" stroke-opacity=".7" stroke-width="2"/>';
    if(gy != null && gz != null){
      var sx = Math.max(5, Math.min(195, (gy - 24) / 20 * 200)), sy = Math.max(5, Math.min(56, 58 - gz * 10));
      s += '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="4.2" fill="' + (q.ev === 'goal' ? '#2DBE60' : q.ev === 'miss' ? 'none' : '#fff') + '" stroke="' + (q.ev === 'miss' ? '#fff' : 'none') + '" stroke-width="1.6"/>';
    }
    return s + '</svg>';
  }
  var SHC = {h: '#2F8DFF', a: '#E5484D'};
  function shBall(x, y, r, c){
    var pts = [], sp = '';
    for(var i = 0; i < 5; i++){ var an = -Math.PI / 2 + i * 2 * Math.PI / 5; pts.push((x + Math.cos(an) * r * .42).toFixed(2) + ',' + (y + Math.sin(an) * r * .42).toFixed(2)); sp += '<line x1="' + (x + Math.cos(an) * r * .42).toFixed(2) + '" y1="' + (y + Math.sin(an) * r * .42).toFixed(2) + '" x2="' + (x + Math.cos(an) * r * .95).toFixed(2) + '" y2="' + (y + Math.sin(an) * r * .95).toFixed(2) + '" stroke="' + c + '" stroke-width="' + (r * .13).toFixed(2) + '"/>'; }
    return '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + r + '" fill="#fff" stroke="' + c + '" stroke-width="' + (r * .2).toFixed(2) + '"/><polygon points="' + pts.join(' ') + '" fill="' + c + '"/>' + sp;
  }
  function shMark(x, y, r, q, on, idx, hit){
    var c = SHC[q.side], o = '';
    if(on) o += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + (r * 1.75).toFixed(2) + '" fill="none" stroke="var(--ink)" stroke-width="' + (r * .22).toFixed(2) + '"/>';
    if(q.ev === 'goal') o += shBall(x, y, r, c);
    else if(q.ev === 'saved') o += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + r + '" fill="' + c + '"/>';
    else if(q.ev === 'post') o += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + r + '" fill="' + c + '" stroke="#fff" stroke-width="' + (r * .2).toFixed(2) + '"/>';
    else if(q.ev === 'block') o += '<path d="M' + (x - r * .8).toFixed(2) + ' ' + (y - r * .8).toFixed(2) + 'l' + (r * 1.6).toFixed(2) + ' ' + (r * 1.6).toFixed(2) + 'm0 ' + (-r * 1.6).toFixed(2) + 'l' + (-r * 1.6).toFixed(2) + ' ' + (r * 1.6).toFixed(2) + '" stroke="' + c + '" stroke-width="' + (r * .3).toFixed(2) + '" stroke-linecap="round"/>';
    else o += '<circle cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + r + '" fill="var(--panel)" stroke="' + c + '" stroke-width="' + (r * .3).toFixed(2) + '"/>';
    return o + '<circle class="shh" data-i="' + idx + '" cx="' + x.toFixed(2) + '" cy="' + y.toFixed(2) + '" r="' + (r * 1.6).toFixed(2) + '" fill="transparent"/>';
  }
  function shPitch2(list, sel){
    var s = '<svg viewBox="0 0 105 68" xmlns="http://www.w3.org/2000/svg"><rect width="105" height="68" fill="var(--panel-2)"/><g fill="none" stroke="var(--line)" stroke-width=".4"><rect x=".2" y=".2" width="104.6" height="67.6"/><path d="M52.5 0V68"/><circle cx="52.5" cy="34" r="9.15"/><rect x=".2" y="13.84" width="16.5" height="40.32"/><rect x="88.3" y="13.84" width="16.5" height="40.32"/><rect x=".2" y="24.84" width="5.5" height="18.32"/><rect x="99.3" y="24.84" width="5.5" height="18.32"/></g>';
    list.forEach(function(q, i){
      if(i === sel) return;
      s += shMark(q.side === 'h' ? q.x : 105 - q.x, q.side === 'h' ? q.y : 68 - q.y, 1.8, q, false, i);
    });
    var q = list[sel]; if(q) s += shMark(q.side === 'h' ? q.x : 105 - q.x, q.side === 'h' ? q.y : 68 - q.y, 1.8, q, true, sel);
    return s + '</svg>';
  }
  function shLegend(){
    var d = el('div', 'shlg');
    d.innerHTML = '<span><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>Fuori</span><span><svg viewBox="0 0 10 10"><circle cx="5" cy="5" r="3" fill="currentColor"/></svg>Parato</span><span><svg viewBox="0 0 10 10"><path d="M2 2l6 6m0-6l-6 6" stroke="currentColor" stroke-width="1.4"/></svg>Bloccato</span><span><svg viewBox="0 0 10 10">' + shBall(5, 5, 4, 'currentColor') + '</svg>Gol</span>';
    return d;
  }
  function shGoal2(list, sel, side){
    var y0 = 22, y1 = 46, zm = 6.2, W = 200, Hh = 84;
    var X = function(y){ return (Math.max(y0 + .6, Math.min(y1 - .6, y)) - y0) / (y1 - y0) * W; }, Y = function(z){ return Hh - 8 - Math.max(.3, Math.min(zm - .4, z)) / zm * (Hh - 18); };
    var gx0 = X(30.34), gx1 = X(37.66), gt = Y(2.44), gb = Y(0);
    var s = '<svg viewBox="0 0 ' + W + ' ' + Hh + '"><line x1="0" y1="' + gb + '" x2="' + W + '" y2="' + gb + '" stroke="var(--line)" stroke-width="1.2"/>';
    for(var i = 0; i <= 12; i++){ var xx = gx0 + (gx1 - gx0) * i / 12; s += '<line x1="' + xx.toFixed(1) + '" y1="' + gt + '" x2="' + xx.toFixed(1) + '" y2="' + gb + '" stroke="var(--line)" stroke-width=".7"/>'; }
    for(var j = 0; j <= 5; j++){ var yy = gt + (gb - gt) * j / 5; s += '<line x1="' + gx0.toFixed(1) + '" y1="' + yy.toFixed(1) + '" x2="' + gx1.toFixed(1) + '" y2="' + yy.toFixed(1) + '" stroke="var(--line)" stroke-width=".7"/>'; }
    s += '<path d="M' + gx0.toFixed(1) + ' ' + gb + 'V' + gt + 'H' + gx1.toFixed(1) + 'V' + gb + '" fill="none" stroke="var(--text)" stroke-width="3.4" stroke-linejoin="round"/>';
    list.forEach(function(q, i){ if(q.side !== side || q.gy == null || q.gz == null || i === sel || q.ev === 'block') return; s += shMark(X(q.gy), Y(q.gz), 3.6, q, false, i); });
    var q = list[sel]; if(q && q.side === side && q.gy != null && q.gz != null && q.ev !== 'block') s += shMark(X(q.gy), Y(q.gz), 3.6, q, true, sel);
    return s + '</svg>';
  }
  function shSame(a, b){
    if(!a || !b) return false; var x = nk(a), y = nk(b); if(x === y) return true;
    var xt = x.split(' '), yt = y.split(' '); return xt[xt.length - 1] === yt[yt.length - 1] && xt[0].charAt(0) === yt[0].charAt(0);
  }
  function shotsView(box, m, rec){
    var today = romeDay(new Date()), old = false, fm = null, pending = false;
    var again = function(ch){ if(ch !== false && HSEL && HSEL.d === m.d && HSEL.h === m.h && HSM === 't' && lvVisible()) drawMatch(); };
    clearTimeout(FMTMR);
    if(!old){
      var f = fmFind(m);
      if(f === undefined){ pending = true; fmDay(m.d, function(){ again(true); }); }
      else if(f){
        var c = FMS[f.id];
        if(c){ fm = c.sh.length || !rec ? c : null; if(c.live || !c.sh.length){ if(Date.now() - c.t > 9000) fmFetch(f, again); else FMTMR = setTimeout(function(){ fmFetch(f, again); }, 10000); } }
        else { pending = true; fmFetch(f, again); }
      }
    }
    var all = shNorm(rec, fm);
    if(!all.length && pending){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
    if(!all.length){ box.appendChild(el('div', 'hempty', 'Tiri non disponibili')); return; }
    segmented(box, [['all', 'Tutti'], ['h', m.h], ['a', m.a]], HSFLT, function(v){ HSFLT = v; HSPL = null; HSHOT = null; drawMatch(); });
    var base = all.filter(function(q){ return HSFLT === 'all' || q.side === HSFLT; });
    if(HSFLT !== 'all'){
      var cnt = {}; base.forEach(function(q){ cnt[q.n] = (cnt[q.n] || 0) + 1; });
      if(HSPL != null && !cnt[HSPL]){ var hq = Object.keys(cnt).filter(function(n){ return shSame(n, HSPL); })[0]; HSPL = hq || null; }
      var ns = Object.keys(cnt).sort(function(a, b){ return cnt[b] - cnt[a]; });
      var row = el('div', 'hpills hscr'), bt = el('button', 'hpill' + (HSPL == null ? ' on' : ''), 'Tutti'); bt.type = 'button'; bt.addEventListener('click', function(){ HSPL = null; HSHOT = null; drawMatch(); }); row.appendChild(bt);
      ns.forEach(function(n){ var b = el('button', 'hpill' + (HSPL === n ? ' on' : ''), shortName(n) + ' ' + cnt[n]); b.type = 'button'; b.addEventListener('click', function(){ HSPL = n; HSHOT = null; drawMatch(); }); row.appendChild(b); });
      box.appendChild(row);
    }
    var list = base.filter(function(q){ return HSPL == null || q.n === HSPL || shSame(q.n, HSPL); }).sort(function(p, q){ return ((p.min || 0) + (p.add || 0) / 100) - ((q.min || 0) + (q.add || 0) / 100); });
    if(!list.length){ box.appendChild(el('div', 'hempty', 'Nessun tiro')); return; }
    var sel = HSHOT != null && HSHOT < list.length && HSHOT >= 0 ? HSHOT : -1;
    var cd = el('div', 'hcard shw');
    cd.innerHTML = shPitch2(list, sel);
    cd.appendChild(shLegend());
    box.appendChild(cd);
    Array.prototype.forEach.call(cd.querySelectorAll('.shh'), function(h){ h.addEventListener('click', function(){ var i = +h.getAttribute('data-i'); HSHOT = i === sel ? null : i; drawMatch(); }); });
    if(sel >= 0){
    var gb = el('div', 'hcard shbx');
    var sides = HSFLT === 'all' ? [list[sel].side] : [HSFLT];
    sides.forEach(function(sd){ var d = el('div'); d.innerHTML = shGoal2(list, sel, sd); gb.appendChild(d); });
    box.appendChild(gb);
    Array.prototype.forEach.call(gb.querySelectorAll('.shh'), function(h){ h.addEventListener('click', function(){ HSHOT = +h.getAttribute('data-i'); drawMatch(); }); });
    }
    if(SHJUMP){ SHJUMP = 0; setTimeout(function(){ try{ cd.scrollIntoView({behavior: 'smooth', block: 'start'}); }catch(e){} }, 60); }
    if(sel < 0){ shPlayers(box, m, base); return; }
    var q = list[sel], team = q.side === 'h' ? m.h : m.a;
    var nv = el('div', 'hcard shnav');
    var lb = el('button', 'ar', '‹'); lb.type = 'button'; lb.addEventListener('click', function(){ HSHOT = sel <= 0 ? list.length - 1 : sel - 1; drawMatch(); });
    var rb = el('button', 'ar', '›'); rb.type = 'button'; rb.addEventListener('click', function(){ HSHOT = sel >= list.length - 1 ? 0 : sel + 1; drawMatch(); });
    var mid = el('div', 'mid'), fc = el('span', 'fc2'), pu = null;
    try{ pu = lvPhoto({n: q.n}, team); }catch(e){}
    if(pu){ var im = el('img'); im.src = pu; im.alt = ''; im.onerror = function(){ im.remove(); fc.textContent = inits(q.n); }; fc.appendChild(im); } else fc.textContent = inits(q.n);
    mid.appendChild(fc);
    var tx = el('div', 'tx'); tx.appendChild(el('b', '', q.n));
    var TT = {RightFoot: ' di destro', LeftFoot: ' di sinistro', Header: ' di testa', Head: ' di testa'}, EV = {goal: 'gol', saved: 'in porta, parato', post: 'palo', miss: 'fuori dallo specchio', block: 'bloccato'};
    tx.appendChild(el('small', '', (q.min != null ? q.min + (q.add ? '+' + q.add : '') + '’ · ' : '') + 'Tiro' + (TT[q.ty] || '') + ' · ' + (EV[q.ev] || '') + (q.si && SHSI[q.si] ? ' · ' + SHSI[q.si].toLowerCase() : '')));
    mid.appendChild(tx);
    var xg = el('div', 'xg'); xg.appendChild(el('b', '', q.xg == null ? '–' : f1(Number(q.xg).toFixed(2)))); xg.appendChild(el('small', '', 'xG')); mid.appendChild(xg);
    nv.appendChild(lb); nv.appendChild(mid); nv.appendChild(rb); box.appendChild(nv);
    box.appendChild(el('div', 'shcnt', (sel + 1) + ' / ' + list.length));
    shPlayers(box, m, base);
  }
  function shMiniPitch(arr){
    var s = '<svg viewBox="52 0 53 68" xmlns="http://www.w3.org/2000/svg"><rect x="52" y="0" width="53" height="68" fill="var(--panel-2)"/><g fill="none" stroke="var(--line)" stroke-width=".4"><rect x="52.5" y=".2" width="52.3" height="67.6"/><rect x="88.3" y="13.84" width="16.5" height="40.32"/><rect x="99.3" y="24.84" width="5.5" height="18.32"/><path d="M52.5 0V68"/></g>';
    arr.forEach(function(q, i){ s += shMark(q.x, q.y, 1.7, q, false, i); });
    return s + '</svg>';
  }
  function shPlayers(box, m, base){
    var by = {}, ord = [];
    base.forEach(function(q){ var k = q.side + '|' + q.n; if(!by[k]){ by[k] = {n: q.n, side: q.side, sh: []}; ord.push(by[k]); } by[k].sh.push(q); });
    ord.sort(function(a, b){ return b.sh.length - a.sh.length || (a.n < b.n ? -1 : 1); });
    if(!ord.length) return;
    var hh = el('div', 'hsec', 'Tiri per giocatore'); hh.style.padding = '4px 2px 8px'; box.appendChild(hh);
    ord.slice(0, 30).forEach(function(o){
      var c = el('button', 'hcard shpc'); c.type = 'button';
      var hd = el('div', 'shph'), fc = el('span', 'fc2'), team = o.side === 'h' ? m.h : m.a, pu = null;
      try{ pu = lvPhoto({n: o.n}, team); }catch(e){}
      if(pu){ var im = el('img'); im.src = pu; im.alt = ''; im.loading = 'lazy'; im.onerror = function(){ im.remove(); fc.textContent = inits(o.n); }; fc.appendChild(im); } else fc.textContent = inits(o.n);
      hd.appendChild(fc);
      var tx = el('div', 'tx'), g = 0, ot = 0, xg = 0;
      o.sh.forEach(function(q){ if(q.ev === 'goal') g++; if(q.ev === 'goal' || q.ev === 'saved') ot++; xg += Number(q.xg) || 0; });
      tx.appendChild(el('b', '', o.n));
      tx.appendChild(el('small', '', o.sh.length + (o.sh.length === 1 ? ' tiro' : ' tiri') + ' · ' + ot + ' in porta' + (g ? ' · ' + g + (g === 1 ? ' gol' : ' gol') : '') + ' · xG ' + f1(xg.toFixed(2))));
      hd.appendChild(tx); c.appendChild(hd);
      var mm = el('div', 'shpm'), p1 = el('div', 'p1'), p2 = el('div', 'p2');
      p1.innerHTML = shMiniPitch(o.sh); p2.innerHTML = shGoal2(o.sh, -1, o.side);
      mm.appendChild(p1); mm.appendChild(p2); c.appendChild(mm);
      c.addEventListener('click', function(){ HSFLT = o.side; HSPL = o.n; HSHOT = null; SHJUMP = 1; drawMatch(); });
      box.appendChild(c);
    });
  }
  var SHJUMP = 0;
  function tabStatsPast(box){
    var m = HSEL, rec = matchRec(m);
    if(rec === 0){ box.appendChild(el('div', 'hempty', 'Carico…')); return; }
    var per = (rec && rec.st) || {};
    segmented(box, [['d', 'Dati'], ['t', 'Mappa tiri']], HSM, function(v){ HSM = v; HSHOT = null; drawMatch(); });
    if(HSM === 't'){ shotsView(box, m, rec || null); return; }
    if(!rec){ box.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili')); return; }
    segmented(box, [['all', 'Totali'], ['FirstHalf', '1° Tempo'], ['SecondHalf', '2° Tempo']], HSP, function(v){ HSP = v; drawMatch(); });
    var gs = per[HSP] || [];
    if(!gs.length){ box.appendChild(el('div', 'hempty', 'Statistiche non disponibili')); return; }
    var IT = {BallPossesion: 'Possesso palla %', ShotsOnTarget: 'Tiri in porta', accurate_passes: 'Passaggi riusciti', big_chance: 'Occasioni da gol', big_chance_missed_title: 'Occasioni sbagliate', corners: 'Corner', expected_goals: 'xG', total_shots: 'Tiri totali', touches_opp_box: 'Tocchi in area avversaria', yellow_cards: 'Gialli', clearances: 'Respinte', interceptions: 'Intercetti', keeper_saves: 'Parate', 'matchstats.headers.tackles': 'Contrasti', shot_blocks: 'Tiri bloccati', fouls: 'Falli commessi', red_cards: 'Rossi', aerials_won: 'Duelli aerei vinti', dribbles_succeeded: 'Dribbling riusciti', duel_won: 'Duelli vinti', ground_duels_won: 'Duelli a terra vinti', expected_goals_non_penalty: 'xG senza rigori', expected_goals_on_target: 'xG in porta (xGOT)', expected_goals_open_play: 'xG azione', expected_goals_set_play: 'xG palle inattive', Offsides: 'Fuorigioco', accurate_crosses: 'Cross riusciti', long_balls_accurate: 'Lanci lunghi riusciti', opposition_half_passes: 'Passaggi metà campo avversaria', own_half_passes: 'Passaggi nella propria metà', passes: 'Passaggi', player_throws: 'Rimesse laterali', physical_metrics_distance_covered: 'Distanza percorsa', physical_metrics_number_of_sprints: 'Sprint', physical_metrics_running: 'Distanza in corsa', physical_metrics_sprinting: 'Distanza in sprint', ShotsOffTarget: 'Tiri fuori', blocked_shots: 'Tiri murati', shots_inside_box: 'Tiri in area', shots_outside_box: 'Tiri da fuori area', shots_woodwork: 'Pali e traverse'};
    var GT = {BallPossesion: 'Panoramica', clearances: 'Difesa', fouls: 'Disciplina', aerials_won: 'Duelli', expected_goals_non_penalty: 'Gol attesi', passes: 'Passaggi', physical_metrics_distance_covered: 'Fisico', total_shots: 'Tiri'};
    function gtitle(g){ if(g.t) return g.t; for(var q = 0; q < g.i.length; q++){ if(GT[g.i[q][3]]) return GT[g.i[q][3]]; } return ''; }
    var ordr = gs.slice().sort(function(a, b){ return (gtitle(a) === 'Panoramica' ? 0 : 1) - (gtitle(b) === 'Panoramica' ? 0 : 1); });
    var PORD = ['BallPossesion', 'expected_goals', 'total_shots', 'ShotsOnTarget', 'big_chance', 'big_chance_missed_title', 'accurate_passes', 'touches_opp_box', 'corners', 'fouls', 'yellow_cards', 'Offsides'];
    var PLAB = {big_chance: 'Grandi occasioni', big_chance_missed_title: 'Grandi occasioni sbagliate', fouls: 'Falli', Offsides: 'Fuorigiochi', BallPossesion: 'Possesso palla'};
    var pany = {}; gs.forEach(function(g){ g.i.forEach(function(x){ if(!pany[x[3]]) pany[x[3]] = x; }); });
    ordr = ordr.map(function(g){
      if(gtitle(g) !== 'Panoramica') return g;
      var it = []; PORD.forEach(function(k){ if(pany[k]) it.push(pany[k]); });
      return {t: 'Panoramica', i: it, pano: 1};
    });
    function num(s){ var v = parseFloat(String(s).replace(',', '.')); return isNaN(v) ? null : v; }
    ordr.forEach(function(g){
      var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', gtitle(g)));
      g.i.forEach(function(x){
        var hv = num(x[1]), av = num(x[2]), r = el('div', 'hst'), v = el('div', 'v');
        var bh = el('b', hv != null && av != null && hv > av ? 'w' : '', String(x[1])), ba = el('b', hv != null && av != null && av > hv ? 'w' : '', String(x[2]));
        if(hv != null && av != null){ if(hv > av) bh.style.color = '#2F8DFF'; else if(av > hv) ba.style.color = '#E5484D'; }
        v.appendChild(bh); v.appendChild(el('span', '', (g.pano && PLAB[x[3]]) || IT[x[3]] || x[0])); v.appendChild(ba); r.appendChild(v);
        if(hv != null && av != null){
          var mx = Math.max(hv, av) || 1, bar = el('div', 'hbar2'), L = el('div', 'l'), R = el('div', 'r'), i = el('i'), u = el('i');
          i.style.width = Math.round(100 * hv / mx) + '%'; u.style.width = Math.round(100 * av / mx) + '%'; i.style.background = '#2F8DFF'; u.style.background = '#E5484D';
          if(hv < av) i.style.opacity = '.4'; else if(av < hv) u.style.opacity = '.4';
          L.appendChild(i); R.appendChild(u); bar.appendChild(L); bar.appendChild(R); r.appendChild(bar);
        }
        c.appendChild(r);
      });
      box.appendChild(c);
    });
  }
  function drawRefPage(body){
    var n = HREF, o0 = ARB && ARB.ref && ARB.ref[n], o = o0 && ((HRLG && o0.by && o0.by[HRLG]) || o0), olg = HRLG && o0 && o0.by && o0.by[HRLG] ? HRLG : (o0 && o0.lg);
    var hero = el('div', 'hhero'); hero.appendChild(backBtn());
    var tt = el('div', 'htm'); tt.appendChild(yc()); tt.firstChild.className += ' big'; var nx = el('div'); nx.appendChild(el('div', 'htn', n)); nx.appendChild(el('div', 'sm', o ? o.n + ' partite' : '')); tt.appendChild(nx); hero.appendChild(tt); body.appendChild(hero);
    var hc = el('div', 'hc'); body.appendChild(hc);
    if(!o){ hc.appendChild(el('div', 'hempty', 'Statistiche non ancora disponibili')); return; }
    var c = el('div', 'hcard'); c.appendChild(el('div', 'hsec', 'Medie a partita'));
    var av = refAvg(olg);
    [['Gialli', o.y, av.y], ['Rossi', o.r, av.r], ['Falli', o.fo, av.fo], ['Rigori', o.pen, av.pen]].forEach(function(x){
      var w = el('div', 'hrw'), d = el('div', 'hr2'); d.appendChild(el('span', 'l', x[0])); d.appendChild(el('b', '', x[1] == null ? '–' : f1(String(x[1])))); w.appendChild(d);
      if(x[1] != null && x[2] > 0) w.appendChild(barEl(x[1], x[2], false));
      c.appendChild(w);
    });
    hc.appendChild(c);
    var l = el('div', 'hcard'); l.appendChild(el('div', 'hsec', 'Ultime partite'));
    (o.m || []).forEach(function(x){
      var r = el('div', 'hrs tap'); r.appendChild(el('span', 'dt', dmy(x[0])));
      r.appendChild(el('span', 'op', x[1] + ' – ' + x[2])); r.appendChild(el('span', 'sc2', x[3] + ' - ' + x[4]));
      r.addEventListener('click', function(){ var lgk = teamLg(x[1]); openMatch({d: x[0], h: x[1], a: x[2], hl: tLogo(x[1]), al: tLogo(x[2]), lg: lgk, sh: x[3], sa: x[4], t: null}); });
      l.appendChild(r);
    });
    hc.appendChild(l);
  }
  function refOf(k, lg){ var o = ARB && ARB.ref && ARB.ref[k]; if(!o) return null; if(o.by && o.by[lg]) return o.by[lg]; return o.lg === lg ? o : null; }
  var RCC = null;
  function rccLoad(){ if(RCC === null){ RCC = 0; gj('refcc.json').then(function(j){ RCC = (j && j.r) || {}; if(lvVisible() && HLV && HLTAB === 'ar') drawMatch(); }); } return RCC || null; }
  function refFlag(name){
    var R = rccLoad(); if(!R) return '';
    if(R[name]) return flagCode(R[name]);
    var q = nk(name), qt = q.split(' '), hit = '';
    Object.keys(R).some(function(k){ var x = nk(k); if(x === q){ hit = R[k]; return true; } var xt = x.split(' '); if(xt[xt.length - 1] === qt[qt.length - 1] && xt[0].charAt(0) === qt[0].charAt(0)){ hit = R[k]; return true; } return false; });
    return hit ? flagCode(hit) : '';
  }
  function refsLeague(hc, lg){
    var R = ARB && ARB.ref ? Object.keys(ARB.ref).filter(function(k){ return !!refOf(k, lg); }) : [];
    var mets = [['y', 'Gialli'], ['r', 'Rossi'], ['fo', 'Falli'], ['pen', 'Rigori'], ['n', 'Partite']];
    segmented(hc, mets, HRK, function(v){ HRK = v; drawMatch(); });
    if(!R.length){ hc.appendChild(el('div', 'hempty', 'Statistiche arbitri non ancora disponibili')); return; }
    R.sort(function(a, b){ return (refOf(b, lg)[HRK] || 0) - (refOf(a, lg)[HRK] || 0); });
    var c = el('div', 'hcard');
    R.forEach(function(k, i){
      var o = refOf(k, lg), r = el('div', 'hrs trk'); r.style.cursor = 'pointer';
      r.appendChild(el('span', 'dt', String(i + 1))); var op = el('span', 'op'); op.appendChild(refAv(k, 'rfa') || yc()); op.appendChild(el('span', '', ' ' + k + (CUPK[lg] ? ' ' + refFlag(k) : ''))); r.appendChild(op);
      r.appendChild(el('span', 'sc2', o[HRK] == null ? '–' : f1(String(o[HRK])))); r.addEventListener('click', function(){ openRef(k, lg); }); c.appendChild(r);
    });
    hc.appendChild(c);
  }
  var MSTL = false;
  function mstDock(hero, tt){
    var fit = function(){
      if(!hero.parentNode) return;
      var tb = hero.querySelector('.htabs'), hid = (tb ? tb.getBoundingClientRect().top : tt.getBoundingClientRect().bottom) - hero.getBoundingClientRect().top;
      if(hid > 20){ hero.setAttribute('data-hid', String(Math.round(hid))); hero.style.top = 'calc(' + stkTop() + ' - ' + Math.round(hid) + 'px)'; }
    };
    var upd = function(){ var h = document.querySelector('#slbMatch .hhero.mst'); if(!h) return; h.classList.toggle('stuck', h.getBoundingClientRect().top <= (parseFloat(stkTop()) - (+h.getAttribute('data-hid') || 0)) + 1); };
    requestAnimationFrame(function(){ fit(); upd(); }); setTimeout(function(){ fit(); upd(); }, 400);
    if(!MSTL){
      MSTL = true; var tk = false;
      window.addEventListener('scroll', function(){
        if(tk) return; tk = true;
        requestAnimationFrame(function(){
          tk = false; upd();
        });
      }, {passive: true});
    }
  }
  function heroGoals(m){
    var out = {h: [], a: []}, any = false, psc = pastScore(m), LE = lvOf(m), add = function(side, mn, ex, n, og){ out[side].push({m: mn + (ex ? '+' + ex : '') + '’', n: cnm(n), og: og}); any = true; };
    if(psc){
      var rc = matchRec(m);
      if(rc && rc !== 0 && rc.ev) rc.ev.forEach(function(e){ if(e[0] === 'goal') add(e[4] === 'a' ? 'a' : 'h', e[1], e[2], e[5], !!e[8]); });
    } else if(LE && LE.st !== 'pre'){
      var F = fxData(m), s = LVM[LE.id];
      if(F && F.ev && F.ev.length){ F.ev.forEach(function(e){ if(e.ty === 'Goal') add(e.h ? 'h' : 'a', e.t, e.a, e.n, !!e.og); }); }
      else if(s){ lvRows(s).forEach(function(x){ if(x.k === 'g') add(x.side, parseInt(x.min, 10) || 0, 0, x.n, !!x.og); }); }
    }
    return any ? out : null;
  }
  function heroGoalCol(list){
    var d = el('div', 'hgl');
    list.forEach(function(g){ d.appendChild(el('div', '', (g.n ? shortName(g.n) + (g.og ? ' (AG)' : '') + ' ' : '') + g.m)); });
    return d;
  }
  function drawHMatch(days, body){
    days.style.display = 'none';
    var m = HSEL, hero = el('div', 'hhero');
    hero.appendChild(backBtn());
    var tt = el('div', 'tt'), a = el('div', 'tn'), b = el('div', 'tn'), mid = el('div');
    a.appendChild(crestEl(m.hl, m.h, 52)); a.appendChild(el('div', 'tap', m.h));
    b.appendChild(crestEl(m.al, m.a, 52)); b.appendChild(el('div', 'tap', m.a));
    a.addEventListener('click', function(){ var l = m.cup ? teamLg(m.h) : m.lg; if(l) openTeam(m.h, l); }); b.addEventListener('click', function(){ var l = m.cup ? teamLg(m.a) : m.lg; if(l) openTeam(m.a, l); });
    if(!pastScore(m)) fxGet(m);
    var psc = pastScore(m), LE = lvOf(m), LIVE = !!(LE && (LE.st !== 'pre' || m.cup) && !psc);
    var stTxt, scTxt;
    if(LIVE){ scTxt = LE.sh + ' \u2013 ' + LE.sa; stTxt = lvMin(LE); var lko = el('div', 'ko' + (LE.st === 'in' ? ' lv' : ''), scTxt); mid.appendChild(lko); mid.appendChild(el('div', 'sm' + (LE.st === 'in' ? ' lv' : ''), stTxt)); }
    else { scTxt = psc ? psc[0] + ' – ' + psc[1] : timeOf(m.t); stTxt = (psc ? 'FT · ' : '') + dayLabel(m.d); mid.appendChild(el('div', 'ko', scTxt)); mid.appendChild(el('div', 'sm', stTxt)); }
    mid.appendChild(el('div', 'sm', lgLabel(m.lg)));
    var hgo = heroGoals(m); if(hgo){ hero.classList.add('hg'); if(hgo.h.length) a.appendChild(heroGoalCol(hgo.h)); if(hgo.a.length) b.appendChild(heroGoalCol(hgo.a)); }
    tt.appendChild(a); tt.appendChild(mid); tt.appendChild(b); hero.appendChild(tt);
    var mnl = el('div', 'mnl'), mb = el('button', 'mbk', '\u2039'); mb.type = 'button'; mb.setAttribute('aria-label', 'Indietro');
    mb.addEventListener('click', function(){ if(history.state && history.state.slb) history.back(); else navBack(); });
    var mtx = el('span', 'mtx', m.h + '  ' + scTxt + '  ' + m.a + (LIVE || psc ? '  \u00B7  ' + stTxt : ''));
    mnl.appendChild(mb); mnl.appendChild(mtx); hero.appendChild(mnl);
    var tabs = el('div', 'htabs sc');
    var PS = !!pastScore(m);
    var LTABS = ['lpano', 'lstat', 'lform', 'class'];
    if(LIVE && LTABS.indexOf(HTAB) < 0) HTAB = {pano: 'lpano', stat: 'lstat', form: 'lform'}[HTAB] || 'lpano'; if(!LIVE && /^l(pano|stat|form)$/.test(HTAB)) HTAB = {lpano: 'pano', lstat: 'stat', lform: 'form'}[HTAB];
    (LIVE ? [['lpano', 'Riassunto'], ['lstat', 'Statistiche'], ['lform', 'Formazioni']].concat(m.cup && !/^uefa\.(champions|europa)/.test(m.lg) ? [] : [['class', 'Classifica']]) : PS ? [['pano', 'Panoramica'], ['stat', 'Statistiche'], ['form', 'Formazioni'], ['class', 'Classifica']] : [['pano', 'Panoramica'], ['stat', 'Statistiche'], ['form', 'Formazioni'], ['class', 'Classifica'], ['play', 'Affidabilità']]).forEach(function(o){
      var t = el('button', HTAB === o[0] ? 'on' : '', o[1]); t.type = 'button';
      t.setAttribute('data-k', o[0]);
      t.addEventListener('click', function(){ if(HTAB === o[0]) return; var ids = ['pano', 'lpano', 'stat', 'lstat', 'form', 'lform', 'class', 'play']; HANIM = {t: 'tab', d: ids.indexOf(o[0]) > ids.indexOf(HTAB) ? 1 : -1}; HTAB = o[0]; drawMatch(); }); tabs.appendChild(t);
    });
    hero.appendChild(tabs); body.appendChild(hero); hero.classList.add('mst');
    mstDock(hero, tt);
    var hc = el('div', 'hc'); body.appendChild(hc);
    hmContent(hc, m, LE, LIVE, PS);
  }
  function hmContent(hc, m, LE, LIVE, PS){
    if(LIVE && HTAB === 'lpano') lvPano(hc, m, LE); else if(LIVE && HTAB === 'lstat') lvStat(hc, m, LE); else if(LIVE && HTAB === 'lform') lvForm(hc, m, LE); else if(HTAB === 'pano') tabPano(hc); else if(HTAB === 'stat') (PS ? tabStatsPast(hc) : tabStats(hc)); else if(HTAB === 'form') tabLineup(hc); else if(HTAB === 'class') tabTable(hc); else tabPlayers(hc);
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
      if(['serie-a','premier-league','la-liga','bundesliga','ligue-1'].indexOf(f[3]) < 0) return;
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
    body.appendChild(el('div', 'hist-note', 'Giocatori con voto 7,75 o più su Over ' + f1(line) + ' (massimo ' + BMAX + ' al giorno).'));
    if(!list.length){ body.appendChild(el('div', 'hist-note', 'Nessun giocatore con voto 7,75 o più per questo giorno.')); return; }
    list.forEach(function(r, i){
      var c = el('div', 'play-card'), top = el('div', 'play-top'), who = el('div', 'who');
      who.appendChild(el('span', '', (i + 1) + '. ' + r.p.n));
      top.appendChild(who); top.appendChild(el('div', 'when', hhmm(r.f[0])));
      c.appendChild(top);
      c.appendChild(el('div', 'play-mkt', (r.f[2] === 1 ? r.p.t + ' – ' + r.f[1] : r.f[1] + ' – ' + r.p.t)));
      var ch = el('div', 'chips');
      var tt = r.t;
      ch.appendChild(el('span', 'chip gold', 'Voto ' + f1((Math.round(r.voto * 100) / 100).toFixed(2))));
      if(tt) ch.appendChild(el('span', 'chip', 'Media attesa ' + f1(tt.lam.toFixed(2))));
      ch.appendChild(el('span', 'chip', Math.round(r.t.mn) + '\' medi'));
      if(tt) ch.appendChild(el('span', 'chip', 'Ultime 5: ' + f1(tt.l5.toFixed(1)) + ' \u00b7 stagione ' + f1(tt.sea.toFixed(1)) + ' /90\''));
      c.appendChild(ch);
      body.appendChild(c);
    });
  }
  function renderMatch(cat){
    MCAT = cat; drawMatch();
    if(cat === 'home'){ loadHome().then(drawMatch); return; }
    if(cat === 'best'){ loadPlayers().then(drawMatch); return; }
    fetch('angoli.json', {cache: 'no-cache'}).then(function(r){ return r.ok ? r.json() : null; })
      .catch(function(){ return null; }).then(function(j){ MDATA = j; drawMatch(); });
  }
  var LAST = null;

  // --- giocatori: ricerca nome e compilazione automatica di medie, minuti, ultime 5 e hit rate ---
  var PDATA = null, PSEL = null, PLOAD = null, PFIX = {};
  function norm(x){ return String(x || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  var QDATA = null, QUPD = null;
  function loadPlayers(){
    if(!PLOAD){
      var qp = null;
      PLOAD = fetch('giocatori.json', {cache: 'no-cache'}).then(function(r){ return r.ok ? r.json() : null; })
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
    mn.style.cssText = 'color:var(--accent);font-size:12.5px;margin-top:6px;font-weight:600;'; wrap.appendChild(mn);
    var hr = document.getElementById('hitRate5');
    if(hr){
      var note = document.createElement('div'); note.id = 'slbL5Note';
      note.style.cssText = 'color:#C98300;font-size:12.5px;margin-top:6px;';
      hr.parentNode.appendChild(note);
    }
    PICKFN = function(p, line){
      PSEL = p; inp.value = p.n; panel.hidden = true;
      if(line != null){
        var sel = document.getElementById('slbLineSel'), lv = document.getElementById('lineValue');
        if(sel) sel.value = String(line);
        if(lv){ lv.value = String(line); lv.dispatchEvent(new Event('input', {bubbles:true})); }
      }
      fillAvg(); fillTeams(p); fillOdds();
    };
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
        d.addEventListener('click', function(){ PICKFN(p); inp.blur(); });
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
      sp.style.color = k >= 7 ? '#2F8DFF' : (themeNow() === 'night' ? '#fff' : '#0B2A6B'); sp.style.opacity = '0'; nm.appendChild(sp);
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
    fetch('data.json', {cache: 'no-cache'}).then(function(r){ return r.json(); }).then(function(j){
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
  var ICON = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAMAAAAKE/YAAAAAkFBMVEX////+///+/v/7/f/4+/70+v/09/3w+P/r9v/r8v3k8v7f8f/Z7v/e6PjW3ObR6v/M5f3E5f+94f/J2fa33v/B0vGv2/+o1/+g1P+Z0f+Uzv+Qzf+Ny/+My//BydqyyfSvwuabue95sOeJqeVvoeBtl+RhjuFTh+dIfNs2c+MsbOElZ+AhZOAfY+ASMG8LKmu5Fl7dAAAJNUlEQVR42u1d6YKiSAzuAbxQRlBUEBkaaQ5Bp9//7baPbagjVRxVoO6Sn63CR5F8SaWS9MvLKKOMMsooo4wyyiijjPJw8juKfj8b5uj9Q6InA/2J+f3vc2E2vkC/G8+l0d+gf4+gR9Aj6LuJOvkBPVEfH62mr629c/L98zfos++fnL211h8V+2S1cfwfqUD/K85mNXk0xKuN66NCgf4GvnwYwMrSPvqEgKA/5Ggvfz2CVlgUYg7oD3Et7c6QZxvP99uB9n1vM7sj5OXeZwgX9Ifs9TtBnh98vyto3z/cY7VViw3I935Ae5wvWYOT98oFgbj7zXo5Q934bLne7BlfXg3r+SBlRv0HGXtgngdR7QEXe06vnGNO6gKmiUnjdudDYTZp6p01i/LmFvW46/uohrtWmoemypqEvR/A18yImzqrX+3i6V8rQkvc3slPx532cd1lE7AmLtKzYi9x4rW1bjuXiY3Teq/R3xrXjHn37ZaO6chpNRRtWGLJGtyjmoOs83EpmhbDVa0n6lthqlFj8q+foF9riAhTkV40RD+hMRrf/+rmLsqyaGfyI1AVjRNPPUSrc/Rl7hWmModJlt8QybMkZKq2gjoqTzrzTVBqtWHM6jbKbqBk0Rb+iYJy31Hyfl051NHGNIjzG0fyOJjWkchBkQraqsGshcWtVopQ63Dp7o4Q1Q3g893l1kguO+DHqIYs+1FowAaN9NZYEoNrjRLV+sBTOy0qbi2kiDQe8x168IQudUc9u7WUjCJkzZXuY7RKOU4UlZqQNudZmrxF0VuSZhCjXAyO4zrK2RPYnABhS6nG5bzDvKW6e6OeK99xXuZGivtGjJD8LLiSiCEnomzPBO5rQH4HMUYJ7lypohqXDDgiAnLAdA5KQMCO2GrtKDKtkFyCEH/nIf9CIa7eIfuFCkepisv0Kjsccq0BTXHYO6bpCC91FUR7BO8bBZfGQPNA6bEgNisTTxrtOawN0QJV0nTa7GpT1HdeFqzNnCMr6HDxd6ahixY35lYtRh8V/5nqSiKQPcs6Yg4TcAVlnJi11HshZ1h6qqPKJI6w3TXZP1VL13vSpPAdrtFG13Um1vpqMEJrEdYrwy8Pf/QEiTVb85OSsBRE8yQEexNGQGAiXDdtf9kpYsT4G9yUN+yelLQY5lwRV97Jzo3KyyQMt2iKa4eLh3aVg9h2u/C2CrSwKyhHYf1QT/CGM+1uhLQxprB+nLqexlSeZQ7HHMW0K+hFAccgc2H/YsHakXRlaHipca12RbMJBzC+08pFypkLvQiiOEniKFgwGaS0xUIDY72OSq2cQKrf1S70Ni3t7Jpuax3jDnRnXrf4dA6r9LkEBPvaRYzvUWJ4taflg50b3LR9KO1hf77AylguM7WNvcCLXXLQBfuzJxZUW6B6GVztUMIrnTK4hnz9MEBD6maJNmiH1b2g1767QumZK5TCW8BPb/Nyhi3IwwTfasr3z/imF0qrZ6CemWL0cQS1K+dpBzMTmfKoOgct6dgJNGjHCnM3/Zm7YSfwgG9X3KmA9NFp11L+egJqIvDGE06Kl/62CVpHFQ53iT7gX1fkQUe8U07OFwhT4OdXwbWqj9H/fMnr24/8KWVahaVFK+243QKaHosqPJ1W9yhv+/pzzwby9s6RtwB2CVBqj5+8Q91UwL9nPeY/71yJOHwQ80DHHK6J+Pesr8KuuUDGAZFwD1s4D5nVLNR/E/TvZ1SP7/oBhvx9LQ0xEzfE8q0FvHvW1TK0obxcmPKqiECc8n5kBvpTA/S9//6inXNRyw/RTawilK+BPeKUF5m2c+N6+aFWGz20jz2wRy7ghBZ9oFEbMMGaNheKPaqNzxJ2Yy8tljrhbV2yBpu81icXJshrEA6dUY0ApvwSkA1NsTMMG0yZBtz00ha0RTDlp13Bdya43YI3tgseiZFni7wESQCbtODGlrHx4TnyTyzUWhfg01V6hvlWRTCFoMN5k2prB+eAtkQtRQanPdQc9JWiyRoVTott+frxeQ6OpsVY5+UBnKEWTYsxEpDVEl207glILYdf2F40q85I9cYyUr0hI/w7iqZ6GUn1Sj/yRVfMSJiyhe2oa92YyjjcSsSPL84MXyl+fFEp9VGBExZX8YMiQ/JBEfNILuYn6docycUMhex+JDdj6IdxFTv8vLDOmW2huJTUD+KY+Q1JLbY/ZkbSlGecB2UcMyMH+jgD6YWcA/1iwVBHkQN9ZulEJKd0An9gSaUTzCIV9Ez+dm5BT+qZXVojqUiFXQ7UqYTpw7Q5RUxIOZBgRTKz8AorFrs0ZD7jwjnTkFZ4xSlxw86E8kZeZpdztjMzT1rpN1K1ueflZq5x7Qm8EV952Zu9tIXGWnKW3DRYceaGT4tzwU2TLWWWUPMKZEOyCJ1pkFOynJ3kSVVqgSxaubqp2xAWSQgs9yJMyO9RuZuqesmX0qNjc16cQSc60miLqLe+jdIGpeoryUXfaHm9RyUFF/B55yWNoyhO4dxNSr0NpMdKUnk9WkLtUM5Pi9s2MtCVqWgjg6wWP8QWoU6l4NIGckanItEeK+dFliC8DzXnqGHeFHIe0nEK2pzjSexsRvsnIUNZNGvQgTmxpzYojJHgzb2RNFBmg7+nk8UcpQY4tb1sRshr4bqmjFZKFLMjt7WvURMl4EV4PudLn/tsovzwEl6jERezIC6adU9+vUCsXbWHJtsl1hjMcwEzw9wFn43BwdY0eHSg9d0YTLRg1w3maDIDEh8T0lOTPtbs7vFdV4Nm9/UQze7kWAGbs5+tHyug7ocZK0AOcOAMyqkd4EAM6ul1nsrq1GyYUg3o2WHAURnUgA+PMUyJC1q1iIv0Pv5qfiQn1qjtQKsmMUDmOMCEoBk5mOgIjGVjgtaooW+HQYb/KRtqKpetNwO9tKm5XdZQ8/OWR2AKXv3wKHoIU91ok35VpOOYLmfYuZCmxxiIZtED0SzGQDRv/TKwEFOJOoyes+8xflN3RIb8OXeaTUgN3GoOGh7uNRSPHLqAPtx7vqm+bwv6bkMrMf6znOagHWv28iBC4YZBPxDiH/dhOzzQjzhh+Bv4hyOxDy4O2j3YHw7nMQFj0edTDc1uvt0aQY+gR9D9y1P+w46n/NcojWZAPqBWP+G/+xlllFFGGWWUUUYZZZT/g/wDsDMH36cYur4AAAAASUVORK5CYII=';
  try{
    var r = await fetch('app.html', {cache: 'no-cache'});
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
    var NT = (function(){ try{ var v = localStorage.getItem('slbTheme'); if(v === 'night') return true; if(v === 'auto') return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }catch(e){} return false; })(), BGC = NT ? '#0E1526' : '#ffffff';
    html = html.replace('</head>', function(){ return '<style>html,body{background:#ffffff !important}html[data-theme="night"],html[data-theme="night"] body{background:#0E1526 !important}#slbCover{position:fixed;inset:0;background:' + BGC + ';z-index:99999}</style>' + (NT ? '<script>document.documentElement.setAttribute("data-theme","night")<\/script>' : '') + '<meta name="theme-color" content="' + BGC + '"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="ScalperLab"><link rel="apple-touch-icon" href="' + ICON + '"><link rel="icon" href="' + ICON + '" type="image/png"></head>'; });
    html = html.replace(/<body[^>]*>/i, function(m){ return m + '<div id="slbCover"></div>'; });
    html = html.replace('</body>', function(){ return '<script>(' + loader.toString() + ')();<\/script></body>'; });
    document.open(); document.write(html); document.close();
  }catch(e){ document.body.textContent = 'Errore: ' + e.message; }
})();

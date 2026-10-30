// ═════════ HUB — the guided century tour ═════════
// Hub only; loads after era-extras.js. A stepped, cinematic walk through the
// four storms in time order: for each stop the camera flies to a vantage on
// that year's route, the route draws itself in, and a glass stop card —
// cloned from the scroll path's own #evN .over-card, so the copy has one
// source — slides in. Data: window.__ERA.tour. Map access: window.__eraMap
// (exposed by era-map.js). Public: window.__tour = {start(i), stop()}.
// Deep links: /#tour, /#1939…/#2008, /?tour=1995.
(function(){
  const E = window.__ERA || {}, STOPS = E.tour || [];
  const root = document.getElementById('tour'), card = document.getElementById('tourCard'),
        rail = document.getElementById('crail'), bAuto = document.getElementById('tourAuto'),
        bX = document.getElementById('tourX'), bGo = document.getElementById('tourBegin');
  if(!STOPS.length || !root || !card || !rail) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FLY = 2400, DRAW = 1500, AUTO = 12000, N = STOPS.length;
  const stopsEls = [...rail.querySelectorAll('.cr-stop')];
  const narrow = ()=>innerWidth <= 860;
  let flown = false;
  let on = false, cur = -1, drawRaf = null, flyTimer = null, swapTimer = null, waitTimer = null;

  // ── the route lines (own sources/layers, created on first use)
  const MAXL = Math.max.apply(null, STOPS.map(s=>s.lines.length));
  function api(){ const a = window.__eraMap; return a && a.ready && a.map ? a : null; }
  function ensureLayers(map){
    if(map.getSource('tour0')) return;
    for(let j=0;j<MAXL;j++){
      map.addSource('tour'+j, {type:'geojson', data:fc([])});
      map.addLayer({id:'tour'+j+'-case', type:'line', source:'tour'+j,
        layout:{'line-cap':'round','line-join':'round'},
        paint:{'line-color':'#0b0a08','line-width':8,'line-opacity':.8,'line-blur':.4}});
      map.addLayer({id:'tour'+j, type:'line', source:'tour'+j,
        layout:{'line-cap':'round','line-join':'round'},
        paint:{'line-color':'#a6752a','line-width':j===0?4.2:3,'line-opacity':j===0?1:.9}});
    }
  }
  function fc(coords){ return {type:'Feature', geometry:{type:'LineString',
    coordinates: coords.length>1 ? coords : (coords.length ? [coords[0],coords[0]] : [[0,0],[0,0]])}}; }
  // cumulative lengths (flat approximation — fine over 5 km)
  function prep(ll){ const d=[0]; for(let k=1;k<ll.length;k++){
    const dx=(ll[k][0]-ll[k-1][0])*Math.cos(ll[k][1]*Math.PI/180), dy=ll[k][1]-ll[k-1][1];
    d.push(d[k-1]+Math.hypot(dx,dy)); } return d; }
  function partial(ll, d, t){
    const L=d[d.length-1]*t, out=[ll[0]];
    for(let k=1;k<ll.length;k++){
      if(d[k]<=L){ out.push(ll[k]); continue; }
      const f=(L-d[k-1])/((d[k]-d[k-1])||1);
      out.push([ll[k-1][0]+(ll[k][0]-ll[k-1][0])*f, ll[k-1][1]+(ll[k][1]-ll[k-1][1])*f]); break;
    }
    return out;
  }
  function clearLines(){
    const a=api(); if(!a) return; ensureLayers(a.map);
    for(let j=0;j<MAXL;j++) a.map.getSource('tour'+j).setData(fc([]));
  }
  function drawLines(i){
    const a=api(); if(!a) return; const map=a.map; ensureLayers(map);
    if(drawRaf) cancelAnimationFrame(drawRaf);
    const s=STOPS[i], ds=s.lines.map(l=>prep(l.ll));
    for(let j=0;j<MAXL;j++){
      map.setLayoutProperty('tour'+j,'visibility', j<s.lines.length?'visible':'none');
      map.setLayoutProperty('tour'+j+'-case','visibility', j<s.lines.length?'visible':'none');
      if(j<s.lines.length) map.setPaintProperty('tour'+j,'line-color', s.lines[j].c);
    }
    const t0=performance.now();
    (function tick(t){
      const k = reduce ? 1 : Math.min(1,(t-t0)/DRAW), e = 1-Math.pow(1-k,3);
      // the secondary lines trail the route climbed slightly
      s.lines.forEach((l,j)=>map.getSource('tour'+j).setData(fc(partial(l.ll, ds[j], Math.max(0,Math.min(1,(e*1.15)-j*.08))))));
      if(k<1 && on && cur===i) drawRaf=requestAnimationFrame(tick); else drawRaf=null;
    })(t0);
  }
  function setLinesVisible(v){
    const a=api(); if(!a || !a.map.getSource('tour0')) return;
    for(let j=0;j<MAXL;j++){ try{
      a.map.setLayoutProperty('tour'+j,'visibility',v?'visible':'none');
      a.map.setLayoutProperty('tour'+j+'-case','visibility',v?'visible':'none'); }catch(e){} }
  }

  // ── the camera
  function fly(i){
    const a=api(); if(!a) return false;
    const s=STOPS[i], c=s.cam;
    a.routes(false); a.focus(s.ev); clearLines();
    if(window.setGrade) window.setGrade(s.grade);
    // phones: the bottom sheet covers the lower half, so frame the route in
    // the top band and pull back a little for the narrow screen
    const nw = narrow();
    const cam = {center:c.center, zoom:c.zoom-(nw?.75:0), pitch:c.pitch, bearing:c.bearing,
      offset: nw ? [0, -Math.round(innerHeight*.27)] : [Math.round(innerWidth*.17), 0]};
    a.map.stop();
    if(!flown && !a.map.loaded()){
      // first flight of a page load (a deep link, or a click before the
      // terrain has settled): go straight there, let the DEM tiles arrive,
      // then ease in — an animated move only resolves the centre's terrain
      // elevation from tiles that are already loaded
      flown = true;
      a.map.jumpTo(cam);
      a.map.once('idle', ()=>{ if(on && cur===i){
        a.map.easeTo(Object.assign({duration: reduce?0:1200, essential:true}, cam,
          {zoom:cam.zoom+.02})); } });
    } else {
      flown = true;
      a.map.flyTo(Object.assign({duration: reduce?0:FLY, essential:true, curve:1.3}, cam));
    }
    clearTimeout(flyTimer);
    flyTimer = setTimeout(()=>{
      if(!(on && cur===i)) return;
      // a second, short move re-resolves the centre's terrain elevation —
      // the first lands wrong whenever the DEM tiles arrived mid-flight
      // (always on a deep link). See PLATES in CLAUDE.md.
      a.map.easeTo(Object.assign({duration: reduce?0:900, essential:true}, cam));
      drawLines(i);
      // …and once more when every tile has arrived (slow first loads)
      a.map.once('idle', ()=>{ if(on && cur===i)
        a.map.easeTo(Object.assign({duration: reduce?0:700, essential:true}, cam)); });
    }, reduce?0:FLY+60);
    return true;
  }
  // the map may still be loading on a deep link — retry until it's up
  function flyWhenReady(i){
    clearTimeout(waitTimer);
    if(fly(i)) return;
    waitTimer = setTimeout(()=>{ if(on && cur===i) flyWhenReady(i); }, 400);
  }

  // ── the stop card (cloned from the scroll path)
  function fill(i){
    const s=STOPS[i], src=document.querySelector('#ev'+s.ev+' .over-card');
    card.className = 'tour-card ' + (src ? [...src.classList].filter(c=>/^y\d\d$/.test(c)).join(' ') : '');
    card.innerHTML = src ? src.innerHTML : '';
    const act = card.querySelector('.stop-act') || card.appendChild(Object.assign(document.createElement('div'),{className:'stop-act'}));
    const nx = document.createElement('button'); nx.type='button'; nx.className='stop-next';
    nx.innerHTML = i<N-1 ? 'Next storm <span aria-hidden="true">›</span>' : 'The four stories <span aria-hidden="true">›</span>';
    nx.addEventListener('click', ()=>{ touch(); i<N-1 ? go(i+1) : stop(); });
    act.appendChild(nx);
    const pos = document.createElement('span'); pos.className='stop-pos';
    pos.textContent = 'Storm '+(i+1)+' of '+N;
    card.insertBefore(pos, card.firstChild);
  }
  function go(i){
    i = Math.max(0, Math.min(N-1, i|0));
    if(!on) return start(i);
    if(i===cur) return;
    cur = i; elapsed = 0;
    stopsEls.forEach((b,j)=>{ b.classList.toggle('on', j===i); b.classList.toggle('past', j<i);
      b.setAttribute('aria-current', j===i?'step':'false'); });
    try{ history.replaceState(null, '', location.pathname + '#' + STOPS[i].year); }catch(e){}
    card.classList.add('out');
    clearTimeout(swapTimer);
    swapTimer = setTimeout(()=>{ if(cur!==i) return; fill(i); card.classList.remove('out');
      card.scrollTop = 0; }, reduce?0:(card.innerHTML?900:500));
    flyWhenReady(i);
  }

  // ── enter / leave
  function start(i){
    i = Math.max(0, Math.min(N-1, (i|0)));
    if(!on){
      on = true; window.__tourOn = true; cur = -1;
      // the tour and explore mode both own the camera — leave explore first
      if(window.__exploreOn){ const x=document.getElementById('exploreExit'); if(x) x.click(); }
      document.body.classList.add('tour');
      document.documentElement.style.overflow = 'hidden';
      root.setAttribute('aria-hidden','false');
      card.innerHTML = '';
    }
    go(i);
  }
  function stop(){
    if(!on) return;
    on = false; cur = -1; setAuto(false);
    clearTimeout(flyTimer); clearTimeout(swapTimer); clearTimeout(waitTimer);
    if(drawRaf) cancelAnimationFrame(drawRaf); drawRaf = null;
    document.body.classList.remove('tour');
    document.documentElement.style.overflow = '';
    root.setAttribute('aria-hidden','true');
    stopsEls.forEach(b=>{ b.classList.remove('on','past'); b.removeAttribute('aria-current'); });
    try{ history.replaceState(null, '', location.pathname); }catch(e){}
    // back to the normal page, at the four covers
    const cv = document.getElementById('covers');
    if(cv) window.scrollTo(0, cv.getBoundingClientRect().top + scrollY);
    const a = api();
    setLinesVisible(false);
    if(a){ a.map.stop(); a.routes(true); a.focus(-1);
      a.release(reduce?0:1600, ()=>{ window.__tourOn = false; }); }
    else window.__tourOn = false;
  }
  window.__tour = {start, stop};

  // ── auto-advance (≈12 s a stop; pauses on hover and while hidden)
  let auto = false, elapsed = 0, hover = false, last = 0, autoRaf = null;
  function setAuto(v){
    auto = v; elapsed = 0;
    if(bAuto){ bAuto.classList.toggle('on', v); bAuto.setAttribute('aria-pressed', v?'true':'false'); }
    rail.style.setProperty('--auto', '0');
    if(v && !autoRaf){ last = performance.now(); autoRaf = requestAnimationFrame(autoTick); }
  }
  function autoTick(t){
    autoRaf = null;
    if(!auto || !on) return;
    const dt = Math.min(100, t-last); last = t;
    if(!hover && !document.hidden) elapsed += dt;
    rail.style.setProperty('--auto', Math.min(1, elapsed/AUTO).toFixed(3));
    if(elapsed >= AUTO){
      if(cur < N-1) go(cur+1); else { setAuto(false); return; }
    }
    autoRaf = requestAnimationFrame(autoTick);
  }
  function touch(){ elapsed = 0; }
  if(bAuto) bAuto.addEventListener('click', ()=>{ setAuto(!auto); });
  [card, rail].forEach(el=>{
    el.addEventListener('mouseenter', ()=>{ hover = true; });
    el.addEventListener('mouseleave', ()=>{ hover = false; });
  });

  // ── controls: rail, keys, swipe, scroll-to-leave
  stopsEls.forEach(b=>b.addEventListener('click', ()=>{ touch(); start(+b.dataset.i); }));
  if(bX) bX.addEventListener('click', stop);
  if(bGo) bGo.addEventListener('click', ()=>start(0));
  addEventListener('keydown', e=>{
    if(!on || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key;
    if(k==='ArrowRight'){ e.preventDefault(); touch(); go(cur+1); }
    else if(k==='ArrowLeft'){ e.preventDefault(); touch(); go(cur-1); }
    else if(k==='Escape'){ e.preventDefault(); stop(); }
    else if(k==='ArrowDown'||k==='ArrowUp'||k==='PageDown'||k==='PageUp'||(k===' ' && e.target===document.body)){ e.preventDefault(); stop(); }
  });
  // a deliberate scroll leaves the tour; small trackpad jitter (and scrolling
  // inside the bottom-sheet card on phones) does not
  let wheelAcc = 0, wheelT = 0;
  addEventListener('wheel', e=>{
    if(!on) return;
    if(card.contains(e.target) && card.scrollHeight > card.clientHeight + 2) return;
    const t = performance.now(); if(t - wheelT > 300) wheelAcc = 0; wheelT = t;
    wheelAcc += Math.abs(e.deltaY);
    if(wheelAcc > 140){ wheelAcc = 0; stop(); }
  }, {passive:true});
  let tx = 0, ty = 0, tIn = false;
  addEventListener('touchstart', e=>{ if(!on) return; const p=e.touches[0];
    tx=p.clientX; ty=p.clientY; tIn = card.contains(e.target); }, {passive:true});
  addEventListener('touchend', e=>{
    if(!on) return; const p=e.changedTouches[0], dx=p.clientX-tx, dy=p.clientY-ty;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)*1.3){ touch(); go(cur + (dx<0?1:-1)); }
    else if(!tIn && Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)*1.3) stop();
  }, {passive:true});

  // ── deep links
  function fromURL(){
    const h = (location.hash||'').slice(1).toLowerCase();
    if(h==='tour') return 0;
    let j = STOPS.findIndex(s=>s.year===h);
    if(j>=0) return j;
    const q = new URLSearchParams(location.search).get('tour');
    if(q===null) return -1;
    j = STOPS.findIndex(s=>s.year===q);
    return j>=0 ? j : 0;
  }
  const first = fromURL();
  if(first>=0) start(first);
  addEventListener('hashchange', ()=>{ const j=fromURL(); if(j>=0 && (!on || j!==cur)) start(j); });
})();

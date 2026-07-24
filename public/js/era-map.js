// ═════════ ERA ENGINE — shared terrain/timeline/explore for the era pages ═════════
// A generalized sibling of engine.js (1939). All story data comes from
// window.__ERA, set by an inline <script> in each era page's story HTML
// before this file loads. Same globals contract as the 1939 engine:
// __scrubSet, __grade, __alt, __flame, __exploreOn, setGrade.
(function(){
  const E = window.__ERA || {};
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const POINTS = E.points || {};
  const ROUTES = E.routes || [];          // [{keys:[...]}, ...] — routes[0] carries the progress line
  const MAIN   = (ROUTES[0] && ROUTES[0].keys) || [];
  const PEOPLE = E.people || {};
  const EVENTS = E.events || [];          // [{date,t,phase,tragic,pos:{},lost:[],reach}]
  const FEATURES = E.features || [];
  const MOMENTS  = E.moments || [];
  const KEYS   = E.keys || [];
  const LOCNOTES = E.locnotes || {};
  const PSTATES  = E.pointStates || {};   // {pointKey:[{from,text},…]} newest matching wins
  const LAST = EVENTS.length - 1;

  const SVG_TENT = '<svg viewBox="0 0 24 16" width="22" height="15"><path d="M12 1 L23 15 H15 L12 9 L9 15 H1 Z" fill="currentColor"/></svg>';
  const SVG_CLIMBER = '<svg viewBox="0 0 20 26" width="15" height="20"><g fill="currentColor"><circle cx="9.5" cy="4" r="3"/><path d="M9.5 7.5 L6 12 L5.5 19 L7.5 25 H9 L9.5 18 L11.5 25 H13 L12.5 16 L13.5 11 L16.5 14.5 L18 13 L13 7.5 Z"/><path d="M4.5 25 L5.5 8 L4 7.8 L3 25 Z"/></g></svg>';

  const $ = id=>document.getElementById(id);
  const bgLoad=$('bgLoad'), fallback=$('bgFallback');
  const hud=$('m3dHud'), hudPhase=$('hudPhase'), hudDate=$('hudDate'), hudTitle=$('hudTitle'), hudAlt=$('hudAlt');
  const legend=$('m3dLegend'), note=$('m3dNote');

  const fmtM = m=>m.toLocaleString('en-US')+' m';

  if(legend) Object.values(PEOPLE).forEach(p=>{
    const s=document.createElement('span');
    s.innerHTML='<i class="lg-sil" style="color:'+p.c+'">'+SVG_CLIMBER+'</i>'+p.name;
    legend.appendChild(s);
  });

  let zoneActive=false, map=null, ready=false, markers={}, camps={}, feats=[], moms=[], keyPts=[], camDirty=true, curEv=-99;

  function fail(){ if(fallback) fallback.classList.add('on'); if(bgLoad) bgLoad.classList.add('off'); }

  function loadLib(cb){
    if(window.maplibregl) return cb();
    const css=document.createElement('link'); css.rel='stylesheet';
    css.href='https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css';
    css.onerror=()=>{css.href='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';};
    document.head.appendChild(css);
    const s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js';
    s.onload=cb;
    s.onerror=()=>{ const s2=document.createElement('script');
      s2.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
      s2.onload=cb; s2.onerror=fail; document.head.appendChild(s2); };
    document.head.appendChild(s);
  }

  function line(keys){ return {type:'Feature',geometry:{type:'LineString',
    coordinates:(keys.length>1?keys:[keys[0]||MAIN[0],keys[0]||MAIN[0]]).map(k=>POINTS[k].ll)}}; }

  function initMap(){
    try{
      const st=E.camStart||{};
      map = new maplibregl.Map({
        container:'bgMap',
        style:{
          version:8,
          sources:{
            sat:{type:'raster',
              tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
              tileSize:256, maxzoom:17,
              attribution:'Imagery © Esri, Maxar, Earthstar Geographics'},
            demhs:{type:'raster-dem',
              tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
              tileSize:256, encoding:'terrarium', maxzoom:14},
            dem:{type:'raster-dem',
              tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
              tileSize:256, encoding:'terrarium', maxzoom:14,
              attribution:'Terrain: Mapzen/AWS Open Data'}
          },
          layers:[
            {id:'bg',type:'background',paint:{'background-color':E.bgColor||'#14110c'}},
            {id:'sat',type:'raster',source:'sat',
             paint:{'raster-saturation':E.sat!==undefined?E.sat:-0.45,'raster-contrast':0.08,'raster-brightness-max':0.92}},
            {id:'hs',type:'hillshade',source:'demhs',
             paint:{'hillshade-exaggeration':0.35,'hillshade-shadow-color':'#221c14','hillshade-highlight-color':'#f6ecd6','hillshade-accent-color':'#3a342a'}}
          ],
          sky:{'sky-color':'#0d1320','horizon-color':'#c9b895','fog-color':'#3a3629',
               'sky-horizon-blend':0.6,'horizon-fog-blend':0.55,'fog-ground-blend':0.62}
        },
        center:POINTS[MAIN[0]].ll, zoom:st.zoom||10.3, pitch:st.pitch||34, bearing:st.bearing||336,
        maxPitch:80, minZoom:8, maxZoom:15.5,
        interactive:false, attributionControl:{compact:true},
        canvasContextAttributes:{antialias:false, powerPreference:'high-performance'}
      });
      map.on('error', ()=>{ if(!ready) fail(); });
      map.on('load', ()=>{
        map.setTerrain({source:'dem', exaggeration:1.55});

        ROUTES.forEach((r,ri)=>{
          const id='route'+ri;
          map.addSource(id,{type:'geojson',data:line(r.keys)});
          map.addLayer({id:id+'-case',type:'line',source:id,
            paint:{'line-color':'#14110c','line-width':4,'line-opacity':.5}});
          map.addLayer({id,type:'line',source:id,
            paint:{'line-color':r.c||'#f1ecdf','line-width':1.4,'line-dasharray':[2.2,2],'line-opacity':.55}});
        });
        map.addSource('prog',{type:'geojson',data:line([MAIN[0]])});
        map.addLayer({id:'prog',type:'line',source:'prog',
          paint:{'line-color':E.progColor||'#c9a86a','line-width':2.6,'line-opacity':.95}});

        // plain wrapper: MapLibre stomps inline opacity on the marker root
        const mkWrap = el=>{const w=document.createElement('div');w.appendChild(el);return w;};

        Object.keys(POINTS).forEach(k=>{
          const c=POINTS[k];
          const el=document.createElement('div'); el.className='mk-camp2';
          const glyph = c.kind==='peak'?'△' : c.kind==='x'?'✕' : c.kind==='site'?'◇' : '';
          el.innerHTML=(glyph?'<div class="pk">'+glyph+'</div>'
                             :'<div class="tent">'+SVG_TENT+'</div>')
            +'<div class="l">'+c.name+' · '+fmtM(c.m)+'</div>';
          if(glyph) el.classList.add('pknode');
          if(c.major) el.classList.add('major');
          el.addEventListener('click',e=>{ if(window.__exploreOn){ e.stopPropagation(); lcOpen(k); } });
          camps[k]=el;
          new maplibregl.Marker({element:mkWrap(el),anchor:'top'}).setLngLat(c.ll).addTo(map);
        });

        Object.entries(PEOPLE).forEach(([k,p])=>{
          const el=document.createElement('div'); el.className='mk-sil hide';
          el.style.color=p.c; el.innerHTML=SVG_CLIMBER;
          markers[k]={mk:new maplibregl.Marker({element:mkWrap(el),anchor:'bottom'}).setLngLat(POINTS[MAIN[0]].ll).addTo(map),
                      el, cur:POINTS[MAIN[0]].ll.slice(), anim:null};
        });

        FEATURES.forEach(f=>{
          const el=document.createElement('div'); el.className='mk-feat off';
          el.innerHTML='<div class="ln"></div><div class="fl">'+f.label+'</div>';
          feats.push({el, from:f.from!==undefined?f.from:0});
          new maplibregl.Marker({element:mkWrap(el),anchor:'bottom'}).setLngLat(f.ll).addTo(map);
        });
        MOMENTS.forEach(m=>{
          const el=document.createElement('div'); el.className='mk-mom off';
          el.innerHTML='<div class="g">'+m.glyph+'</div><div class="ml">'+m.label+'</div>';
          moms.push({el, at:m.at});
          new maplibregl.Marker({element:mkWrap(el),anchor:'bottom'}).setLngLat(m.ll).addTo(map);
        });

        map.on('move',()=>{ const far=map.getZoom()<12.45;
          document.body.classList.toggle('lbl-far',far); });
        ready=true; camDirty=true;
        applyEvent(curEv, true);
        setTimeout(()=>bgLoad && bgLoad.classList.add('off'), 400);
      });
    }catch(e){ fail(); }
  }

  // ── camera keyframes
  function measure(){
    keyPts = KEYS.map(([id,pt,zoom,pitch,bearing,off,grade])=>{
      const el=document.getElementById(id); if(!el||!POINTS[pt]) return null;
      return {y:el.getBoundingClientRect().top+scrollY, ll:POINTS[pt].ll, zoom, pitch, bearing, off, grade};
    }).filter(Boolean).sort((a,b)=>a.y-b.y);
  }
  const lerp=(a,b,t)=>a+(b-a)*t;
  function lerpAng(a,b,t){let d=((b-a+540)%360)-180;return (a+d*t+360)%360;}
  const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;
  function camTick(){
    if(!ready||!keyPts.length) return;
    const yr=scrollY+innerHeight*.5;
    let a=keyPts[0], b=keyPts[0];
    for(let i=0;i<keyPts.length;i++){ if(keyPts[i].y<=yr){a=keyPts[i];b=keyPts[i+1]||keyPts[i];} }
    const t=a===b?0:ease(Math.min(1,Math.max(0,(yr-a.y)/(b.y-a.y))));
    map.jumpTo({center:[lerp(a.ll[0],b.ll[0],t),lerp(a.ll[1],b.ll[1],t)],
      zoom:lerp(a.zoom,b.zoom,t), pitch:lerp(a.pitch,b.pitch,t),
      bearing:lerpAng(a.bearing,b.bearing,t), offset:[0,innerHeight*lerp(a.off,b.off,t)]});
    setGrade(t>.55?b.grade:a.grade);
  }

  function lerpMarker(m,to){
    if(m.anim) cancelAnimationFrame(m.anim);
    if(reduce){m.cur=to.slice();m.mk.setLngLat(to);return;}
    const from=m.cur.slice(), t0=performance.now(), D=1400;
    function tick(t){
      const k=Math.min(1,(t-t0)/D), e=ease(k);
      m.cur=[from[0]+(to[0]-from[0])*e, from[1]+(to[1]-from[1])*e];
      m.mk.setLngLat(m.cur);
      if(k<1)m.anim=requestAnimationFrame(tick);else m.anim=null;
    }
    m.anim=requestAnimationFrame(tick);
  }

  function applyEvent(i, force){
    if(i===curEv && !force) return; curEv=i;
    if(i<0){
      if(hudPhase) hudPhase.textContent='';
      if(hudDate) hudDate.textContent=(E.hud&&E.hud.date)||'';
      if(hudTitle) hudTitle.textContent=(E.hud&&E.hud.title)||'';
      if(hudAlt) hudAlt.textContent='';
      hud && hud.classList.remove('tragic');
      if(!ready) return;
      Object.values(markers).forEach(m=>m.el.classList.add('hide'));
      moms.forEach(f=>f.el.classList.add('off'));
      return;
    }
    const ev=EVENTS[i];
    if(hudPhase) hudPhase.textContent=ev.phase||'';
    if(hudDate) hudDate.textContent=ev.date;
    if(hudTitle) hudTitle.textContent=ev.t;
    if(window.__scrubSet) window.__scrubSet(i, zoneActive);
    hud && hud.classList.toggle('tragic',!!ev.tragic);
    let hi=0,hiName='';
    const lost=ev.lost||[];
    Object.keys(PEOPLE).forEach(k=>{
      const ck=ev.pos[k];
      if(ready){
        const m=markers[k];
        if(!ck){m.el.classList.add('hide');}
        else{
          m.el.classList.remove('hide');
          m.el.classList.toggle('lost', lost.includes(k));
          m.el.classList.toggle('pulse', (ev.pulse||[]).includes(k));
          lerpMarker(m,POINTS[ck].ll);
        }
      }
      if(ck&&!lost.includes(k)&&POINTS[ck].m>hi){hi=POINTS[ck].m;hiName=PEOPLE[k].name;}
    });
    if(hudAlt) hudAlt.textContent = ev.hialt||(hi?('Highest: '+hiName+' · '+fmtM(hi)):'');
    if(!ready) return;

    Object.keys(POINTS).forEach(k=>{
      const el=camps[k]; if(!el) return;
      const sts=(PSTATES[k]||[]);
      let cleared=false, dim=false, future=false;
      sts.forEach(s=>{ if(i>=s.from){ cleared=s.mode==='cleared'; dim=s.mode==='dim'; future=s.mode==='future'; } });
      el.classList.toggle('cleared',cleared);
      el.classList.toggle('dim',dim);
      el.classList.toggle('future',future);
    });
    if(map.getSource('prog') && ev.reach!==undefined)
      map.getSource('prog').setData(line(MAIN.slice(0,ev.reach+1)));
    feats.forEach(f=>f.el.classList.toggle('off', i<f.from));
    moms.forEach(f=>f.el.classList.toggle('off', !zoneActive || !f.at.includes(i)));
  }

  loadLib(initMap);
  addEventListener('load', measure); measure();
  addEventListener('resize', ()=>{measure();camDirty=true;});
  let raf=null,lastY=-1;
  function loop(){ if(!window.__exploreOn && (scrollY!==lastY||camDirty)){lastY=scrollY;camDirty=false;camTick();} raf=requestAnimationFrame(loop); }
  if(reduce){ addEventListener('scroll',camTick,{passive:true}); setTimeout(camTick,1500); }
  else loop();
  setTimeout(measure,1200); setTimeout(measure,3500);

  const stepIO=new IntersectionObserver(es=>{es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('on');
      if(e.target.dataset.ev!==undefined) applyEvent(+e.target.dataset.ev);}
  })},{threshold:.5});
  document.querySelectorAll('.over-step').forEach(s=>stepIO.observe(s));

  const zone=document.getElementById('timeline-zone');
  if(zone) new IntersectionObserver(es=>{es.forEach(e=>{
    zoneActive=e.isIntersecting;
    if(window.__scrubSet) window.__scrubSet(curEv>=0?curEv:-1, e.isIntersecting&&curEv>=0);
    if(ready) moms.forEach(f=>f.el.classList.toggle('off', !zoneActive || curEv<0 || !f.at.includes(curEv)));
    hud && hud.classList.toggle('show',e.isIntersecting);
    legend && legend.classList.toggle('show',e.isIntersecting);
    note && note.classList.toggle('show',e.isIntersecting);
    if(!e.isIntersecting) applyEvent(-1);
  })},{rootMargin:'-15% 0px -15% 0px'}).observe(zone);

  // ── color grade + snow (same classes as the 1939 page)
  const gradeEl=document.getElementById('grade'); let curGrade='__';
  function setGrade(g){ if(g===curGrade) return; curGrade=g; window.__grade=g;
    if(gradeEl) gradeEl.className=g||''; snowSet(g); }
  window.setGrade=setGrade;

  const sc=document.getElementById('snow'), sx=sc?sc.getContext('2d'):null;
  let flakes=[], mode='';
  function sz(){ if(sc){sc.width=innerWidth; sc.height=innerHeight;} }
  sz(); addEventListener('resize',sz);
  function snowSet(g){
    if(!sc) return;
    const m = g==='g-storm'?'storm' : g==='g-night'?'calm' : g==='g-mourn'?'sparse' : '';
    if(m===mode) return; mode=m;
    sc.classList.toggle('on', !!m && !reduce);
    const n = m==='storm'?260 : m==='calm'?90 : m==='sparse'?45 : 0;
    flakes = Array.from({length:n},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,
      r:.6+Math.random()*1.8, s:.4+Math.random()*1.4, w:Math.random()*Math.PI*2}));
  }
  (function snowLoop(){
    if(!sc) return;
    if(flakes.length && !reduce){
      sx.clearRect(0,0,sc.width,sc.height); sx.fillStyle='rgba(241,236,223,.75)';
      const gale = mode==='storm'?3.4 : .35;
      flakes.forEach(f=>{ f.y+=f.s*(mode==='storm'?3.2:1); f.x+=Math.sin(f.w+=.01)*.4+gale*f.s*.5;
        if(f.y>sc.height){f.y=-4;f.x=Math.random()*innerWidth;}
        if(f.x>sc.width){f.x=-4;}
        sx.beginPath(); sx.arc(f.x,f.y,f.r,0,7); sx.fill(); });
    } else if(sc.width) sx.clearRect(0,0,sc.width,sc.height);
    requestAnimationFrame(snowLoop);
  })();

  // ── FLAME at the memorial point
  let flameEl=null;
  function ensureFlame(){
    if(flameEl||!ready||!E.flame) return;
    flameEl=document.createElement('div'); flameEl.className='mk-flame off';
    flameEl.innerHTML='<div class="fm"></div><div class="fl">'+E.flame.label+'</div>';
    const w=document.createElement('div'); w.appendChild(flameEl);
    new maplibregl.Marker({element:w,anchor:'bottom'}).setLngLat(E.flame.ll).addTo(map);
  }
  window.__flame=function(on){ ensureFlame(); if(flameEl) flameEl.classList.toggle('off',!on); };

  // ── EXPLORE MODE
  const bE=document.getElementById('btnExplore'), bX=document.getElementById('exploreExit'),
        bC=document.getElementById('exploreCta');
  let exploreReturnEv=null;
  function exploreNeutral(){
    Object.keys(POINTS).forEach(k=>{const el=camps[k];if(!el)return;
      el.classList.remove('future','cleared','dim');});
    feats.forEach(f=>f.el.classList.remove('off'));
    moms.forEach(f=>f.el.classList.add('off'));
    Object.values(markers).forEach(m=>m.el.classList.add('hide'));
  }
  function exploreSet(on){
    if(!ready) return;
    window.__exploreOn=on;
    document.body.classList.toggle('explore',on);
    document.documentElement.style.overflow=on?'hidden':'';
    ['dragPan','dragRotate','scrollZoom','touchZoomRotate','keyboard','doubleClickZoom'].forEach(hnd=>{
      try{ on?map[hnd].enable():map[hnd].disable(); }catch(e){}
    });
    if(on){
      exploreReturnEv = curEv===-99?-1:curEv;
      exploreNeutral();
      const x=E.explore||{};
      map.easeTo({center:POINTS[x.center||MAIN[0]].ll, zoom:x.zoom||12.4, pitch:x.pitch||62, bearing:x.bearing||150, duration:2200, offset:[0,0]});
    } else {
      lcClose();
      camDirty=true;
      applyEvent(exploreReturnEv===null?(curEv===-99?-1:curEv):exploreReturnEv, true);
      exploreReturnEv=null;
    }
    if(bE) bE.classList.toggle('on',on);
  }
  if(bE) bE.addEventListener('click',()=>exploreSet(!window.__exploreOn));
  if(bX) bX.addEventListener('click',()=>exploreSet(false));
  if(bC) bC.addEventListener('click',()=>exploreSet(true));

  // ── EXPLORE LOCATION CARDS (blurbs restate facts already in the story/data)
  const lcRoot=$('locCard');
  const lcEls = lcRoot ? {kick:$('lcKick'),name:$('lcName'),blurb:$('lcBlurb'),range:$('lcRange'),
    prev:$('lcPrev'),next:$('lcNext'),date:$('lcDate'),phase:$('lcPhase'),title:$('lcTitle'),
    state:$('lcState'),who:$('lcWho'),close:$('lcClose')} : null;
  let lcKey=null, lcEv=0;
  if(lcEls) lcEls.range.max=String(LAST);
  function lcStateText(k,i){
    const sts=PSTATES[k]||[];
    let txt=POINTS[k].state||'—';
    sts.forEach(s=>{ if(i>=s.from && s.text) txt=s.text; });
    return txt;
  }
  function lcRender(){
    if(!lcKey||!lcEls) return;
    const k=lcKey, i=lcEv, ev=EVENTS[i];
    lcEls.range.value=i;
    lcEls.date.textContent=ev.date+' · '+(E.year||'');
    lcEls.phase.textContent=ev.phase||'';
    lcEls.title.textContent=ev.t;
    lcEls.title.classList.toggle('tragic',!!ev.tragic);
    lcEls.state.textContent=lcStateText(k,i);
    const lost=ev.lost||[];
    const here=Object.keys(PEOPLE).filter(p=>ev.pos[p]===k);
    lcEls.who.innerHTML = here.length
      ? here.map(p=>'<span class="lc-chip'+(lost.includes(p)?' lost':'')+'"><i style="background:'+PEOPLE[p].c+'"></i>'
          +PEOPLE[p].name+(lost.includes(p)?' †':'')+'</span>').join('')
      : '<span class="lc-none">No one here on this date</span>';
    applyEvent(i,true);
  }
  function lcOpen(k){
    if(!lcEls) return;
    lcKey=k; const c=POINTS[k];
    lcEls.kick.textContent=fmtM(c.m)+' · '+Math.round(c.m/0.3048).toLocaleString('en-US')+' ft';
    lcEls.name.textContent=c.name;
    lcEls.blurb.textContent=LOCNOTES[k]||'';
    lcEv=Math.min(LAST, c.ev!==undefined?c.ev:0);
    lcRender();
    lcRoot.classList.add('show'); lcRoot.setAttribute('aria-hidden','false');
    document.body.classList.add('loc-open');
    map.easeTo({center:c.ll, zoom:13.2, pitch:68, bearing:map.getBearing(),
      duration:1400, offset:[innerWidth>860?-innerWidth*.13:0, innerWidth>860?0:-innerHeight*.14]});
  }
  function lcClose(){
    if(!lcRoot) return;
    lcRoot.classList.remove('show'); lcRoot.setAttribute('aria-hidden','true');
    document.body.classList.remove('loc-open');
    if(lcKey && window.__exploreOn) exploreNeutral();
    lcKey=null;
  }
  if(lcEls){
    lcEls.range.addEventListener('input',()=>{lcEv=+lcEls.range.value;lcRender();});
    lcEls.prev.addEventListener('click',()=>{if(lcEv>0){lcEv--;lcRender();}});
    lcEls.next.addEventListener('click',()=>{if(lcEv<LAST){lcEv++;lcRender();}});
    lcEls.close.addEventListener('click',lcClose);
  }

  // ── LITE MODE
  const bL=document.getElementById('btnLite'); let lite=false;
  if(bL) bL.addEventListener('click',()=>{
    if(!ready) return;
    lite=!lite; bL.classList.toggle('on',lite);
    try{ map.setLayoutProperty('hs','visibility', lite?'none':'visible'); }catch(e){}
    try{ map.setTerrain({source:'dem', exaggeration: lite?1.2:1.55}); }catch(e){}
    try{ if(map.setPixelRatio) map.setPixelRatio(lite?1:(window.devicePixelRatio||1)); }catch(e){}
    const sn=document.getElementById('snow'); if(sn) sn.style.display=lite?'none':'';
  });
})();

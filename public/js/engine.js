// ═════════ THE MOUNTAIN AS THE PAGE — terrain, silhouettes, phases, moments ═════════
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Camps: altitudes documented (1939 record); lng/lat approximate along the Abruzzi route
  const CAMPS = {
    base:  {ll:[76.5175,35.8420], ft:16500, name:'Base Camp'},
    c1:    {ll:[76.5232,35.8552], ft:18600, name:'Camp I'},
    c2:    {ll:[76.5226,35.8604], ft:19300, name:'Camp II'},
    c3:    {ll:[76.5216,35.8646], ft:20700, name:'Camp III'},
    c4:    {ll:[76.5206,35.8680], ft:21500, name:'Camp IV'},
    c5:    {ll:[76.5199,35.8697], ft:22000, name:'Camp V'},
    c6:    {ll:[76.5191,35.8722], ft:23400, name:'Camp VI'},
    c7:    {ll:[76.5181,35.8746], ft:24700, name:'Camp VII'},
    c8:    {ll:[76.5166,35.8766], ft:25300, name:'Camp VIII'},
    c9:    {ll:[76.5151,35.8786], ft:26050, name:'Camp IX'},
    highpt:{ll:[76.5141,35.8801], ft:27450, name:'High Point'},
    summit:{ll:[76.5133,35.8814], ft:28251, name:'Summit'}
  };
  const ROUTE = ['base','c1','c2','c3','c4','c5','c6','c7','c8','c9','highpt','summit'];

  // First event at which each camp exists; camps cleared/stripped from the July 20–21 event (idx 9)
  const EST = {base:0,c1:1,c2:1,c3:2,c4:2,c5:3,c6:4,c7:4,c8:6,c9:7};
  const CLEARED = {c1:9,c2:9,c3:9,c4:9,c6:9,c7:9};   // per Cromwell's order (IV & below) and the Sherpas (VI–VII)
  const DIMMED  = {c8:10,c9:10,c5:10};               // abandoned, never restocked

  const PEOPLE = {
    wiessner:{name:'Wiessner', c:'#5e4a1f'},
    wolfe:   {name:'Wolfe',    c:'#82352a'},
    pasang:  {name:'P. Lama',  c:'#3e6252'},
    durrance:{name:'Durrance', c:'#3f5c77'},
    cromwell:{name:'Cromwell', c:'#655c4d'},
    rescue:  {name:'Rescue Sherpas', c:'#2f4f63'}
  };

  // 17 events (jun1 … aug 3–7). lost:true renders hollow "ghost" silhouettes.
  const POS = [
    {wiessner:'base',wolfe:'base',pasang:'base',durrance:'base',cromwell:'base',rescue:null},
    {wiessner:'c2',wolfe:'c2',pasang:'c2',durrance:'c2',cromwell:'c3',rescue:null},
    {wiessner:'c4',wolfe:'c4',pasang:'c4',durrance:'c2',cromwell:'c2',rescue:null},
    {wiessner:'c5',wolfe:'c5',pasang:'c5',durrance:'c2',cromwell:'c2',rescue:null},
    {wiessner:'c7',wolfe:'c5',pasang:'c7',durrance:'c4',cromwell:'c2',rescue:null},
    {wiessner:'c7',wolfe:'c7',pasang:'c7',durrance:'c6',cromwell:'c2',rescue:null},
    {wiessner:'c8',wolfe:'c8',pasang:'c8',durrance:'c2',cromwell:'c2',rescue:null},
    {wiessner:'c9',wolfe:'c8',pasang:'c9',durrance:'c2',cromwell:'base',rescue:null},
    {wiessner:'highpt',wolfe:'c8',pasang:'highpt',durrance:'c2',cromwell:'base',rescue:null},
    {wiessner:'c9',wolfe:'c8',pasang:'c9',durrance:'base',cromwell:'base',rescue:null},
    {wiessner:'c7',wolfe:'c7',pasang:'c7',durrance:'base',cromwell:'base',rescue:null},
    {wiessner:'base',wolfe:'c7',pasang:'base',durrance:'base',cromwell:'base',rescue:null},
    {wiessner:'base',wolfe:'c7',pasang:'base',durrance:'base',cromwell:null,rescue:'c6'},
    {wiessner:'base',wolfe:'c7',pasang:'base',durrance:'base',cromwell:null,rescue:'c7'},
    {wiessner:'base',wolfe:'c7',pasang:'base',durrance:'base',cromwell:null,rescue:'c7'},
    {wiessner:'base',wolfe:'c7',pasang:'base',durrance:'base',cromwell:null,rescue:'base',lost:['wolfe']},
    {wiessner:'c1',wolfe:'c7',pasang:'base',durrance:'base',cromwell:null,rescue:'c7',lost:['wolfe','rescue']}
  ];
  const DATES  = ['June 1','June 14','June 21–29','June 30 – July 1','July 6','July 13','July 14','July 17','July 19','July 20–21','July 22','July 24–25','July 28','July 29','July 31','August 2','August 3–7'];
  const TITLES = ['Base Camp established','Wiessner takes the lead','The eight-day storm','The House Chimney','Camp VII — top of the ridge','Durrance collapses','Camp VIII — the Shoulder','Wolfe turns back','800 feet from the summit','The camps are stripped','Wolfe found alone','Back to Base Camp','Kikuli\u2019s impossible climb','The Sherpas reach Wolfe','The last ascent','Something awful','The last search'];
  const TRAGIC = [false,false,false,false,false,false,false,false,false,true,true,true,false,true,true,true,true];
  const PHASES = ['The Approach','The Build','The Build','The Build','The Push','The Push','The Push','The Summit Bid','The Summit Bid','The Unraveling','The Unraveling','The Unraveling','The Rescue','The Rescue','The Rescue','The Silence','The Silence'];
  // highest camp reached so far (index into ROUTE), for the progress line
  const REACH = [0,2,4,5,7,7,8,9,10,10,10,10,10,10,10,10,10];

  // Named features of the Abruzzi route — appear once the story arrives at them
  const FEATURES = [
    {ll:[76.5202,35.8689], label:'House Chimney', from:3},
    {ll:[76.5193,35.8712], label:'The Black Pyramid', from:4},
    {ll:[76.5169,35.8760], label:'The Shoulder', from:6},
    {ll:[76.5145,35.8794], label:'The Bergschrund', from:7},
    {ll:[76.5137,35.8806], label:'The Bottleneck', from:8}
  ];
  // Moment pins — a glyph + line shown only during specific events
  const MOMENTS = [
    {ll:[76.5170,35.8426], glyph:'✚', label:'Cranmer collapses — saved by Durrance', at:[0]},
    {ll:[76.5209,35.8676], glyph:'❄', label:'−2 °F · 80 mph gusts at Camp II', at:[2]},
    {ll:[76.5202,35.8690], glyph:'⤒', label:'Wolfe hauled up on a tight rope', at:[3]},
    {ll:[76.5168,35.8759], glyph:'〣', label:'Tendrup shouts three times — no reply', at:[8,9]},
    {ll:[76.5173,35.8756], glyph:'⚠', label:'The fall on the rope — sleeping bag lost', at:[10]},
    {ll:[76.5200,35.8500], glyph:'✦', label:'Wolfe\u2019s remains found here · 2002', at:[16]}
  ];

  // Silhouette SVGs
  const SVG_TENT = '<svg viewBox="0 0 24 16" width="22" height="15"><path d="M12 1 L23 15 H15 L12 9 L9 15 H1 Z" fill="currentColor"/></svg>';
  const SVG_CLIMBER = '<svg viewBox="0 0 20 26" width="15" height="20"><g fill="currentColor"><circle cx="9.5" cy="4" r="3"/><path d="M9.5 7.5 L6 12 L5.5 19 L7.5 25 H9 L9.5 18 L11.5 25 H13 L12.5 16 L13.5 11 L16.5 14.5 L18 13 L13 7.5 Z"/><path d="M4.5 25 L5.5 8 L4 7.8 L3 25 Z"/></g></svg>';

  const $ = id=>document.getElementById(id);
  const bgLoad=$('bgLoad'), fallback=$('bgFallback');
  const hud=$('m3dHud'), hudPhase=$('hudPhase'), hudDate=$('hudDate'), hudTitle=$('hudTitle'), hudAlt=$('hudAlt');
  const legend=$('m3dLegend'), note=$('m3dNote');

  Object.values(PEOPLE).forEach(p=>{
    const s=document.createElement('span');
    s.innerHTML='<i class="lg-sil" style="color:'+p.c+'">'+SVG_CLIMBER+'</i>'+p.name;
    legend.appendChild(s);
  });

  let ch4Active=false, _zoneVig=''; function zoneVigActive(){return !!_zoneVig;} let map=null, ready=false, markers={}, camps={}, feats=[], moms=[], keyPts=[], camDirty=true, curEv=-99;

  function fail(){ fallback.classList.add('on'); bgLoad.classList.add('off'); }

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

  function initMap(){
    try{
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
            {id:'bg',type:'background',paint:{'background-color':'#14110c'}},
            {id:'sat',type:'raster',source:'sat',
             paint:{'raster-saturation':-0.45,'raster-contrast':0.08,'raster-brightness-max':0.92}},
            {id:'hs',type:'hillshade',source:'demhs',
             paint:{'hillshade-exaggeration':0.35,'hillshade-shadow-color':'#221c14','hillshade-highlight-color':'#f6ecd6','hillshade-accent-color':'#3a342a'}}
          ],
          sky:{'sky-color':'#0d1320','horizon-color':'#c9b895','fog-color':'#3a3629',
               'sky-horizon-blend':0.6,'horizon-fog-blend':0.55,'fog-ground-blend':0.62}
        },
        center:CAMPS.base.ll, zoom:10.3, pitch:34, bearing:336,
        maxPitch:80, minZoom:8, maxZoom:15.5,
        interactive:false, attributionControl:{compact:true},
        canvasContextAttributes:{antialias:false, powerPreference:'high-performance'}
      });
      map.on('error', ()=>{ if(!ready) fail(); });
      map.on('load', ()=>{
        map.setTerrain({source:'dem', exaggeration:1.55});

        // full route (faint dashed) + progress (reached so far) + rescue line
        map.addSource('route',{type:'geojson',data:line(ROUTE)});
        map.addLayer({id:'route-case',type:'line',source:'route',
          paint:{'line-color':'#14110c','line-width':4,'line-opacity':.5}});
        map.addLayer({id:'route',type:'line',source:'route',
          paint:{'line-color':'#f1ecdf','line-width':1.4,'line-dasharray':[2.2,2],'line-opacity':.55}});
        map.addSource('prog',{type:'geojson',data:line(['base'])});
        map.addLayer({id:'prog',type:'line',source:'prog',
          paint:{'line-color':'#c9a86a','line-width':2.6,'line-opacity':.95}});
        map.addSource('resc',{type:'geojson',data:line(['base'])});
        map.addLayer({id:'resc',type:'line',source:'resc',
          paint:{'line-color':'#c96a5c','line-width':2.2,'line-dasharray':[1.4,1.2],'line-opacity':0}});

        // MapLibre stomps inline opacity on the marker root for terrain
        // occlusion (opacityWhenCovered) — it would override our class-based
        // .off/.hide/.future opacity. Give it a plain wrapper to control.
        const mkWrap = el=>{const w=document.createElement('div');w.appendChild(el);return w;};
        // camp silhouettes (tents)
        ROUTE.forEach(k=>{
          const c=CAMPS[k];
          const el=document.createElement('div'); el.className='mk-camp2 future';
          const noTent = (k==='highpt'||k==='summit');
          el.innerHTML=(noTent?'<div class="pk">'+(k==='summit'?'△':'✕')+'</div>'
                              :'<div class="tent">'+SVG_TENT+'</div>')
            +'<div class="l">'+c.name+' · '+c.ft.toLocaleString('en-US')+'\u2032</div>';
          if(noTent) el.classList.add('pknode');
          if(k==='base'||k==='c2'||k==='c7'||k==='summit') el.classList.add('major');
          el.addEventListener('click',e=>{ if(window.__exploreOn){ e.stopPropagation(); lcOpen(k); } });
          camps[k]=el;
          new maplibregl.Marker({element:mkWrap(el),anchor:'top'}).setLngLat(c.ll).addTo(map);
        });

        // climber silhouettes
        Object.entries(PEOPLE).forEach(([k,p])=>{
          const el=document.createElement('div'); el.className='mk-sil hide';
          el.style.color=p.c; el.innerHTML=SVG_CLIMBER;
          markers[k]={mk:new maplibregl.Marker({element:mkWrap(el),anchor:'bottom'}).setLngLat(CAMPS.base.ll).addTo(map),
                      el, cur:CAMPS.base.ll.slice(), anim:null};
        });

        // named features
        FEATURES.forEach(f=>{
          const el=document.createElement('div'); el.className='mk-feat off';
          el.innerHTML='<div class="ln"></div><div class="fl">'+f.label+'</div>';
          feats.push({el, from:f.from});
          new maplibregl.Marker({element:mkWrap(el),anchor:'bottom'}).setLngLat(f.ll).addTo(map);
        });
        // moment pins
        MOMENTS.forEach(m=>{
          const el=document.createElement('div'); el.className='mk-mom off';
          el.innerHTML='<div class="g">'+m.glyph+'</div><div class="ml">'+m.label+'</div>';
          moms.push({el, at:m.at});
          new maplibregl.Marker({element:mkWrap(el),anchor:'bottom'}).setLngLat(m.ll).addTo(map);
        });

        map.on('move',()=>{ const far=map.getZoom()<12.45;
          document.body.classList.toggle('lbl-far',far); scheduleClamp(); });
        // MapLibre re-places markers after 'move' (terrain elevation resolves
        // late), so a clamp keyed only to 'move' reads stale geometry. 'render'
        // fires after each repaint; the rAF in scheduleClamp coalesces it to at
        // most one pass per frame, and 'idle' catches the settled position.
        map.on('render', scheduleClamp);
        map.on('idle', scheduleClamp);
        ready=true; camDirty=true;
        applyEvent(curEv, true);
        setTimeout(()=>bgLoad.classList.add('off'), 400);
      });
    }catch(e){ fail(); }
  }
  function line(keys){ return {type:'Feature',geometry:{type:'LineString',
    coordinates:(keys.length>1?keys:['base','base']).map(k=>CAMPS[k].ll)}}; }

  // ── keep marker labels on screen (narrow viewports)
  // A marker near the edge of a phone screen hangs its label off it; the body
  // clips the overflow, so the text was simply cut in half. Nudge the label
  // back inside horizontally — the marker itself stays where the terrain puts
  // it. Only the label moves, and only when it would otherwise be unreadable.
  const LBL_PAD = 8;
  let clampRaf = null;
  function labelEls(){
    const out = [];
    ROUTE.forEach(k=>{ const el=camps[k]; if(el){const l=el.querySelector('.l'); if(l) out.push(l);} });
    feats.forEach(f=>{ const l=f.el.querySelector('.fl'); if(l) out.push(l); });
    moms.forEach(m=>{ const l=m.el.querySelector('.ml'); if(l) out.push(l); });
    return out;
  }
  function clampLabels(){
    clampRaf = null;
    const narrow = innerWidth <= 860;
    labelEls().forEach(l=>{
      const dx = +(l.dataset.dx || 0);
      const reset = ()=>{ if(dx){ l.style.transform=''; l.dataset.dx='0'; } };
      if(!narrow) return reset();
      const mk = l.closest('.maplibregl-marker');
      if(!mk) return reset();
      // Only nudge labels whose marker is itself on screen. The camera routinely
      // leaves markers far outside the viewport (the map clips them); dragging
      // one of those labels into view would label a peak nobody can see.
      const m = mk.getBoundingClientRect();
      const ax = m.left + m.width/2;
      if(ax < 0 || ax > innerWidth || m.bottom < 0 || m.top > innerHeight) return reset();
      const r = l.getBoundingClientRect();
      if(!r.width) return;
      const left = r.left - dx, right = r.right - dx;   // position before our nudge
      let want = 0;
      if(left < LBL_PAD) want = LBL_PAD - left;
      else if(right > innerWidth - LBL_PAD) want = innerWidth - LBL_PAD - right;
      want = Math.round(want);
      if(want !== dx){ l.dataset.dx=String(want); l.style.transform = want?('translateX('+want+'px)'):''; }
    });
  }
  function scheduleClamp(){ if(ready && !clampRaf) clampRaf = requestAnimationFrame(clampLabels); }
  addEventListener('resize', scheduleClamp);

  // ── camera keyframes (page-order path)
  const KEYS = [
    ['prologue','base',10.3,34,336,-.05,''], ['k-quote','base',10.9,44,344,-.05,''],
    ['ch1','base',11.4,50,354,-.05,'g-city'], ['k-ch1-end','c1',11.7,53,12,-.05,'g-city'],
    ['clipB1','c1',11.8,54,18,-.05,'g-day'], ['ch2','c1',11.9,55,26,-.05,'g-day'], ['k-ch2-end','c2',12.1,57,44,-.05,'g-day'],
    ['ch3','c2',12.3,60,62,-.04,'g-day'], ['k-ch3-end','c3',12.5,62,82,-.04,'g-day'],
    ['clip1','c3',12.4,58,96,-.04,'g-day'],
    ['ch4','base',11.2,50,128,-.06,'g-day'],
    ['ev0','base',11.6,55,150,-.06,'g-day'], ['ev1','c2',12.6,62,135,-.05,'g-day'],
    ['ev2','c4',12.9,66,120,-.05,'g-storm'], ['ev3','c5',13.1,68,110,-.04,'g-day'],
    ['ev4','c7',13.1,70,102,-.04,'g-day'], ['ev5','c6',13.2,70,95,-.04,'g-day'],
    ['ev6','c8',13.3,72,85,-.04,'g-day'], ['ev7','c9',13.5,74,70,-.03,'g-day'],
    ['ev8','highpt',13.8,76,55,-.02,'g-night'], ['ev9','c7',12.8,68,72,-.05,'g-dusk'],
    ['ev10','c7',13.4,72,88,-.03,'g-dusk'], ['ev11','base',11.9,58,116,-.06,'g-dusk'],
    ['ev12','c6',12.7,68,104,-.05,'g-day'], ['ev13','c7',13.6,73,94,-.03,'g-dusk'],
    ['ev14','c7',12.2,50,132,-.06,'g-dusk'], ['ev15','base',11.3,46,148,-.06,'g-mourn'],
    ['ev16','c1',12.0,52,160,-.07,'g-mourn'],
    ['clip3','c8',13.4,72,50,-.03,'g-night'], ['ch5','highpt',13.6,76,44,-.03,'g-night'],
    ['ov5-0','c9',13.6,75,34,-.03,'g-night'], ['ov5-1','highpt',13.9,77,16,-.02,'g-night'],
    ['ov5-2','highpt',13.7,76,356,-.03,'g-night'], ['ov5-3','c9',13.4,73,336,-.03,'g-night'],
    ['ch6','c7',13.1,70,312,-.04,'g-dusk'], ['k-ch6-body','c5',12.5,62,288,-.05,'g-dusk'],
    ['k-ch6-record','c7',13.3,71,262,-.03,'g-dusk'],
    ['ch7','c2',11.2,46,232,-.05,'g-mourn'], ['k-ch7-body','base',10.8,40,208,-.05,'g-mourn'], ['evroom','c2',11.6,48,214,-.05,'g-mourn'], ['clip4','base',11.0,42,196,-.04,'g-mourn'], ['colophon','base',10.2,32,172,-.03,'g-mourn'],
    ['memorial','base',12.0,55,182,-.05,'g-mourn'], ['footer','base',9.7,28,158,-.02,'']
  ];
  function measure(){
    keyPts = KEYS.map(([id,camp,zoom,pitch,bearing,off,grade])=>{
      const el=document.getElementById(id); if(!el) return null;
      return {y:el.getBoundingClientRect().top+scrollY, ll:CAMPS[camp].ll, zoom, pitch, bearing, off, grade};
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
      hudPhase.textContent=''; hudDate.textContent='The Abruzzi Spur';
      hudTitle.textContent='Fifty-three days on the mountain'; hudAlt.textContent='';
      hud.classList.remove('tragic');
      if(!ready) return;
      Object.values(markers).forEach(m=>m.el.classList.add('hide'));
      moms.forEach(f=>f.el.classList.add('off'));
      return;
    }
    hudPhase.textContent=PHASES[i]; hudDate.textContent=DATES[i]; hudTitle.textContent=TITLES[i];
    if(window.__scrubSet) window.__scrubSet(i, ch4Active);
    hud.classList.toggle('tragic',TRAGIC[i]);
    let hi=0,hiName='';
    const lost=POS[i].lost||[];
    Object.keys(PEOPLE).forEach(k=>{
      const ck=POS[i][k];
      if(ready){
        const m=markers[k];
        if(!ck){m.el.classList.add('hide');}
        else{
          m.el.classList.remove('hide');
          m.el.classList.toggle('lost', lost.includes(k));
          m.el.classList.toggle('pulse', k==='wolfe'&&i>=10&&!lost.includes(k));
          lerpMarker(m,CAMPS[ck].ll);
        }
      }
      if(ck&&CAMPS[ck].ft>hi){hi=CAMPS[ck].ft;hiName=PEOPLE[k].name;}
    });
    if(i===8){hi=27450;hiName='Wiessner · P. Lama';}
    hudAlt.textContent=hi?('Highest: '+hiName+' · '+hi.toLocaleString('en-US')+' ft'):'';
    if(!ready) return;

    // camp states
    ROUTE.forEach(k=>{
      const el=camps[k]; if(!el) return;
      const est=EST[k]!==undefined?EST[k]:99;
      el.classList.toggle('future', i<est && k!=='summit' && k!=='highpt');
      el.classList.toggle('cleared', CLEARED[k]!==undefined && i>=CLEARED[k]);
      el.classList.toggle('dim', DIMMED[k]!==undefined && i>=DIMMED[k] && !(CLEARED[k]!==undefined&&i>=CLEARED[k]));
    });
    // progress + rescue lines
    map.getSource('prog').setData(line(ROUTE.slice(0,REACH[i]+1)));
    const rescueOn = i>=12 && i<=14;
    map.getSource('resc').setData(line(['base','c1','c2','c3','c4','c5','c6','c7']));
    map.setPaintProperty('resc','line-opacity', rescueOn?0.95:0);
    // features + moments
    feats.forEach(f=>f.el.classList.toggle('off', i<f.from));
    moms.forEach(f=>f.el.classList.toggle('off', !ch4Active || !f.at.includes(i)));
    if(window.__vig && !zoneVigActive()) window.__vig.vigForEvent(ch4Active?i:-1);
    scheduleClamp();
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

  const ch4=document.getElementById('ch4-zone');
  if(ch4) new IntersectionObserver(es=>{es.forEach(e=>{
    ch4Active=e.isIntersecting;
    if(window.__scrubSet) window.__scrubSet(curEv>=0?curEv:-1, e.isIntersecting&&curEv>=0);
    if(ready) moms.forEach(f=>f.el.classList.toggle('off', !ch4Active || curEv<0 || !f.at.includes(curEv)));
    hud.classList.toggle('show',e.isIntersecting);
    legend.classList.toggle('show',e.isIntersecting);
    note.classList.toggle('show',e.isIntersecting);
    if(!e.isIntersecting) applyEvent(-1);
  })},{rootMargin:'-15% 0px -15% 0px'}).observe(ch4);

  // Chapter VI vigil: Wolfe's silhouette alone at Camp VII, camps in their stripped state
  const ch6=document.getElementById('ch6-zone');
  if(ch6) new IntersectionObserver(es=>{es.forEach(e=>{
    if(!ready) return;
    if(e.isIntersecting){
      Object.entries(markers).forEach(([k,m])=>{
        if(k==='wolfe'){m.el.classList.remove('hide','lost');m.el.classList.add('pulse');lerpMarker(m,CAMPS.c7.ll);}
        else m.el.classList.add('hide');
      });
      ROUTE.forEach(k=>{const el=camps[k];if(!el)return;
        el.classList.remove('future');
        el.classList.toggle('cleared',CLEARED[k]!==undefined);
        el.classList.toggle('dim',DIMMED[k]!==undefined&&CLEARED[k]===undefined);});
    } else if(curEv<0){ markers.wolfe && markers.wolfe.el.classList.add('hide'); }
  })},{rootMargin:'-10% 0px -10% 0px'}).observe(ch6);

  // ── silhouette vignettes
  const VIG = {3:'haul',8:'pair',9:'strip',10:'fall',12:'rescue',13:'rescue',15:'tent',16:'tent'};
  const vgs = {}; document.querySelectorAll('.vg').forEach(v=>vgs[v.id.replace('vg-','')]=v);
  let zoneVig='';
  function setVig(name){
    Object.entries(vgs).forEach(([k,el])=>el.classList.toggle('on', k===name));
  }
  function vigForEvent(i){ setVig(zoneVig || (i>=0 && VIG[i]) || ''); }
  window.__vig={setVig,vigForEvent,z:v=>{zoneVig=v;setVig(v|| (curEv>=0&&ch4Active&&VIG[curEv]) || '');}};

  // ── color grade — the CSS tint layer, plus the rendered atmosphere when
  // weather.js is present (it owns fog/relighting/snow; see its header).
  // setGrade only ever fires from camTick, i.e. after the map is ready.
  const gradeEl=document.getElementById('grade'); let curGrade='__';
  function setGrade(g){ if(g===curGrade) return; curGrade=g; window.__grade=g;
    gradeEl.className=g||'';
    if(window.__wx) window.__wx.grade(g, map); else snowSet(g); }
  window.setGrade=setGrade;

  // ── snow / storm particles
  const sc=document.getElementById('snow'), sx=sc.getContext('2d');
  let flakes=[], mode='';
  function sz(){ sc.width=innerWidth; sc.height=innerHeight; }
  sz(); addEventListener('resize',sz);
  function snowSet(g){
    const m = g==='g-storm'?'storm' : g==='g-night'?'calm' : g==='g-mourn'?'sparse' : '';
    if(m===mode) return; mode=m;
    sc.classList.toggle('on', !!m && !reduce);
    const n = m==='storm'?260 : m==='calm'?90 : m==='sparse'?45 : 0;
    flakes = Array.from({length:n},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,
      r:.6+Math.random()*1.8, s:.4+Math.random()*1.4, w:Math.random()*Math.PI*2}));
  }
  // fallback loop only — weather.js (loaded first, when present) owns the
  // canvas; two writers would fight over clearRect.
  if(!window.__wx) (function snowLoop(){
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

  // ── local clips: play when visible, tap card or button for sound
  const vids=[...document.querySelectorAll('video.clip')];
  const vIO=new IntersectionObserver(es=>{es.forEach(e=>{
    const v=e.target;
    if(e.isIntersecting){ v.play().catch(()=>{}); } else { v.pause(); }
  })},{threshold:.35});
  vids.forEach(v=>vIO.observe(v));
  document.querySelectorAll('.snd').forEach(b=>{
    b.addEventListener('click',()=>{ const v=b.parentElement.querySelector('video');
      v.muted=!v.muted; b.textContent=v.muted?'Sound on':'Mute'; if(!v.muted) v.play().catch(()=>{}); });
  });

  function bindZone(id, name){
    const el=document.getElementById(id); if(!el) return;
    new IntersectionObserver(es=>{es.forEach(e=>{
      if(e.isIntersecting){ _zoneVig=name; window.__vig.z(name); }
      else if(_zoneVig===name){ _zoneVig=''; window.__vig.z(''); if(ch4Active&&curEv>=0) window.__vig.vigForEvent(curEv); }
    })},{rootMargin:'-12% 0px -12% 0px'}).observe(el);
  }
  bindZone('ch1-zone','nyc');
  bindZone('ch6-zone','tent');
  // ch5 pair vignette: bind on the summit-night steps container
  const ov0=document.getElementById('ov5-0');
  if(ov0){ bindZoneEl(ov0.parentElement,'pair'); }
  function bindZoneEl(el,name){
    new IntersectionObserver(es=>{es.forEach(e=>{
      if(e.isIntersecting){ _zoneVig=name; window.__vig.z(name); }
      else if(_zoneVig===name){ _zoneVig=''; window.__vig.z(''); if(ch4Active&&curEv>=0) window.__vig.vigForEvent(curEv); }
    })},{rootMargin:'-12% 0px -12% 0px'}).observe(el);
  }

  // ── FLAME at the memorial point (Gilkey site, near Base Camp — approximate)
  let flameEl=null;
  function ensureFlame(){
    if(flameEl||!ready) return;
    flameEl=document.createElement('div'); flameEl.className='mk-flame off';
    flameEl.innerHTML='<div class="fm"></div><div class="fl">Gilkey Memorial</div>';
    const w=document.createElement('div'); w.appendChild(flameEl);
    new maplibregl.Marker({element:w,anchor:'bottom'}).setLngLat([76.5160,35.8446]).addTo(map);
  }
  window.__flame=function(on){ ensureFlame(); if(flameEl) flameEl.classList.toggle('off',!on); };

  // ── EXPLORE MODE
  const bE=document.getElementById('btnExplore'), bX=document.getElementById('exploreExit'),
        bC=document.getElementById('exploreCta');
  let exploreReturnEv=null;
  function exploreNeutral(){
    ROUTE.forEach(k=>{const el=camps[k];if(!el)return;
      el.classList.remove('future');
      el.classList.toggle('cleared',CLEARED[k]!==undefined);
      el.classList.toggle('dim',DIMMED[k]!==undefined&&CLEARED[k]===undefined);});
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
      map.easeTo({center:CAMPS.c5.ll, zoom:12.4, pitch:62, bearing:150, duration:2200, offset:[0,0]});
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

  // ── EXPLORE LOCATION CARDS — click a camp for a deep dive with its own scrubber.
  // Blurbs restate facts already in the story/data; nothing new is asserted.
  const LOCNOTES = {
    base:'Established June 1 at the foot of the Abruzzi Spur — fifty-three days on the mountain began and ended here.',
    c1:'The first camp on the spur, stocked in the June carries.',
    c2:'The storm camp — the team was pinned here in the eight-day storm, −2 °F with 80 mph gusts.',
    c3:'Stocked in the late-June carries; stripped with the lower camps on July 20.',
    c4:'Below the House Chimney, where Wolfe came up on a tight rope.',
    c5:'The mid-mountain depot — abandoned in the retreat and never restocked.',
    c6:'Pasang Kikuli and Tsering Norbu reached this camp from Base in a single day — 7,000 vertical feet.',
    c7:'The highest supply camp. Wolfe waited here alone for a week; the Sherpas reached him on July 29.',
    c8:'On the Shoulder — Wolfe’s highest camp.',
    c9:'The summit camp, pitched July 17.',
    highpt:'Wiessner and Pasang Dawa Lama’s high point — about 27,450 feet at nightfall on July 19.',
    summit:'28,251 feet. Unclimbed until July 31, 1954.'
  };
  const lcRoot=$('locCard');
  const lcEls = lcRoot ? {kick:$('lcKick'),name:$('lcName'),blurb:$('lcBlurb'),range:$('lcRange'),
    prev:$('lcPrev'),next:$('lcNext'),date:$('lcDate'),phase:$('lcPhase'),title:$('lcTitle'),
    state:$('lcState'),who:$('lcWho'),close:$('lcClose')} : null;
  let lcKey=null, lcEv=0;
  function lcStateText(k,i){
    if(k==='summit') return 'Unreached — the 1939 high point was 800 feet below';
    if(k==='highpt') return i<8?'Not yet reached':'Reached at nightfall, July 19, 1939';
    const est=EST[k]!==undefined?EST[k]:99;
    if(i<est) return 'Not yet established';
    if(CLEARED[k]!==undefined && i>=CLEARED[k]) return 'Stripped — tents, bags and mattresses carried down';
    if(DIMMED[k]!==undefined && i>=DIMMED[k]) return 'Abandoned — never restocked';
    return 'Established · supplied';
  }
  function lcRender(){
    if(!lcKey||!lcEls) return;
    const k=lcKey, i=lcEv;
    lcEls.range.value=i;
    lcEls.date.textContent=DATES[i]+' · 1939';
    lcEls.phase.textContent=PHASES[i];
    lcEls.title.textContent=TITLES[i];
    lcEls.title.classList.toggle('tragic',TRAGIC[i]);
    lcEls.state.textContent=lcStateText(k,i);
    const lost=POS[i].lost||[];
    const here=Object.keys(PEOPLE).filter(p=>POS[i][p]===k);
    lcEls.who.innerHTML = here.length
      ? here.map(p=>'<span class="lc-chip'+(lost.includes(p)?' lost':'')+'"><i style="background:'+PEOPLE[p].c+'"></i>'
          +PEOPLE[p].name+(lost.includes(p)?' †':'')+'</span>').join('')
      : '<span class="lc-none">No one here on this date</span>';
    applyEvent(i,true);
  }
  function lcOpen(k){
    if(!lcEls) return;
    lcKey=k; const c=CAMPS[k];
    lcEls.kick.textContent=c.ft.toLocaleString('en-US')+' ft · '+Math.round(c.ft*0.3048).toLocaleString('en-US')+' m';
    lcEls.name.textContent=c.name;
    lcEls.blurb.textContent=LOCNOTES[k]||'';
    lcEv=Math.min(16, EST[k]!==undefined?EST[k]:8);
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
    lcEls.next.addEventListener('click',()=>{if(lcEv<16){lcEv++;lcRender();}});
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
    document.getElementById('snow').style.display=lite?'none':'';
  });
})();

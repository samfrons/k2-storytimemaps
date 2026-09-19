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

  // Route colours. ROUTE_C is the hub's 1939 year accent — token --y39 in
  // public/css/disasters.css (#a6752a) — so the hub and the story agree.
  // RESC_C is --wine-l in public/css/main.css. CASE_C is the dark casing that
  // keeps the lines legible through cloud, snow and bright snowfields.
  const ROUTE_C = '#a6752a', RESC_C = '#c96a5c', CASE_C = '#0b0a08';

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
  // route swatches, same chip styling as the climber chips
  [[ROUTE_C,'Route climbed',''],[ROUTE_C,'Route ahead',' dash'],[RESC_C,'Rescue','']]
    .forEach(([c,label,cls])=>{
      const s=document.createElement('span');
      s.innerHTML='<i class="lg-line'+cls+'" style="--lc:'+c+'"></i>'+label;
      legend.appendChild(s);
    });

  let plateOn=false;
  let ch4Active=false, _zoneVig=''; function zoneVigActive(){return !!_zoneVig;} let map=null, ready=false, markers={}, camps={}, feats=[], moms=[], keyPts=[], camDirty=true, curEv=-99;

  // Poster (fallback) is already visible by default (see story.html); on
  // failure just make sure it never gets the fade-out class and surface the
  // small error veil instead of a silently-stuck poster.
  function fail(){ fallback.classList.remove('off'); fallback.classList.add('on'); bgLoad.classList.add('on'); }

  function loadLib(cb){
    if(window.maplibregl) return cb();
    // Self-hosted first (also what the preload <link> in <head> warms up),
    // then cdnjs, then unpkg as last-resort fallbacks.
    const css=document.createElement('link'); css.rel='stylesheet';
    css.href='/vendor/maplibre-gl.min.css';
    css.onerror=()=>{ css.onerror=()=>{css.href='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';};
      css.href='https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.css'; };
    document.head.appendChild(css);
    const s=document.createElement('script');
    s.src='/vendor/maplibre-gl.min.js';
    s.onload=cb;
    s.onerror=()=>{ const s2=document.createElement('script');
      s2.src='https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.min.js';
      s2.onload=cb; s2.onerror=()=>{ const s3=document.createElement('script');
        s3.src='https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
        s3.onload=cb; s3.onerror=fail; document.head.appendChild(s3); };
      document.head.appendChild(s2); };
    document.head.appendChild(s);
  }

  // ── contour lines (maplibre-contour, self-hosted)
  // Loaded after maplibre and before initMap; the library registers a custom
  // protocol on maplibregl, so it has to be in place before the Map is built.
  // Failure is silent: initMap checks window.mlcontour and simply omits the
  // contour source/layer, leaving the rest of the style identical.
  // worker:false on purpose — the 0.1.0 UMD bundle needs a separate
  // index.worker.min.js served at workerUrl for worker:true, which we do not
  // self-host; the main-thread decoder keeps up at our zoom range.
  function loadContour(cb){
    if(window.mlcontour) return cb();
    const s=document.createElement('script');
    s.src='/vendor/maplibre-contour.min.js';
    s.onload=cb; s.onerror=()=>cb();
    document.head.appendChild(s);
  }

  const DEM_TILES=['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'];

  function initMap(){
    let ctSrc=null;
    try{
      if(window.mlcontour){
        const ds=new mlcontour.DemSource({url:DEM_TILES[0],encoding:'terrarium',maxzoom:14,worker:true});
        ds.setupMaplibre(maplibregl);
        ctSrc={type:'vector',maxzoom:15,tiles:[ds.contourProtocolUrl({
          multiplier:1, elevationKey:'ele', levelKey:'level', contourLayer:'contours',
          thresholds:{10:[500,2000],11:[200,1000],12:[100,500],13:[100,500],14:[50,250]}
        })]};
      }
    }catch(e){ ctSrc=null; }
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
            // one DEM source feeds both the terrain mesh and the hillshade
            dem:{type:'raster-dem',
              tiles:DEM_TILES,
              tileSize:256, encoding:'terrarium', maxzoom:14,
              attribution:'Terrain: Mapzen/AWS Open Data'},
            ...(ctSrc?{contours:ctSrc}:{})
          },
          layers:[
            {id:'bg',type:'background',paint:{'background-color':'#14110c'}},
            {id:'sat',type:'raster',source:'sat',
             paint:{'raster-saturation':-0.12,'raster-contrast':0.12,
                    'raster-brightness-min':0.02,'raster-brightness-max':0.96,
                    'raster-fade-duration':0}},
            {id:'hs',type:'hillshade',source:'dem',
             paint:{'hillshade-exaggeration':0.42,'hillshade-illumination-direction':300,
                    'hillshade-shadow-color':'#1a150e','hillshade-highlight-color':'#fff6e4','hillshade-accent-color':'#2a241c'}},
            ...(ctSrc?[{id:'ct',type:'line',source:'contours','source-layer':'contours',
             paint:{'line-color':'rgba(241,236,223,0.22)',
                    'line-width':['match',['get','level'],1,0.9,0.45]}}]:[])
          ],
          sky:{'sky-color':'#101a2a','horizon-color':'#c9ab86','fog-color':'#4b4a44',
               'sky-horizon-blend':0.7,'horizon-fog-blend':0.65,'fog-ground-blend':0.7}
        },
        center:CAMPS.c1.ll, zoom:11.6, pitch:72, bearing:348,
        maxPitch:80, minZoom:8, maxZoom:15.5,
        interactive:false, attributionControl:{compact:true},
        canvasContextAttributes:{antialias:false, powerPreference:'high-performance'}
      });
      map.on('error', ()=>{ if(!ready) fail(); });
      // Cross-fade the poster out on the map's first *idle* (tiles/terrain
      // actually drawn), not 'load' (fires before the first paint) — 'once'
      // so later idle events (post-scrub, resize) don't re-trigger it.
      // On a slow connection the first idle can be many seconds away (a
      // high-pitch view pulls tiles to the horizon), so also release the
      // poster 3.5 s after 'load' — a half-drawn live mountain beats a stale
      // still. window.__mapIdle marks the true first idle (scripts/poster.mjs
      // waits on it so the poster is always shot from a settled frame).
      const release=()=>fallback.classList.add('off');
      const onIdle=()=>{ release();
        // "settled" for the poster means the terrain mesh is up and every
        // tile in view has arrived — the first idle can precede both.
        if(map.getTerrain() && map.areTilesLoaded()){ window.__mapIdle=true; map.off('idle', onIdle); } };
      map.on('idle', onIdle);
      map.on('load', ()=>{
        setTimeout(release, 3500);
        map.setTerrain({source:'dem', exaggeration:1.35});

        // The traversed route, unmistakable: a dark casing under a bold
        // coloured line. 'route' is the whole Abruzzi line (its un-reached
        // remainder shows as the same hue, dashed and faded); 'prog' is what
        // the party had reached by the current event, solid and full strength;
        // 'resc' is the Sherpas' rescue attempt, in wine, with its own casing.
        map.addSource('route',{type:'geojson',data:line(ROUTE)});
        map.addLayer({id:'route-case',type:'line',source:'route',
          paint:{'line-color':CASE_C,'line-width':6,'line-opacity':.75,'line-blur':.4}});
        map.addLayer({id:'route',type:'line',source:'route',
          paint:{'line-color':ROUTE_C,'line-width':2.4,'line-dasharray':[2.2,2],'line-opacity':.35}});
        map.addSource('prog',{type:'geojson',data:line(['base'])});
        map.addLayer({id:'prog',type:'line',source:'prog',
          paint:{'line-color':ROUTE_C,'line-width':3.2,'line-opacity':1}});
        map.addSource('resc',{type:'geojson',data:line(['base'])});
        map.addLayer({id:'resc-case',type:'line',source:'resc',
          paint:{'line-color':CASE_C,'line-width':5.4,'line-opacity':0,'line-blur':.4}});
        map.addLayer({id:'resc',type:'line',source:'resc',
          paint:{'line-color':RESC_C,'line-width':2.6,'line-opacity':0}});

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
          // Base Camp and the Summit always keep their label (the two fixed
          // reference points); every other camp's label is event-driven.
          if(k==='base'||k==='summit') el.classList.add('anchor');
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
        window.__map=map;            // exposed for the screenshot harness only
        applyEvent(curEv, true);
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
  // Framing rule (2026-09-18): pitch high enough that the horizon and sky stay
  // in shot, bearings looking *up* the Abruzzi Ridge toward the summit
  // (~330–20°, the summit sits N/NNW of Base Camp). Adjacent keys stay within
  // a few dozen degrees so the scrub reads smooth in both directions; the
  // evidence-room / colophon / footer keys keep their lower, flatter framing.
  const KEYS = [
    ['prologue','c1',11.6,72,348,0,''], ['k-quote','base',11.3,70,352,-.02,''],
    ['ch1','base',11.5,66,358,-.02,'g-city'], ['k-ch1-end','c1',11.8,70,4,-.02,'g-city'],
    ['clipB1','c1',12.0,72,10,0,'g-day'], ['ch2','c1',12.0,73,6,0,'g-day'], ['k-ch2-end','c2',12.2,74,358,0,'g-day'],
    ['ch3','c2',12.4,74,352,0,'g-day'], ['k-ch3-end','c3',12.6,75,346,0,'g-day'],
    ['clip1','c3',12.5,74,342,0,'g-day'],
    ['ch4','base',11.4,72,348,0,'g-day'],
    ['ev0','base',11.7,72,354,0,'g-day'], ['ev1','c2',12.6,74,2,0,'g-day'],
    ['ev2','c4',13.0,74,18,0,'g-storm'], ['ev3','c5',13.15,77,352,0,'g-day'],
    ['ev4','c7',13.1,76,344,0,'g-day'], ['ev5','c6',13.2,76,350,0,'g-day'],
    ['ev6','c8',13.3,77,338,0,'g-day'], ['ev7','c9',13.45,77,344,0,'g-day'],
    ['ev8','highpt',13.5,78,338,0,'g-night'], ['ev9','c7',12.9,74,346,0,'g-dusk'],
    ['ev10','c7',13.4,76,356,0,'g-dusk'], ['ev11','base',12.0,72,4,0,'g-dusk'],
    ['ev12','c6',12.9,75,352,0,'g-day'], ['ev13','c7',13.5,77,344,0,'g-dusk'],
    ['ev14','c7',12.4,70,352,-.02,'g-dusk'], ['ev15','base',11.5,68,358,-.02,'g-mourn'],
    ['ev16','c1',12.1,70,6,-.02,'g-mourn'],
    ['clip3','c8',13.4,76,350,0,'g-night'], ['ch5','highpt',13.5,78,342,0,'g-night'],
    ['ov5-0','c9',13.5,77,336,0,'g-night'], ['ov5-1','highpt',13.8,78,344,0,'g-night'],
    ['ov5-2','highpt',13.6,77,354,0,'g-night'], ['ov5-3','c9',13.4,75,2,0,'g-night'],
    ['ch6','c7',13.1,72,8,0,'g-dusk'], ['k-ch6-body','c5',12.6,68,356,-.02,'g-dusk'],
    ['k-ch6-record','c7',13.2,71,346,-.02,'g-dusk'],
    ['ch7','c2',11.6,58,338,-.05,'g-mourn'], ['k-ch7-body','base',11.2,52,330,-.05,'g-mourn'], ['evroom','c2',11.8,54,336,-.05,'g-mourn'], ['clip4','base',11.2,50,344,-.04,'g-mourn'], ['colophon','base',10.8,44,352,-.03,'g-mourn'],
    ['memorial','base',12.0,60,358,-.05,'g-mourn'], ['footer','base',10.2,40,6,-.02,'']
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
      document.body.classList.remove('lbl-ev');
      return;
    }
    hudPhase.textContent=PHASES[i]; hudDate.textContent=DATES[i]; hudTitle.textContent=TITLES[i];
    if(window.__scrubSet) window.__scrubSet(i, ch4Active);
    hud.classList.toggle('tragic',TRAGIC[i]);
    let hi=0,hiName='',hiKey='';
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
      if(ck&&CAMPS[ck].ft>hi){hi=CAMPS[ck].ft;hiName=PEOPLE[k].name;hiKey=ck;}
    });
    if(i===8){hi=27450;hiName='Wiessner · P. Lama';hiKey='highpt';}
    hudAlt.textContent=hi?('Highest: '+hiName+' · '+hi.toLocaleString('en-US')+' ft'):'';
    if(!ready) return;

    // camp states
    ROUTE.forEach(k=>{
      const el=camps[k]; if(!el) return;
      const est=EST[k]!==undefined?EST[k]:99;
      el.classList.toggle('future', i<est && k!=='summit' && k!=='highpt');
      el.classList.toggle('cleared', CLEARED[k]!==undefined && i>=CLEARED[k]);
      el.classList.toggle('dim', DIMMED[k]!==undefined && i>=DIMMED[k] && !(CLEARED[k]!==undefined&&i>=CLEARED[k]));
      // labels that don't stack: only the event's highest camp carries text
      // (plus the two anchors, Base Camp and Summit). See .lbl-ev in main.css.
      el.classList.toggle('cur', k===hiKey);
    });
    document.body.classList.add('lbl-ev');
    // progress + rescue lines
    map.getSource('prog').setData(line(ROUTE.slice(0,REACH[i]+1)));
    const rescueOn = i>=12 && i<=14;
    map.getSource('resc').setData(line(['base','c1','c2','c3','c4','c5','c6','c7']));
    map.setPaintProperty('resc','line-opacity', rescueOn?1:0);
    map.setPaintProperty('resc-case','line-opacity', rescueOn?.75:0);
    // features + moments
    feats.forEach(f=>f.el.classList.toggle('off', i<f.from));
    moms.forEach(f=>f.el.classList.toggle('off', !ch4Active || !f.at.includes(i)));
    if(window.__vig && !zoneVigActive()) window.__vig.vigForEvent(ch4Active?i:-1);
    scheduleClamp();
  }

  loadLib(function(){ loadContour(initMap); });
  addEventListener('load', measure); measure();
  addEventListener('resize', ()=>{measure();camDirty=true;});
  let raf=null,lastY=-1;
  function loop(){ if(!window.__exploreOn && !plateOn && (scrollY!==lastY||camDirty)){lastY=scrollY;camDirty=false;camTick();} raf=requestAnimationFrame(loop); }
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
      lensBuild(); lensMark(-1);
      map.easeTo({center:CAMPS.c5.ll, zoom:12.4, pitch:62, bearing:150, duration:2200, offset:[0,0]});
    } else {
      lcClose();
      lensMark(-1);
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
  function lcOpen(k, opt){
    if(!lcEls) return;
    lcKey=k; const c=CAMPS[k];
    lcEls.kick.textContent=c.ft.toLocaleString('en-US')+' ft · '+Math.round(c.ft*0.3048).toLocaleString('en-US')+' m';
    lcEls.name.textContent=c.name;
    lcEls.blurb.textContent=LOCNOTES[k]||'';
    lcEv=Math.min(16, EST[k]!==undefined?EST[k]:8);
    lcRender();
    lcRoot.classList.add('show'); lcRoot.setAttribute('aria-hidden','false');
    document.body.classList.add('loc-open');
    if(!(opt&&opt.noCam))
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


  // ── LENSES — named vantage points along the route. Each is a camera the
  // reader can jump to in explore mode: {id, label, ll, zoom, pitch, bearing}.
  // Coordinates come from CAMPS / FEATURES, so the camp lat/lons here are the
  // same flagged approximations the rest of the page declares.
  //
  // Why the numbers look the way they do: MapLibre puts the camera at
  // altitude ~= 779 * (metres-per-pixel) * cos(pitch) above the map plane, and
  // with terrain exaggeration 1.35 the rendered mountain is up to 11.6 km
  // high. Zoom in past that and the camera ends up INSIDE the massif (the mesh
  // renders from within, as a hole) — measured by screenshotting. So the low
  // lenses keep a high, oblique pitch at a wide zoom (a climber's view up the
  // spur) and the high lenses trade pitch for closeness, flattening toward a
  // plan view. The zoom 14+/pitch 70+ combination simply does not exist here.
  // Some `ll` values are nudged north of their subject: the marker for a camp
  // sits at its (exaggerated) elevation, several hundred pixels above the
  // ground point, so aiming at the camp itself throws it off the top of frame.
  // `off` is a screen offset in pixels — kept small, and only where the
  // location card would otherwise cover the subject, because at high pitch the
  // offset is applied on the ground plane and magnifies fast.
  // `camp` opens that location's record card; `evCamps` maps a Chapter IV
  // event's highest camp to the lens that frames it.
  const LENSES = [
    {id:'base',      label:'Base Camp',          ll:CAMPS.base.ll,      zoom:12.2, pitch:66, bearing:352, off:[-140,0], camp:'base',   evCamps:['base']},
    {id:'glacier',   label:'Glacier approach',   ll:[76.5205,35.8300],  zoom:12.1, pitch:72, bearing:6},
    {id:'chimney',   label:'House Chimney',      ll:[76.5202,35.8689],  zoom:12.8, pitch:48, bearing:344, evCamps:['c1','c2','c3','c4']},
    {id:'pyramid',   label:'Black Pyramid',      ll:[76.5193,35.8712],  zoom:12.8, pitch:40, bearing:16, evCamps:['c5','c6']},
    {id:'shoulder',  label:'Shoulder \u00b7 Camp VIII',ll:CAMPS.c8.ll, zoom:12.7, pitch:38, bearing:344, off:[-140,0], camp:'c8',     evCamps:['c7','c8']},
    {id:'c9',        label:'Camp IX',            ll:[76.5151,35.8896], zoom:12.6, pitch:36, bearing:330, camp:'c9',     evCamps:['c9']},
    {id:'bottleneck',label:'Bottleneck \u00b7 high point',ll:[76.5137,35.9006],zoom:12.6,pitch:34,bearing:20, camp:'highpt', evCamps:['highpt']},
    {id:'summit',    label:'Summit',             ll:[76.5133,35.9114],  zoom:12.4, pitch:34, bearing:355, camp:'summit', evCamps:['summit']}
  ];
  let lensIdx=-1, lensStrip=null, lensBtns=[];
  function lensBuild(){
    if(lensStrip) return;
    lensStrip=document.createElement('div'); lensStrip.id='lenses';
    lensStrip.innerHTML='<span class="lz-cap">Lenses</span>';
    LENSES.forEach((L,i)=>{
      const b=document.createElement('button'); b.className='lz'; b.type='button';
      b.textContent=L.label; b.addEventListener('click',()=>lensGo(i));
      lensStrip.appendChild(b); lensBtns.push(b);
    });
    document.body.appendChild(lensStrip);
  }
  function lensMark(i){ lensIdx=i; lensBtns.forEach((b,k)=>b.classList.toggle('on',k===i)); }
  function lensGo(i){
    const L=LENSES[i]; if(!L||!ready) return;
    lensBuild(); lensMark(i);
    // A lens flies itself and passes noCam so lcOpen does not also ease the
    // camera to its own sidebar-offset framing, which would undo the vantage.
    if(L.camp) lcOpen(L.camp, {noCam:true}); else lcClose();
    map.flyTo({center:L.ll, zoom:L.zoom, pitch:L.pitch, bearing:L.bearing,
      duration:1600, essential:true, offset:L.off||[0,0]});
  }
  function lensForEvent(i){
    if(i<0) return 0;
    let hi=-1, key=null;
    Object.keys(PEOPLE).forEach(k=>{ const ck=POS[i][k];
      if(ck && CAMPS[ck] && CAMPS[ck].ft>hi){ hi=CAMPS[ck].ft; key=ck; } });
    if(i===8) key='highpt';
    if(!key) return 0;
    const at=LENSES.findIndex(L=>L.evCamps && L.evCamps.includes(key));
    return at<0?0:at;
  }
  window.__lens=i=>lensGo(i);

  // "Look closer" affordance on each Chapter IV step. Injected from JS as a
  // SIBLING of .over-card (never inside it) so story.html stays untouched and
  // the narration playlist selector in extras.js — which reads .over-card —
  // never picks the button up.
  document.querySelectorAll('#ch4-zone .over-step[data-ev]').forEach(step=>{
    const ev=+step.dataset.ev; if(!(ev>=0)) return;
    const card=step.querySelector('.over-card'); if(!card) return;
    const b=document.createElement('button');
    b.className='lens-cta'; b.type='button'; b.textContent='◎ Look closer';
    b.addEventListener('click',()=>{
      const i=lensForEvent(ev);
      if(!window.__exploreOn){ if(bE) bE.click(); else exploreSet(true); }
      setTimeout(()=>lensGo(i), 160);
    });
    const holder=document.createElement('div'); holder.className='lens-cta-wrap';
    holder.appendChild(b);
    // .over-step is a flex row with align-items:center, so a sibling would sit
    // BESIDE the card. Stack them in a column wrapper instead — the card
    // element itself is untouched, so the narration selector and the
    // typewriter still see exactly what they saw before.
    const stack=document.createElement('div'); stack.className='oc-stack';
    card.parentNode.insertBefore(stack, card);
    stack.appendChild(card); stack.appendChild(holder);
  });

  // explore-only keyboard zoom (mouse-wheel zoom is enabled by exploreSet);
  // Escape closes the location card, then leaves explore.
  addEventListener('keydown',e=>{
    if(plateOn){ if(e.key==='Escape') plateClose(); return; }
    if(!window.__exploreOn) return;
    if(e.key==='Escape'){
      if(lcRoot&&lcRoot.classList.contains('show')) lcClose(); else exploreSet(false);
      lensMark(-1); return;
    }
    if(e.key==='+'||e.key==='='){ map.zoomIn({duration:300}); }
    else if(e.key==='-'||e.key==='_'){ map.zoomOut({duration:300}); }
  });

  // ── PLATES — photo-matched vantage views. This is the honest version of a
  // "digital twin": no geometry is reconstructed from the photographs (that
  // would be invented terrain). For each documented public-domain plate we
  // searched the real DEM for the camera that reproduces its view, and let the
  // reader cross-fade photograph against terrain. The vantage is approximate
  // and the overlay says so on screen.
  // Each `cam.center` is a point on the glacier the photograph was made from,
  // not the summit: MapLibre measures the camera's height from the centre's
  // terrain elevation, so centring on an 8.6 km peak lifts the camera above
  // the whole range and flattens the view. Both vantages still sit further
  // back and higher than the photographer stood:
  // MapLibre's camera altitude is fixed by zoom and pitch (alt = k*m-per-px*
  // cos(pitch)) and the camera cannot tilt upward past the horizon, so a
  // ground-level view looking UP at an 8,611 m peak — which is what Sella
  // made — is not expressible. The match is therefore of the skyline and the
  // main ridgelines, not of the photographer's exact station.
  const PLATES = [
    {id:'sella-west',
     match:'K2%20pictured%20from%20west',
     src:'https://commons.wikimedia.org/wiki/Special:FilePath/Vittorio%20Sella%20Himalayas%20K2%20pictured%20from%20west%20c1900.jpg',
     title:'K2 from the west',
     credit:'Vittorio Sella, c. 1900 · Wikimedia Commons · public domain',
     cam:{center:[76.4850,35.8814], zoom:13.4, pitch:79, bearing:92}},
    {id:'sella-gag',
     match:'K2%20from%20Godwin-Austen%20glacier',
     src:'https://commons.wikimedia.org/wiki/Special:FilePath/K2%20from%20Godwin-Austen%20glacier%2C%20Vittorio%20Sella%2C%201909.jpg',
     title:'K2 from the Godwin-Austen Glacier',
     credit:'Vittorio Sella, 1909 Duke of the Abruzzi expedition · Wikimedia Commons · public domain',
     cam:{center:[76.5230,35.8100], zoom:13.2, pitch:79, bearing:350}}
  ];
  let plRoot=null, plImg=null, plRange=null, plTitle=null, plCredit=null;
  function plateUI(){
    if(plRoot) return;
    plRoot=document.createElement('div'); plRoot.id='plateView'; plRoot.setAttribute('aria-hidden','true');
    plRoot.innerHTML='<img id="plImg" alt="">'
      +'<div class="pl-bar">'
      +'<div class="pl-t"><b id="plTitle"></b><span id="plCredit"></span></div>'
      +'<label class="pl-sl"><span>Photograph ↔ Terrain</span>'
      +'<input type="range" id="plRange" min="0" max="100" step="1" value="70" aria-label="Photograph opacity"></label>'
      +'<div class="pl-note">Vantage matched on the terrain model \u2014 same '
      +'direction and skyline, but from further back and higher than the '
      +'photographer stood: the map camera cannot tilt upward, so a view from '
      +'the glacier floor is not expressible. Approximate.</div>'
      +'<button id="plClose" type="button">✕ Close</button></div>';
    document.body.appendChild(plRoot);
    plImg=$('plImg'); plRange=$('plRange'); plTitle=$('plTitle'); plCredit=$('plCredit');
    plRange.addEventListener('input',()=>{ plImg.style.opacity=(+plRange.value/100); });
    $('plClose').addEventListener('click',plateClose);
  }
  function plateOpen(P){
    if(!ready) return;
    plateUI();
    plTitle.textContent=P.title; plCredit.textContent=P.credit;
    plImg.src=P.src; plRange.value=70; plImg.style.opacity=.7;
    plateOn=true; plRoot.classList.add('show'); plRoot.setAttribute('aria-hidden','false');
    document.body.classList.add('plate-on');
    document.documentElement.style.overflow='hidden';
    const cam={center:P.cam.center, zoom:P.cam.zoom, pitch:P.cam.pitch,
      bearing:P.cam.bearing, offset:[0,0]};
    map.flyTo({...cam, duration:1800, essential:true});
    // MapLibre measures the camera's height from the centre's *terrain*
    // elevation, and that elevation is only known once the DEM around the
    // target has arrived — so the first move from wherever the reader was
    // lands short of the vantage and stays there. Flying the identical camera
    // a second time, after the first has settled, resolves to the documented
    // framing. It has to be another animated move: a jumpTo re-uses the same
    // stale elevation and changes nothing (measured).
    map.once('moveend', ()=>{ setTimeout(()=>{
      if(plateOn) map.easeTo({...cam, duration:600, essential:true}); }, 700); });
  }
  function plateClose(){
    if(!plateOn) return;
    plateOn=false;
    plRoot.classList.remove('show'); plRoot.setAttribute('aria-hidden','true');
    document.body.classList.remove('plate-on');
    document.documentElement.style.overflow='';
    camDirty=true;   // the scroll camera resumes where the reader was
  }
  window.__plate=id=>{ const P=PLATES.find(p=>p.id===id); if(P) plateOpen(P); };
  PLATES.forEach(P=>{
    const b=document.querySelector('[data-plate="'+P.id+'"]');
    if(b) b.addEventListener('click',()=>plateOpen(P));
  });

  // ── LITE MODE
  const bL=document.getElementById('btnLite'); let lite=false;
  if(bL) bL.addEventListener('click',()=>{
    if(!ready) return;
    lite=!lite; bL.classList.toggle('on',lite);
    try{ map.setLayoutProperty('hs','visibility', lite?'none':'visible'); }catch(e){}
    try{ map.setTerrain({source:'dem', exaggeration: lite?1.15:1.35}); }catch(e){}
    try{ if(map.setPixelRatio) map.setPixelRatio(lite?1:(window.devicePixelRatio||1)); }catch(e){}
    // lite drops the weather canvas to cloud banks only (weather.js reads
    // body.lite); without weather.js the canvas simply hides as before.
    document.body.classList.toggle('lite', lite);
    if(!window.__wx) document.getElementById('snow').style.display=lite?'none':'';
  });
})();

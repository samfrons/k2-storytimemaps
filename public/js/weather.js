// ═════════ WEATHER — the mountain's atmosphere, rendered ═════════
// Shared by the 1939 engine and the era engine (load order: weather →
// engine → chrome → extras). Owns two things the grade system used to fake
// with CSS tint alone:
//
//   1. The MapLibre atmosphere: per-grade sky/fog presets and terrain
//      relighting (hillshade + raster paint), eased over ~2 s — a storm now
//      drops real fog onto the terrain and flattens its light; night raises
//      a moon-blue hillshade; dusk warms the rock.
//   2. The #snow canvas: a layered weather system (cloud banks, spindrift,
//      storm streaks + whiteout + frost, night sky, depth snowfall) whose
//      layer weights ease toward per-grade targets over ~2.5 s, matched to
//      the terrain relight, and which parallaxes with the map camera.
//
// Contract: engines call  window.__wx.grade(g, map)  from setGrade (map is
// always ready by then — setGrade only fires from camTick after load). If
// this file is absent the engines fall back to their own flat snow, so the
// pages degrade exactly to the pre-weather behavior.
//
// Also public: __wx.wind(0..1) biases the spindrift/gale, __wx.anchor(x,y)
// moves the spindrift source (screen px; default upper-centre ≈ the summit
// ridge). Both are optional — the system runs without either.
//
// Performance: every texture (noise tiles, star fields, whiteout and frost
// masks) is pre-rendered once onto an offscreen canvas and blitted with
// drawImage; there is no per-pixel work in the frame loop. The loop parks
// itself when the tab is hidden or when every layer weight has decayed to
// zero. `?wxdebug` logs a rolling average frame cost.
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DEBUG  = location.search.indexOf('wxdebug') >= 0;

  // ── atmosphere presets ─────────────────────────────────────────────────
  // sky: MapLibre sky spec · hs: hillshade paint · ras: raster paint
  const BASE = {
    sky:{c:'#101a2a',h:'#c9ab86',f:'#4b4a44',shb:.7,hfb:.65,fgb:.7},
    hs:{ex:.42,dir:300,sh:'#1a150e',hi:'#fff6e4',ac:'#2a241c'},
    ras:{sat:-.12,con:.12,bri:.96}
  };
  // Colour comes from the imagery; mood comes from sky/fog + the #grade
  // gradient. Only storm/night/mourn desaturate hard (2026-09-18).
  // hs.dir = hillshade illumination direction: one sun per grade, eased.
  const P = {
    '': BASE,
    'g-day':  {sky:{c:'#274a73',h:'#e2b98e',f:'#7d7466',shb:.7, hfb:.62,fgb:.6},
               hs:{ex:.42,dir:295,sh:'#1c1610',hi:'#fff2d8',ac:'#2c261c'},
               ras:{sat:-.05,con:.12,bri:1}},
    'g-storm':{sky:{c:'#20242a',h:'#5c6066',f:'#5a5d60',shb:.85,hfb:.85,fgb:.92},
               hs:{ex:.3, dir:330,sh:'#2a2f38',hi:'#b8c0cc',ac:'#3a4048'},
               ras:{sat:-.5, con:.04,bri:.7}},
    'g-night':{sky:{c:'#03050c',h:'#131c2e',f:'#0a1020',shb:.7, hfb:.7, fgb:.8},
               hs:{ex:.55,dir:200,sh:'#04060c',hi:'#7d95bd',ac:'#101826'},
               ras:{sat:-.55,con:.08,bri:.54}},
    'g-dusk': {sky:{c:'#2a1e30',h:'#d08a52',f:'#4e3226',shb:.68,hfb:.6, fgb:.66},
               hs:{ex:.44,dir:250,sh:'#301a12',hi:'#f0c896',ac:'#402a1c'},
               ras:{sat:.05, con:.1, bri:.86}},
    'g-mourn':{sky:{c:'#565a60',h:'#a8a49a',f:'#84827c',shb:.75,hfb:.7, fgb:.8},
               hs:{ex:.34,dir:320,sh:'#26262a',hi:'#d8d6d0',ac:'#3c3c40'},
               ras:{sat:-.55,con:.06,bri:.82}},
    'g-city': {sky:{c:'#1a1210',h:'#b57a44',f:'#33251a',shb:.68,hfb:.6, fgb:.64},
               hs:{ex:.4, dir:300,sh:'#241410',hi:'#e0b880',ac:'#38241a'},
               ras:{sat:-.25,con:.1, bri:.8}}
  };

  const hex2rgb = x=>[parseInt(x.slice(1,3),16),parseInt(x.slice(3,5),16),parseInt(x.slice(5,7),16)];
  const rgb2hex = c=>'#'+c.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
  const lerp=(a,b,t)=>a+(b-a)*t;
  // illumination direction is an angle: take the short way round
  const lerpA=(a,b,t)=>{const d=((b-a+540)%360)-180; return (a+d*t+360)%360;};
  const lerpC=(a,b,t)=>rgb2hex(hex2rgb(a).map((v,i)=>lerp(v,hex2rgb(b)[i],t)));
  const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;

  let cur = JSON.parse(JSON.stringify(BASE));   // last applied values
  let atmoRaf = null;

  function applyAtmo(map, v){
    try{
      if(map.setSky) map.setSky({'sky-color':v.sky.c,'horizon-color':v.sky.h,'fog-color':v.sky.f,
        'sky-horizon-blend':v.sky.shb,'horizon-fog-blend':v.sky.hfb,'fog-ground-blend':v.sky.fgb});
      map.setPaintProperty('hs','hillshade-exaggeration',v.hs.ex);
      map.setPaintProperty('hs','hillshade-illumination-direction',v.hs.dir);
      map.setPaintProperty('hs','hillshade-shadow-color',v.hs.sh);
      map.setPaintProperty('hs','hillshade-highlight-color',v.hs.hi);
      map.setPaintProperty('hs','hillshade-accent-color',v.hs.ac);
      map.setPaintProperty('sat','raster-saturation',v.ras.sat);
      map.setPaintProperty('sat','raster-contrast',v.ras.con);
      map.setPaintProperty('sat','raster-brightness-max',v.ras.bri);
    }catch(e){}
  }

  function toGrade(map, g){
    const tgt = P[g] || BASE;
    if(atmoRaf) cancelAnimationFrame(atmoRaf);
    if(reduce){ cur=JSON.parse(JSON.stringify(tgt)); applyAtmo(map,cur); return; }
    const from = JSON.parse(JSON.stringify(cur)), t0=performance.now(), D=2200;
    (function step(t){
      const k=ease(Math.min(1,(t-t0)/D));
      cur = {
        sky:{c:lerpC(from.sky.c,tgt.sky.c,k),h:lerpC(from.sky.h,tgt.sky.h,k),f:lerpC(from.sky.f,tgt.sky.f,k),
             shb:lerp(from.sky.shb,tgt.sky.shb,k),hfb:lerp(from.sky.hfb,tgt.sky.hfb,k),fgb:lerp(from.sky.fgb,tgt.sky.fgb,k)},
        hs:{ex:lerp(from.hs.ex,tgt.hs.ex,k),dir:lerpA(from.hs.dir,tgt.hs.dir,k),sh:lerpC(from.hs.sh,tgt.hs.sh,k),
            hi:lerpC(from.hs.hi,tgt.hs.hi,k),ac:lerpC(from.hs.ac,tgt.hs.ac,k)},
        ras:{sat:lerp(from.ras.sat,tgt.ras.sat,k),con:lerp(from.ras.con,tgt.ras.con,k),bri:lerp(from.ras.bri,tgt.ras.bri,k)}
      };
      applyAtmo(map,cur);
      if(k<1) atmoRaf=requestAnimationFrame(step); else atmoRaf=null;
    })(t0);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // CANVAS WEATHER
  // ═══════════════════════════════════════════════════════════════════════
  const sc = document.getElementById('snow');
  const sx = sc ? sc.getContext('2d', {alpha:true}) : null;

  // Render at a capped pixel ratio: retina phones don't need 3× of fog.
  const MOBILE = matchMedia('(max-width:820px)').matches;
  const RS = Math.min(MOBILE ? 1 : 1.25, window.devicePixelRatio || 1);
  let W = 0, H = 0;                              // CSS px (logical)

  // ── value-noise fBm, borrowed from the prototype ───────────────────────
  // The x axis wraps on a whole number of noise periods, so one tile can be
  // laid end to end across the screen with no seam; the y axis is faded to
  // nothing at the tile's own top and bottom instead, which is what turns a
  // rectangle of noise into a band of cloud.
  function mkNoise(seed){
    const Pm = new Uint8Array(512); for(let i=0;i<256;i++) Pm[i]=i;
    let s = seed>>>0 || 1;
    const rnd = ()=>((s = (s*1664525 + 1013904223)>>>0) / 4294967296);
    for(let i=255;i>0;i--){ const j=(rnd()*(i+1))|0; const t=Pm[i]; Pm[i]=Pm[j]; Pm[j]=t; }
    for(let i=0;i<256;i++) Pm[256+i]=Pm[i];
    const fade=t=>t*t*t*(t*(t*6-15)+10);
    const gr=(h,x,y)=>((h&1)?x:-x)+((h&2)?y:-y);
    function pn(x,y,per){
      const Xi=Math.floor(x), Yi=Math.floor(y);
      const fx=x-Xi, fy=y-Yi;
      const X0=((Xi%per)+per)%per, X1=((Xi+1)%per+per)%per;
      const Y=Yi&255, u=fade(fx), v=fade(fy);
      const A=Pm[X0]+Y, B=Pm[X1]+Y;
      return lerp(lerp(gr(Pm[A],fx,fy),    gr(Pm[B],fx-1,fy),    u),
                  lerp(gr(Pm[A+1],fx,fy-1),gr(Pm[B+1],fx-1,fy-1),u), v);
    }
    return function fbm(x,y,oct,per){
      let a=0,f=1,m=.5,p=per;
      for(let i=0;i<oct;i++){ a+=m*pn(x*f,y*f,p); f*=2; m*=.5; p*=2; }
      return a;
    };
  }

  // One 256-px noise tile per kind, made once and then only ever blitted.
  // per = whole noise periods across the tile (what makes x seamless),
  // sq = vertical squash, edge = fraction of the tile height faded out.
  const TILES = {};
  function tile(kind){
    if(TILES[kind]) return TILES[kind];
    const spec = {
      // kind:      [size, seed, per, gain, thr, octaves, squashY, edge]
      sea:          [256, 11,  5, 1.45, .26, 4, 1.9, .30],
      cirrus:       [256, 29,  3,  .60, .38, 3, 3.4, .34],
      storm:        [256, 41,  6, 1.70, .16, 4, 1.5, .13],
      stormFine:    [256, 57, 11, 1.15, .30, 4, 1.2, .13],
      mist:         [256, 71,  4,  .85, .30, 3, 2.2, .40],
      milky:        [256, 83, 10,  .55, .26, 4, 3.0, .22],
      frost:        [256, 97, 17, 1.70, .36, 4, 1.0, .02]
    }[kind];
    const [N,seed,per,gain,thr,oct,sq,edge] = spec;
    const fbm = mkNoise(seed);
    const o = document.createElement('canvas'); o.width=o.height=N;
    const c = o.getContext('2d'), im = c.createImageData(N,N), d = im.data;
    const E = Math.max(1, edge*N);
    for(let j=0;j<N;j++){
      // smoothstep fade at the tile's own top and bottom edge
      let e = Math.min(1, Math.min(j, N-1-j)/E); e = e*e*(3-2*e);
      for(let i=0;i<N;i++){
        let n = fbm(i/N*per, j/N*per*sq, oct, per);
        n = Math.max(0,(n + .55 - thr)) * gain * e;
        const k=(j*N+i)*4;
        d[k]=245; d[k+1]=241; d[k+2]=234; d[k+3]=Math.min(255, n*255)|0;
      }
    }
    c.putImageData(im,0,0);
    return (TILES[kind]=o);
  }

  // ── star fields: two alternating layers so the twinkle costs nothing ───
  let STARS = null;
  function stars(){
    if(STARS) return STARS;
    const SW=1280, SH=560;
    const mk = (n, seed, big)=>{
      const o=document.createElement('canvas'); o.width=SW; o.height=SH;
      const c=o.getContext('2d'); let s=seed;
      const r=()=>((s=(s*1103515245+12345)>>>0)/4294967296);
      for(let i=0;i<n;i++){
        const x=r()*SW, y=Math.pow(r(),1.45)*SH, m=r();
        c.fillStyle='rgba(228,234,255,'+(.3+m*.7).toFixed(2)+')';
        const sz = (m>big)?1.9:1;
        c.fillRect(x,y,sz,sz);
      }
      return o;
    };
    return (STARS = [mk(430, 20260919, .93), mk(400, 77712345, .95)]);
  }

  // ── screen-sized masks, rebuilt only on resize ─────────────────────────
  let WHITEOUT=null, FROST=null;
  function masks(){
    if(WHITEOUT || !W) return;
    // whiteout: clear centre, milky toward the frame edge
    const a=document.createElement('canvas'); a.width=Math.max(1,W>>1); a.height=Math.max(1,H>>1);
    const ac=a.getContext('2d');
    const gd=ac.createRadialGradient(a.width/2,a.height/2,a.height*.32,a.width/2,a.height/2,a.height*.95);
    gd.addColorStop(0,'rgba(233,235,238,.10)'); gd.addColorStop(.55,'rgba(233,235,238,.40)');
    gd.addColorStop(1,'rgba(233,235,238,1)');
    ac.fillStyle=gd; ac.fillRect(0,0,a.width,a.height);
    WHITEOUT=a;
    // frost: the fine noise tile, punched out in the middle so it only
    // creeps in from the edges
    const b=document.createElement('canvas'); b.width=Math.max(1,W>>1); b.height=Math.max(1,H>>1);
    const bc=b.getContext('2d'); const t=tile('frost');
    bc.drawImage(t,-20,-20,b.width+40,b.height+40);
    bc.globalCompositeOperation='destination-out';
    const gd2=bc.createRadialGradient(b.width/2,b.height/2,0,b.width/2,b.height/2,b.height*.86);
    gd2.addColorStop(0,'rgba(0,0,0,1)'); gd2.addColorStop(.55,'rgba(0,0,0,.92)');
    gd2.addColorStop(1,'rgba(0,0,0,0)');
    bc.fillStyle=gd2; bc.fillRect(0,0,b.width,b.height);
    FROST=b;
  }

  function sz(){
    if(!sc) return;
    W = innerWidth; H = innerHeight;
    sc.width = Math.round(W*RS); sc.height = Math.round(H*RS);
    sc.style.width = W+'px'; sc.style.height = H+'px';
    if(sx) sx.setTransform(RS,0,0,RS,0,0);
    WHITEOUT=null; FROST=null;
    if(anchorSet===false){ ax = W*.60; ay = H*.17; }
    kick();
  }

  // ── layer weights ──────────────────────────────────────────────────────
  // sea    valley cloud sea (lower third)     cir   thin high cirrus
  // thick  driving storm cloud                mist  faint night mist band
  // star   star field + milky way             drift spindrift density
  // snow   snowfall amount                    fall  snowfall speed
  // white  whiteout falloff                   frost edge frost (slow ramp)
  // gale   wind strength
  const Z = {sea:0,cir:0,thick:0,mist:0,star:0,drift:0,snow:0,fall:1,white:0,frost:0,gale:.3};
  const GRADES = {
    '':        {sea:.34,cir:.26,thick:0,  mist:0,  star:0,drift:.30,snow:0,  fall:1,  white:0,  frost:0,gale:.30},
    'g-day':   {sea:.62,cir:.30,thick:0,  mist:0,  star:0,drift:.50,snow:0,  fall:1,  white:0,  frost:0,gale:.34},
    'g-storm': {sea:0,  cir:0,  thick:1,  mist:0,  star:0,drift:.95,snow:1,  fall:3.0,white:1,  frost:1,gale:1},
    'g-night': {sea:0,  cir:0,  thick:0,  mist:.34,star:1,drift:.10,snow:0,  fall:1,  white:0,  frost:0,gale:.14},
    'g-dusk':  {sea:.50,cir:.24,thick:0,  mist:0,  star:0,drift:.40,snow:.26,fall:1.0,white:0,  frost:0,gale:.42},
    'g-mourn': {sea:.10,cir:0,  thick:.58,mist:0,  star:0,drift:.28,snow:.50,fall:1.8,white:.20,frost:0,gale:.55},
    'g-city':  {sea:.10,cir:.10,thick:0,  mist:.10,star:0,drift:0,  snow:0,  fall:1,  white:0,  frost:0,gale:.20}
  };
  let T = Object.assign({}, GRADES['']);
  let curGrade = '';
  let windBias = null;              // set by __wx.wind()

  // ── particles ──────────────────────────────────────────────────────────
  const flakes=[], spin=[], streaks=[];
  function mkFlake(top){ const z=Math.random();
    return {x:Math.random()*W, y:top?-8-Math.random()*H*.2:Math.random()*H, z,
            r:.6+z*2.2, w:Math.random()*6.28}; }
  function mkSpin(){ return {t:Math.random(), s:.45+Math.random()*.9,
            j:(Math.random()-.5), l:.4+Math.random()*1.3, o:Math.random()*.6+.4}; }
  function mkStreak(){ return {x:Math.random()*(W*1.6)-W*.3, y:Math.random()*H,
            l:34+Math.random()*90, a:.12+Math.random()*.36, v:.7+Math.random()*.9}; }

  // spindrift anchor (screen px) — the summit ridge, upper-centre
  let ax=0, ay=0, anchorSet=false;

  // ── loop ───────────────────────────────────────────────────────────────
  let raf=null, last=0, born=performance.now(), stormSince=0;
  let bAcc=0, lastB=null, pitchP=0;
  let mapRef=null;
  let dbgN=0, dbgSum=0;

  function active(){
    return Z.sea>.004||Z.cir>.004||Z.thick>.004||Z.mist>.004||Z.star>.004||
           Z.drift>.004||Z.snow>.004||Z.white>.004||Z.frost>.004;
  }
  function kick(){ if(!raf && !reduce && sx) { last=performance.now(); raf=requestAnimationFrame(frame); } }

  function lite(){ return document.body.classList.contains('lite'); }

  function frame(now){
    raf=null;
    if(document.hidden){ return; }        // parked; visibilitychange kicks
    const t0 = DEBUG ? performance.now() : 0;
    // `dt` drives the particles and is clamped hard so a dropped frame
    // cannot teleport them; `de` drives the eases and follows wall-clock,
    // so a grade transition still takes ~2.5 s on a slow, frame-starved
    // machine instead of stretching out with the frame rate.
    const raw = now-last || 16;
    const dt = Math.min(60, raw), de = Math.min(600, raw); last=now;

    // ease every weight toward its target; frost creeps in much slower (6 s)
    for(const k in Z){
      const tau = (k==='frost') ? 6000 : (k==='fall' ? 1800 : 2500);
      Z[k] += ((T[k]||0) - Z[k]) * Math.min(1, de/tau);
    }

    if(!active()){ sx.clearRect(0,0,W,H); return; }   // park
    raf = requestAnimationFrame(frame);

    // parallax from the camera: bearing scrolls the banks sideways, pitch
    // lifts them. getBearing/getPitch are plain property reads.
    if(mapRef){
      try{
        const b = mapRef.getBearing();
        if(lastB===null) lastB=b;
        bAcc += ((b-lastB+540)%360)-180; lastB=b;
        pitchP += (mapRef.getPitch() - pitchP)*Math.min(1,de/600);
      }catch(e){ mapRef=null; }
    }

    const L = lite();
    const age = now-born;
    const gale = (windBias==null ? Z.gale : lerp(Z.gale,windBias,.75));
    const gust = gale*(1+.42*Math.sin(now*.00042)+.24*Math.sin(now*.0011+2));

    sx.clearRect(0,0,W,H);

    // ── 1 · cloud banks ──────────────────────────────────────────────────
    // Two depths; each drifts on its own clock and shifts with the camera.
    const px = (d)=> -bAcc*3.2*d;                 // parallax x
    const py = (d)=> (pitchP-55)*.9*d;            // parallax y

    // A band is one seamless tile repeated across the screen; `sh` is its
    // scroll in tile widths, so a bank can drift for ever without a jump.
    function band(t, sh, y, w, h, a){
      if(a<=.004) return;
      sx.globalAlpha=a;
      let x = -(((sh % 1) + 1) % 1) * w;
      for(let k = Math.ceil((W - x)/w); k>0; k--, x+=w) sx.drawImage(t, x, y, w, h);
    }

    if(Z.sea>.004){
      const w=W*1.05, h=H*.80;
      band(tile('sea'), age*.000021 - px(1)/w, H*.40 + py(1) + Math.sin(age*.00012)*H*.012,
           w, h, Z.sea);
    }
    if(Z.cir>.004){
      const w=W*1.35, h=H*.46;
      band(tile('cirrus'), age*.000044 - px(.45)/w, -H*.06+py(.4), w, h, Z.cir*.85);
    }
    if(Z.thick>.004){
      const w1=W*1.25, h1=H*1.55;
      band(tile('storm'), age*.00013 - px(1.35)/w1, -H*.2+py(1.2), w1, h1, Z.thick);
      const w2=W*.95, h2=H*1.25;
      band(tile('stormFine'), age*.00027+.3 - px(2.1)/w2, -H*.06+py(1.9), w2, h2, Z.thick*.66);
    }
    if(Z.mist>.004){
      const w=W*1.1, h=H*.5;
      band(tile('mist'), age*.000016 - px(.7)/w, H*.5+py(.6), w, h, Z.mist*.8);
    }
    sx.globalAlpha=1;

    // ── 4 · night sky ────────────────────────────────────────────────────
    // Stars only above the skyline (terrain starts ≈ 35 % down); the two
    // pre-rendered layers cross-fade to twinkle without touching a pixel.
    if(Z.star>.004 && !L){
      const S=stars(), skyH=H*.36;
      const k=.5+.5*Math.sin(now*.0009);
      sx.globalAlpha=Z.star*(.55+.45*k);   sx.drawImage(S[0],0,0,W,skyH);
      sx.globalAlpha=Z.star*(.55+.45*(1-k)); sx.drawImage(S[1],0,0,W,skyH);
      const mw=tile('milky'), w=W*1.3;
      sx.globalAlpha=Z.star*.17;
      sx.drawImage(mw, -W*.12+px(.15), -H*.03, w, skyH*1.25);
      sx.globalAlpha=1;
    }

    if(L){ if(DEBUG) tally(t0); return; }   // lite mode: clouds only

    // ── 3 · storm system ─────────────────────────────────────────────────
    if(Z.white>.004){
      masks();
      // wind-driven streaks at a fixed angle
      const n=Math.round(210*Z.white);
      while(streaks.length<n) streaks.push(mkStreak());
      if(streaks.length>n) streaks.length=n;
      sx.strokeStyle='rgba(240,238,232,1)'; sx.lineWidth=1;
      sx.beginPath();
      for(let i=0;i<streaks.length;i++){
        const s=streaks[i];
        s.x -= (5.2+gust*4.6)*s.v*(dt/16);
        s.y += (1.5+gust*1.3)*s.v*(dt/16);
        if(s.x<-W*.35){ s.x=W*1.25; s.y=Math.random()*H; }
        if(s.y>H){ s.y=-20; }
        sx.moveTo(s.x,s.y); sx.lineTo(s.x-s.l, s.y+s.l*.28);
      }
      sx.globalAlpha=.42*Z.white; sx.stroke(); sx.globalAlpha=1;
      // radial visibility falloff
      if(WHITEOUT){ sx.globalAlpha=Z.white*(.88+.09*Math.sin(now*.0006)); sx.drawImage(WHITEOUT,0,0,W,H); sx.globalAlpha=1; }
    }
    // frost creeping in from the edges while the storm holds
    if(Z.frost>.004){
      masks();
      if(FROST){ sx.globalAlpha=Z.frost*.70; sx.drawImage(FROST,0,0,W,H); sx.globalAlpha=1; }
    }

    // ── 2 · spindrift off the ridge ──────────────────────────────────────
    if(Z.drift>.004){
      const n=Math.round((150+150*Math.min(1,gale))*Z.drift);
      while(spin.length<n) spin.push(mkSpin());
      if(spin.length>n) spin.length=n;
      const len=W*(.22+.34*Math.min(1,gale)), slope=-0.22-0.16*Math.min(1,gale);
      sx.fillStyle='#f5f1e8';
      for(let i=0;i<spin.length;i++){
        const p=spin[i];
        p.t += (0.0016+0.0042*gale)*p.s*(dt/16);
        if(p.t>1){ p.t-=1; p.j=(Math.random()-.5); p.l=.4+Math.random()*1.3; }
        const t=p.t;
        const x=ax + t*len + Math.sin(t*7+p.j*6)*6;
        const y=ay + t*len*slope + p.j*30*(1+t*2.6) + Math.sin(now*.002+p.j*9)*2;
        sx.globalAlpha=Z.drift*p.o*(1-t*.86)*1.05;
        sx.fillRect(x, y, 1+t*4.2*p.l, 1);
      }
      sx.globalAlpha=1;
    }

    // ── 5 · snowfall, three depth classes ────────────────────────────────
    if(Z.snow>.004){
      const n=Math.round(300*Z.snow);
      while(flakes.length<n) flakes.push(mkFlake(true));
      if(flakes.length>n) flakes.length=n;
      const fall=Z.fall;
      // near / mid / far drawn in one pass each so alpha is set 3 times
      for(let cls=0; cls<3; cls++){
        const lo=cls/3, hi=(cls+1)/3;
        sx.globalAlpha=Z.snow*(.22+cls*.26);
        sx.fillStyle = cls===2 ? 'rgba(246,245,238,1)' : 'rgba(238,238,231,1)';
        if(cls===2){ sx.strokeStyle='rgba(243,245,249,1)'; }
        for(let i=0;i<flakes.length;i++){
          const f=flakes[i]; if(f.z<lo||f.z>=hi) continue;
          const depth=.35+f.z*.65;
          f.y += (0.4+f.z*1.7)*fall*depth*(dt/16);
          f.x += (Math.sin(f.w+=.011)*.45 - gust*depth*1.9)*(dt/16);
          if(f.y>H){ f.y=-4; f.x=Math.random()*W; }
          if(f.x>W+8) f.x=-6; else if(f.x<-8) f.x=W+6;
          if(cls===2 && fall>1.6){
            sx.lineWidth=f.r*.8;
            sx.beginPath(); sx.moveTo(f.x,f.y);
            sx.lineTo(f.x+gust*depth*3.0, f.y-(0.4+f.z*1.7)*fall*depth*3.4);
            sx.stroke();
          } else {
            const r=f.r*(cls===0?.7:1);
            sx.fillRect(f.x, f.y, r, r);
          }
        }
      }
      sx.globalAlpha=1;
    }

    if(DEBUG) tally(t0);
  }

  function tally(t0){
    dbgSum += performance.now()-t0; dbgN++;
    if(dbgN>=120){ console.log('[wx] '+(dbgSum/dbgN).toFixed(2)+' ms/frame · '+curGrade); dbgSum=0; dbgN=0; }
  }

  // reduced motion: one static frame per grade, no loop, no particles
  function still(){
    if(!sx) return;
    for(const k in Z) Z[k]=T[k]||0;
    sx.clearRect(0,0,W,H);
    if(Z.sea>.01){ sx.globalAlpha=Z.sea*.95; sx.drawImage(tile('sea'),-W*.18,H*.46,W*1.55,H*.72); }
    if(Z.cir>.01){ sx.globalAlpha=Z.cir*.62; sx.drawImage(tile('cirrus'),-W*.22,-H*.06,W*1.7,H*.46); }
    if(Z.thick>.01){ sx.globalAlpha=Z.thick*.78; sx.drawImage(tile('storm'),-W*.3,-H*.16,W*1.9,H*1.5); }
    if(Z.mist>.01){ sx.globalAlpha=Z.mist*.8; sx.drawImage(tile('mist'),-W*.16,H*.5,W*1.4,H*.5); }
    if(Z.star>.01){ const S=stars(); sx.globalAlpha=Z.star*.9; sx.drawImage(S[0],0,0,W,H*.36); }
    if(Z.white>.01){ masks(); if(WHITEOUT){ sx.globalAlpha=Z.white*.86; sx.drawImage(WHITEOUT,0,0,W,H);} }
    if(Z.frost>.01){ masks(); if(FROST){ sx.globalAlpha=Z.frost*.46; sx.drawImage(FROST,0,0,W,H);} }
    sx.globalAlpha=1;
  }

  function wxTo(g){
    curGrade = g;
    T = GRADES[g] || GRADES[''];
    if(g==='g-storm' && !stormSince) stormSince=performance.now();
    if(g!=='g-storm') stormSince=0;
    const anyTarget = T.sea||T.cir||T.thick||T.mist||T.star||T.drift||T.snow||T.white;
    if(sc) sc.classList.toggle('on', !!anyTarget);
    if(reduce){ still(); return; }
    kick();
  }

  if(sc){
    sz();
    let rt=null;
    addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ sz(); if(reduce) still(); },160); });
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) kick(); });
  }

  if(DEBUG) window.__wxZ = Z;
  window.__wx = {
    grade: function(g, map){
      g = g||'';
      if(map) { mapRef = map; toGrade(map, g); }
      wxTo(g);
    },
    // 0–1 wind bias; null hands control back to the grade
    wind: function(level){ windBias = (level==null) ? null : Math.max(0,Math.min(1,+level||0)); kick(); },
    // screen-space source for the spindrift plume (the summit ridge)
    anchor: function(x,y){ if(x==null){ anchorSet=false; ax=W*.60; ay=H*.17; return; }
                           anchorSet=true; ax=+x; ay=+y; }
  };

  // follow extras.js's wind level if it ever publishes one
  if(typeof window.__windLevel === 'number') window.__wx.wind(window.__windLevel);
  setInterval(()=>{ if(typeof window.__windLevel === 'number') windBias=Math.max(0,Math.min(1,window.__windLevel)); }, 800);
})();

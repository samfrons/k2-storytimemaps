// ═════════ WEATHER — the mountain's atmosphere, rendered ═════════
// Shared by the 1939 engine and the era engine (load order: weather →
// engine → chrome → extras). Owns two things the grade system used to fake
// with CSS tint alone:
//
//   1. The MapLibre atmosphere: per-grade sky/fog presets and terrain
//      relighting (hillshade + raster paint), eased over ~2 s — a storm now
//      drops real fog onto the terrain and flattens its light; night raises
//      a moon-blue hillshade; dusk warms the rock.
//   2. The #snow canvas: three parallax depth layers, wind gusts, velocity
//      streaks in storm, drifting cloud banks, and density that ramps
//      instead of snapping.
//
// Contract: engines call  window.__wx.grade(g, map)  from setGrade (map is
// always ready by then — setGrade only fires from camTick after load). If
// this file is absent the engines fall back to their own flat snow, so the
// pages degrade exactly to the pre-weather behavior.
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── atmosphere presets ─────────────────────────────────────────────────
  // sky: MapLibre sky spec · hs: hillshade paint · ras: raster paint
  const BASE = {
    sky:{c:'#0d1320',h:'#c9b895',f:'#3a3629',shb:.6,hfb:.55,fgb:.62},
    hs:{ex:.35,sh:'#221c14',hi:'#f6ecd6',ac:'#3a342a'},
    ras:{sat:-.45,con:.08,bri:.92}
  };
  const P = {
    '': BASE,
    'g-day':  {sky:{c:'#2a3f5c',h:'#d8c9a0',f:'#4a443a',shb:.55,hfb:.5, fgb:.55},
               hs:{ex:.35,sh:'#241d14',hi:'#fff2d8',ac:'#3a342a'},
               ras:{sat:-.35,con:.1, bri:.95}},
    'g-storm':{sky:{c:'#3f4650',h:'#6d7580',f:'#5c636e',shb:.85,hfb:.85,fgb:.95},
               hs:{ex:.28,sh:'#2a2f38',hi:'#b8c0cc',ac:'#3a4048'},
               ras:{sat:-.75,con:0,  bri:.62}},
    'g-night':{sky:{c:'#050a16',h:'#16223c',f:'#0e1626',shb:.7, hfb:.7, fgb:.8},
               hs:{ex:.45,sh:'#04060c',hi:'#7d95bd',ac:'#101826'},
               ras:{sat:-.7, con:.06,bri:.5}},
    'g-dusk': {sky:{c:'#2a1e30',h:'#c07a48',f:'#4e3226',shb:.65,hfb:.6, fgb:.68},
               hs:{ex:.4, sh:'#301a12',hi:'#f0c896',ac:'#402a1c'},
               ras:{sat:-.3, con:.08,bri:.78}},
    'g-mourn':{sky:{c:'#565a60',h:'#a8a49a',f:'#84827c',shb:.75,hfb:.7, fgb:.8},
               hs:{ex:.3, sh:'#26262a',hi:'#d8d6d0',ac:'#3c3c40'},
               ras:{sat:-.85,con:.02,bri:.78}},
    'g-city': {sky:{c:'#1a1210',h:'#8a5c34',f:'#33251a',shb:.65,hfb:.6, fgb:.66},
               hs:{ex:.38,sh:'#241410',hi:'#e0b880',ac:'#38241a'},
               ras:{sat:-.5, con:.08,bri:.7}}
  };

  const hex2rgb = x=>[parseInt(x.slice(1,3),16),parseInt(x.slice(3,5),16),parseInt(x.slice(5,7),16)];
  const rgb2hex = c=>'#'+c.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
  const lerp=(a,b,t)=>a+(b-a)*t;
  const lerpC=(a,b,t)=>rgb2hex(hex2rgb(a).map((v,i)=>lerp(v,hex2rgb(b)[i],t)));
  const ease=t=>t<.5?2*t*t:-1+(4-2*t)*t;

  let cur = JSON.parse(JSON.stringify(BASE));   // last applied values
  let atmoRaf = null;

  function applyAtmo(map, v){
    try{
      if(map.setSky) map.setSky({'sky-color':v.sky.c,'horizon-color':v.sky.h,'fog-color':v.sky.f,
        'sky-horizon-blend':v.sky.shb,'horizon-fog-blend':v.sky.hfb,'fog-ground-blend':v.sky.fgb});
      map.setPaintProperty('hs','hillshade-exaggeration',v.hs.ex);
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
        hs:{ex:lerp(from.hs.ex,tgt.hs.ex,k),sh:lerpC(from.hs.sh,tgt.hs.sh,k),
            hi:lerpC(from.hs.hi,tgt.hs.hi,k),ac:lerpC(from.hs.ac,tgt.hs.ac,k)},
        ras:{sat:lerp(from.ras.sat,tgt.ras.sat,k),con:lerp(from.ras.con,tgt.ras.con,k),bri:lerp(from.ras.bri,tgt.ras.bri,k)}
      };
      applyAtmo(map,cur);
      if(k<1) atmoRaf=requestAnimationFrame(step); else atmoRaf=null;
    })(t0);
  }

  // ── snow + clouds ──────────────────────────────────────────────────────
  const sc=document.getElementById('snow');
  const sx=sc?sc.getContext('2d'):null;
  function sz(){ if(sc){sc.width=innerWidth; sc.height=innerHeight;} }
  sz(); addEventListener('resize',sz);

  // pre-rendered cloud sprite (soft radial blob)
  const SPRITE=document.createElement('canvas'); SPRITE.width=SPRITE.height=256;
  (function(){ const c=SPRITE.getContext('2d');
    for(let i=0;i<7;i++){
      const x=48+Math.random()*160,y=88+Math.random()*80,r=46+Math.random()*66;
      const g=c.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(232,236,242,.16)'); g.addColorStop(1,'rgba(232,236,242,0)');
      c.fillStyle=g; c.beginPath(); c.arc(x,y,r,0,7); c.fill();
    }
  })();

  // mode targets: [flakes, cloud opacity, fall speed, gale]
  const MODES={ storm:[300,1,3.0,3.2], calm:[110,0,1.0,.4], sparse:[50,.35,.7,.25], off:[0,0,1,.3] };
  let mode='off', density=0, cloudOp=0, flakes=[], clouds=[], t0=performance.now();

  for(let i=0;i<6;i++) clouds.push({x:Math.random(), y:.05+Math.random()*.5,
    s:1.2+Math.random()*1.8, v:.00006+Math.random()*.00012, z:.3+Math.random()*.7});

  function mkFlake(top){ const z=Math.random();
    return {x:Math.random()*innerWidth, y:top?-6:Math.random()*innerHeight,
      z, r:.5+z*2.1, w:Math.random()*Math.PI*2}; }

  function snowTo(g){
    mode = g==='g-storm'?'storm' : g==='g-night'?'calm' : g==='g-mourn'?'sparse' : 'off';
    if(sc) sc.classList.toggle('on', mode!=='off' && !reduce);
  }

  let last=performance.now();
  (function loop(now){
    requestAnimationFrame(loop);
    if(!sx||reduce) return;
    const dt=Math.min(50, now-last); last=now;
    const M=MODES[mode];
    // ramp density + cloud opacity toward targets
    density += (M[0]-density)*Math.min(1,dt/1400);
    cloudOp += (M[1]-cloudOp)*Math.min(1,dt/2000);
    const n=Math.round(density);
    while(flakes.length<n) flakes.push(mkFlake(true));
    if(flakes.length>n) flakes.length=n;
    if(!flakes.length && cloudOp<.01){ if(sc.width) sx.clearRect(0,0,sc.width,sc.height); return; }

    sx.clearRect(0,0,sc.width,sc.height);

    // cloud banks (behind the snow), storm/mourn only
    if(cloudOp>.01){
      const drift=(now-t0);
      clouds.forEach(c=>{
        const w=sc.width*c.s, h=w*.55;
        const x=((c.x+drift*c.v*c.z)%1.4-0.2)*sc.width;
        sx.globalAlpha=cloudOp*(.5+.5*c.z);
        sx.drawImage(SPRITE, x-w/2, c.y*sc.height-h/2, w, h);
      });
      sx.globalAlpha=1;
      if(mode==='storm'){ // whiteout breath
        sx.fillStyle='rgba(205,212,222,'+(0.05+0.04*Math.sin(now*.0006))+')';
        sx.fillRect(0,0,sc.width,sc.height);
      }
    }

    // wind: slow oscillation + per-flake wobble; storm adds hard gusts
    const gale = M[3]*(1+.45*Math.sin(now*.00042)+.25*Math.sin(now*.0011+2));
    const fall = M[2];
    flakes.forEach(f=>{
      const depth=.35+f.z*.65;
      f.y += (0.4+f.z*1.6)*fall*depth*(dt/16);
      f.x += (Math.sin(f.w+=.011)*.4 + gale*depth)*(dt/16);
      if(f.y>sc.height){ f.y=-4; f.x=Math.random()*sc.width; }
      if(f.x>sc.width+6) f.x=-4; else if(f.x<-6) f.x=sc.width+4;
      const a=.28+f.z*.6;
      if(mode==='storm' && f.z>.42){
        // streaked flake along its velocity
        sx.strokeStyle='rgba(240,243,248,'+a+')';
        sx.lineWidth=f.r*.85;
        sx.beginPath(); sx.moveTo(f.x,f.y);
        sx.lineTo(f.x-gale*depth*2.6, f.y-(0.4+f.z*1.6)*fall*depth*3.2);
        sx.stroke();
      } else {
        sx.fillStyle='rgba(241,240,232,'+a+')';
        sx.beginPath(); sx.arc(f.x,f.y,f.r,0,7); sx.fill();
      }
    });
  })(performance.now());

  window.__wx = {
    grade: function(g, map){ if(map) toGrade(map, g||''); snowTo(g||''); }
  };
})();

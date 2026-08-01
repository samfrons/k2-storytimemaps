// ═════════ v13 · WIND · SCRUBBER · LETTERBOX · TYPEWRITER · NIGHT ═════════
(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── WIND (WebAudio, synthesized — off by default)
  let ac=null, master=null, bp1=null, bp2=null, windOn=false, gustT=null;
  const sndBtn=document.getElementById('btnWind');
  function windInit(){
    ac = new (window.AudioContext||window.webkitAudioContext)();
    const len=ac.sampleRate*2, buf=ac.createBuffer(1,len,ac.sampleRate), d=buf.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
    const src=ac.createBufferSource(); src.buffer=buf; src.loop=true;
    bp1=ac.createBiquadFilter(); bp1.type='bandpass'; bp1.frequency.value=170; bp1.Q.value=.55;
    bp2=ac.createBiquadFilter(); bp2.type='bandpass'; bp2.frequency.value=430; bp2.Q.value=1.1;
    const g1=ac.createGain(), g2=ac.createGain(); g1.gain.value=.7; g2.gain.value=.4;
    master=ac.createGain(); master.gain.value=0;
    src.connect(bp1); bp1.connect(g1); g1.connect(master);
    src.connect(bp2); bp2.connect(g2); g2.connect(master);
    master.connect(ac.destination); src.start();
    gustT=setInterval(()=>{ if(!windOn) return;
      const t=ac.currentTime;
      bp1.frequency.setTargetAtTime(120+Math.random()*160, t, .9);
      bp2.frequency.setTargetAtTime(320+Math.random()*260, t, .7);
    }, 900);
    setInterval(windLevel, 260);
  }
  function windLevel(){
    if(!ac) return;
    const alt=window.__alt||16500, g=window.__grade||'';
    let v=.05+.4*Math.min(1,Math.max(0,(alt-16500)/11700));
    if(g==='g-storm') v*=2.3;
    if(g==='g-mourn') v*=.4;
    if(document.body.classList.contains('memnight')) v=.025;
    if(document.body.classList.contains('explore')) v=.22;
    master.gain.setTargetAtTime(windOn?v:0, ac.currentTime, .9);
  }
  if(sndBtn) sndBtn.addEventListener('click',()=>{
    if(!ac) windInit();
    if(ac.state==='suspended') ac.resume();
    windOn=!windOn; sndBtn.classList.toggle('on',windOn);
    sndBtn.textContent=windOn?'✕ Wind':'♪ Wind';
    windLevel();
  });

  // ── LETTERBOX while clips are visible
  const visClips=new Set();
  const lbIO=new IntersectionObserver(es=>{es.forEach(e=>{
    if(e.isIntersecting) visClips.add(e.target); else visClips.delete(e.target);
    document.body.classList.toggle('filmy', visClips.size>0);
  })},{threshold:.4});
  document.querySelectorAll('video.clip').forEach(v=>lbIO.observe(v));

  // ── TIMELINE SCRUBBER (built from ev anchors)
  const DATES=['Jun 1','Jun 14','Jun 21–29','Jun 30–Jul 1','Jul 6','Jul 13','Jul 14','Jul 17','Jul 19','Jul 20–21','Jul 22','Jul 24–25','Jul 28','Jul 29','Jul 31','Aug 2','Aug 3–7'];
  const TRG=[9,10,11,13,14,15,16], PH=[0,1,4,7,9,12,15];
  const scrub=document.getElementById('scrub'), sd=document.createElement('div');
  if(scrub){
    sd.className='sd'; scrub.appendChild(sd);
    DATES.forEach((dte,i)=>{
      const b=document.createElement('button'); b.className='tk';
      if(TRG.includes(i)) b.classList.add('trg');
      if(PH.includes(i)) b.classList.add('ph');
      b.title=dte+', 1939';
      b.addEventListener('click',()=>{ const el=document.getElementById('ev'+i);
        if(el) el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'}); });
      scrub.appendChild(b);
    });
    window.__scrubSet=function(i, active){
      scrub.classList.toggle('show', !!active);
      [...scrub.querySelectorAll('.tk')].forEach((b,k)=>b.classList.toggle('cur',k===i));
      sd.textContent=i>=0?(DATES[i]+' · 1939'):'';
    };
  }

  // ── TYPEWRITER on the expedition record
  const rec=document.querySelector('.record');
  if(rec && !reduce){
    const ps=[...rec.querySelectorAll('p')].filter(p=>!p.classList.contains('rec-meta'));
    const texts=ps.map(p=>p.textContent);
    let done=false;
    new IntersectionObserver((es,o)=>{es.forEach(e=>{
      if(e.isIntersecting && !done){ done=true; o.disconnect();
        ps.forEach(p=>p.textContent='');
        rec.classList.add('typing');
        let pi=0;
        (function typeP(){
          if(pi>=ps.length){rec.classList.remove('typing');return;}
          const full=texts[pi], el=ps[pi]; let ci=0;
          const iv=setInterval(()=>{ ci+=2; el.textContent=full.slice(0,ci);
            if(ci>=full.length){clearInterval(iv); pi++; setTimeout(typeP,140);} },14);
        })();
      }
    })},{threshold:.25}).observe(rec);
  }

  // ── EVIDENCE ROOM flip
  const docs=[...document.querySelectorAll('.ev-docs .doc')];
  docs.forEach(d=>d.addEventListener('click',()=>{
    docs.forEach(x=>{x.classList.toggle('front',x===d);x.classList.toggle('back',x!==d);});
  }));

  // ── STARFIELD canvas (drawn once)
  const st=document.getElementById('stars');
  if(st){ const c=st.getContext('2d');
    function draw(){ st.width=innerWidth; st.height=innerHeight; c.clearRect(0,0,st.width,st.height);
      for(let i=0;i<170;i++){ const r=Math.random();
        c.fillStyle='rgba(241,240,230,'+(0.25+r*.6)+')';
        c.beginPath(); c.arc(Math.random()*st.width, Math.random()*st.height*.75, r*1.3+.3, 0, 7); c.fill(); } }
    draw(); addEventListener('resize',draw);
  }
  const mem=document.getElementById('memorial');
  if(mem) new IntersectionObserver(es=>{es.forEach(e=>{
    document.body.classList.toggle('memnight', e.isIntersecting);
    if(window.__flame) window.__flame(e.isIntersecting);
  })},{rootMargin:'-18% 0px -18% 0px'}).observe(mem);

  // ── VOICE: "play the story" — reads the narrative aloud, scrolling to each
  // block as it speaks (Web Speech API: keyless, local, free)
  const vBtn=document.getElementById('btnVoice');
  if(vBtn && 'speechSynthesis' in window){
    const SEL='.prologue h1,.prologue .sub,.pq-sky,.ch-cover .inner,.narrative > p,.narrative > .pq,.record p,.cast .cc,.over-card,.evroom .ev-head,.doc,.ev-verdict,.mem-inner > p,.footer .final';
    const blockText=el=>{
      const c=el.cloneNode(true);
      c.querySelectorAll('figure,figcaption,.snd,.src,.mono,.film-more').forEach(n=>n.remove());
      return c.textContent.replace(/·/g,', ').replace(/[†✝◈]/g,'')
        .replace(/−/g,'minus ').replace(/~/g,'about ').replace(/\s+/g,' ').trim();
    };
    // snapshot text at load — the typewriter empties the record's <p>s later
    const blocks=[...document.querySelectorAll(SEL)].map(el=>({el,text:blockText(el)})).filter(b=>b.text.length>2);
    let voice=null;
    function pickVoice(){
      const vs=speechSynthesis.getVoices().filter(v=>/^en/i.test(v.lang));
      const rank=v=>(/premium|enhanced|natural/i.test(v.name)?8:0)
        +(/google uk english male/i.test(v.name)?7:0)
        +(/daniel|serena|ava|samantha/i.test(v.name)?4:0)
        +(/google/i.test(v.name)?3:0);
      voice=vs.sort((a,b)=>rank(b)-rank(a))[0]||null;
    }
    pickVoice(); speechSynthesis.addEventListener('voiceschanged',pickVoice);
    // Chrome cuts long utterances off (~15 s); speak in sentence-sized chunks
    const chunks=t=>{const out=[];let cur='';
      t.split(/(?<=[.!?…;:])\s+/).forEach(s=>{ if(cur&&(cur+' '+s).length>220){out.push(cur);cur=s;} else cur=cur?cur+' '+s:s; });
      if(cur)out.push(cur); return out;};
    let playing=false;
    function stopVoice(){ playing=false; speechSynthesis.cancel();
      vBtn.classList.remove('on'); vBtn.textContent='▷ Play story'; }
    function speakBlock(i){
      if(!playing) return;
      if(i>=blocks.length || document.body.classList.contains('explore')) return stopVoice();
      const b=blocks[i];
      b.el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'center'});
      const parts=chunks(b.text); let p=0;
      (function next(){
        if(!playing) return;
        if(document.body.classList.contains('explore')) return stopVoice();
        if(p>=parts.length) return void setTimeout(()=>speakBlock(i+1),400);
        const u=new SpeechSynthesisUtterance(parts[p++]);
        if(voice)u.voice=voice; u.rate=.95;
        u.onend=next; u.onerror=()=>{ if(playing) next(); };
        speechSynthesis.speak(u);
      })();
    }
    vBtn.addEventListener('click',()=>{
      if(playing) return stopVoice();
      playing=true; vBtn.classList.add('on'); vBtn.textContent='✕ Stop story';
      const y=scrollY+innerHeight*.35;
      const i=blocks.findIndex(b=>b.el.getBoundingClientRect().bottom+scrollY>y);
      speakBlock(i<0?0:i);
    });
    addEventListener('beforeunload',()=>speechSynthesis.cancel());
  } else if(vBtn) vBtn.style.display='none';
})();

// ── vignette figure style: archival cutouts (default) ⇄ engraved figures
(function(){
  const b=document.getElementById('btnFig'), st=document.getElementById('stage');
  if(!b||!st) return;
  b.addEventListener('click',()=>{ b.classList.toggle('on', st.classList.toggle('eng')); });
})();

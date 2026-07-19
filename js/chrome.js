// ═════════ CHROME: progress · reveals · covers · rail · altimeter ═════════
(function(){
  const prog=document.getElementById('progress');
  function op(){const h=document.documentElement;prog.style.width=((h.scrollTop/(h.scrollHeight-h.clientHeight))*100).toFixed(2)+'%';}
  addEventListener('scroll',op,{passive:true});op();

  const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}})},{threshold:.18});
  document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

  const cio=new IntersectionObserver(es=>{es.forEach(e=>e.target.classList.toggle('on',e.isIntersecting))},{threshold:.35});
  document.querySelectorAll('.ch-cover').forEach(el=>cio.observe(el));

  const links=[...document.querySelectorAll('.rail a')];
  const rio=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const id=e.target.id;links.forEach(a=>a.classList.toggle('on',a.dataset.ch===id));}})},{rootMargin:'-40% 0px -55% 0px'});
  ['prologue','ch1','ch2','ch3','ch4','ch5','ch6','ch7','memorial'].forEach(id=>{const el=document.getElementById(id);if(el)rio.observe(el);});

  const markers=[...document.querySelectorAll('[data-alt]')].map(el=>({el,alt:+el.dataset.alt}));
  const ftEl=document.getElementById('altiFt'),mEl=document.getElementById('altiM'),
        fill=document.getElementById('altiFill'),alti=document.querySelector('.alti');
  const MAX=28251;
  function at(){
    const mid=scrollY+innerHeight*.5;
    const pts=markers.map(m=>({y:m.el.getBoundingClientRect().top+scrollY,alt:m.alt})).sort((a,b)=>a.y-b.y);
    let alt=pts.length?pts[0].alt:0;
    for(let i=0;i<pts.length;i++){
      if(mid>=pts[i].y){const n=pts[i+1];
        if(n&&mid<n.y){const t=(mid-pts[i].y)/(n.y-pts[i].y);alt=pts[i].alt+(n.alt-pts[i].alt)*t;}
        else alt=pts[i].alt;}
    }
    ftEl.textContent=Math.round(alt).toLocaleString('en-US')+' ft';
    mEl.textContent=Math.round(alt*0.3048).toLocaleString('en-US')+' m';
    fill.style.height=Math.min(100,alt/MAX*100).toFixed(1)+'%';
    alti.classList.toggle('danger',alt>22000);
    window.__alt=alt;
  }
  let raf=null;
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{at();raf=null;});},{passive:true});
  addEventListener('resize',at);at();
})();

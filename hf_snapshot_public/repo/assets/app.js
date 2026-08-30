(()=>{
  'use strict';
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine=matchMedia('(pointer:fine)').matches;
  const mobile=matchMedia('(max-width: 800px)').matches;
  const doc=document.documentElement;
  const meter=document.querySelector('.progress span');
  const sections=[...document.querySelectorAll('.motion-section')];
  const wow=document.querySelector('.wow-spread');
  const glow=document.querySelector('.cursor-glow');
  const hero=document.querySelector('.hero');
  let sx=0,sy=0,px=-500,py=-500,targetX=-500,targetY=-500,ticking=false;

  // Semantic reveal variants and stagger groups.
  document.querySelectorAll('.reveal').forEach((el,i)=>{
    if(!el.dataset.reveal){
      if(el.matches('.rail,.case-title,.section-head')) el.dataset.reveal='left';
      else if(el.matches('figure,.hack-stage,.case-proof,.boundary-visual,.task-route')) el.dataset.reveal='scale';
      else if(el.matches('.adv-summary,.hack-result,.action-cluster')) el.dataset.reveal='clip';
      else el.dataset.reveal=i%3===0?'right':'up';
    }
  });
  [document.querySelectorAll('.adv-grid article'),document.querySelectorAll('.hack-sequence article'),document.querySelectorAll('.boundary-grid article'),document.querySelectorAll('.task-grid article')].forEach(group=>group.forEach((el,i)=>el.style.setProperty('--reveal-delay',`${Math.min(i,5)*72}ms`)));

  const revealItems=[...document.querySelectorAll('.reveal')];
  const revealPassed=()=>{
    const limit=innerHeight*1.08;
    revealItems.forEach(el=>{
      if(el.classList.contains('is-visible'))return;
      const r=el.getBoundingClientRect();
      if(r.top<limit)el.classList.add('is-visible');
    });
  };

  if(!reduce&&'IntersectionObserver' in window){
    // Progressive enhancement: content is visible in base CSS and is hidden only
    // after the reveal system is ready. Scroll fallback also reveals jumped-over blocks.
    revealPassed();
    doc.classList.add('motion-enhanced');
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-visible');revealObserver.unobserve(entry.target)}
    }),{threshold:0,rootMargin:'12% 0px 12% 0px'});
    revealItems.filter(el=>!el.classList.contains('is-visible')).forEach(el=>revealObserver.observe(el));
    addEventListener('scroll',revealPassed,{passive:true});
    addEventListener('resize',revealPassed,{passive:true});
    requestAnimationFrame(revealPassed);

    const inviewObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.classList.toggle('is-inview',entry.isIntersecting);
    }),{threshold:.18,rootMargin:'8% 0px 8%'});
    document.querySelectorAll('.motion-section,.motion-plate,.hack-stage,.boundary-visual,.case-plate-image').forEach(el=>inviewObserver.observe(el));
  } else {
    revealItems.forEach(el=>el.classList.add('is-visible'));
  }

  // One RAF loop controls progress, section lines, scroll parallax and wow spread.
  const frame=()=>{
    ticking=false;
    const max=doc.scrollHeight-innerHeight;
    const scroll=scrollY||doc.scrollTop;
    if(meter) meter.style.width=(max?Math.min(100,scroll/max*100):0)+'%';
    sections.forEach(sec=>{
      const r=sec.getBoundingClientRect();
      const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height*.35)));
      sec.style.setProperty('--section-progress',p.toFixed(3));
    });
    if(wow){
      const r=wow.getBoundingClientRect();
      const p=Math.max(0,Math.min(1,(innerHeight-r.top)/(innerHeight+r.height)));
      wow.style.setProperty('--wow-progress',p.toFixed(3));
    }
    document.querySelectorAll('.parallax-layer').forEach(el=>{
      if(reduce)return;
      const r=el.getBoundingClientRect();
      if(r.bottom<0||r.top>innerHeight)return;
      const depth=Number(el.dataset.depth||.012);
      const scrollOffset=(innerHeight/2-(r.top+r.height/2))*depth*1.2;
      const pointerX=fine?(sx-.5)*innerWidth*depth:0;
      const pointerY=fine?(sy-.5)*innerHeight*depth:0;
      el.style.setProperty('--motion-x',`${pointerX.toFixed(2)}px`);
      el.style.setProperty('--motion-y',`${(pointerY+scrollOffset).toFixed(2)}px`);
      // The hero art uses ambient keyframes; other layers receive composed translation.
      if(!el.classList.contains('hero-art')) el.style.transform=`translate3d(var(--motion-x),var(--motion-y),0) scale(1.025)`;
    });
    px+=(targetX-px)*.16;py+=(targetY-py)*.16;
    if(glow){glow.style.setProperty('--cursor-x',`${px}px`);glow.style.setProperty('--cursor-y',`${py}px`)}
  };
  const requestFrame=()=>{if(!ticking){ticking=true;requestAnimationFrame(frame)}};
  addEventListener('scroll',requestFrame,{passive:true});
  addEventListener('resize',requestFrame,{passive:true});
  requestFrame();

  if(!reduce&&fine){
    addEventListener('pointermove',e=>{
      sx=e.clientX/innerWidth;sy=e.clientY/innerHeight;targetX=e.clientX;targetY=e.clientY;
      doc.style.setProperty('--pointer-x',`${e.clientX}px`);doc.style.setProperty('--pointer-y',`${e.clientY}px`);
      if(wow){wow.style.setProperty('--wow-x',`${sx*100}%`);wow.style.setProperty('--wow-y',`${sy*100}%`)}
      requestFrame();
    },{passive:true});

    const cards=[...document.querySelectorAll('.tilt-card,.adv-grid article,.hack-sequence article,.boundary-grid article,.task-grid article,.action-link')];
    cards.forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect();
        const x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
        card.style.setProperty('--card-rx',`${((.5-y)*4.2).toFixed(2)}deg`);
        card.style.setProperty('--card-ry',`${((x-.5)*5.2).toFixed(2)}deg`);
        card.style.setProperty('--card-glow-x',`${(x*100).toFixed(1)}%`);
        card.style.setProperty('--card-glow-y',`${(y*100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave',()=>{card.style.setProperty('--card-rx','0deg');card.style.setProperty('--card-ry','0deg')});
    });
  }

  // Lightweight hero particle network: capped, 30fps, paused off-screen.
  const canvas=document.querySelector('.hero-particles');
  if(canvas&&!reduce){
    const ctx=canvas.getContext('2d',{alpha:true});
    let cw=0,ch=0,visible=true,last=0;
    const count=mobile?16:28;
    const points=Array.from({length:count},(_,i)=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.00011,vy:(Math.random()-.5)*.00010,r:1+Math.random()*1.7,p:i/count*Math.PI*2}));
    const size=()=>{const d=Math.min(devicePixelRatio||1,1.5);cw=canvas.clientWidth;ch=canvas.clientHeight;canvas.width=Math.max(1,Math.round(cw*d));canvas.height=Math.max(1,Math.round(ch*d));ctx.setTransform(d,0,0,d,0,0)};
    size();addEventListener('resize',size,{passive:true});
    if(hero)new IntersectionObserver(([e])=>visible=e.isIntersecting,{threshold:.02}).observe(hero);
    const draw=t=>{
      requestAnimationFrame(draw);if(!visible||t-last<33)return;last=t;
      ctx.clearRect(0,0,cw,ch);
      points.forEach(p=>{p.x+=p.vx*33;p.y+=p.vy*33;if(p.x<0||p.x>1)p.vx*=-1;if(p.y<0||p.y>1)p.vy*=-1});
      for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++){
        const a=points[i],b=points[j],dx=(a.x-b.x)*cw,dy=(a.y-b.y)*ch,dist=Math.hypot(dx,dy);
        if(dist<175){ctx.strokeStyle=`rgba(116,218,235,${(1-dist/175)*.12})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x*cw,a.y*ch);ctx.lineTo(b.x*cw,b.y*ch);ctx.stroke()}
      }
      points.forEach((p,i)=>{const pulse=.65+.35*Math.sin(t*.0012+p.p);ctx.fillStyle=i%4===0?`rgba(127,240,207,${.3*pulse})`:`rgba(116,218,235,${.2*pulse})`;ctx.beginPath();ctx.arc(p.x*cw,p.y*ch,p.r*pulse,0,Math.PI*2);ctx.fill()});
    };requestAnimationFrame(draw);
  }


  // PRO DESIGN PASS: journey rail, timeline activation, signature case flow, sticky contact.
  const journeyRail=document.querySelector('[data-journey-rail]');
  const journeyLinks=journeyRail?[...journeyRail.querySelectorAll('a[data-section]')]:[];
  const journeySections=journeyLinks.map(link=>document.getElementById(link.dataset.section)).filter(Boolean);
  const setJourneyActive=id=>journeyLinks.forEach(link=>link.classList.toggle('is-active',link.dataset.section===id));
  if(journeyLinks.length){
    setJourneyActive(journeyLinks[0].dataset.section);
    if('IntersectionObserver' in window){
      const journeyObserver=new IntersectionObserver(entries=>{
        const active=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
        if(active)setJourneyActive(active.target.id);
      },{threshold:[.2,.35,.55],rootMargin:'-20% 0px -45% 0px'});
      journeySections.forEach(sec=>journeyObserver.observe(sec));
    }
  }

  const hackTimeline=document.querySelector('[data-hack-timeline]');
  const hackSteps=hackTimeline?[...hackTimeline.querySelectorAll('[data-hack-step]')]:[];
  if(hackSteps.length&&'IntersectionObserver' in window){
    const hackObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting)entry.target.classList.add('is-active');
    }),{threshold:.42,rootMargin:'0px 0px -8%'});
    hackSteps.forEach(step=>hackObserver.observe(step));
  }

  document.querySelectorAll('[data-case-flow]').forEach(flow=>{
    const tabs=[...flow.querySelectorAll('[role="tab"]')];
    const panels=[...flow.querySelectorAll('[role="tabpanel"]')];
    const activate=index=>{
      const safe=Math.max(0,Math.min(tabs.length-1,index));
      flow.style.setProperty('--case-step',safe);
      tabs.forEach((tab,i)=>{tab.setAttribute('aria-selected',String(i===safe));tab.tabIndex=i===safe?0:-1});
      panels.forEach((panel,i)=>panel.classList.toggle('is-active',i===safe));
    };
    tabs.forEach((tab,i)=>{
      tab.addEventListener('click',()=>activate(i));
      tab.addEventListener('mouseenter',()=>{if(fine&&!reduce)activate(i)});
      tab.addEventListener('keydown',event=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
        event.preventDefault();
        let next=i;
        if(event.key==='Home')next=0;else if(event.key==='End')next=tabs.length-1;else if(event.key==='ArrowLeft'||event.key==='ArrowUp')next=(i-1+tabs.length)%tabs.length;else next=(i+1)%tabs.length;
        activate(next);tabs[next].focus();
      });
    });
    activate(0);
    flow.classList.add('is-enhanced');
  });

  const stickyContact=document.querySelector('[data-sticky-contact]');
  const caseSection=document.getElementById('case');
  const taskSection=document.getElementById('task');
  const finalAction=document.querySelector('.action-cluster');
  const updateProProgress=()=>{
    const scroll=scrollY||doc.scrollTop;
    if(journeyRail&&journeySections.length){
      const start=journeySections[0].offsetTop;
      const end=journeySections[journeySections.length-1].offsetTop+journeySections[journeySections.length-1].offsetHeight-innerHeight;
      const progress=Math.max(0,Math.min(1,(scroll-start)/Math.max(1,end-start)));
      journeyRail.style.setProperty('--journey-progress',`${(progress*100).toFixed(2)}%`);
      const marker=innerHeight*.34;
      let current=journeySections[0];
      journeySections.forEach(sec=>{if(sec.getBoundingClientRect().top<=marker)current=sec});
      setJourneyActive(current.id);
    }
    if(hackTimeline){
      const r=hackTimeline.getBoundingClientRect();
      const p=Math.max(0,Math.min(1,(innerHeight*.72-r.top)/Math.max(1,r.height)));
      hackTimeline.style.setProperty('--timeline-progress',`${(p*100).toFixed(2)}%`);
    }
    if(stickyContact&&caseSection&&taskSection){
      const stickyEnd=finalAction?finalAction.getBoundingClientRect().top+scroll-innerHeight*.8:taskSection.offsetTop+Math.min(900,taskSection.offsetHeight*.55);
      const show=scroll>caseSection.offsetTop+caseSection.offsetHeight*.72&&scroll<stickyEnd;
      stickyContact.classList.toggle('is-visible',show);
      stickyContact.setAttribute('aria-hidden',String(!show));
      stickyContact.inert=!show;
    }
  };
  addEventListener('scroll',updateProProgress,{passive:true});
  addEventListener('resize',updateProProgress,{passive:true});
  updateProProgress();

})();


/* FINAL MERGED safety net: never leave content hidden if an observer stalls. */
setTimeout(()=>{document.querySelectorAll('.reveal:not(.is-visible)').forEach(el=>el.classList.add('is-visible'));},3000);

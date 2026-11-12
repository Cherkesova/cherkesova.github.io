(() => {
 const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
 // Sample a damped Quick-style spring for the prototype's 744ms slide.
 // Figma exports the preset name, not its underlying spring coefficients.
 const toastFrames=enter=>Array.from({length:61},(_,i)=>{
  const t=i/60*.744,decay=Math.exp(-10*t);
  const progress=i===60?1:1-decay*(Math.cos(Math.sqrt(200)*t)+10/Math.sqrt(200)*Math.sin(Math.sqrt(200)*t));
  const offset=65*(enter?1-progress:progress);
  return {transform:'translateY(calc(var(--toast-travel, 65px) * '+(offset/65)+'))',offset:i/60};
 });
 const toast=message=>{
  const el=document.querySelector('.toast'),motion=!reducedMotion();
  clearTimeout(toast.timer);el.getAnimations().forEach(animation=>animation.cancel());
  el.textContent=message;el.classList.add('visible');
  if(motion)el.animate(toastFrames(true),{duration:744,easing:'linear'});
  toast.timer=setTimeout(()=>{
   if(!motion){el.classList.remove('visible');return}
   const exit=el.animate(toastFrames(false),{duration:744,easing:'linear',fill:'forwards'});
   exit.onfinish=()=>{el.classList.remove('visible');exit.cancel()};
  },(motion?744:0)+300);
 };
 const burst=button=>{
  if(reducedMotion())return;
  const rect=button.getBoundingClientRect(),layer=document.createElement('span');
  layer.className='copy-burst';layer.setAttribute('aria-hidden','true');
  layer.style.left=rect.left+rect.width/2+'px';layer.style.top=rect.top+rect.height/2+'px';
  // Keep repeat clicks bounded without suppressing a new burst.
  button.copyBurst?.remove();button.copyBurst=layer;
  document.body.append(layer);
  for(let i=0;i<16;i++){
   const particle=document.createElement('span');
   const angle=Math.random()*Math.PI*2,speed=95+Math.random()*190;
   const drag=4+Math.random()*5,duration=460+Math.random()*320;
   const originX=(Math.random()-.5)*12,originY=(Math.random()-.5)*12;
   const size=1+Math.random()*1.3;
   particle.style.width=particle.style.height=size+'px';layer.append(particle);
   // Independent impulse and drag: avoid evenly spaced radial spokes.
   const frames=Array.from({length:25},(_,j)=>{
    const progress=j/24,t=progress*duration/1000;
    const travel=(1-Math.exp(-drag*t))/drag;
    const x=originX+Math.cos(angle)*speed*travel;
    const y=originY+Math.sin(angle)*speed*travel+12*t*t;
    return {transform:'translate(calc(-50% + '+x+'px),calc(-50% + '+y+'px))',opacity:progress<.15?1:Math.pow((1-progress)/.85,1.6),offset:progress};
   });
   const animation=particle.animate(frames,{duration,easing:'linear',fill:'forwards'});
   animation.onfinish=()=>{particle.remove();if(!layer.childElementCount){layer.remove();if(button.copyBurst===layer)button.copyBurst=null}};
  }
 };
 const mobileContacts=matchMedia('(max-width: 900px)');
 const syncEmailAddresses=()=>document.querySelectorAll('[data-email-address]').forEach(email=>{email.disabled=!mobileContacts.matches});
 syncEmailAddresses();mobileContacts.addEventListener('change',syncEmailAddresses);
 document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(button.dataset.copy)}
  catch{toast('Не удалось скопировать. Выделите текст рядом с кнопкой.');return}
  burst(button);toast('Скопировано');
 }));
 // Navigation particle experiment: remove this binding to revert independently.
 document.querySelectorAll('.site-nav a, .mobile-menu-sections a').forEach(link=>{
  link.addEventListener('click',()=>burst(link));
 });
 const nav=document.querySelector('.home .site-nav');
 if(nav){
  const links=[...nav.querySelectorAll('a')];const targets=links.map(link=>document.querySelector(link.hash));
  const setActive=id=>links.forEach(link=>{if(link.hash==='#'+id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current')});
  setActive('about');
  const sections=[document.querySelector('.hero-grid'),...targets].filter(Boolean);
  let scheduled=false;
  addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;let id='about';for(const target of targets)if(target.getBoundingClientRect().top<innerHeight*.45)id=target.id;if(scrollY<300)id='about';setActive(id)})},{passive:true});
 }
})();

// Stack the workflow when its real text, icons and spacing no longer fit its container.
document.querySelectorAll('.case-workflow-shell').forEach(shell=>{
 const labels=[...shell.querySelectorAll('.case-workflow-label')];
 const update=()=>{
  const required=labels.reduce((total,label)=>total+label.getBoundingClientRect().width+52,0)+32+40+8;
  const stacked=shell.clientWidth+.5<required;
  shell.toggleAttribute('data-stacked',stacked);shell.setAttribute('data-measured','');
  shell.querySelectorAll('.case-workflow-arrow img').forEach(image=>{const src='./assets/design/nov10-10-248/'+(stacked?'9a953.svg':'8245d.svg');if(image.getAttribute('src')!==src)image.src=src});
  const effect=shell.querySelector('.case-workflow-step:last-child img');
  if(effect){const src='./assets/design/nov10-10-248/'+(stacked?'2c57a.svg':'87d87.svg');if(effect.getAttribute('src')!==src)effect.src=src}
 };
 new ResizeObserver(update).observe(shell);document.fonts?.ready.then(update);update();
});

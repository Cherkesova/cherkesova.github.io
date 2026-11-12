/* Shared full-control hover surface with an eased glide. */
(() => {
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
 const header=document.querySelector('[data-component="SiteHeader"]');
 if(header){
  const mobile=matchMedia('(max-width: 900px)'),toggle=header.querySelector('.mobile-menu-toggle'),menu=header.querySelector('.mobile-menu');
  let queued=false,lastY=Math.max(scrollY,0),opened=false,previousOverflow='',lockedY=0,previousBodyStyles=null;
  const background=[...header.parentElement.children].filter(el=>el!==header);
  const setOpen=(value,restoreFocus=false)=>{
   if(value===opened)return;
   opened=value;header.toggleAttribute('data-menu-open',value);header.removeAttribute('data-hidden');
   toggle.setAttribute('aria-expanded',String(value));toggle.setAttribute('aria-label',value?'Закрыть меню':'Открыть меню');
   menu.toggleAttribute('data-open',value);menu.inert=!value;menu.setAttribute('aria-hidden',String(!value));
   background.forEach(el=>el.inert=value);
   if(value){
    lockedY=Math.max(scrollY,0);previousOverflow=document.documentElement.style.overflow;
    previousBodyStyles=Object.fromEntries(['position','top','left','right','width','overflow'].map(key=>[key,document.body.style[key]||'']));
    document.documentElement.style.overflow='hidden';
    Object.assign(document.body.style,{position:'fixed',top:-lockedY+'px',left:'0',right:'0',width:'100%',overflow:'hidden'});
   }else{
    Object.assign(document.body.style,previousBodyStyles);previousBodyStyles=null;
    document.documentElement.style.overflow=previousOverflow;
    scrollTo({top:lockedY,behavior:'instant'});lastY=lockedY;
    if(restoreFocus)toggle.focus({preventScroll:true});
   }
  };
  const updateCompact=()=>{
   queued=false;const y=Math.max(opened?lockedY:scrollY,0);header.toggleAttribute('data-compact',y>8);
   if(!mobile.matches||opened){header.removeAttribute('data-hidden');lastY=y;return}
   if(y<=80){header.removeAttribute('data-hidden');lastY=y}
   else if(Math.abs(y-lastY)>=6){header.toggleAttribute('data-hidden',y>lastY);lastY=y}
  };
  header.querySelector('.site-brand').addEventListener('click',()=>{if(opened)setOpen(false)});
  toggle.addEventListener('click',event=>{setOpen(!opened);if(!opened&&event.detail)toggle.blur()});
  menu.addEventListener('click',event=>{if(event.target.closest('a'))setOpen(false);else if(!event.target.closest('button'))setOpen(false,true)});
  header.addEventListener('keydown',event=>{
   if(!opened)return;
   if(event.key==='Escape'){event.preventDefault();setOpen(false,true)}
   if(event.key==='Tab'){
    const focusable=[header.querySelector('.site-brand'),toggle,...menu.querySelectorAll('a,button')],first=focusable[0],last=focusable.at(-1);
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
   }
  });
  mobile.addEventListener('change',()=>{if(opened)setOpen(false,true);updateCompact()});
  updateCompact();
  addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(updateCompact)}},{passive:true});
  addEventListener('pageshow',updateCompact);
 }

 document.querySelectorAll('.site-nav').forEach(nav=>{
  const links=[...nav.querySelectorAll('a')];
  const surface=nav.querySelector('.site-nav-highlight');
  if(!surface||!links.length)return;
  let hovered=null,positioned=false,hiddenAt=-Infinity;
  const focused=()=>links.find(link=>link===document.activeElement&&link.matches(':focus-visible'));
  const positionSurface=(link,snap)=>{
   const n=nav.getBoundingClientRect(),a=link.getBoundingClientRect();
   if(snap)surface.style.transition='none';
   surface.style.transform=`translate3d(${a.left-n.left}px,${a.top-n.top}px,0)`;
   surface.style.width=`${a.width}px`;surface.style.height=`${a.height}px`;
   if(snap){surface.getBoundingClientRect();surface.style.removeProperty('transition')}
   positioned=true;
  };
  const update=(immediate=false)=>{
   const link=hovered||focused();
   links.forEach(item=>item.toggleAttribute('data-highlighted',item===link));
   if(!link){nav.removeAttribute('data-highlight-visible');hiddenAt=performance.now();return}
   const fresh=!nav.hasAttribute('data-highlight-visible')&&performance.now()-hiddenAt>200;
   positionSurface(link,immediate||!positioned||fresh||reducedMotion.matches);
   nav.setAttribute('data-highlight-visible','');
  };
  links.forEach(link=>{
   link.addEventListener('mouseenter',()=>{if(!matchMedia('(hover: hover)').matches)return;hovered=link;update()});
  });
  nav.addEventListener('mouseleave',()=>{hovered=null;update()});
  nav.addEventListener('focusin',()=>update());
  nav.addEventListener('focusout',()=>queueMicrotask(()=>update()));
  window.addEventListener('blur',()=>{hovered=null;update()});
  new ResizeObserver(()=>{if(hovered||focused())update(true)}).observe(nav);
  document.fonts?.ready.then(()=>{if(hovered||focused())update(true)});
  reducedMotion.addEventListener('change',()=>update(true));
  nav.classList.add('has-highlight');
 });
})();

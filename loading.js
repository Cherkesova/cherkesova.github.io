/* Wave animation adapted from Prompt Kit (MIT), Julien Thibeaut. */
(() => {
 const wave=()=>{
  const el=document.createElement('span');el.className='wave-loader';el.setAttribute('role','status');el.setAttribute('aria-label','Загрузка');
  [8,12,16,12,8].forEach((height,i)=>{const bar=document.createElement('i');bar.style.height=height+'px';bar.style.animationDelay=i*100+'ms';bar.setAttribute('aria-hidden','true');el.append(bar)});return el;
 };
 window.PortfolioLoading={wave};
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
  if(!entry.isIntersecting)return;observer.unobserve(entry.target);track(entry.target);
 }),{rootMargin:'150px'});
 const track=slot=>{
  const images=[...slot.querySelectorAll('img')];let timer,loader,done=false;
  const pending=()=>images.some(image=>!image.complete);
  const finish=()=>{if(pending())return;done=true;clearTimeout(timer);loader?.remove();slot.classList.remove('image-loading');slot.removeAttribute('aria-busy');images.forEach(image=>{image.removeEventListener('load',finish);image.removeEventListener('error',finish)})};
  images.forEach(image=>{image.addEventListener('load',finish);image.addEventListener('error',finish)});
  if(!pending()){finish();return}
  timer=setTimeout(()=>{if(done||!pending())return;loader=document.createElement('span');loader.className='image-loader';loader.append(wave());slot.append(loader);slot.classList.add('image-loading');slot.setAttribute('aria-busy','true')},1000);
 };
 document.querySelectorAll('.portrait,.about-portrait,.case-image-slot,.play-card,.case-card [data-design-slot="img container"]').forEach(slot=>observer.observe(slot));
 const overlay=document.createElement('div');overlay.className='page-loader';overlay.hidden=true;overlay.append(wave());document.body.append(overlay);
 let transitionTimer,resetTimer;
 const reset=()=>{clearTimeout(transitionTimer);clearTimeout(resetTimer);overlay.hidden=true};
 addEventListener('pageshow',reset);addEventListener('pagehide',reset);
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target&&link.target!=='_self'||link.hasAttribute('download'))return;
  const next=new URL(link.href,location.href);
  if(next.origin!==location.origin||next.pathname===location.pathname&&next.search===location.search)return;
  reset();transitionTimer=setTimeout(()=>{overlay.hidden=false},1000);resetTimer=setTimeout(reset,12000);
 });
})();

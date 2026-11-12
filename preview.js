(() => {
 const viewer=document.querySelector('.project-viewer');
 if(!viewer)return;
 const content=viewer.querySelector('.viewer-content'),heading=viewer.querySelector('.viewer-heading');
 const title=viewer.querySelector('#viewer-title'),category=viewer.querySelector('#viewer-category');
 let previousFocus=null,singleImage=null,request=null,sequence=0,backdropDown=false;
 const zoom=PortfolioPreviewZoom.create({viewer,content});
 const open=({mode,titleText='',categoryText=''})=>{
  zoom.unmount();request?.abort();request=null;singleImage=null;sequence++;
  previousFocus=document.activeElement;
  viewer.dataset.previewMode=mode;
  title.textContent=titleText;category.textContent=categoryText;
  heading.hidden=!titleText&&!categoryText;category.hidden=!categoryText;title.hidden=!titleText;
  if(titleText){viewer.setAttribute('aria-labelledby','viewer-title');viewer.removeAttribute('aria-label')}
  else{viewer.removeAttribute('aria-labelledby');viewer.setAttribute('aria-label',mode==='image'?'Просмотр изображения':'Просмотр проекта')}
  content.replaceChildren();content.setAttribute('aria-busy','true');
  if(!viewer.open)viewer.showModal();
  viewer.scrollTop=0;content.scrollTop=0;
  const status=document.createElement('p');status.className='preview-status';if(window.PortfolioLoading)status.append(PortfolioLoading.wave());else status.textContent='Загрузка…';status.setAttribute('role','status');content.append(status);
  return sequence;
 };
 const showImage=({src,titleText='',categoryText='',alt=''})=>{
  const current=open({mode:'image',titleText,categoryText});
  const image=new Image();image.className='single-image';image.alt=alt||titleText||'Изображение';image.decoding='async';image.fetchPriority='high';image.setAttribute('data-preview-artwork','');
  image.addEventListener('load',()=>{
   if(current!==sequence||!viewer.open)return;
   singleImage=image;zoom.mount(image,'image');content.removeAttribute('aria-busy');
  },{once:true});
  image.addEventListener('error',()=>{if(current===sequence&&viewer.open){content.textContent='Не удалось загрузить изображение. Попробуйте открыть его ещё раз.';content.removeAttribute('aria-busy')}},{once:true});
  image.src=src;
 };
 viewer.querySelector('.viewer-close').addEventListener('click',()=>viewer.close());
 viewer.addEventListener('close',()=>{
  zoom.unmount();sequence++;request?.abort();request=null;singleImage=null;backdropDown=false;
  content.replaceChildren();content.removeAttribute('aria-busy');previousFocus?.focus({preventScroll:true});
 });
 const isBackdrop=target=>!target.closest('[data-preview-artwork]');
 content.addEventListener('pointerdown',event=>{backdropDown=event.button===0&&isBackdrop(event.target)});
 content.addEventListener('mousedown',event=>{backdropDown=event.button===0&&isBackdrop(event.target)});
 content.addEventListener('click',event=>{if(backdropDown&&isBackdrop(event.target))viewer.close();backdropDown=false});
 document.querySelectorAll('[data-image]').forEach(button=>button.addEventListener('click',()=>{
  showImage({src:button.dataset.image,titleText:button.dataset.previewTitle||'',categoryText:button.dataset.previewCategory||'',alt:button.querySelector('img')?.alt||'Изображение кейса'});
 }));
 document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',async()=>{
  const key=button.dataset.project,titleText=button.dataset.previewTitle??button.querySelector('p')?.textContent.trim()??'';
  const categoryText=button.dataset.previewCategory??button.querySelectorAll('p')[1]?.textContent.trim()??'';
  if(button.dataset.previewMode==='image'){
   showImage({src:button.dataset.previewSrc,titleText,categoryText});return;
  }
  const current=open({mode:'project',titleText,categoryText});request=new AbortController();
  try{
   const response=await fetch('./galleries/'+key+'.html'+(key==='belkins'?'?v=photos-1':''),{signal:request.signal});
   if(!response.ok)throw Error('Gallery unavailable');
   const markup=await response.text();if(current!==sequence||!viewer.open)return;
   const template=document.createElement('template');template.innerHTML=markup;
   const artwork=document.createElement('div');artwork.className='preview-project';artwork.setAttribute('data-preview-artwork','');
   const width=Number(button.dataset.previewWidth)||1600;artwork.dataset.previewWidth=String(width);artwork.style.setProperty('--preview-width',`${Math.max(1,width)}px`);
   artwork.append(template.content);zoom.mount(artwork,'project');content.scrollTop=0;content.removeAttribute('aria-busy');
   const first=artwork.querySelector('img');if(first){first.loading='eager';first.fetchPriority='high'}
  }catch(error){if(current===sequence&&viewer.open&&error.name!=='AbortError'){content.textContent='Не удалось загрузить проект. Попробуйте открыть его ещё раз.';content.removeAttribute('aria-busy')}}
 }));
})();

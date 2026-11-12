/* Zoom is local to preview artwork; the dialog and its header never scale. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.PortfolioPreviewZoom=api;
})(globalThis,()=>{
 const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
 const scrollForAnchor=({world,scale,offset,point,max})=>clamp(offset+world*scale-point,0,Math.max(0,max));
 function create({viewer,content}){
  const min=.5,max=6;
  let target=null,canvas=null,layer=null,mode='image',scale=1,baseWidth=0,baseHeight=0,offsetX=0,offsetY=0;
  let pinch=null,tap=null,lastTap=null,drag=null,gesture=null,lastMouse=null,suppressUntil=0,lastTouch=0,resizeFrame=0;
  const controls=document.createElement('div');controls.className='viewer-zoom';controls.hidden=true;controls.setAttribute('role','group');controls.setAttribute('aria-label','Масштаб изображения');
  controls.innerHTML='<button type="button" data-zoom="out" aria-label="Уменьшить изображение">−</button><button type="button" data-zoom="reset" aria-label="Вернуть исходный масштаб" title="Вернуть исходный масштаб">100%</button><button type="button" data-zoom="in" aria-label="Увеличить изображение">+</button>';
  viewer.append(controls);
  const out=controls.querySelector('[data-zoom="out"]'),reset=controls.querySelector('[data-zoom="reset"]'),inside=controls.querySelector('[data-zoom="in"]');
  const available=()=>{
   const s=getComputedStyle(content);
   return {width:Math.max(1,content.clientWidth-parseFloat(s.paddingLeft)-parseFloat(s.paddingRight)),height:Math.max(1,content.clientHeight-parseFloat(s.paddingTop)-parseFloat(s.paddingBottom)),left:parseFloat(s.paddingLeft),top:parseFloat(s.paddingTop)};
  };
  const local=(clientX,clientY)=>{
   const a=available(),r=content.getBoundingClientRect();
   return {x:clientX-r.left-a.left,y:clientY-r.top-a.top};
  };
  const center=()=>{const a=available();return {x:a.width/2,y:a.height/2}};
  const anchorAt=point=>({x:(content.scrollLeft+point.x-offsetX)/scale,y:(content.scrollTop+point.y-offsetY)/scale});
  const render=()=>{
   if(!target)return;
   const a=available();
   offsetX=Math.max(0,(a.width-baseWidth*scale)/2);
   offsetY=mode==='image'?Math.max(0,(a.height-baseHeight*scale)/2):0;
   canvas.style.width=`${Math.max(a.width,baseWidth*scale)}px`;
   canvas.style.height=`${Math.max(a.height,baseHeight*scale)}px`;
   layer.style.left=`${offsetX}px`;layer.style.top=`${offsetY}px`;layer.style.transform=`scale(${scale})`;
   if(mode==='project')target.querySelectorAll('img[srcset]').forEach(image=>{
    if(!image.dataset.previewSizes)image.dataset.previewSizes=image.sizes;
    image.sizes=scale>1?`${Math.ceil((image.offsetWidth||baseWidth)*scale)}px`:image.dataset.previewSizes;
   });
   viewer.dataset.zoomed=String(scale>1.001);viewer.dataset.zoom=scale.toFixed(3);
   reset.textContent=`${Math.round(scale*100)}%`;out.disabled=scale<=min;inside.disabled=scale>=max;
  };
  const setScale=(value,point=center(),anchor=anchorAt(point))=>{
   if(!target)return;
   scale=clamp(value,min,max);render();
   content.scrollLeft=scrollForAnchor({world:anchor.x,scale,offset:offsetX,point:point.x,max:content.scrollWidth-content.clientWidth});
   content.scrollTop=scrollForAnchor({world:anchor.y,scale,offset:offsetY,point:point.y,max:content.scrollHeight-content.clientHeight});
  };
  const fit=()=>{
   if(!target)return;
   const a=available();
   if(mode==='image'){
    if(!target.naturalWidth)return;
    const factor=Math.min(1,a.width/target.naturalWidth,a.height/target.naturalHeight);
    baseWidth=target.naturalWidth*factor;baseHeight=target.naturalHeight*factor;
    target.style.width=`${baseWidth}px`;target.style.height=`${baseHeight}px`;
   }else{
    baseWidth=Math.min(Number(target.dataset.previewWidth)||1600,a.width);
   }
   layer.style.width=`${baseWidth}px`;
   if(mode==='project')baseHeight=layer.offsetHeight;
   render();
  };
  const observer=new ResizeObserver(()=>{
   cancelAnimationFrame(resizeFrame);
   resizeFrame=requestAnimationFrame(()=>{if(target){baseHeight=layer.offsetHeight;render()}});
  });
  const viewportObserver=new ResizeObserver(()=>{
   if(!target)return;
   // A new viewport gets a fresh fitted image, without changing browser scale.
   scale=1;fit();content.scrollLeft=0;content.scrollTop=0;
  });viewportObserver.observe(viewer);viewportObserver.observe(viewer.querySelector('.viewer-header'));
  const unmount=()=>{
   observer.disconnect();cancelAnimationFrame(resizeFrame);
   target=canvas=layer=null;pinch=tap=lastTap=drag=gesture=lastMouse=null;scale=1;suppressUntil=0;
   controls.hidden=true;viewer.removeAttribute('data-zoomed');viewer.removeAttribute('data-zoom');content.removeAttribute('data-dragging');content.classList.remove('has-preview-zoom');
  };
  const mount=(artwork,type)=>{
   unmount();target=artwork;mode=type;canvas=document.createElement('div');canvas.className='preview-zoom-canvas';layer=document.createElement('div');layer.className='preview-zoom-layer';
   layer.append(target);canvas.append(layer);content.replaceChildren(canvas);content.classList.add('has-preview-zoom');controls.hidden=false;
   fit();observer.observe(layer);content.scrollLeft=0;content.scrollTop=0;
  };
  controls.addEventListener('click',event=>{
   const button=event.target.closest('[data-zoom]');if(!button)return;
   if(button.dataset.zoom==='reset')setScale(1);
   else setScale(scale*(button.dataset.zoom==='in'?1.25:1/1.25));
  });
  content.addEventListener('wheel',event=>{
   if(!target||(!event.ctrlKey&&!event.metaKey&&mode==='project'))return;
   event.preventDefault();if(gesture)return;
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?content.clientHeight:1);
   setScale(scale*Math.exp(-clamp(delta,-160,160)*(event.ctrlKey?.006:.0015)),local(event.clientX,event.clientY));
  },{passive:false});
  viewer.addEventListener('keydown',event=>{
   if(!target||event.altKey||event.target.matches('input,textarea,[contenteditable=true]'))return;
   if(['+','=','-','_','0'].includes(event.key)){
    event.preventDefault();setScale(event.key==='0'?1:scale*(['+','='].includes(event.key)?1.25:1/1.25));
   }
  });
  content.addEventListener('pointerdown',event=>{
   if(!target||event.pointerType!=='mouse'||event.button!==0||scale<=1)return;
   drag={id:event.pointerId,x:event.clientX,y:event.clientY,left:content.scrollLeft,top:content.scrollTop,moved:false,art:!!event.target.closest('[data-preview-artwork]')};
   content.setPointerCapture(event.pointerId);content.setAttribute('data-dragging','');event.preventDefault();
  });
  content.addEventListener('pointermove',event=>{
   if(!drag||event.pointerId!==drag.id)return;
   const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
   if(Math.hypot(dx,dy)>4)drag.moved=true;
   content.scrollLeft=drag.left-dx;content.scrollTop=drag.top-dy;
  });
  const endDrag=event=>{
   if(!drag||event.pointerId!==drag.id)return;
   lastMouse={art:drag.art,time:performance.now()};
   if(drag.moved||drag.art)suppressUntil=performance.now()+350;
   if(!drag.moved&&drag.art&&mode==='image')setScale(1,local(event.clientX,event.clientY));
   if(content.hasPointerCapture(event.pointerId))content.releasePointerCapture(event.pointerId);
   drag=null;content.removeAttribute('data-dragging');
  };
  content.addEventListener('pointerup',endDrag);content.addEventListener('pointercancel',endDrag);
  const touchGeometry=touches=>{
   const [a,b]=touches;return {point:local((a.clientX+b.clientX)/2,(a.clientY+b.clientY)/2),distance:Math.max(1,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY))};
  };
  content.addEventListener('touchstart',event=>{
   lastTouch=performance.now();
   if(!target)return;
   if(event.touches.length>=2){
    event.preventDefault();const g=touchGeometry(event.touches);
    pinch={distance:g.distance,scale,anchor:anchorAt(g.point)};tap=lastTap=null;suppressUntil=performance.now()+500;
   }else if(event.touches.length===1){const t=event.touches[0];tap={x:t.clientX,y:t.clientY,time:performance.now(),moved:false}}
  },{passive:false});
  content.addEventListener('touchmove',event=>{
   if(!target)return;
   if(event.touches.length>=2){
    event.preventDefault();const g=touchGeometry(event.touches);
    if(!pinch)pinch={distance:g.distance,scale,anchor:anchorAt(g.point)};
    setScale(pinch.scale*g.distance/pinch.distance,g.point,pinch.anchor);suppressUntil=performance.now()+500;
   }else if(tap&&event.touches.length){const t=event.touches[0];if(Math.hypot(t.clientX-tap.x,t.clientY-tap.y)>8)tap.moved=true}
  },{passive:false});
  content.addEventListener('touchend',event=>{
   lastTouch=performance.now();
   if(pinch){suppressUntil=performance.now()+500;if(event.touches.length<2)pinch=null;tap=lastTap=null;return}
   if(!event.touches.length&&tap&&!tap.moved&&performance.now()-tap.time<300){
    if(lastTap&&performance.now()-lastTap.time<300&&Math.hypot(tap.x-lastTap.x,tap.y-lastTap.y)<24){
     event.preventDefault();setScale(scale>1.01?1:2,local(tap.x,tap.y));suppressUntil=performance.now()+500;lastTap=null;
    }else lastTap={...tap,time:performance.now()};
   }
   tap=null;
  },{passive:false});
  content.addEventListener('touchcancel',()=>{pinch=tap=lastTap=null;suppressUntil=performance.now()+350},{passive:true});
  // WebKit emits proprietary gesture events for trackpad pinch; touch pinch is handled above.
  ['gesturestart','gesturechange','gestureend'].forEach(type=>viewer.addEventListener(type,event=>{
   if(!viewer.open)return;event.preventDefault();if(!target||pinch)return;
   const point=event.clientX||event.clientY?local(event.clientX,event.clientY):center();
   if(type==='gesturestart')gesture={scale,anchor:anchorAt(point)};
   else if(type==='gesturechange'&&gesture)setScale(gesture.scale*event.scale,point,gesture.anchor);
   else if(type==='gestureend')gesture=null;
   suppressUntil=performance.now()+350;
  },{passive:false}));
  // Keep a pinch on the fixed header from zooming the whole document on iOS.
  viewer.addEventListener('touchmove',event=>{if(event.touches.length>1&&!content.contains(event.target))event.preventDefault()},{passive:false});
  content.addEventListener('click',event=>{
   if(performance.now()<suppressUntil){event.preventDefault();event.stopImmediatePropagation();return}
   if(target&&mode==='image'&&event.target.closest('[data-preview-artwork]')&&performance.now()-lastTouch>500&&event.detail===1){
    event.preventDefault();setScale(scale>1.01?1:2,local(event.clientX,event.clientY));
   }
  });
  content.addEventListener('dblclick',event=>{
   if(!target||mode!=='project'||(!event.target.closest('[data-preview-artwork]')&&!(lastMouse?.art&&performance.now()-lastMouse.time<400)))return;
   event.preventDefault();setScale(scale>1.01?1:2,local(event.clientX,event.clientY));
  });
  return {mount,unmount};
 }
 return {clamp,scrollForAnchor,create};
});

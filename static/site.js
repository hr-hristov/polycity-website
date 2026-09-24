// Native page navigation and shareable chapter selection.
// The session preview carries its local server port in the document address.
// Keep that context on same-site navigation without changing direct localhost links.
const previewPort=new URL(location.href).searchParams.get('nxport');
if(previewPort&&/^\d+$/.test(previewPort)){
  document.querySelectorAll('a[href^="./"],iframe[src^="./"]').forEach(element=>{
    const attribute=element.tagName==='IFRAME'?'src':'href';
    const url=new URL(element.getAttribute(attribute),location.href);
    url.searchParams.set('nxport',previewPort);
    element.setAttribute(attribute,url.href);
  });
}
const experience=document.querySelector('[data-experience]');
if(experience){
  const tabs=[...experience.querySelectorAll('[role="tab"]')];
  const param=experience.dataset.experience==='workflow'?'step':'question';
  const panels=[...experience.querySelectorAll('[role="tabpanel"]')];
  function select(value,write=false){
    const chosen=tabs.find(t=>t.dataset.chapter===value)||tabs[0];
    tabs.forEach(t=>{const active=t===chosen;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;});
    panels.forEach(p=>{p.hidden=p.id!==chosen.getAttribute('aria-controls');});
    const index=tabs.indexOf(chosen);
    experience.dataset.active=chosen.dataset.chapter;
    const prev=experience.querySelector('[data-step-prev]'),next=experience.querySelector('[data-step-next]');
    if(prev)prev.disabled=index===0;
    if(next)next.disabled=index===tabs.length-1;
    const position=experience.querySelector('[data-step-position]');
    if(position)position.textContent=(index+1)+' / '+tabs.length;
    const label=experience.querySelector('[data-model-label]');
    if(label)label.textContent=chosen.dataset.sceneLabel;
    if(write){const url=new URL(location.href);url.searchParams.set(param,chosen.dataset.chapter);history.pushState({},'',url);}
    experience.dispatchEvent(new CustomEvent('polycity:chapter',{detail:{value:chosen.dataset.chapter}}));
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>select(tab.dataset.chapter,true));
    tab.addEventListener('keydown',e=>{
      let target;
      if(e.key==='ArrowRight')target=(index+1)%tabs.length;
      if(e.key==='ArrowLeft')target=(index-1+tabs.length)%tabs.length;
      if(e.key==='Home')target=0;
      if(e.key==='End')target=tabs.length-1;
      if(target===undefined)return;
      e.preventDefault();tabs[target].focus();select(tabs[target].dataset.chapter,true);
    });
  });
  experience.querySelector('[data-step-prev]')?.addEventListener('click',()=>{const i=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');if(i>0)select(tabs[i-1].dataset.chapter,true);});
  experience.querySelector('[data-step-next]')?.addEventListener('click',()=>{const i=tabs.findIndex(t=>t.getAttribute('aria-selected')==='true');if(i<tabs.length-1)select(tabs[i+1].dataset.chapter,true);});
  window.addEventListener('popstate',()=>select(new URL(location.href).searchParams.get(param)));
  select(new URL(location.href).searchParams.get(param));
}
// A city that never draws must say so rather than reading "Opening the city
// study." for as long as the page is open. Twenty seconds is far longer than a
// first frame takes; past that the picture is not coming, and the reason goes
// to the browser console for whoever can act on it.
setTimeout(()=>{
  document.querySelectorAll('.model-stage[data-render-state="opening"]').forEach(stage=>{
    const box=stage.getBoundingClientRect();
    if(box.bottom<0||box.top>innerHeight)return;
    stage.dataset.renderState='error';
    const line=stage.querySelector('.story-loading');
    if(line)line.textContent='The illustration could not open. Reload to try again.';
    let context='none';
    try{
      const probe=document.createElement('canvas');
      context=probe.getContext('webgl2')?'webgl2':probe.getContext('webgl')?'webgl':'none';
    }catch(error){context='threw: '+error.message;}
    const canvas=stage.querySelector('canvas');
    console.error('polycity: no frame was drawn for '+(stage.dataset.storyStage||stage.dataset.outcomeStudy||'a city')+
      '; webgl='+context+'; canvas='+(canvas?canvas.width+'x'+canvas.height:'missing')+
      '; frames='+(canvas&&canvas.dataset.frame||'0'));
  });
},20000);
document.querySelectorAll('.mobile-menu a').forEach(a=>a.addEventListener('click',()=>a.closest('details').open=false));
document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const menu=document.querySelector('.mobile-menu[open]');
  if(!menu)return;
  menu.open=false;
  menu.querySelector('summary').focus();
});

// A reversible position on the page, rather than an elapsed animation timer.
export function createScrollProgress(element,{sticky=false}={}){
  let value=0,observer;
  const frame=sticky?element.querySelector('.hero-scroll-frame'):null;
  // A picture shorter than the screen is held in the middle of it, not against
  // the top with the rest of the page showing empty underneath.
  function offset(){
    const height=frame.getBoundingClientRect().height;
    return height>=innerHeight ? innerHeight-height : (innerHeight-height)/2;
  }
  function layout(){
    if(!frame)return;
    element.classList.add('scroll-linked');
    const height=frame.getBoundingClientRect().height;
    element.style.setProperty('--hero-frame-height',height+'px');
    frame.style.top=offset()+'px';
  }
  if(frame){layout();observer=new ResizeObserver(layout);observer.observe(frame);window.addEventListener('resize',layout);}
  function bounds(){
    const top=element.getBoundingClientRect().top+scrollY;
    const maximum=Math.max(0,document.documentElement.scrollHeight-innerHeight);
    if(frame){
      const held=offset();
      const travel=Math.max(1,element.getBoundingClientRect().height-frame.getBoundingClientRect().height);
      return {start:top-held,end:Math.min(maximum,top-held+travel)};
    }
    return {start:top-innerHeight*.95,end:Math.min(maximum,top-innerHeight*.18)};
  }
  // The page carries a little weight: the read position eases toward where the
  // scroll actually is, on the same frame that draws the city, so the camera
  // and the words never arrive on different clocks.
  let eased=null,last=performance.now();
  return {
    read(paused,reduced){
      if(reduced)return 1;
      if(!paused){const {start,end}=bounds();value=Math.max(0,Math.min(1,(scrollY-start)/Math.max(1,end-start)));}
      const now=performance.now(),dt=Math.min((now-last)/1000,.08);last=now;
      if(eased===null||paused)eased=value;
      else eased+=(value-eased)*(1-Math.exp(-dt*7.5));
      return Math.abs(value-eased)<.0004 ? (eased=value) : eased;
    },
    seek(progress,behavior='smooth'){
      const {start,end}=bounds();window.scrollTo({top:start+(end-start)*progress,behavior});
    },
    dispose(){observer?.disconnect();if(frame)window.removeEventListener('resize',layout);}
  };
}

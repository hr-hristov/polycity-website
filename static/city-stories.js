import { createCityKit } from './city-kit.js?v=7c4acbfa47ff';
import { createScrollProgress } from './scroll-motion.js?v=5c3d066fb57c';
import { attachOutcomeStudies } from './outcome-studies.js?v=9b86233f75cc';

// Independent illustrated scenes share the homepage's palette, crowns, and pause state.
export function attachCityStories({ THREE, crownGeometry, palette, reducedMotion }) {
  let paused = reducedMotion.matches, disposed = false, previous = performance.now();
  const kit = createCityKit({ THREE, crownGeometry, palette });
  const { stages, own, mesh, box, group, house, tree, person, tram, stage, ground, frame:aimCamera } = kit;
  const outcomes=attachOutcomeStudies({THREE,kit,palette,reducedMotion,isPaused:()=>paused});
  const smooth=t=>{const n=THREE.MathUtils.clamp(t,0,1);return n*n*(3-2*n);};
  const planning=stage('[data-story-stage="planning"]',26,[0,.7,0]);
  const planningMotion=createScrollProgress(planning.host);
  const p=planning.world;
  box(p,20,.4,13.8,0,-.24,0,'#bcc8ac');
  box(p,20,.1,13.8,0,-.015,0,'#e0e3cb');
  const boulevard=box(p,19.8,.045,3.3,0,.06,0,'#adbba9');
  const greenway=box(p,19.7,.05,1.7,0,.075,1.15,'#b2c597');
  for(let i=-9;i<=9;i+=1.1)box(p,.4,.03,.05,i,.11,-.25,'#f6efd8').castShadow=false;
  const neighborhood=[];
  for(const [x,z,w,d,h,color] of [
    [-7,-4.4,2.8,2.7,2.5,palette.copper],[-2.9,-4.6,2.4,2.5,3.4,palette.mint],
    [1.4,-4.5,2.8,2.6,2.7,palette.copper],[6.3,-4.4,3.2,2.7,2.3,palette.mint],
    [-7.4,4.7,2.7,2.5,2.1,palette.mint],[7.4,4.6,2.9,2.6,2.7,palette.copper]
  ])neighborhood.push(house(p,x,z,w,d,h,color));
  const future=[house(p,-2.6,4.6,2.6,2.6,4.2,palette.mint),house(p,2.5,4.6,2.9,2.5,3.5,palette.copper)];
  const planted=[-7.6,-3.8,0,3.8,7.6].map((x,i)=>tree(p,x,2.15,.83,i%2?palette.leaf:palette.forest));
  const gardenTrees=[tree(p,-2.7,4.6,.92),tree(p,2.5,4.8,.85)];
  const rearTrees=[tree(p,-9.1,-2.4,.7),tree(p,9,-2.4,.8)];
  const tramGroup=group(p),parts=tram(tramGroup);
  const rails=group(p);
  for(const z of [-.62,-.19])box(rails,20,.025,.045,0,.095,z,'#687f71').castShadow=false;
  for(const x of [-6.8,5.8]){
    box(rails,2.2,.1,.85,x,.09,-1.45,'#ecdec0');
    box(rails,.065,1.15,.065,x-.7,.63,-1.7,'#6c8370');
    box(rails,.4,.4,.055,x-.7,1.3,-1.7,palette.coral);
  }
  const walkers=Array.from({length:9},(_,i)=>person(p,i));
  const walkingRoute=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-8,.1,2.95),new THREE.Vector3(8,.1,2.95),
    new THREE.Vector3(8.5,.1,3.75),new THREE.Vector3(-8,.1,3.75)
  ],true,'centripetal');
  const modes={streets:0,transit:1,growth:2};
  const planningInput=document.querySelector('[name="planning-question"]:checked');
  let mode=planningInput?.id.replace('question-','') || 'streets';
  let blend=Object.keys(modes).map(key=>key===mode?1:0),from=blend.slice(),changeAt=0;
  // The row the camera has arrived at carries the marker, so the words and the
  // city are never describing two different places.
  function markRow(){
    document.querySelectorAll('[data-camera-place]').forEach(row=>{
      row.toggleAttribute('data-current',row.dataset.cameraPlace===mode);
    });
  }
  function choosePlanning(input){
    if(!input?.checked)return;
    mode=input.id.replace('question-','');from=blend.slice();changeAt=planning.time;
    if(paused)from=blend.map((_,i)=>i===modes[mode]?1:0);
    planning.host.dataset.choice=mode;markRow();
    planning.dirty=true;
  }
  document.querySelectorAll('[name="planning-question"]').forEach(input=>input.addEventListener('change',()=>choosePlanning(input)));
  window.addEventListener('pageshow',()=>choosePlanning(document.querySelector('[name="planning-question"]:checked')));
  planning.host.dataset.choice=mode;markRow();
  ground(planning,{spread:2.8});
  // Each row of the proposal names a place in this city. The camera settles on
  // the one the reader has reached, rather than holding one wide picture.
  const rowShots={
    streets:{target:new THREE.Vector3(0,.7,1.15),span:26,from:new THREE.Vector3(14,15,20)},
    transit:{target:new THREE.Vector3(-.7,.85,-1),span:23,from:new THREE.Vector3(17,11,18)},
    growth:{target:new THREE.Vector3(0,1.15,4.5),span:22,from:new THREE.Vector3(11,13,21)}
  };
  const rowTarget=new THREE.Vector3(),rowFrom=new THREE.Vector3();
  function settle(weights){
    rowTarget.set(0,0,0);rowFrom.set(0,0,0);
    let span=0,total=0;
    Object.keys(modes).forEach(key=>{
      const weight=Math.max(0,weights[modes[key]]),shot=rowShots[key];
      rowTarget.addScaledVector(shot.target,weight);
      rowFrom.addScaledVector(shot.from,weight);
      span+=shot.span*weight;total+=weight;
    });
    if(total<.001)return;
    rowTarget.multiplyScalar(1/total);rowFrom.multiplyScalar(1/total);
    aimCamera(planning,rowTarget,span/total,rowFrom);
  }
  planning.update=()=>{
    const scroll=planningMotion.read(paused,reducedMotion.matches);
    if(!planningInput){
      const next=['streets','transit','growth'][Math.min(2,Math.floor(scroll*3))];
      if(next!==mode){mode=next;from=blend.slice();changeAt=planning.time;planning.host.dataset.choice=mode;markRow();}
    }
    const height=.62+.38*smooth(scroll);
    neighborhood.forEach(g=>g.scale.y=height);
    const progress=reducedMotion.matches ? 1 : smooth((planning.time-changeAt)/1.8);
    blend=from.map((v,i)=>THREE.MathUtils.lerp(v,i===modes[mode]?1:0,progress));
    const [street,connection,growth]=blend;
    boulevard.scale.z=3.3-street*1.25;
    greenway.scale.z=.15+street*1.65;
    greenway.position.z=.9+street*.25;
    planted.forEach((t,i)=>{
      const reveal=paused||reducedMotion.matches?street:smooth(street*1.5-i*.1);
      t.group.scale.setScalar(t.size*(.02+.98*reveal));
      t.crown.rotation.z=Math.sin(planning.time*.8+t.phase)*.05;
      t.crown.rotation.y=(1-reveal)*.7;
    });
    gardenTrees.forEach(t=>{t.group.scale.setScalar(t.size*(1-growth*.98));t.crown.rotation.z=Math.sin(planning.time*.7+t.phase)*.045;});
    rearTrees.forEach(t=>{t.crown.rotation.z=Math.sin(planning.time*.6+t.phase)*.04;});
    future.forEach((g,i)=>{g.scale.y=(.001+.999*smooth(growth*1.3-i*.25))*height;g.rotation.y=(1-smooth(growth))*.04;});
    rails.scale.y=.02+.98*connection;
    rails.visible=connection>.01;
    tramGroup.visible=connection>.01;
    tramGroup.scale.setScalar(.01+.99*connection);
    parts.forEach((part,i)=>{part.position.x=((planning.time*1.35+i*1.6+12)%27)-13.5;part.position.z=-.42;part.visible=Math.abs(part.position.x)<8.8;});
    walkers.forEach(({group:g,legs,phase})=>{
      const t=(planning.time/32+phase/9)%1,point=walkingRoute.getPoint(t),direction=walkingRoute.getTangent(t);
      g.position.copy(point);g.rotation.y=Math.atan2(direction.x,direction.z);
      legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(planning.time*7+phase+i*Math.PI)*.42;});
    });
    if(planningInput){
      const yaw=.56+connection*.16-growth*.1;
      planning.camera.position.set(Math.sin(yaw)*31,22-growth*2,Math.cos(yaw)*31);planning.camera.lookAt(0,.8+growth*.7,0);
    } else settle(blend);
    planning.canvas.dataset.pedestrian=walkers[0].group.position.x.toFixed(4);
    planning.canvas.dataset.growth=future[0].scale.y.toFixed(4);
    planning.canvas.dataset.tram=parts[0].position.x.toFixed(4);
    planning.canvas.dataset.tree=planted[0].crown.rotation.z.toFixed(4);
    planning.canvas.dataset.scrollProgress=scroll.toFixed(4);
    planning.canvas.dataset.buildingHeight=height.toFixed(4);
  };

  const closing=stage('[data-story-stage="closing"]',24,[0,1,0]);
  const closingMotion=createScrollProgress(closing.host);
  if(reducedMotion.matches)closing.time=7;
  const c=closing.world;
  box(c,17.6,.38,13.8,0,-.24,0,'#839b83');
  box(c,17.8,.1,14,0,-.01,0,'#d2dabc');
  box(c,17.5,.04,2.25,0,.06,2.25,'#acbba3');
  box(c,2.25,.04,13.8,1.4,.07,0,'#acbba3');
  const assembled=[
    house(c,-6,-4,2.8,2.8,2.5,palette.copper),
    house(c,-1.8,-4.1,3,2.6,3.6,palette.mint),
    house(c,3.3,-4.1,3.2,2.5,2.7,palette.copper),
    house(c,6.5,-1.9,2.4,2.6,3.2,palette.mint),
    house(c,-5.4,4.8,3,2.5,2.6,palette.mint),
    house(c,5.5,4.7,3.5,2.7,2.8,palette.copper)
  ];
  const pavilion=group(c,-3,.1,-.1);assembled.push(pavilion);
  box(pavilion,3.6,1.25,2.4,0,.65,0,'#f4ecd0');
  box(pavilion,3.85,.15,2.65,0,1.32,0,'#b7c5aa');
  const drum=own(new THREE.CylinderGeometry(.84,.84,.7,12));
  mesh(pavilion,drum,palette.stone,0,1.6,0);
  const cap=own(new THREE.SphereGeometry(1,12,5,0,Math.PI*2,0,Math.PI/2));
  const dome=mesh(pavilion,cap,palette.gold,0,1.96,0);dome.scale.set(.95,.85,.95);
  const grove=[[-7,-.3],[-6.3,1],[-.1,-1],[3.4,-.6],[6.5,1.2],[-1.6,4.6],[1.2,5.5],[7,-5.5],[-7.4,-5.6]].map(([x,z],i)=>tree(c,x,z,.77+(i%3)*.13,i%2?palette.leaf:palette.forest));
  for(const z of [2.06,2.44])box(c,17.6,.025,.035,0,.105,z,'#7b9078');
  const closingTram=tram(c);
  ground(closing,{spread:2.8});
  closing.update=()=>{
    const scroll=closingMotion.read(paused,reducedMotion.matches);
    assembled.forEach((g,i)=>{
      const rise=smooth((scroll-i*.035)/(1-i*.035));
      g.scale.y=.08+.92*rise;g.position.y=.08-(1-rise)*.12;
    });
    grove.forEach((t,i)=>{
      const growth=smooth((scroll-i*.03)/(1-i*.03));
      t.group.scale.setScalar(t.size*(.001+.999*growth));
      t.crown.rotation.z=(1-growth)*-.38+Math.sin(closing.time*.65+t.phase)*.055;
      t.crown.rotation.y=(1-growth)*1.2;
    });
    closingTram.forEach((part,i)=>{part.position.x=((closing.time*1.3+i*1.6+10)%23)-11.5;part.position.z=2.25;part.scale.setScalar(.25+.75*smooth(scroll));part.visible=Math.abs(part.position.x)<7.8;});
    c.rotation.y=(scroll-.5)*.18;
    if(!planningInput)fitStory(closing,28,23);
    closing.canvas.dataset.assembly=assembled[3].scale.y.toFixed(4);
    closing.canvas.dataset.tree=grove[0].crown.rotation.z.toFixed(4);
    closing.canvas.dataset.tram=closingTram[0].position.x.toFixed(4);
    closing.canvas.dataset.scrollProgress=scroll.toFixed(4);
  };

  const process=document.querySelector('[data-workflow-visual]');
  function fitStory(view,width,height){
    const aspect=view.canvas.clientWidth/view.canvas.clientHeight,half=Math.max(height,width/aspect)/2;
    Object.assign(view.camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});
    view.camera.updateProjectionMatrix();
  }
  const processMotion=createScrollProgress(document.querySelector('.workflow'));
  const processPath=process.querySelector('[data-process-path]');
  const processDots=[...process.querySelectorAll('[data-process-traveler]')];
  const processLength=processPath.getTotalLength();
  const processNames=['SKETCH THE POSSIBILITY','FOLLOW THE CITY IN MOTION','READ WHAT CHANGES','PUT FUTURES SIDE BY SIDE','REFINE THE NEXT POSSIBILITY'];
  const processState={time:reducedMotion.matches?3.5:0,visible:false,step:0};
  function selectStep(index){
    processState.step=index;process.dataset.step=String(index);
    process.querySelector('[data-process-name]').textContent=processNames[index];
    document.querySelectorAll('.workflow-step').forEach((step,i)=>step.classList.toggle('is-current',i===index));
  }
  selectStep(0);
  const visibility=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const s=stages.find(s=>s.host===entry.target);
      if(s)s.visible=entry.isIntersecting;
      else if(entry.target===process){processState.visible=entry.isIntersecting;process.dataset.visible=String(entry.isIntersecting);}
    });
  },{rootMargin:'80px'});
  stages.forEach(s=>visibility.observe(s.host));visibility.observe(process);

  function tick(now,scheduled=true){
    if(disposed)return;
    const dt=Math.min((now-previous)/1000,.07);previous=now;
    if(!document.hidden||stages.some(s=>s.frame===0)){
      for(const s of stages){
        if(document.hidden&&s.frame>0)continue;
        // A city standing on screen draws its first frame whether or not the
        // page has been told it is there. A browser that reports it off screen
        // used to leave it reading "Opening the city study." for good.
        if(!s.visible&&s.frame===0){
          const box=s.host.getBoundingClientRect();
          s.visible=box.bottom>0&&box.top<innerHeight;
        }
        if(!s.visible||s.lost)continue;
        if(paused&&s.frame>0&&!s.dirty)continue;
        if(paused&&s.frame===0&&s===closing)s.time=7;
        if(!paused)s.time+=dt;
        s.update();s.render();s.frame++;
        s.dirty=false;
        s.host.dataset.renderState='ready';s.host.querySelector('.story-loading').textContent='Illustration ready.';
        s.canvas.dataset.frame=String(s.frame);s.canvas.dataset.motion=paused?'paused':'running';
      }
      if(processState.visible){
        if(!paused)processState.time+=dt;
        const time=processMotion.read(paused,reducedMotion.matches)*29.999,step=Math.floor(time/6)%5;
        if(step!==processState.step)selectStep(step);
        processPath.style.strokeDasharray=String(processLength);
        processPath.style.strokeDashoffset=String(step===0 ? processLength*(1-smooth((time%6)/3.5)) : 0);
        processDots.forEach((dot,i)=>{
          const point=processPath.getPointAtLength(((time/5+i/3)%1)*processLength);
          dot.setAttribute('cx',point.x.toFixed(3));dot.setAttribute('cy',point.y.toFixed(3));
        });
        process.dataset.phase=time.toFixed(3);
        process.querySelectorAll('.workflow-layer').forEach((layer,i)=>{
          layer.style.transform='translateY('+(-Math.sin(time*.6+i)*7).toFixed(2)+'px)';
        });
      }
    }
    if(scheduled)frame=requestAnimationFrame(tick);
  }
  let frame=requestAnimationFrame(tick);
  // The same fallback the hero has: where a browser never runs an animation
  // frame, a timer draws instead, so no city is left saying it is opening.
  let ticker=null;
  setTimeout(()=>{
    if(disposed||stages.some(s=>s.frame>0))return;
    tick(performance.now(),false);
    ticker=setInterval(()=>{if(!disposed)tick(performance.now(),false);},50);
  },700);
  return {
    setPaused(value){paused=value;stages.forEach(s=>{s.dirty=true;});document.body.classList.toggle('motion-paused',value);},
    dispose(){
      disposed=true;cancelAnimationFrame(frame);clearInterval(ticker);visibility.disconnect();
      planningMotion.dispose();closingMotion.dispose();processMotion.dispose();
      outcomes.dispose();
      kit.dispose();
    }
  };
}

import { createScrollProgress } from './scroll-motion.js?v=5c3d066fb57c';

// Authored vignettes explain the product's outcome categories; they are not simulation results.
export function attachOutcomeStudies({ THREE, kit, palette, reducedMotion, isPaused }) {
  const { stage, own, mesh, box, group, house, tree, person, tram, ground } = kit;
  const gallery = !!document.querySelector('[data-outcome-study]');
  const s = gallery ? null : stage('[data-story-stage="outcomes"]', 25, [0, .6, 0]);
  const motion = s ? createScrollProgress(s.host) : null;
  const smooth = t => { const n = THREE.MathUtils.clamp(t, 0, 1); return n * n * (3 - 2 * n); };
  const studies = new Map();
  const sphere = own(new THREE.IcosahedronGeometry(1, 0));
  const wheel = own(new THREE.TorusGeometry(.25, .04, 4, 12));
  const cylinder = own(new THREE.CylinderGeometry(1, 1, 1, 32));

  function study(key, title, description, label) {
    const view = gallery ? stage('[data-outcome-study="'+key+'"]', 25, [0,.6,0]) : s;
    const world = group(view.world);
    world.visible = gallery;
    const model = { key, title, description, label, world, view, trees: [], buildings: [], update() {} };
    if(gallery)model.motion=createScrollProgress(view.host);
    studies.set(key, model);
    return model;
  }
  function plinth(model, size=17.5, depth=13) {
    box(model.world, size, .45, depth, 0, -.3, 0, '#acbda0');
    box(model.world, size+.05, .13, depth+.05, 0, -.015, 0, '#d9dfc2');
    // Exposed strata give each study the edge of a small architectural model.
    box(model.world, size-.35, .07, depth-.35, 0, -.49, 0, '#ede7cc');
  }
  function building(model, x, z, w=2.5, d=2.6, h=2.7, color=palette.copper) {
    const g = house(model.world, x, z, w, d, h, color);
    model.buildings.push(g); return g;
  }
  function plant(model, x, z, size=1, color=palette.forest) {
    const t = tree(model.world, x, z, size, color); model.trees.push(t); return t;
  }
  function path(parent, points, color, radius=.035, closed=false) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'centripetal');
    const line = mesh(parent, own(new THREE.TubeGeometry(curve, 64, radius, 5, closed)), color);
    line.castShadow = false;
    return curve;
  }
  function line(parent, from, to, color, width=.055) {
    return path(parent, [from, to], color, width);
  }
  function place(g, route, progress) {
    const t = ((progress % 1) + 1) % 1;
    g.position.copy(route.getPoint(t));
    const tangent = route.getTangent(t);
    g.rotation.y = Math.atan2(tangent.x, tangent.z);
  }
  function car(parent, color=palette.copper) {
    const g = group(parent);
    box(g, .7, .31, 1.38, 0, .28, 0, color);
    box(g, .57, .31, .72, 0, .57, -.08, '#e8e5cd');
    box(g, .585, .2, .48, 0, .58, -.09, palette.ink);
    box(g, .58, .05, .52, 0, .75, -.09, color);
    for (const x of [-.36,.36]) for (const z of [-.42,.42]) {
      const tire = mesh(g, cylinder, palette.ink, x, .2, z);
      tire.scale.set(.17,.09,.17); tire.rotation.z=Math.PI/2;
    }
    return g;
  }
  function walk(parent, route, number=6) {
    const people=Array.from({length:number},(_,i)=>person(parent,i));
    return time => people.forEach(({group:g, legs, phase}) => {
      place(g,route,time/35+phase/number);
      legs.forEach((leg,i)=>leg.rotation.x=Math.sin(time*7+phase+i*Math.PI)*.4);
    });
  }
  function rails(parent, length, z) {
    for (const offset of [-.24,.24]) box(parent,length,.025,.035,0,.1,z+offset,'#71866e');
    for(let x=-length/2+.3;x<length/2;x+=.65)box(parent,.08,.02,.7,x,.085,z,'#a8b497');
  }
  function stop(parent, x, z) {
    const g=group(parent,x,0,z);
    box(g,3.1,.15,1.6,0,.12,0,'#eee5c9');
    for(const px of [-1.15,1.15])for(const pz of [-.4,.4])box(g,.055,1.9,.055,px,1.05,pz,palette.forest);
    box(g,3.25,.12,1.75,0,2.04,0,palette.mint);
    box(g,2.45,.65,.05,0,1.28,-.42,'#a9bca2');
    box(g,2,.12,.36,0,.6,-.26,palette.copper);
    box(g,.07,2.2,.07,1.7,1.2,0,palette.ink);
    box(g,.4,.55,.08,1.7,2.1,0,palette.gold);
    return g;
  }
  function ring(parent, radius, color) {
    const g=mesh(parent,own(new THREE.TorusGeometry(radius,.028,4,80)),color,0,.15,0);
    g.rotation.x=Math.PI/2;g.castShadow=false;return g;
  }

  const mobility=study('mobility','One city. Many ways through.',
    'Trips by mode, average travel time, and trip distance.',
    'Geometric neighborhood with walkers, cyclists, and a golden tram following separate paths.');
  plinth(mobility);
  const m=mobility.world;
  box(m,17.4,.04,2.6,0,.07,1.45,'#b4c0a8');rails(m,17.3,1.6);
  box(m,17.4,.04,.85,0,.08,-.52,'#97b7a1');
  for(const [x,z,w,h,c] of [[-5,-4,3.1,2.6,palette.copper],[-.7,-4.3,2.4,3.7,palette.mint],[4.1,-3.9,3.2,2.8,palette.copper],[-5,4.8,3,2.5,palette.mint],[5.7,4.8,2.6,3,palette.copper]])building(mobility,x,z,w,2.4,h,c);
  for(const [x,z] of [[-7.4,-2],[-3.2,-1.9],[1,-1.9],[6.7,-2],[.1,4.5],[2.2,5.1]])plant(mobility,x,z,.85);
  const promenade=path(m,[[-7,.12,3.3],[6.8,.12,3.3],[7.5,.12,4.4],[0,.12,5.7],[-7,.12,3.3]],palette.copper,.04,true);
  const walking=walk(m,promenade,9), mt=tram(m);
  const bikes=Array.from({length:3},(_,i)=>{
    const g=group(m);
    for(const x of [-.4,.4]){const tire=mesh(g,wheel,palette.ink,x,.31,0);tire.rotation.y=0;}
    line(g,[-.4,.32,0],[0,.65,0],palette.coral,.035);
    line(g,[0,.65,0],[.4,.32,0],palette.coral,.035);
    line(g,[-.4,.32,0],[.4,.32,0],palette.coral,.035);
    const rider=person(g,i);rider.group.position.y=.45;rider.group.scale.setScalar(.85);
    return g;
  });
  mobility.update=t=>{
    walking(t);
    mt.forEach((part,i)=>{part.position.set(((t*1.05-i*1.6+13)%24)-12,.12,1.6);part.visible=Math.abs(part.position.x)<8;});
    bikes.forEach((g,i)=>{g.position.set(((t*1.6+i*5)%20)-10,.1,-.52);g.visible=Math.abs(g.position.x)<8.2;});
    mobility.view.canvas.dataset.activity=bikes[0].position.x.toFixed(4);
  };

  const congestion=study('congestion','A street has its own rhythm.',
    'Vehicles on the street and time spent driving.',
    'An angular city junction with cars queueing at a signal, then moving through together.');
  plinth(congestion);
  const c=congestion.world;
  box(c,17.4,.04,3.4,0,.07,1,'#afbaa6');box(c,3,.045,12.8,3,.075,0,'#afbaa6');
  for(let x=-8;x<8;x+=1.3)box(c,.55,.025,.06,x,.105,1,'#f5efd8');
  for(let z=-.15;z<2.5;z+=.4)box(c,.65,.025,.15,1.1,.105,z,'#f5efd8');
  for(const [x,z,w,d,h] of [[-5,-3.5,4,3,3.5],[.1,-4.7,2.5,2,2.5],[6.2,-4,2.3,2.8,4],[-5.5,4.6,3.7,2.3,2.5],[6,4.5,2.6,2.3,2.7]])building(congestion,x,z,w,d,h,x<0?palette.copper:palette.mint);
  for(const [x,z] of [[-7.6,-1.9],[-1.3,-2],[7.5,-1.9],[-1.6,4.5],[4.8,-1.8]])plant(congestion,x,z,.85);
  const signal=group(c,1.05,.1,-.7);
  box(signal,.09,2.1,.09,0,1,0,palette.ink);box(signal,.2,.64,.28,0,2.02,0,palette.ink);
  const red=mesh(signal,sphere,palette.coral,-.12,2.2,0),green=mesh(signal,sphere,palette.leaf,-.12,1.94,0);
  red.scale.setScalar(.115);green.scale.setScalar(.115);
  const traffic=Array.from({length:6},(_,i)=>car(c,[palette.copper,palette.mint,palette.stone,palette.gold][i%4]));
  const oncoming=Array.from({length:3},(_,i)=>car(c,i%2?palette.mint:palette.stone));
  congestion.update=t=>{
    const phase=t%13,release=smooth((phase-4)/6);
    red.visible=phase<4;green.visible=phase>=4;
    traffic.forEach((g,i)=>{g.position.set(-.5-i*1.45+release*(12+i*.3),.12,1.9);g.rotation.y=Math.PI/2;g.visible=Math.abs(g.position.x)<8.1;});
    oncoming.forEach((g,i)=>{g.position.set(9-((t*1.1+i*5)%20),.12,.12);g.rotation.y=-Math.PI/2;g.visible=Math.abs(g.position.x)<8.1;});
    congestion.view.canvas.dataset.activity=traffic[0].position.x.toFixed(4);congestion.view.canvas.dataset.signal=red.visible?'stop':'go';
  };

  const transit=study('transit','The city meets at a stop.',
    'Boardings and how full each tram and bus runs.',
    'A golden articulated tram arrives at a covered stop, where waiting figures board before the tram departs.');
  plinth(transit);
  const t=transit.world;
  box(t,17.4,.035,3.4,0,.08,1.7,'#b6c2a9');rails(t,17.3,2.1);rails(t,17.3,.65);
  for(const [x,z,w,h,c] of [[-5.3,-4,3.3,3.5,palette.copper],[0,-4.3,3,2.7,palette.mint],[5.3,-4,3.1,3.3,palette.copper]])building(transit,x,z,w,2.7,h,c);
  stop(t,-.5,-1);stop(t,4.1,4.15);
  for(const x of [-7,-4,3.3,7])plant(transit,x,-1.5,.86);
  for(const x of [-6.6,-3.6,.2])plant(transit,x,4.6,.85);
  for(const x of [-7,7]){box(t,.07,4,.07,x,2,3.25,palette.ink);box(t,2.8,.065,.065,x,4,1.8,palette.ink);}
  line(t,[-8,4,2.1],[8,4,2.1],'#8da089',.013);
  const train=tram(t),waiting=Array.from({length:7},(_,i)=>person(t,i));
  transit.update=time=>{
    const phase=time%18;
    const x=phase<6?THREE.MathUtils.lerp(-12,1.6,smooth(phase/6)):phase<10?1.6:THREE.MathUtils.lerp(1.6,15,smooth((phase-10)/8));
    train.forEach((part,i)=>{part.position.set(x-i*1.6,.12,.65);part.visible=Math.abs(part.position.x)<8;});
    waiting.forEach(({group:g,legs},i)=>{
      const board=smooth((phase-6-i*.35)/1.8);
      g.position.set(-2.2+i*.47,.18,-1.9+board*2.4);g.visible=phase<6||board<.95;
      legs.forEach((leg,j)=>leg.rotation.x=Math.sin(time*7+j*Math.PI)*.2);
    });
    transit.view.canvas.dataset.activity=x.toFixed(4);transit.view.canvas.dataset.boarding=String(waiting.filter(p=>p.group.visible).length);
  };

  const parking=study('parking','A journey needs somewhere to end.',
    'Occupancy, parking revenue, and time finding a space.',
    'A courtyard of marked parking bays; a copper car turns into a space, rests, and rejoins the street.');
  plinth(parking);
  const p=parking.world;
  box(p,12.5,.045,8.6,1.4,.07,.4,'#b9c2aa');
  building(parking,-6,-3.3,3,3.3,3.8);building(parking,1,-4.9,5,2.1,2.5,palette.mint);building(parking,6.1,-4.5,2.2,2.5,3.4);
  for(const [x,z] of [[-6,1],[-6,4.5],[6.9,4.8],[6.8,-1.5],[-2.7,4.8]])plant(parking,x,z,.95);
  for(const x of [-2.6,-.6,1.4,3.4,5.4])for(const z of [-2.1,3.05]){
    const sign=z<0?-1:1;
    box(p,1.65,.022,.055,x,.108,z+sign*.75,'#f2edd5');
    for(const side of [-1,1])box(p,.05,.022,1.8,x+side*.83,.108,z,'#f2edd5');
  }
  for(const [i,x,z] of [[0,-2.6,-2.1],[1,3.4,-2.1],[2,5.4,-2.1],[3,-.6,3.05],[4,5.4,3.05]]){
    const g=car(p,i%2?palette.mint:palette.stone);g.position.set(x,.12,z);
  }
  const parkingSign=group(p,-3.8,.1,3.9);box(parkingSign,.06,1.65,.06,0,.8,0,palette.ink);
  box(parkingSign,.55,.64,.09,0,1.65,0,palette.forest);
  box(parkingSign,.065,.42,.025,-.1,1.65,.06,'#f2edd5');
  box(parkingSign,.23,.065,.025,0,1.83,.06,'#f2edd5');box(parkingSign,.23,.065,.025,0,1.65,.06,'#f2edd5');box(parkingSign,.06,.19,.025,.1,1.74,.06,'#f2edd5');
  const parkingPath=path(p,[[-8,.13,.6],[-3,.13,.6],[-.7,.13,.6],[1.4,.13,.25],[1.4,.13,-2.05]],palette.copper,.03);
  const arriving=car(p,palette.copper);
  parking.update=time=>{
    const phase=time%18;
    const travel=phase<7?smooth(phase/7):phase<11?.9999:1-smooth((phase-11)/7);
    place(arriving,parkingPath,Math.min(.9999,travel));
    parking.view.canvas.dataset.activity=arriving.position.z.toFixed(4);parking.view.canvas.dataset.parked=String(phase>=7&&phase<11);
  };

  const emissions=study('emissions','Follow the traces of a journey.',
    'Exhaust from the vehicles moving through your city.',
    'Faceted particles drift from moving cars beside a grove of folded trees and angular rooflines.');
  plinth(emissions);
  const e=emissions.world;
  box(e,17.4,.035,2.9,0,.08,1.8,'#b1bda6');
  box(e,12,.05,4.8,-1.1,.07,-2.9,'#aebf98');
  building(emissions,6,-3.6,3,3.5,3.6,palette.mint);building(emissions,-5.6,4.85,3.5,2.2,2.5);building(emissions,5.5,4.8,3,2.3,2.8);
  for(const [i,x,z,size] of [[0,-6,-4.4,1.3],[1,-2.9,-4.1,1.6],[2,.1,-4.3,1.3],[3,-5,-1.4,1.1],[4,-1.8,-1.5,1.25],[5,1.1,-1.3,1.05],[6,2.5,4.7,.9]])plant(emissions,x,z,size,i%2?palette.leaf:palette.forest);
  const vehicles=[car(e,palette.copper),car(e,palette.stone)];
  const particles=Array.from({length:26},(_,i)=>{
    const g=mesh(e,sphere,i%3?palette.copper:palette.gold);g.castShadow=false;return g;
  });
  emissions.update=time=>{
    vehicles.forEach((g,i)=>{g.position.set(((time*1.2+i*9)%22)-11,.13,1.3+i);g.rotation.y=Math.PI/2;g.visible=Math.abs(g.position.x)<8.1;});
    particles.forEach((g,i)=>{
      const age=(time*.26+i/26)%1,car=vehicles[i%2];
      g.position.set(car.position.x-.75-age*3.3,.55+age*4.1,car.position.z+Math.sin(age*3+i)*age*.6);
      g.scale.setScalar(.015+Math.sin(age*Math.PI)*.19);g.rotation.set(age*2,i,age*3);
      g.visible=Math.abs(g.position.x)<8.3;
    });
    emissions.view.canvas.dataset.activity=particles[0].position.y.toFixed(4);
  };

  const accessibility=study('accessibility','A whole world within reach.',
    'How easily each district reaches jobs and everyday places.',
    'Paths radiate from a central home to a school, a market, a tram stop, and a park, with travelers moving between them.');
  const a=accessibility.world;
  const island=mesh(a,cylinder,'#acbda0',0,-.3,0);island.scale.set(9,.45,9);
  const top=mesh(a,cylinder,'#d9dfc2',0,-.02,0);top.scale.set(9.03,.13,9.03);
  const reach=[ring(a,3.1,'#a3b594'),ring(a,5.5,'#a3b594'),ring(a,8,'#a3b594')];
  building(accessibility,0,0,2.5,2.5,3.1,palette.copper);
  building(accessibility,-5,-4,3.1,2.4,2.5,palette.mint);
  const school=building(accessibility,3,-5.3,3.8,2.4,2.4);
  box(school,.045,1.2,.045,0,3.4,0,palette.ink);box(school,.65,.4,.03,.3,3.8,0,palette.gold);
  const market=group(a,5.6,1,1.2);
  for(const x of [-1.1,1.1])box(market,.06,1.4,.06,x,-.1,0,palette.forest);
  box(market,2.5,.8,.8,0,-.35,0,'#eee8ce');
  for(let i=0;i<7;i++)box(market,.38,.13,1.45,-1.14+i*.38,.7,0,i%2?palette.stone:palette.copper);
  for(const x of [-.7,0,.7]){const fruit=mesh(market,sphere,palette.gold,x,.18,0);fruit.scale.setScalar(.21);}
  stop(a,-4.8,2.4);
  for(const [x,z,size] of [[-2.4,-5.8,.8],[6.4,-2.9,1],[.1,5.7,1.4],[2.4,5.4,1.1],[-6.9,-.5,.8]])plant(accessibility,x,z,size);
  const destinations=[[-5,-4],[3,-5.3],[5.6,1.2],[1,5.6],[-4.8,2.4]];
  const travelers=destinations.map(([x,z],i)=>{
    const route=path(a,[[0,.14,0],[x*.45,.14,z*.35],[x,.14,z]],i%2?palette.forest:palette.copper,.042);
    const walker=person(a,i);return {route,...walker};
  });
  accessibility.update=time=>{
    travelers.forEach(({route,group:g,legs},i)=>{place(g,route,(time/12+i*.19)%1);legs.forEach((leg,j)=>leg.rotation.x=Math.sin(time*7+j*Math.PI)*.35);});
    reach.forEach((g,i)=>{const breathing=1+Math.sin(time*.6-i)*.017;g.scale.setScalar(breathing);});
    accessibility.view.canvas.dataset.activity=travelers[0].group.position.x.toFixed(4);
  };

  if(gallery){
    let order=0;
    for(const model of studies.values()){
      const view=model.view;
      view.time=reducedMotion.matches?7:0;
      // Each card's city settles onto its own ground as the card arrives, a
      // fifth of a second behind the one before it, rather than six cities
      // starting at once.
      const wake=order++*.2;
      ground(view,{spread:2.6});
      view.update=()=>{
        const scroll=model.motion.read(isPaused(),reducedMotion.matches);
        const height=.62+.38*smooth(scroll);
        const settle=reducedMotion.matches?1:smooth((view.time-wake)/.85);
        view.world.position.y=(settle-1)*.85;
        view.world.rotation.y=(1-settle)*-.12;
        model.buildings.forEach(building=>{building.scale.y=height;});
        model.trees.forEach(({crown,phase})=>{
          crown.rotation.z=Math.sin(view.time*.7+phase)*.052;
          crown.rotation.x=Math.cos(view.time*.5+phase)*.025;
        });
        model.update(view.time);
        const aspect=view.canvas.clientWidth/view.canvas.clientHeight;
        const half=Math.max(22,27/aspect)/2;
        Object.assign(view.camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});
        view.camera.updateProjectionMatrix();
        view.canvas.dataset.mode=model.key;
        view.canvas.dataset.scrollProgress=scroll.toFixed(4);
        view.canvas.dataset.buildingHeight=height.toFixed(4);
        view.canvas.dataset.tree=model.trees[0].crown.rotation.z.toFixed(4);
      };
    }
    return {dispose(){studies.forEach(model=>model.motion.dispose());}};
  }

  const buttons=[...document.querySelectorAll('[data-outcome]')];
  const panel=document.querySelector('#outcome-panel');
  let selected=mobility,changedAt=-2;
  function select(button) {
    selected=studies.get(button.dataset.outcome);changedAt=s.time;
    for(const model of studies.values())model.world.visible=model===selected;
    buttons.forEach(b=>{b.setAttribute('aria-selected',String(b===button));b.tabIndex=b===button?0:-1;});
    panel.setAttribute('aria-labelledby',button.id);
    document.querySelector('[data-outcome-folio]').textContent=button.querySelector('span').textContent+' / '+button.querySelector('strong').textContent;
    document.querySelector('[data-outcome-title]').textContent=selected.title;
    document.querySelector('[data-outcome-description]').textContent=selected.description;
    s.canvas.setAttribute('aria-label',selected.label);
    s.host.dataset.choice=selected.key;s.dirty=true;
  }
  function onClick(event) { select(event.currentTarget); }
  function onKey(event) {
    const index=buttons.indexOf(event.currentTarget);
    let next=index;
    if(['ArrowRight','ArrowDown'].includes(event.key))next=(index+1)%buttons.length;
    else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(index+buttons.length-1)%buttons.length;
    else if(event.key==='Home')next=0;
    else if(event.key==='End')next=buttons.length-1;
    else return;
    event.preventDefault();buttons[next].focus();select(buttons[next]);
  }
  buttons.forEach(button=>{button.addEventListener('click',onClick);button.addEventListener('keydown',onKey);});
  const narrow=matchMedia('(max-width:620px)');
  const orientation=()=>document.querySelector('.outcome-tabs').setAttribute('aria-orientation',narrow.matches?'horizontal':'vertical');
  narrow.addEventListener('change',orientation);orientation();select(buttons[0]);changedAt=-2;
  s.update=()=>{
    const scroll=motion.read(isPaused(),reducedMotion.matches);
    const height=.62+.38*smooth(scroll);
    const arrival=isPaused()||reducedMotion.matches?1:smooth((s.time-changedAt)/1.1);
    selected.world.rotation.y=(1-arrival)*-.16;
    selected.buildings.forEach(g=>g.scale.y=height);
    selected.trees.forEach(({crown,phase})=>{
      crown.rotation.z=Math.sin(s.time*.7+phase)*.052;
      crown.rotation.x=Math.cos(s.time*.5+phase)*.025;
    });
    selected.update(s.time);
    const aspect=s.canvas.clientWidth/s.canvas.clientHeight;
    const span=Math.max(21.5,25/aspect),half=span/2;
    s.camera.left=-half*aspect;s.camera.right=half*aspect;s.camera.top=half;s.camera.bottom=-half;s.camera.updateProjectionMatrix();
    s.canvas.dataset.mode=selected.key;s.canvas.dataset.scrollProgress=scroll.toFixed(4);
    s.canvas.dataset.buildingHeight=height.toFixed(4);s.canvas.dataset.tree=selected.trees[0].crown.rotation.z.toFixed(4);
  };
  return {dispose(){
    motion.dispose();narrow.removeEventListener('change',orientation);
    buttons.forEach(button=>{button.removeEventListener('click',onClick);button.removeEventListener('keydown',onKey);});
  }};
}

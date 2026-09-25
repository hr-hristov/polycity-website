import { THREE, plan } from './one-city.js?v=93d1433f0575';

// What the Technical page draws over the city, one set for each of the three
// ways Polycity runs it:
//   the quick estimate: a glass block over each zone as tall as the trips the
//     zone makes, arcs carrying trips from zone to zone that split into the
//     four ways of travelling, and the car trips loaded onto the roads as
//     walls of light that rise and fall hour by hour;
//   the simulated day: residents at every door, each group's plan along the
//     streets, everyone out at once, each day weighed by a ring at its end,
//     one resident's plan changing, and the rounds of learning stacked over
//     the city as slices of its roads, orange to blue as it settles;
//   the junction study: a line round one stretch of the west road, a dot every
//     second behind every vehicle in it, the gap each car keeps ahead, the
//     signal's ring at the stop line and the longest tailback beside the queue.
// All of it lies over the city rather than being part of it, so none of it
// turns into numbers.
const INK='#000b2d',ORANGE='#fd4b08',CYAN='#0ad6ed',GOLD='#febe11',BLUE='#049dd6',PURPLE='#57039b',FOOT='#e0a800';
const RED='#e23b3b',GREEN='#2fa36b';
const BLOCKS_X=[[-11.25,-6.9],[-5.1,4.9],[6.7,11.25]],BLOCKS_Z=[[-8.5,-4.3],[-2.5,2.5],[4.3,8.5]];
const ZONES=BLOCKS_X.flatMap(([x0,x1])=>BLOCKS_Z.map(([z0,z1])=>({x0,x1,z0,z1,x:(x0+x1)/2,z:(z0+z1)/2})));
// The trips each zone makes, in the same order as ZONES, and how tall that
// stands its block: every block clears the roofs of its own zone.
const TRIPS_MADE=[2.4,2,3,2.2,3.6,2.6,1.8,2.8,2];
const blockHeight=trips=>2.6+trips*1.25;
// The trips between zones: from, to and how thick the arc is.
const FLOWS=[[2,4,.07],[8,3,.06],[7,4,.05],[0,5,.045],[6,1,.04],[5,7,.035],[2,6,.03]];
// How the trips share out between the ways of travelling: car, public
// transport, bike and on foot, the shares How it works fits to the survey.
const MODES=[{color:ORANGE,share:.48},{color:PURPLE,share:.27},{color:BLUE,share:.07},{color:FOOT,share:.18}];
// Each road between two junctions, and how full its car trips make it at the
// busiest hour, 0 to 1.
const ROADS=[
  [-12.3,-3.4,-6,-3.4,.55],[-6,-3.4,5.8,-3.4,.95],[5.8,-3.4,12.3,-3.4,.5],
  [-12.3,3.4,-6,3.4,.35],[-6,3.4,5.8,3.4,.62],[5.8,3.4,12.3,3.4,.3],
  [-6,-9.6,-6,-3.4,.78],[-6,-3.4,-6,3.4,.9],[-6,3.4,-6,9.6,.42],
  [5.8,-9.6,5.8,-3.4,.45],[5.8,-3.4,5.8,3.4,.68],[5.8,3.4,5.8,9.6,.5],
  [-6.9,-9.15,6.7,-9.15,.3],[-6.9,9.15,6.7,9.15,.36]
];
// How busy the roads are at an hour, as a share of the busiest: a morning
// peak, a smaller one at noon and an evening peak.
export function hourLoad(hour){
  const bell=(centre,width)=>Math.exp(-(((hour-centre)/width)**2));
  return .12+.88*Math.max(bell(8,1.3),.85*bell(17.5,1.6),.35*bell(13,2.5));
}
// Flowing roads are blue, busy ones gold and queued ones orange.
const flowing=new THREE.Color(BLUE),busy=new THREE.Color(GOLD),queued=new THREE.Color(ORANGE);
function loadColor(target,load){
  const v=Math.min(1,Math.max(0,load));
  return v<.5?target.copy(flowing).lerp(busy,v/.5):target.copy(busy).lerp(queued,(v-.5)/.5);
}

// Where a building's door opens onto its street, a step out from the wall.
const doorOf=plan.doorOf;
const B=plan.BUILDINGS,HOME_DOOR=doorOf(B[6]),WORK_DOOR=doorOf(B[1]);
// One resident's day as the page follows it, from a home on the south street
// to work on the north street, both in sight beside the words: by car along
// the south street, the west road past the signal and the north street, and
// after the plans change, by bike through the park on the cycle track.
const CAR_ROUTE=[HOME_DOOR,[HOME_DOOR[0],3.4],[-6,3.4],[-6,-3.4],[WORK_DOOR[0],-3.4],WORK_DOOR];
const BIKE_ROUTE=[HOME_DOOR,[HOME_DOOR[0],2.25],[-4.22,2.25],[-4.22,-2.25],[WORK_DOOR[0],-2.25],WORK_DOOR];
// How well each plan's day came out, 0 to 1: the sample's days in their order,
// then the followed resident's. Some change their plans and come out better.
const SCORES=[.8,.3,.65,.25,.7,.55,.2];
const BETTER={1:.75,3:.8,6:.85};
// The rounds of learning the stack shows, and how far each has settled: the
// share of the busiest hour's load still standing on the roads.
export const ROUNDS=[1,2,5,12,30];
const SETTLING=[1,.82,.66,.52,.42];
const SLICE_Y=6.2,SLICE_STEP=1.4;
export const sliceHeight=k=>SLICE_Y+k*SLICE_STEP;

export function createTechnicalLayers(city){
  const {world,kit,traffic,lineMaterials}=city;
  const own=geometry=>kit.own(geometry);
  const flat=(color,opacity=1,{depthTest=true,blending=THREE.NormalBlending}={})=>{
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,depthTest,side:THREE.DoubleSide,fog:false,toneMapped:false,blending});
    lineMaterials.push(material);return material;
  };
  // A set of things shown together and faded as one. Each set belongs to one
  // of the three ways, so the three-way screen can draw each slice of the city
  // with only its own way's sets.
  const sets=[];let only=null;
  function layer(way,parent=world,y=0,order=0){
    const group=new THREE.Group();group.position.y=y;group.visible=false;parent.add(group);
    const parts=[];let shown=-1;
    const set={
      group,way,on:false,
      add(mesh,material=mesh.material){mesh.renderOrder=order;group.add(mesh);if(!parts.some(([m])=>m===material))parts.push([material,material.opacity]);return mesh;},
      set(alpha){
        const a=Math.round(Math.min(1,Math.max(0,alpha))*1000)/1000;
        if(a!==shown){shown=a;parts.forEach(([material,base])=>{material.opacity=base*a;});}
        set.on=a>0;group.visible=set.on&&(only===null||only===way);
      }
    };
    sets.push(set);return set;
  }
  // Shows only one way's sets, or every set again with null.
  function show(way){
    only=way;
    sets.forEach(set=>{set.group.visible=set.on&&(way===null||way===set.way);});
  }
  // A flat band of a width along a line of [x, z] points, lying on the ground,
  // so it can be drawn part way.
  function band(points,width){
    const n=points.length,position=[],index=[],along=[0];
    for(let i=1;i<n;i++)along.push(along[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
    for(let i=0;i<n;i++){
      const a=points[Math.max(0,i-1)],b=points[Math.min(n-1,i+1)];
      let dx=b[0]-a[0],dz=b[1]-a[1];const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
      const nx=-dz*width/2,nz=dx*width/2;
      position.push(points[i][0]+nx,0,points[i][1]+nz,points[i][0]-nx,0,points[i][1]-nz);
      if(i>0){const k=2*i;index.push(k-2,k-1,k,k-1,k+1,k);}
    }
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setIndex(index);
    return {geometry:own(geometry),points,along,length:along[n-1]};
  }
  const drawTo=(path,progress)=>path.geometry.setDrawRange(0,6*Math.floor((path.points.length-1)*Math.min(1,Math.max(0,progress))));
  const line=(corners,{closed=false,radius=.18,step=.1}={})=>plan.makePath(corners,{closed,radius}).points(step);
  const plane=own(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2));
  const disc=own(new THREE.CircleGeometry(1,40).rotateX(-Math.PI/2));
  const ring=own(new THREE.RingGeometry(.9,1,64).rotateX(-Math.PI/2));
  const ball=own(new THREE.IcosahedronGeometry(1,2));
  const stroke=(target,corners,width,material,options)=>{
    const path=band(line(corners,options),width);
    return {...path,mesh:target.add(new THREE.Mesh(path.geometry,material))};
  };
  // A traveller: a gold dot with a dark rim. Both stand at one place, so the
  // dot is drawn after its rim, or the rim covers it. Each set has its own
  // pair of materials, since a set fades its materials with it.
  const travellerLook=new Map();
  function traveller(set,size=.2,color=GOLD){
    if(!travellerLook.has(set))travellerLook.set(set,{rim:Object.assign(flat(INK,1),{side:THREE.BackSide}),dots:{}});
    const look=travellerLook.get(set);look.dots[color]??=flat(color,1);
    const g=new THREE.Group();set.group.add(g);
    const dot=set.add(new THREE.Mesh(ball,look.dots[color]));dot.scale.setScalar(size);g.add(dot);
    const rim=set.add(new THREE.Mesh(ball,look.rim));rim.scale.setScalar(size*1.24);g.add(rim);
    dot.renderOrder=rim.renderOrder+1;
    return g;
  }

  // ---- 01 The quick estimate --------------------------------------------------
  // A glass block over each zone, standing on the ground, as tall as the trips
  // the zone makes. Each rises on its own, a little after the one before.
  const blocks=layer('quick',world,.1,3);
  const glass=flat(CYAN,.09),glassTop=flat(CYAN,.2);
  const edge=new THREE.LineBasicMaterial({color:'#0ab8cf',transparent:true,opacity:.95,depthWrite:false,fog:false,toneMapped:false});
  lineMaterials.push(edge);
  const boxGeometry=own(new THREE.BoxGeometry(1,1,1).translate(0,.5,0));
  const boxEdges=own(new THREE.EdgesGeometry(boxGeometry));
  const tops=ZONES.map((zone,i)=>{
    const g=new THREE.Group();g.position.set(zone.x,0,zone.z);blocks.group.add(g);
    const w=zone.x1-zone.x0-.3,d=zone.z1-zone.z0-.3,h=blockHeight(TRIPS_MADE[i]);
    const fill=blocks.add(new THREE.Mesh(boxGeometry,glass));fill.scale.set(w,h,d);g.add(fill);
    const lines=blocks.add(new THREE.LineSegments(boxEdges,edge));lines.scale.set(w,h,d);g.add(lines);
    const top=blocks.add(new THREE.Mesh(plane,glassTop));top.scale.set(w,1,d);top.position.y=h;g.add(top);
    g.scale.y=.001;
    return {group:g,height:h};
  });
  // The trips between zones, from the top of one block to the top of another.
  // Each arc is four strands, one for each way of travelling, drawn together
  // as one dark arc until the trips are shared out, when the strands part and
  // take their colours.
  const arcs=layer('quick',world,0,4);
  const ARC_STEPS=60,ARC_SIDES=6;
  const strandMaterials=MODES.map(()=>flat(INK,.92));
  const strandColors=MODES.map(mode=>new THREE.Color(mode.color)),ink=new THREE.Color(INK);
  const flows=FLOWS.map(([a,b,width])=>{
    const A=ZONES[a],Z=ZONES[b],ha=blockHeight(TRIPS_MADE[a])+.1,hb=blockHeight(TRIPS_MADE[b])+.1;
    const length=Math.hypot(Z.x-A.x,Z.z-A.z),across=[-(Z.z-A.z)/length,(Z.x-A.x)/length];
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(A.x,ha,A.z),new THREE.Vector3((A.x+Z.x)/2,Math.max(ha,hb)+1.4+length*.1,(A.z+Z.z)/2),new THREE.Vector3(Z.x,hb,Z.z));
    const radii=MODES.map(mode=>width*.95*Math.sqrt(mode.share*4));
    // Where each strand stands across the arc once they part, side by side.
    const total=radii.reduce((sum,r)=>sum+2*r,0)+.05*(MODES.length-1);
    let at=-total/2;
    const strands=MODES.map((mode,k)=>{
      const geometry=own(new THREE.TubeGeometry(curve,ARC_STEPS,radii[k],ARC_SIDES,false));
      const mesh=arcs.add(new THREE.Mesh(geometry,strandMaterials[k]));
      const offset=at+radii[k];at+=2*radii[k]+.05;
      return {mesh,geometry,offset};
    });
    [[A,ha],[Z,hb]].forEach(([zone,h])=>{const end=arcs.add(new THREE.Mesh(disc,flat(INK,.9)));end.scale.setScalar(.22);end.position.set(zone.x,h+.005,zone.z);});
    return {curve,across,strands};
  });
  // Trips riding the arcs while the trips are spread between the zones.
  const riders=layer('quick',world,0,5);
  const riderDots=flows.flatMap((flow,i)=>[0,1].map(k=>({flow,phase:k/2+i*.13,group:traveller(riders,.13)})));
  // The car trips loaded onto the roads: a wall of light along each road, as
  // tall as the trips on it at the hour, blue where they flow, gold where it
  // is busy and orange where they queue.
  const walls=layer('quick',world,.1,3);
  const wallGeometry=own(new THREE.PlaneGeometry(1,1).translate(0,.5,0));
  const wallParts=ROADS.map(([x0,z0,x1,z1,load])=>{
    const length=Math.hypot(x1-x0,z1-z0),turn=Math.atan2(z1-z0,x1-x0);
    const sheet=flat(BLUE,.5),cap=flat(BLUE,1),foot=flat(BLUE,.6);
    const wall=walls.add(new THREE.Mesh(wallGeometry,sheet));wall.position.set((x0+x1)/2,0,(z0+z1)/2);wall.rotation.y=-turn;wall.scale.set(length,1,1);
    const top=walls.add(new THREE.Mesh(plane,cap));top.position.set((x0+x1)/2,1,(z0+z1)/2);top.rotation.y=-turn;top.scale.set(length,1,.1);
    const base=walls.add(new THREE.Mesh(plane,foot));base.position.set((x0+x1)/2,.02,(z0+z1)/2);base.rotation.y=-turn;base.scale.set(length,1,.55);
    return {wall,top,load,materials:[sheet,cap,foot]};
  });
  const wallColor=new THREE.Color();

  // ---- 02 The simulated day ---------------------------------------------------
  // Residents stand at every door, three at each, until everyone goes out.
  const doorsSet=layer('day',world,0,3);
  const residentMaterial=flat(ORANGE,1);
  const doors=[...B.map(b=>[doorOf(b,.4),b.door]),[doorOf(plan.HOME,.4),plan.HOME.door]];
  doors.forEach(([[x,z],side])=>{
    const acrossX=side==='north'||side==='south';
    [-.32,0,.32].forEach(offset=>{const m=doorsSet.add(new THREE.Mesh(ball,residentMaterial));m.scale.setScalar(.15);m.position.set(x+(acrossX?offset:0),.3,z+(acrossX?0:offset));});
  });
  // Each group's plan for the day, along the streets it will take: the
  // survey's sample of days, which the plans are fitted to, drawn faint.
  const plans=layer('day',world,.13,2);
  const planInk=flat(INK,.32);
  const samplePaths=plan.SURVEY.sample.map(s=>plan.makePath(s.route,{radius:.45}));
  const planLines=samplePaths.map((path,i)=>{
    const drawn=band(path.points(.12,plan.SURVEY.sample[i].side),.1);
    plans.add(new THREE.Mesh(drawn.geometry,planInk));
    return drawn;
  });
  // The followed resident's plan: to work by car, and after the plans change,
  // by bike another way and a little earlier.
  const routes=layer('day',world,.16,3);
  const carRoute=stroke(routes,CAR_ROUTE,.2,flat(ORANGE,1),{radius:.45});
  const bikeRoute=stroke(routes,BIKE_ROUTE,.2,flat(BLUE,1),{radius:.35});
  const carPath=plan.makePath(CAR_ROUTE,{radius:.45}),bikePath=plan.makePath(BIKE_ROUTE,{radius:.35});
  // Everyone out at once: each sample's residents and the followed resident
  // ride their plans at the same time, stand at the far end a while, and go
  // again, a day at a time.
  const out=layer('day',world,0,5);
  const outDots=samplePaths.flatMap((path,i)=>[0,1].map(k=>({path,side:plan.SURVEY.sample[i].side,phase:k*.42+i*.17,group:traveller(out,.17)})));
  const followed=traveller(out,.22,ORANGE);
  // Each day weighed: a ring at the end of each plan, as full as the day
  // came out well, orange for a poor day and blue for a good one.
  const weighed=layer('day',world,.14,4);
  const ends=[...samplePaths.map(path=>{const p=path.at(path.length);return [p.x,p.z];}),WORK_DOOR];
  const scoreColor=score=>loadColor(new THREE.Color(),1-score);
  function gauge(score,[x,z]){
    const geometry=own(new THREE.RingGeometry(.78,1,48,1,Math.PI/2,-score*Math.PI*2).rotateX(-Math.PI/2));
    const m=weighed.add(new THREE.Mesh(geometry,flat(scoreColor(score),1)));m.position.set(x,.01,z);m.scale.setScalar(.7);
    return m;
  }
  const scoreRings=ends.map(([x,z],i)=>{
    const back=weighed.add(new THREE.Mesh(ring,flat(INK,.18)));back.position.set(x,0,z);back.scale.setScalar(.7);
    return {before:gauge(SCORES[i],[x,z]),after:BETTER[i]!=null?gauge(BETTER[i],[x,z]):null};
  });
  // The rounds of learning: each round as a sheet of tinted glass over the
  // city with its roads drawn on it, the first low and orange where the day
  // queued, each later one higher and bluer as the plans settle. The first
  // rises out of the city itself.
  const slices=ROUNDS.map((round,k)=>{
    const set=layer('day',world,0,6+k);
    const tone=loadColor(new THREE.Color(),.95-k*.2);
    const w=plan.BOARD.w*.48,d=plan.BOARD.d*.48;
    set.add(new THREE.Mesh(plane,flat(tone,.13))).scale.set(w*2,1,d*2);
    stroke(set,[[-w,-d],[w,-d],[w,d],[-w,d]],.1,flat(tone,.9),{closed:true,radius:.3});
    const buckets=new Map();
    ROADS.forEach(([x0,z0,x1,z1,load])=>{
      const color='#'+loadColor(new THREE.Color(),load*SETTLING[k]).getHexString();
      if(!buckets.has(color))buckets.set(color,flat(color,.85));
      const r=set.add(new THREE.Mesh(plane,buckets.get(color)));
      r.position.set((x0+x1)/2,.01,(z0+z1)/2);r.scale.set(Math.abs(x1-x0)+.22,1,Math.abs(z1-z0)+.22);
    });
    return {set,round};
  });
  // Thin posts at two corners hold the stack over the board.
  const posts=layer('day',world,0,5);
  const post=own(new THREE.BoxGeometry(.05,1,.05).translate(0,.5,0));
  const postMaterial=flat(INK,.3);
  const corners=[[plan.BOARD.w*.48,-plan.BOARD.d*.48],[-plan.BOARD.w*.48,plan.BOARD.d*.48],[plan.BOARD.w*.48,plan.BOARD.d*.48]].map(([x,z])=>{
    const m=posts.add(new THREE.Mesh(post,postMaterial));m.position.set(x,.1,z);return m;
  });

  // ---- 03 The junction study --------------------------------------------------
  // The line the study is drawn round: the west road from the north street's
  // tram crossing to the south street's, with the signal in the middle.
  const J=plan.JUNCTION;
  const pen=layer('junction',world,.3,8);
  const penLine=stroke(pen,[[J.x0,J.z0],[J.x1,J.z0],[J.x1,J.z1],[J.x0,J.z1]],.16,flat(ORANGE,1,{depthTest:false}),{closed:true,radius:.6,step:.08});
  const inside=(x,z)=>x>J.x0&&x<J.x1&&z>J.z0&&z<J.z1;
  // Every second, every vehicle in the study leaves a dot where it stands:
  // close together where it crawls, far apart where it runs. The dots fade
  // over nine seconds of the traffic's own clock, so with less movement, when
  // the traffic stands still, the last nine seconds stay drawn.
  const seconds=layer('junction',world,.12,5);
  const DOT_LIFE=9,DOTS=260;
  const dotMesh=new THREE.InstancedMesh(disc,flat(INK,.72),DOTS);dotMesh.count=0;dotMesh.frustumCulled=false;
  seconds.add(dotMesh);
  const trail=[];let lastMark=null;
  const vehicles=()=>traffic.movers.filter(m=>(m.kind==='car'&&m.state==='drive')||m.kind==='tram');
  const placeOf=m=>m.kind==='tram'?traffic.carriages(m)[1]:traffic.place(m);
  const placer=new THREE.Object3D();
  const TRACE_SECONDS=24;
  // The gap each car keeps to the one ahead: longer the faster it goes, orange
  // while it stands, gold while it crawls and blue while it runs.
  const gaps=layer('junction',world,.11,4);
  const cars=traffic.movers.filter(m=>m.kind==='car');
  const gapBands=cars.map(()=>{const material=flat(BLUE,.55);const m=gaps.add(new THREE.Mesh(plane,material));return {mesh:m,material};});
  const standing=new THREE.Color(ORANGE),crawling=new THREE.Color(GOLD),running=new THREE.Color(BLUE);
  // The signal's ring at the stop line, red or green with the lamp.
  const signal=layer('junction',world,.13,6);
  const signalFill=flat(RED,.28),signalEdge=flat(RED,1,{depthTest:false});
  const stopAt=[-6.4,plan.STOP_LINE.z];
  const signalDisc=signal.add(new THREE.Mesh(disc,signalFill));signalDisc.position.set(stopAt[0],0,stopAt[1]);signalDisc.scale.setScalar(.62);
  const signalRing=signal.add(new THREE.Mesh(ring,signalEdge));signalRing.position.set(stopAt[0],.01,stopAt[1]);signalRing.scale.setScalar(.62);
  const signalWave=new THREE.Mesh(ring,flat(RED,0,{depthTest:false}));signalWave.renderOrder=6;signalWave.position.set(stopAt[0],.01,stopAt[1]);signal.group.add(signalWave);
  const red=new THREE.Color(RED),green=new THREE.Color(GREEN);
  // The longest tailback: a bracket beside the queue, from the stop line back
  // to the end of the longest queue the study has seen.
  const tailback=layer('junction',world,.15,7);
  const bracketMaterial=flat(INK,1,{depthTest:false});
  const BRACKET_X=-5.6;
  const bar=tailback.add(new THREE.Mesh(plane,bracketMaterial));
  const ticks=[0,1].map(()=>{const t=tailback.add(new THREE.Mesh(plane,bracketMaterial));t.scale.set(.5,1,.09);return t;});
  let longest=0;
  // The west road's queue this moment: from the stop line back to the rear of
  // the last car standing in an unbroken line behind it.
  function queueLength(){
    const queue=cars.filter(m=>m.state==='drive'&&m.v<.05).map(m=>traffic.place(m)).filter(p=>Math.abs(p.x-stopAt[0])<.2&&p.z<stopAt[1]+.2).sort((a,b)=>b.z-a.z);
    let front=stopAt[1],length=0;
    for(const p of queue){
      const head=p.z+plan.SIZES.CAR.len/2,rear=p.z-plan.SIZES.CAR.len/2;
      if(front-head>.7)break;
      length=stopAt[1]-rear;front=rear;
    }
    return length;
  }
  // The study's record: a dot for every vehicle every second, each car's place
  // along the west road and the signal four times a second for the card, and
  // the longest queue seen, all on the traffic's own clock.
  const traced={cars:new Map(),signal:[]};let lastSample=null;
  function record(){
    const now=traffic.clock;
    if(lastMark===null||now-lastMark>=1){
      lastMark=now;
      vehicles().forEach(m=>{const p=placeOf(m);if(inside(p.x,p.z))trail.push({x:p.x,z:p.z,t:now});});
    }
    while(trail.length&&now-trail[0].t>DOT_LIFE)trail.shift();
    if(lastSample!==null&&now-lastSample<.25)return;
    lastSample=now;
    cars.forEach(m=>{
      const p=traffic.place(m);
      if(m.state!=='drive'||Math.abs(p.x-stopAt[0])>.3||p.z<J.z0||p.z>J.z1)return;
      if(!traced.cars.has(m))traced.cars.set(m,[]);
      traced.cars.get(m).push({t:now,z:p.z});
    });
    traced.signal.push({t:now,green:traffic.green()});
    for(const [m,list] of traced.cars){while(list.length&&now-list[0].t>TRACE_SECONDS)list.shift();if(!list.length)traced.cars.delete(m);}
    while(traced.signal.length&&now-traced.signal[0].t>TRACE_SECONDS)traced.signal.shift();
    longest=Math.max(longest,queueLength());
  }
  // The study has run a while before anybody reaches it: the traffic runs on
  // for as long as the card shows, so the card, the dots and the tailback
  // stand from the first frame, with less movement too.
  for(let i=0;i<TRACE_SECONDS*30;i++){traffic.step(1/30);record();}

  // Sets everything for one frame. Each value is how much of it is shown, 0
  // to 1, unless it says otherwise.
  //   quick {blocks, grow: how far the blocks have risen, arcs, drawn: how far
  //     along the arcs are drawn, split: how far the strands have parted,
  //     riders, walls, hour}
  //   day {doors, plans: how far drawn, route, drawn: how far the followed
  //     resident's route is drawn, change: 0 by car, 1 by bike,
  //     out, weighed, better: how far the changed plans' rings have turned,
  //     rounds: how far the stack has risen, 0 to 1}
  //   junction {pen, drawn, seconds, gaps, signal, tailback}
  function update(state,dt,{paused=false,still=false}={}){
    const time=city.hero.time;
    const quick=state.quick||{},day=state.day||{},junction=state.junction||{};
    // 01
    blocks.set(quick.blocks||0);
    tops.forEach((top,i)=>{top.group.scale.y=Math.max(.001,Math.min(1,Math.max(0,((quick.grow??1)-i*.05)/.55)));});
    arcs.set(quick.arcs||0);
    const split=quick.split||0;
    strandMaterials.forEach((material,k)=>material.color.copy(ink).lerp(strandColors[k],split));
    flows.forEach(flow=>flow.strands.forEach(strand=>{
      const shift=strand.offset*split;
      strand.mesh.position.set(flow.across[0]*shift,0,flow.across[1]*shift);
      strand.geometry.setDrawRange(0,Math.floor(ARC_STEPS*Math.min(1,Math.max(0,quick.drawn??1)))*ARC_SIDES*6);
    }));
    riders.set(quick.riders||0);
    if(quick.riders>0)riderDots.forEach(r=>{r.group.position.copy(r.flow.curve.getPoint((time*.3+r.phase)%1));});
    walls.set(quick.walls||0);
    if(quick.walls>0){
      const busyness=hourLoad(quick.hour??8);
      wallParts.forEach(part=>{
        const load=part.load*busyness,h=.1+3*load;
        part.wall.scale.y=h;part.top.position.y=h;
        loadColor(wallColor,load);part.materials.forEach(material=>material.color.copy(wallColor));
      });
    }
    // 02
    doorsSet.set(day.doors||0);
    plans.set(day.plans>0?1:0);
    planLines.forEach((drawn,i)=>drawTo(drawn,((day.plans||0)-i*.05)/.7));
    routes.set(day.route||0);
    const change=day.change||0;
    drawTo(carRoute,(day.drawn??1)*(1-Math.min(1,change*2)));
    drawTo(bikeRoute,change*2-1);
    carRoute.mesh.visible=change<.5;bikeRoute.mesh.visible=change>.5;
    out.set(day.out||0);
    if(day.out>0){
      outDots.forEach(d=>{
        const u=Math.min(1,((time*.11+d.phase)%1.35));
        const p=d.path.at(u*d.path.length,d.side);d.group.position.set(p.x,.3,p.z);
      });
      const path=change>.5?bikePath:carPath,u=Math.min(1,((time*.11+.31)%1.35));
      const p=path.at(u*path.length);followed.position.set(p.x,.32,p.z);
    }
    weighed.set(day.weighed||0);
    const better=day.better||0;
    scoreRings.forEach(r=>{
      if(!r.after)return;
      r.before.visible=better<1;r.before.scale.setScalar(.7*Math.max(.001,1-better));
      r.after.visible=better>0;r.after.scale.setScalar(.7*Math.max(.001,better));
    });
    // Each slice takes a little more than its share of the rise, so the last
    // one has settled at its height when the rounds are done.
    const rounds=day.rounds||0;
    slices.forEach((slice,k)=>{
      const rise=Math.min(1,Math.max(0,(rounds*(ROUNDS.length+.2)-k)/1.2));
      const eased=rise*rise*(3-2*rise);
      slice.risen=eased;
      slice.set.set(eased);slice.set.group.position.y=.3+(sliceHeight(k)-.3)*eased;
    });
    posts.set(rounds>0?Math.min(1,rounds*3):0);
    const topSlice=slices.reduce((top,slice)=>Math.max(top,slice.set.group.position.y),.3);
    corners.forEach(m=>{m.scale.y=Math.max(.001,topSlice-.1);});
    // 03
    pen.set(junction.pen||0);
    drawTo(penLine,junction.drawn??1);
    if(!paused)record();
    seconds.set(junction.seconds||0);
    if(junction.seconds>0){
      let n=0;
      for(const d of trail){
        if(n>=DOTS)break;
        const age=traffic.clock-d.t,size=.13*Math.max(.25,1-age/DOT_LIFE);
        placer.position.set(d.x,0,d.z);placer.scale.setScalar(size);placer.updateMatrix();
        dotMesh.setMatrixAt(n++,placer.matrix);
      }
      dotMesh.count=n;dotMesh.instanceMatrix.needsUpdate=true;
    }
    gaps.set(junction.gaps||0);
    if(junction.gaps>0)cars.forEach((m,i)=>{
      const band=gapBands[i],p=traffic.place(m);
      const on=m.state==='drive'&&inside(p.x,p.z)&&Math.abs(p.x-stopAt[0])<.3;
      band.mesh.visible=on;if(!on)return;
      const length=plan.SIZES.CAR.gap+m.v*1.1,front=m.len/2+length/2;
      band.mesh.position.set(p.x+p.hx*front,0,p.z+p.hz*front);band.mesh.rotation.y=Math.atan2(p.hx,p.hz);
      band.mesh.scale.set(.5,1,length);
      const pace=m.v/m.vmax;
      band.material.color.copy(m.v<.05?standing:pace<.6?crawling:running);
    });
    signal.set(junction.signal||0);
    if(junction.signal>0){
      const color=traffic.green()?green:red;
      signalFill.color.copy(color);signalEdge.color.copy(color);signalWave.material.color.copy(color);
      const life=(time*.7)%1;
      signalWave.scale.setScalar(.62*(1+life*.9));signalWave.material.opacity=.8*(junction.signal||0)*(1-life);
      signalWave.visible=!still;
    }
    tailback.set(junction.tailback>0&&longest>.5?junction.tailback:0);
    if(junction.tailback>0){
      const from=stopAt[1],to=stopAt[1]-longest;
      bar.position.set(BRACKET_X,0,(from+to)/2);bar.scale.set(.09,1,longest);
      ticks[0].position.set(BRACKET_X,0,from);ticks[1].position.set(BRACKET_X,0,to);
    }
  }
  // The card's record, as each car's line and the signal's runs: how many
  // seconds ago, and how far along the stretch, 0 where the study starts and
  // 1 where it ends. A run lasts from older seconds ago to newer.
  function trace(){
    const now=traffic.clock,span=J.z1-J.z0;
    const lines=[...traced.cars.values()].map(list=>list.map(({t,z})=>({ago:now-t,along:(z-J.z0)/span})));
    const runs=[];
    traced.signal.forEach(({t,green:on})=>{
      const last=runs[runs.length-1];
      if(last&&last.green===on)last.newer=now-t;else runs.push({green:on,older:now-t,newer:now-t});
    });
    return {lines,runs,seconds:TRACE_SECONDS,stop:(plan.STOP_LINE.z-J.z0)/span,longest};
  }
  // Where the rounds' tags stand: at the near corner of the first and the
  // last slice. A tag shows once its slice has nearly reached its height.
  const roundTag=k=>[plan.BOARD.w*.48,slices[k].set.group.position.y,plan.BOARD.d*.48];
  const roundRisen=k=>(slices[k].risen||0)>.8;
  return {update,show,trace,roundTag,roundRisen,hourLoad};
}

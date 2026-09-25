import { THREE, plan } from './one-city.js?v=a2f722dbad15';
import { tripTable } from './story-curves.js?v=7dd555d9dbcc';
import { weigh, REMEMBERED } from './day-score.js?v=3884fd80fb69';

// What the Technical page draws over the city, one set for each of the three
// ways Polycity runs it:
//   the quick estimate, over the city in numbers: a column of light over each
//     zone as tall as the trips the zone makes, glowing arcs carrying trips
//     from zone to zone that part into the four ways of travelling, and the
//     car trips poured onto the roads as flowing light, wider where more cars
//     go, slower and more orange as a road fills;
//   the simulated day: residents at every door, each one's plan along the
//     streets, everyone out at once with red tailbacks reaching back into the
//     side streets, and then each resident's day as a thread rising over the
//     city an hour a step, a glowing plane climbing through them at the hour;
//     one resident's five remembered days, the rounds flashing the threads
//     that try something new, and at the end the threads in income colours;
//   the junction study: a line round one stretch of the west road, a trail
//     behind every vehicle coloured by its speed, the gap each car keeps
//     ahead, the signal's ring at the stop line and the longest tailback.
// All of it lies over the city rather than being part of it, so none of it
// turns into numbers.
const INK='#000b2d',ORANGE='#fd4b08',CYAN='#0ad6ed',TEAL='#0ab8cf',PALE='#bff6fc',GOLD='#febe11',BLUE='#049dd6',FOOT='#e0a800';
const RED='#e23b3b',GREEN='#2fa36b',PURPLE='#7a2fb8';
// The residents' income bands, in the colours the page's key uses.
const INCOME={low:GOLD,mid:TEAL,high:'#57039b'};
const BLOCKS_X=[[-11.25,-6.9],[-5.1,4.9],[6.7,11.25]],BLOCKS_Z=[[-8.5,-4.3],[-2.5,2.5],[4.3,8.5]];
const ZONES=BLOCKS_X.flatMap(([x0,x1])=>BLOCKS_Z.map(([z0,z1])=>({x0,x1,z0,z1,x:(x0+x1)/2,z:(z0+z1)/2})));

// ---- The quick estimate's numbers --------------------------------------------
// The residents of each zone, in the same order as ZONES, and the trips they
// make on a day: 2.4 each, to the nearest ten.
const RESIDENTS=[1000,830,1250,920,1500,1080,750,1170,830];
export const TRIP_RATE=2.4;
export const ZONE_TRIPS=RESIDENTS.map(n=>Math.round(n*TRIP_RATE/10)*10);
// Where the trips go: the product's gravity table, balanced so every zone's
// trips out and in add up.
export const {km:ZONE_KM,trips:TRIP_TABLE}=tripTable(ZONES,ZONE_TRIPS);
// The zone the page lights, the one in the middle, and the others in order.
export const LIT_ZONE=4;
export const DESTINATIONS=ZONES.map((_,j)=>j).filter(j=>j!==LIT_ZONE);
const columnHeight=trips=>.8+trips/3600*5.4;
// The arcs drawn: every trip from the lit zone, and the six busiest pairs
// among the others, each pair's trips both ways on one arc.
const PAIRS=[];
for(let i=0;i<ZONES.length;i++)for(let j=i+1;j<ZONES.length;j++)PAIRS.push({a:i,b:j,trips:TRIP_TABLE[i][j]+TRIP_TABLE[j][i]});
const ARCS=[
  ...DESTINATIONS.map(j=>({a:LIT_ZONE,b:j,trips:TRIP_TABLE[LIT_ZONE][j]+TRIP_TABLE[j][LIT_ZONE]})),
  ...PAIRS.filter(p=>p.a!==LIT_ZONE&&p.b!==LIT_ZONE).sort((x,y)=>y.trips-x.trips).slice(0,6)
];
const MOST_TRIPS=Math.max(...ARCS.map(p=>p.trips));
// How the trips share out between the ways of travelling: car, public
// transport, bike and on foot, the shares How it works fits to the survey,
// in colours bright enough for the navy of the number city.
export const MODES=[{key:'car',color:ORANGE,share:.48},{key:'transit',color:'#a35ef0',share:.27},{key:'bike',color:'#2bb4ec',share:.07},{key:'foot',color:GOLD,share:.18}];
// Each road between two junctions, and how full its car trips make it at the
// busiest hour, 0 to 1. The card reads the north street's middle stretch.
const ROADS=[
  [-12.3,-3.4,-6,-3.4,.55],[-6,-3.4,5.8,-3.4,.95],[5.8,-3.4,12.3,-3.4,.5],
  [-12.3,3.4,-6,3.4,.35],[-6,3.4,5.8,3.4,.62],[5.8,3.4,12.3,3.4,.3],
  [-6,-9.6,-6,-3.4,.78],[-6,-3.4,-6,3.4,.9],[-6,3.4,-6,9.6,.42],
  [5.8,-9.6,5.8,-3.4,.45],[5.8,-3.4,5.8,3.4,.68],[5.8,3.4,5.8,9.6,.5],
  [-6.9,-9.15,6.7,-9.15,.3],[-6.9,9.15,6.7,9.15,.36]
];
export const READ_ROAD=1;
export const roadLoad=i=>ROADS[i][4];
// How busy the roads are at an hour, as a share of the busiest: a morning
// peak, a smaller one at noon and an evening peak.
export function hourLoad(hour){
  const bell=(centre,width)=>Math.exp(-(((hour-centre)/width)**2));
  return .12+.88*Math.max(bell(8,1.3),.85*bell(17.5,1.6),.35*bell(13,2.5));
}
// Flowing roads are blue, busy ones gold and ones in a tailback orange.
const flowing=new THREE.Color('#2bb4ec'),busy=new THREE.Color(GOLD),queued=new THREE.Color(ORANGE);
function loadColor(target,load){
  const v=Math.min(1,Math.max(0,load));
  return v<.5?target.copy(flowing).lerp(busy,v/.5):target.copy(busy).lerp(queued,(v-.5)/.5);
}

// ---- The simulated day's residents ---------------------------------------------
const doorOf=plan.doorOf;
const B=plan.BUILDINGS,HOME_DOOR=doorOf(B[6]),WORK_DOOR=doorOf(B[1]),SHOP_DOOR=doorOf(B[2]);
// The resident the page follows: home on the south street, work on the north
// street, a shop after work. Each way of travelling takes its own way to work;
// the trips after work keep to the streets.
const CAR_ROUTE=[HOME_DOOR,[HOME_DOOR[0],3.4],[-6,3.4],[-6,-3.4],[WORK_DOOR[0],-3.4],WORK_DOOR];
const TO_WORK={
  car:CAR_ROUTE,
  route:[HOME_DOOR,[HOME_DOOR[0],3.4],[5.8,3.4],[5.8,-3.4],[WORK_DOOR[0],-3.4],WORK_DOOR],
  bike:[HOME_DOOR,[HOME_DOOR[0],2.25],[-4.22,2.25],[-4.22,-2.25],[WORK_DOOR[0],-2.25],WORK_DOOR],
  transit:[HOME_DOOR,[HOME_DOOR[0],3.05],[-11.3,3.05],[-11.3,-3.8],[WORK_DOOR[0],-3.8],WORK_DOOR],
  foot:[HOME_DOOR,[-2.6,0],WORK_DOOR]
};
const TO_SHOP=[WORK_DOOR,[WORK_DOOR[0],-3.4],[2.2,-3.4],SHOP_DOOR];
const SHOP_HOME=[SHOP_DOOR,[2.2,-3.4],[5.8,-3.4],[5.8,3.4],[HOME_DOOR[0],3.4],HOME_DOOR];
const PLACE={home:HOME_DOOR,work:WORK_DOOR,shop:SHOP_DOOR};
// A day's parts as the threads read them: where the resident stands, or the
// path they travel, from one hour to another.
function dayParts(day,key,side=0){
  const routes=[TO_WORK[key],TO_SHOP,SHOP_HOME];
  return day.parts.map(p=>p.kind==='place'?{from:p.from,to:p.to,at:PLACE[p.place]}:{from:p.from,to:p.to,path:plan.makePath(routes[p.trip],{radius:.45}),side});
}
// The survey's sample of days, each lived by two residents: one from each
// end. Each leaves and comes back at its own hour, by its own way.
const SPEED={car:32,transit:24,bike:22,foot:12};
const WAY_OF=['car','transit','car','bike','car','foot','transit','car','bike','car','transit','foot'];
const INCOME_OF=['mid','low','high','mid','mid','low','mid','high','low','mid','high','low'];
const WAY_COLOR={car:ORANGE,transit:PURPLE,bike:BLUE,foot:FOOT,route:'#ff9a6b'};
const SAMPLE=plan.SURVEY.sample.flatMap((s,i)=>[0,1].map(k=>{
  const n=i*2+k,route=k?[...s.route].reverse():s.route,way=WAY_OF[n];
  const there=plan.makePath(route,{radius:.45}),back=plan.makePath([...route].reverse(),{radius:.45});
  const trip=there.length/SPEED[way],leave=6.3+(n*1.37)%3.2,leaveWork=15.4+(n*2.11)%4.2,side=s.side*.4*(k?-1:1);
  return {way,income:INCOME_OF[n],offset:[((n%3)-1)*.11,((n%2)-.5)*.16],parts:[
    {from:0,to:leave,at:route[0]},{from:leave,to:leave+trip,path:there,side},{from:leave+trip,to:leaveWork,at:route[route.length-1]},
    {from:leaveWork,to:leaveWork+trip,path:back,side},{from:leaveWork+trip,to:24,at:route[0]}
  ]};
}));
// The threads rise an hour a step, THREAD_HEIGHT over the whole day.
export const THREAD_HEIGHT=9;
const hourY=hour=>.06+hour/24*THREAD_HEIGHT;
function placeOn(parts,hour,[ox,oz]){
  const part=parts.find(p=>hour<=p.to+1e-9)||parts[parts.length-1];
  if(part.at)return [part.at[0]+ox,part.at[1]+oz];
  const u=Math.min(1,Math.max(0,(hour-part.from)/(part.to-part.from))),p=part.path.at(u*part.path.length,part.side||0);
  return [p.x+ox,p.z+oz];
}
// A day as a line through the city and the hours: along the tube its trips
// take sixteen times their share, so the streets they follow stay round.
// The tube is read by the hour, so drawing it part way draws the day so far.
class DayThread extends THREE.Curve{
  constructor(parts,{from=0,to=24,offset=[0,0]}={}){
    super();this.parts=parts;this.offset=offset;this.from=from;this.to=to;
    let sum=0;
    this.spans=parts.filter(p=>p.to>from&&p.from<to).map(p=>{
      const a=Math.max(from,p.from),b=Math.min(to,p.to),w=(b-a)*(p.path?16:1),span={a,b,w0:sum,w};sum+=w;return span;
    });
    this.total=sum||1;
  }
  hourAt(t){
    const w=t*this.total,s=this.spans.find(s=>w<=s.w0+s.w+1e-9)||this.spans[this.spans.length-1];
    return s.a+(s.b-s.a)*Math.min(1,Math.max(0,(w-s.w0)/(s.w||1)));
  }
  shareAt(hour){
    if(hour<=this.from)return 0;if(hour>=this.to)return 1;
    const s=this.spans.find(s=>hour<=s.b)||this.spans[this.spans.length-1];
    return (s.w0+s.w*(hour-s.a)/((s.b-s.a)||1))/this.total;
  }
  getPoint(t,target=new THREE.Vector3()){const hour=this.hourAt(t),[x,z]=placeOn(this.parts,hour,this.offset);return target.set(x,hourY(hour),z);}
  getPointAt(u,target){return this.getPoint(u,target);}
  getTangentAt(u,target){return this.getTangent(u,target);}
}

export function createTechnicalLayers(city){
  const {world,kit,traffic,lineMaterials}=city;
  const own=geometry=>kit.own(geometry);
  const flat=(color,opacity=1,{depthTest=true,blending=THREE.NormalBlending}={})=>{
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,depthTest,side:THREE.DoubleSide,fog:false,toneMapped:false,blending});
    lineMaterials.push(material);return material;
  };
  const glowing=(color,opacity)=>flat(color,opacity,{blending:THREE.AdditiveBlending});
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
  const white=new THREE.Color('#ffffff'),placer=new THREE.Object3D(),color=new THREE.Color();

  // ---- 01 The quick estimate --------------------------------------------------
  // A column of light over each zone, as tall as the trips the zone makes: a
  // glowing shaft round a bright core, a cap of light on top and a ring where
  // it meets the ground. Each rises on its own, a little after the one before.
  const columns=layer('quick',world,0,3);
  const shaft=own(new THREE.CylinderGeometry(1,1,1,40,1,true).translate(0,.5,0));
  const shaftLight=glowing(CYAN,.13),coreLight=glowing(PALE,.8),capLight=glowing(PALE,.75),haloLight=glowing(CYAN,.22),footLight=glowing(CYAN,.75);
  const beams=ZONES.map((zone,i)=>{
    const g=new THREE.Group();g.position.set(zone.x,0,zone.z);columns.group.add(g);
    const height=columnHeight(ZONE_TRIPS[i]);
    const body=columns.add(new THREE.Mesh(shaft,shaftLight));body.scale.set(.78,height,.78);g.add(body);
    const core=columns.add(new THREE.Mesh(shaft,coreLight));core.scale.set(.09,height,.09);g.add(core);
    const top=new THREE.Group();g.add(top);
    const cap=columns.add(new THREE.Mesh(disc,capLight));cap.scale.setScalar(.78);top.add(cap);
    const halo=columns.add(new THREE.Mesh(ball,haloLight));halo.scale.set(.5,.24,.5);top.add(halo);
    const foot=columns.add(new THREE.Mesh(ring,footLight));foot.scale.setScalar(1.05);foot.position.y=.03;g.add(foot);
    return {body,core,top,height,risen:0};
  });
  // The trips between zones, from the top of one column to the top of
  // another, as thick as the trips they carry. Each arc is four strands, one
  // for each way of travelling, drawn together as one cyan arc until the
  // trips are shared out, when the strands part and take their colours. The
  // arc the card reads glows brighter.
  const arcs=layer('quick',world,0,4);
  const ARC_STEPS=64,ARC_SIDES=6;
  const arcGlow=glowing(CYAN,.1),arcLit=glowing(PALE,.3);
  const cyan=new THREE.Color(CYAN),modeColors=MODES.map(mode=>new THREE.Color(mode.color));
  const flows=ARCS.map(({a,b,trips})=>{
    const A=ZONES[a],Z=ZONES[b],ha=columnHeight(ZONE_TRIPS[a])+.05,hb=columnHeight(ZONE_TRIPS[b])+.05;
    const length=Math.hypot(Z.x-A.x,Z.z-A.z),across=[-(Z.z-A.z)/length,(Z.x-A.x)/length];
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(A.x,ha,A.z),new THREE.Vector3((A.x+Z.x)/2,Math.max(ha,hb)+.8+length*.16,(A.z+Z.z)/2),new THREE.Vector3(Z.x,hb,Z.z));
    const width=.035+.1*Math.sqrt(trips/MOST_TRIPS);
    const radii=MODES.map(mode=>width*Math.sqrt(mode.share));
    const total=radii.reduce((sum,r)=>sum+2*r,0)+.035*(MODES.length-1);
    let at=-total/2;
    const materials=MODES.map(()=>flat(CYAN,.92));
    const strands=MODES.map((mode,k)=>{
      const geometry=own(new THREE.TubeGeometry(curve,ARC_STEPS,radii[k],ARC_SIDES,false));
      const mesh=arcs.add(new THREE.Mesh(geometry,materials[k]));
      const offset=at+radii[k];at+=2*radii[k]+.035;
      return {mesh,geometry,offset};
    });
    const haloGeometry=own(new THREE.TubeGeometry(curve,ARC_STEPS,width*2.6,8,false));
    const halo=arcs.add(new THREE.Mesh(haloGeometry,arcGlow));
    const lit=arcs.add(new THREE.Mesh(haloGeometry,arcLit));lit.visible=false;
    return {a,b,curve,across,strands,materials,haloGeometry,halo,lit};
  });
  // Trips riding the arcs while the trips are spread between the zones.
  const riders=layer('quick',world,0,5);
  const riderLight=glowing('#e9fdff',.95);
  const riderDots=flows.flatMap((flow,i)=>[0,1,2].map(k=>{const m=riders.add(new THREE.Mesh(ball,riderLight));m.scale.setScalar(.075);return {flow,phase:k/3+i*.07,mesh:m};}));
  // The car trips poured onto the roads as flowing light: a band along each
  // road as wide as the cars on it, and pulses running both ways along it,
  // blue and quick while the road is free, slower and orange as it fills.
  // The light lies just above the street's surface, as the study's trails do.
  const roads=layer('quick',world,.12,3);
  const roadParts=ROADS.map(([x0,z0,x1,z1,load])=>{
    const length=Math.hypot(x1-x0,z1-z0),turn=Math.atan2(z1-z0,x1-x0);
    const core=glowing(BLUE,.55),halo=glowing(BLUE,.16);
    const mid=[(x0+x1)/2,(z0+z1)/2];
    const bandMesh=roads.add(new THREE.Mesh(plane,core));bandMesh.position.set(mid[0],0,mid[1]);bandMesh.rotation.y=-turn;
    const haloMesh=roads.add(new THREE.Mesh(plane,halo));haloMesh.position.set(mid[0],-.01,mid[1]);haloMesh.rotation.y=-turn;
    return {x0,z0,length,turn,load,hx:(x1-x0)/length,hz:(z1-z0)/length,band:bandMesh,halo:haloMesh,materials:[core,halo],shown:new THREE.Color()};
  });
  const read=roadParts[READ_ROAD];
  const readLit=roads.add(new THREE.Mesh(plane,glowing(PALE,.28)));readLit.position.copy(read.band.position);readLit.rotation.y=-read.turn;
  const pulseList=roadParts.flatMap((road,r)=>[1,-1].flatMap(way=>{
    const count=Math.max(3,Math.round(road.length/1.25));
    return Array.from({length:count},(_,k)=>({road,r,way,phase:(k+(way<0?.5:0))/count}));
  }));
  const pulses=new THREE.InstancedMesh(plane,glowing('#ffffff',.95),pulseList.length);
  pulses.frustumCulled=false;pulseList.forEach((_,i)=>pulses.setColorAt(i,white));roads.add(pulses);

  // ---- 02 The simulated day ---------------------------------------------------
  // Residents stand at every door, three at each, until everyone goes out.
  const doorsSet=layer('day',world,0,3);
  const residentMaterial=flat(ORANGE,1);
  const doors=[...B.map(b=>[doorOf(b,.4),b.door]),[doorOf(plan.HOME,.4),plan.HOME.door]];
  doors.forEach(([[x,z],side])=>{
    const acrossX=side==='north'||side==='south';
    [-.32,0,.32].forEach(offset=>{const m=doorsSet.add(new THREE.Mesh(ball,residentMaterial));m.scale.setScalar(.15);m.position.set(x+(acrossX?offset:0),.3,z+(acrossX?0:offset));});
  });
  // The resident the card follows, ringed at their door.
  const homeSet=layer('day',world,.04,4);
  const homeRing=homeSet.add(new THREE.Mesh(ring,flat(ORANGE,1)));homeRing.position.set(HOME_DOOR[0],0,HOME_DOOR[1]);homeRing.scale.setScalar(.62);
  const homeWave=new THREE.Mesh(ring,flat(ORANGE,0));homeWave.renderOrder=4;homeWave.position.copy(homeRing.position);homeSet.group.add(homeWave);
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
  // The followed resident's plan: to work by car.
  const routes=layer('day',world,.16,3);
  const carRoute=stroke(routes,CAR_ROUTE,.2,flat(ORANGE,1),{radius:.45});
  const carPath=plan.makePath(CAR_ROUTE,{radius:.45});
  // Everyone out at once: each sample's residents and the followed resident
  // ride their plans at the same time, stand at the far end a while, and go
  // again, a day at a time.
  const out=layer('day',world,0,5);
  const outDots=samplePaths.flatMap((path,i)=>[0,1].map(k=>({path,side:plan.SURVEY.sample[i].side,phase:k*.42+i*.17,group:traveller(out,.17)})));
  const followed=traveller(out,.22,ORANGE);
  // Tailbacks: red from a stop line back along the road and round into the
  // side street, as long as the hour is busy and the plans have not settled.
  const tails=layer('day',world,.12,4);
  const tailCore=flat(RED,.95),tailHalo=flat(RED,.16);
  const tailLines=[
    [[-6.45,1.45],[-6.45,-3.05],[-11.5,-3.05]],
    [[4.9,-3.05],[-3,-3.05]]
  ].map(corners=>({core:stroke(tails,corners,.24,tailCore,{radius:.4}),halo:stroke(tails,corners,.9,tailHalo,{radius:.4})}));
  tailLines.forEach(t=>{t.halo.mesh.position.y=-.01;});

  // Each resident's day as a thread rising over the city: straight up while
  // they stay at a place, across the city along the streets while they
  // travel. Coloured by the way they travel, then by their income.
  const threads=layer('day',world,0,6);
  const THREAD_SEGMENTS=420,SIDES=4;
  const residents=SAMPLE.map(r=>{
    const curve=new DayThread(r.parts,{offset:r.offset});
    const geometry=own(new THREE.TubeGeometry(curve,THREAD_SEGMENTS,.05,SIDES,false));
    const material=flat(WAY_COLOR[r.way],.82);
    const mesh=threads.add(new THREE.Mesh(geometry,material));
    return {...r,curve,geometry,material,mesh,base:new THREE.Color(WAY_COLOR[r.way]),income:new THREE.Color(INCOME[r.income]),flash:0};
  });
  // The resident the card weighs, in seven pieces: teal while at a place,
  // orange while travelling, as in the card's equation. Pointing at either
  // half of the equation lights its pieces and pales the other half's.
  const DAY=weigh('car');
  const own7=layer('day',world,0,7);
  const placeLight=flat(TEAL,1),tripLight=flat(ORANGE,1);
  const paper=new THREE.Color('#dfe5f0'),teal=new THREE.Color(TEAL),orange=new THREE.Color(ORANGE),midIncome=new THREE.Color(INCOME.mid);
  const pieces=dayParts(DAY,'car').map(part=>{
    const curve=new DayThread([part],{from:part.from,to:part.to});
    const segments=part.path?72:6;
    const geometry=own(new THREE.TubeGeometry(curve,segments,.085,6,false));
    const mesh=own7.add(new THREE.Mesh(geometry,part.path?tripLight:placeLight));
    return {curve,geometry,segments,sides:6,trip:!!part.path};
  });
  // The four other days the resident remembers, fainter, each a little to
  // the side: another route by car, by bike, by public transport and on foot.
  const remembered=layer('day',world,0,6);
  const others=REMEMBERED.filter(r=>r.key!=='car').map((r,k)=>{
    const day=weigh(r.way,{minutes:r.minutes,km:r.km});
    const side=(k+1)*.14,curve=new DayThread(dayParts(day,r.key,side),{offset:[(k+1)*.12,(k+1)*.06]});
    const geometry=own(new THREE.TubeGeometry(curve,THREAD_SEGMENTS,.045,SIDES,false));
    remembered.add(new THREE.Mesh(geometry,flat(WAY_COLOR[r.key],.55)));
    return {curve,geometry};
  });
  // The hour plane: a sheet of glass over the board at the hour, edged in
  // teal, with each resident's dot where its thread crosses it and a shadow
  // on the ground below.
  const W=plan.BOARD.w*.48,D=plan.BOARD.d*.48;
  const hourPlane=layer('day',world,0,8);
  hourPlane.add(new THREE.Mesh(plane,flat(CYAN,.08))).scale.set(W*2,1,D*2);
  stroke(hourPlane,[[-W,-D],[W,-D],[W,D],[-W,D]],.09,flat(TEAL,.9),{closed:true,radius:.35});
  const tips=layer('day',world,0,9);
  const tipDots=new THREE.InstancedMesh(ball,flat('#ffffff',1),residents.length);tipDots.frustumCulled=false;
  residents.forEach((r,i)=>tipDots.setColorAt(i,r.base));tips.add(tipDots);
  const shadows=new THREE.InstancedMesh(disc,flat(INK,.35),residents.length+1);shadows.frustumCulled=false;tips.add(shadows);
  const followedTip=traveller(tips,.17,ORANGE);
  // The hours stand up one corner, with a tick every six hours.
  const axis=layer('day',world,0,6);
  const axisInk=flat(INK,.55);
  const post=axis.add(new THREE.Mesh(own(new THREE.BoxGeometry(.05,1,.05).translate(0,.5,0)),axisInk));
  post.position.set(W,0,D);post.scale.y=hourY(24);
  [6,12,18,24].forEach(h=>{const t=axis.add(new THREE.Mesh(plane,axisInk));t.position.set(W+.2,hourY(h),D);t.scale.set(.4,1,.05);});

  // ---- 03 The junction study --------------------------------------------------
  // The line the study is drawn round: the west road from the north street's
  // tram crossing to the south street's, with the signal in the middle.
  const J=plan.JUNCTION;
  const pen=layer('junction',world,.3,8);
  const penLine=stroke(pen,[[J.x0,J.z0],[J.x1,J.z0],[J.x1,J.z1],[J.x0,J.z1]],.16,flat(ORANGE,1,{depthTest:false}),{closed:true,radius:.6,step:.08});
  const inside=(x,z)=>x>J.x0&&x<J.x1&&z>J.z0&&z<J.z1;
  // Every vehicle in the study leaves a trail, a dash every sixth of a second
  // along its way, coloured by its speed: red standing, gold slow, blue at
  // speed. A dash is as long as the way the vehicle went in that time, so a
  // standing car leaves a red blot and a running one a long blue line. The
  // trail fades over ten seconds of the traffic's own clock, and is wide
  // enough to read from the camera's height.
  const trails=layer('junction',world,.12,5);
  const TRAIL_LIFE=10,TRAIL_STEP=.15,DASHES=1200,TRAIL_WIDTH=.24;
  const dashMesh=new THREE.InstancedMesh(plane,flat('#ffffff',.92),DASHES);dashMesh.count=0;dashMesh.frustumCulled=false;
  for(let i=0;i<DASHES;i++)dashMesh.setColorAt(i,white);
  trails.add(dashMesh);
  const trail=[];let lastMark=null;
  const vehicles=()=>traffic.movers.filter(m=>(m.kind==='car'&&m.state==='drive')||m.kind==='tram');
  const placeOf=m=>m.kind==='tram'?traffic.carriages(m)[1]:traffic.place(m);
  const standing=new THREE.Color(RED),slow=new THREE.Color(GOLD),fast=new THREE.Color(BLUE);
  const speedColor=pace=>pace<.02?standing.clone():pace<.4?standing.clone().lerp(slow,pace/.4):slow.clone().lerp(fast,(pace-.4)/.6);
  // The gap each car keeps to the one ahead: longer the faster it goes, red
  // while it stands, gold while it crawls and blue while it runs.
  const gaps=layer('junction',world,.11,4);
  const cars=traffic.movers.filter(m=>m.kind==='car');
  const gapBands=cars.map(()=>{const material=flat(BLUE,.55);const m=gaps.add(new THREE.Mesh(plane,material));return {mesh:m,material};});
  // The signal's ring at the stop line, red or green with the lamp.
  const signal=layer('junction',world,.13,6);
  const signalFill=flat(RED,.28),signalEdge=flat(RED,1,{depthTest:false});
  const stopAt=[-6.4,plan.STOP_LINE.z];
  const signalDisc=signal.add(new THREE.Mesh(disc,signalFill));signalDisc.position.set(stopAt[0],0,stopAt[1]);signalDisc.scale.setScalar(.62);
  const signalRing=signal.add(new THREE.Mesh(ring,signalEdge));signalRing.position.set(stopAt[0],.01,stopAt[1]);signalRing.scale.setScalar(.62);
  const signalWave=new THREE.Mesh(ring,flat(RED,0,{depthTest:false}));signalWave.renderOrder=6;signalWave.position.set(stopAt[0],.01,stopAt[1]);signal.group.add(signalWave);
  const red=new THREE.Color(RED),green=new THREE.Color(GREEN);
  // The longest tailback: a bracket beside the waiting cars, from the stop
  // line back to the end of the longest line the study has seen.
  const tailback=layer('junction',world,.15,7);
  const bracketMaterial=flat(INK,1,{depthTest:false});
  const BRACKET_X=-5.6;
  const bar=tailback.add(new THREE.Mesh(plane,bracketMaterial));
  const ticks=[0,1].map(()=>{const t=tailback.add(new THREE.Mesh(plane,bracketMaterial));t.scale.set(.5,1,.09);return t;});
  let longest=0;
  // The west road's waiting cars this moment: from the stop line back to the
  // rear of the last car standing in an unbroken line behind it.
  function queueLength(){
    const standingCars=cars.filter(m=>m.state==='drive'&&m.v<.05).map(m=>traffic.place(m)).filter(p=>Math.abs(p.x-stopAt[0])<.2&&p.z<stopAt[1]+.2).sort((a,b)=>b.z-a.z);
    let front=stopAt[1],length=0;
    for(const p of standingCars){
      const head=p.z+plan.SIZES.CAR.len/2,rear=p.z-plan.SIZES.CAR.len/2;
      if(front-head>.7)break;
      length=stopAt[1]-rear;front=rear;
    }
    return length;
  }
  // The study's record, on the traffic's own clock: a dash for every vehicle
  // every sixth of a second, and the longest line of waiting cars seen.
  function record(){
    const now=traffic.clock;
    if(lastMark===null||now-lastMark>=TRAIL_STEP){
      lastMark=now;
      vehicles().forEach(m=>{
        const p=placeOf(m);if(!inside(p.x,p.z))return;
        const pace=Math.min(1,(m.v||0)/(m.vmax||1));
        trail.push({x:p.x,z:p.z,turn:Math.atan2(p.hx,p.hz),length:.07+(m.v||0)*TRAIL_STEP,t:now,color:speedColor(pace)});
      });
    }
    while(trail.length&&(now-trail[0].t>TRAIL_LIFE||trail.length>DASHES))trail.shift();
    longest=Math.max(longest,queueLength());
  }
  // The study has run a while before anybody reaches it, so the trails and
  // the tailback stand from the first frame, with less movement too.
  for(let i=0;i<TRAIL_LIFE*30;i++){traffic.step(1/30);record();}

  // Sets everything for one frame. Each value is how much of it is shown, 0
  // to 1, unless it says otherwise.
  //   quick {columns, grow: how far the columns have risen, arcs, drawn: how
  //     far along the arcs are drawn, split: how far the strands have parted,
  //     lit: the destination whose arc glows, riders, roads, hour, roadLit}
  //   day {doors, home, plans: how far drawn, route, drawn, out, tails,
  //     tail: how long the tailbacks are, threads, upTo: the hour the threads
  //     are drawn to, plane, planeHour, tips, pointed: 'places' or 'trips',
  //     own: the followed resident's pieces, remembered, income: 0 by way of
  //     travelling to 1 by income}
  //   junction {pen, drawn, trails, gaps, signal, tailback}
  let grown=0,planeAt=0;
  function update(state,dt,{paused=false,still=false}={}){
    const time=city.hero.time;
    const quick=state.quick||{},day=state.day||{},junction=state.junction||{};
    // 01
    columns.set(quick.columns||0);
    grown=quick.grow??1;
    beams.forEach((beam,i)=>{
      const risen=Math.min(1,Math.max(0,(grown-i*.05)/.55)),e=risen*risen*(3-2*risen),h=Math.max(.001,beam.height*e);
      beam.risen=e;beam.body.scale.y=h;beam.core.scale.y=h;beam.top.position.y=h;beam.top.visible=e>.02;
    });
    arcs.set(quick.arcs||0);
    const split=quick.split||0;
    flows.forEach((flow,f)=>{
      const lit=quick.lit===flow.b&&flow.a===LIT_ZONE;
      flow.materials.forEach((material,k)=>{material.color.copy(cyan).lerp(modeColors[k],split);if(lit)material.color.lerp(white,.25);});
      flow.lit.visible=lit;
      const count=Math.floor(ARC_STEPS*Math.min(1,Math.max(0,quick.drawn??1)));
      flow.strands.forEach(strand=>{
        const shift=strand.offset*split;
        strand.mesh.position.set(flow.across[0]*shift,0,flow.across[1]*shift);
        strand.geometry.setDrawRange(0,count*ARC_SIDES*6);
      });
      flow.haloGeometry.setDrawRange(0,count*8*6);
    });
    riders.set(quick.riders||0);
    if(quick.riders>0)riderDots.forEach(r=>{r.mesh.position.copy(r.flow.curve.getPoint((time*.22+r.phase)%1));});
    roads.set(quick.roads||0);
    if(quick.roads>0){
      const busyness=hourLoad(quick.hour??8);
      roadParts.forEach(road=>{
        const load=road.load*busyness,width=.12+.5*load;
        road.band.scale.set(road.length,1,width);road.halo.scale.set(road.length,1,width*3.2);
        loadColor(road.shown,load);road.materials.forEach(material=>material.color.copy(road.shown));
        road.speed=.45+2.4*(1-Math.min(1,load))**1.5;road.now=load;
      });
      readLit.visible=!!quick.roadLit;
      readLit.scale.set(read.length+.3,1,(.12+.5*read.now)*1.9+.12*Math.sin(time*3));
      pulseList.forEach((p,i)=>{
        const road=p.road,s=((p.phase*road.length+time*road.speed)%road.length),along=p.way>0?s:road.length-s;
        const across=p.way*(.08+.12*road.now);
        placer.position.set(road.x0+road.hx*along-road.hz*across,.02,road.z0+road.hz*along+road.hx*across);
        placer.rotation.set(0,-road.turn,0);placer.scale.set(.5,1,.07+.07*road.now);placer.updateMatrix();
        pulses.setMatrixAt(i,placer.matrix);pulses.setColorAt(i,color.copy(road.shown).lerp(white,.45));
      });
      pulses.instanceMatrix.needsUpdate=true;pulses.instanceColor.needsUpdate=true;
    }
    // 02
    doorsSet.set(day.doors||0);
    homeSet.set(day.home||0);
    if(day.home>0){const life=(time*.6)%1;homeWave.scale.setScalar(.62*(1+life*1.4));homeWave.material.opacity=.8*day.home*(1-life);homeWave.visible=!still;}
    plans.set(day.plans>0?1:0);
    planLines.forEach((drawn,i)=>drawTo(drawn,((day.plans||0)-i*.05)/.7));
    routes.set(day.route||0);
    drawTo(carRoute,day.drawn??1);
    out.set(day.out||0);
    if(day.out>0){
      outDots.forEach(d=>{
        const u=Math.min(1,((time*.11+d.phase)%1.35));
        const p=d.path.at(u*d.path.length,d.side);d.group.position.set(p.x,.3,p.z);
      });
      const u=Math.min(1,((time*.11+.31)%1.35)),p=carPath.at(u*carPath.length);followed.position.set(p.x,.32,p.z);
    }
    tails.set(day.tails||0);
    tailLines.forEach((t,i)=>{const long=Math.min(1,Math.max(0,(day.tail??1)*(i?.85:1)));drawTo(t.core,long);drawTo(t.halo,long);});
    const upTo=day.upTo??24;
    threads.set(day.threads||0);
    const income=day.income||0;
    residents.forEach(r=>{
      if(!paused)r.flash=Math.max(0,r.flash-dt*1.4);
      r.geometry.setDrawRange(0,Math.floor(r.curve.shareAt(upTo)*THREAD_SEGMENTS)*SIDES*6);
      r.material.color.copy(r.base).lerp(r.income,income).lerp(cyan,r.flash);
    });
    own7.set(day.own||0);
    const pointed=day.pointed;
    placeLight.color.copy(teal).lerp(midIncome,income).lerp(paper,pointed==='trips'?.75:0);
    tripLight.color.copy(orange).lerp(midIncome,income).lerp(paper,pointed==='places'?.75:0);
    pieces.forEach(piece=>piece.geometry.setDrawRange(0,Math.floor(piece.curve.shareAt(upTo)*piece.segments)*piece.sides*6));
    remembered.set(day.remembered||0);
    others.forEach(o=>o.geometry.setDrawRange(0,Math.floor(o.curve.shareAt(upTo)*THREAD_SEGMENTS)*SIDES*6));
    planeAt=day.planeHour??upTo;
    hourPlane.set(day.plane||0);hourPlane.group.position.y=hourY(planeAt);
    axis.set(day.plane||0);
    tips.set(day.tips||0);
    if(day.tips>0){
      const at=new THREE.Vector3();
      residents.forEach((r,i)=>{
        const [x,z]=placeOn(r.parts,planeAt,r.offset);
        placer.position.set(x,hourY(planeAt),z);placer.rotation.set(0,0,0);placer.scale.setScalar(.12);placer.updateMatrix();tipDots.setMatrixAt(i,placer.matrix);
        tipDots.setColorAt(i,color.copy(r.base).lerp(r.income,income));
        placer.position.set(x,.03,z);placer.scale.setScalar(.14);placer.updateMatrix();shadows.setMatrixAt(i,placer.matrix);
      });
      const [fx,fz]=placeOn(dayParts(DAY,'car'),planeAt,[0,0]);
      followedTip.position.set(fx,hourY(planeAt),fz);
      at.set(fx,.03,fz);placer.position.copy(at);placer.scale.setScalar(.2);placer.updateMatrix();shadows.setMatrixAt(residents.length,placer.matrix);
      tipDots.instanceMatrix.needsUpdate=true;tipDots.instanceColor.needsUpdate=true;shadows.instanceMatrix.needsUpdate=true;
    }
    // 03
    pen.set(junction.pen||0);
    drawTo(penLine,junction.drawn??1);
    if(!paused)record();
    trails.set(junction.trails||0);
    if(junction.trails>0){
      let n=0;
      for(let k=trail.length-1;k>=0&&n<DASHES;k--){
        const d=trail[k],fade=1-(traffic.clock-d.t)/TRAIL_LIFE;
        placer.position.set(d.x,0,d.z);placer.rotation.set(0,d.turn,0);placer.scale.set(TRAIL_WIDTH*Math.max(.4,fade),1,d.length);placer.updateMatrix();
        dashMesh.setMatrixAt(n,placer.matrix);dashMesh.setColorAt(n,color.copy(d.color).lerp(paper,.45*(1-fade)));n++;
      }
      dashMesh.count=n;dashMesh.instanceMatrix.needsUpdate=true;dashMesh.instanceColor.needsUpdate=true;
    }
    gaps.set(junction.gaps||0);
    if(junction.gaps>0)cars.forEach((m,i)=>{
      const gapBand=gapBands[i],p=traffic.place(m);
      const on=m.state==='drive'&&inside(p.x,p.z)&&Math.abs(p.x-stopAt[0])<.3;
      gapBand.mesh.visible=on;if(!on)return;
      const length=plan.SIZES.CAR.gap+m.v*1.1,front=m.len/2+length/2;
      gapBand.mesh.position.set(p.x+p.hx*front,0,p.z+p.hz*front);gapBand.mesh.rotation.y=Math.atan2(p.hx,p.hz);
      gapBand.mesh.scale.set(.5,1,length);
      gapBand.material.color.copy(speedColor(m.v/m.vmax));
    });
    signal.set(junction.signal||0);
    if(junction.signal>0){
      const lamp=traffic.green()?green:red;
      signalFill.color.copy(lamp);signalEdge.color.copy(lamp);signalWave.material.color.copy(lamp);
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
  // A round of learning: a few residents try another route, hour or way, and
  // their threads flash. Which ones is read from the round, so a round seen
  // again flashes the same threads.
  function flashRound(round){
    residents.forEach((r,i)=>{if(((i*7+round*5)%11)<3)r.flash=1;});
  }
  // Where the page's tags stand: over each zone's column as it has risen,
  // the hour at the corner of the hour plane, and the hours up the corner.
  const zoneTag=i=>[ZONES[i].x,beams[i].height*beams[i].risen+.55,ZONES[i].z];
  const zoneRisen=i=>beams[i].risen>.9;
  const hourTag=()=>[W,hourY(planeAt)+.05,D];
  const axisTag=h=>[W+.45,hourY(h),D];
  return {update,show,flashRound,zoneTag,zoneRisen,hourTag,axisTag,longest:()=>longest};
}

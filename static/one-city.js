import * as THREE from './vendor/three.module.min.js';
import { createCityKit, palette as cityPalette, foldedCrown } from './city-kit.js?v=7c4acbfa47ff';
import { createNumberCity } from './hero-numbers.js?v=61b49655c33d';
import { createCityDetail } from './city-detail.js?v=acf713bdcf2d';
import * as plan from './city-plan.js?v=bb2a86585d63';

// The one city the homepage and How it works both stand on. It is fixed to the
// screen and screens of words scroll over it. This module builds the city, its
// proposal, its rings of reach and its number skin, and holds the camera, the
// streets' life, the split into today and the proposal, and the drawing loop.
// Each page brings only its own screens and where the camera stands for each.
const palette = {
  ...cityPalette, sharedRenderer:true, haze:'#e7eef9', ink:'#000b2d', stone:'#f6f7fb', copper:'#fd4b08',
  mint:'#57039b', coral:'#0ad6ed', gold:'#febe11', forest:'#217b9b', leaf:'#5ab6bd',
  surfaces: {
    '#bcc8ac':'#bdc9df', '#e0e3cb':'#e4eaf4', '#adbba9':'#bdc9df',
    '#b2c597':'#b8e6df', '#f6efd8':'#f6f7fb', '#687f71':'#011573',
    '#ecdec0':'#dde6f3', '#6c8370':'#52607d', '#839b83':'#bdc9df',
    '#d2dabc':'#e4eaf4', '#acbba3':'#bdc9df', '#f4ecd0':'#f6f7fb',
    '#b7c5aa':'#c4cfe3', '#7b9078':'#57039b', '#acbda0':'#b3c2d9',
    '#d9dfc2':'#dde6f3', '#ede7cc':'#edf1fa', '#e8e5cd':'#f6f7fb',
    '#71866e':'#011573', '#a8b497':'#bdc9df', '#eee5c9':'#e4eaf4',
    '#a9bca2':'#c4cfe3', '#b4c0a8':'#bdc9df', '#97b7a1':'#8dd7e0',
    '#afbaa6':'#bdc9df', '#f5efd8':'#f6f7fb', '#b6c2a9':'#c4cfe3',
    '#8da089':'#9bacc8', '#b9c2aa':'#bdc9df', '#f2edd5':'#f6f7fb',
    '#b1bda6':'#bdc9df', '#aebf98':'#b8e6df', '#a3b594':'#9bacc8',
    '#eee8ce':'#f6f7fb', '#f8f0d7':'#edf1fa', '#c4ccb6':'#c4cfe3',
    '#587366':'#6f7c9c', '#8c9070':'#52607d', '#f5efd4':'#f6f7fb'
  }
};
export const smooth=t=>{const n=THREE.MathUtils.clamp(t,0,1);return n*n*(3-2*n);};
export const clamp01=t=>THREE.MathUtils.clamp(t,0,1);
export { THREE, plan };

// glide: how slowly the drawn scroll follows the real one; smaller settles later.
export function createOneCity({glide=5}={}){
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const crownGeometry = foldedCrown(THREE);
const kit = createCityKit({THREE, crownGeometry, palette});
const {box, tree, tram, group, mesh, own} = kit;
const detail=createCityDetail({THREE, kit, palette, crownGeometry});
// Every person on the page is the detail module's figure, with arms, a
// jacket and hair, rather than the kit's peg.
const person=detail.person;
const hero = kit.stage('[data-story-stage="hero"]', 27, [0,1,0]);
const world = hero.world;


// ---- The city as it stands today ------------------------------------------
// Where everything stands and the lines everything moves along come from the
// plan, the same tables the audit reads, so nothing here places a thing by eye.
const {PATHS}=plan;
const tint={copper:palette.copper,mint:palette.mint,navy:'#011573',sky:'#049dd6'};
box(world,plan.BOARD.w,.42,plan.BOARD.d,0,-.3,0,'#b3c2d9');
box(world,plan.BOARD.w,.13,plan.BOARD.d,0,-.025,0,'#e4eaf4');
plan.ROADS.forEach((r,i)=>{box(world,r.w,.03,r.d,r.x,.065+i*.0004,r.z,'#f6f7fb').castShadow=false;});
// The south street is a group, so its kerbs and its crossing narrow with it.
// It narrows from the south: the rails keep their half.
const SS=plan.SOUTH_STREET;
const southStreet=group(world,0,0,SS.north+SS.width/2);
box(southStreet,SS.w,.03,SS.width,0,.0645,0,'#f6f7fb').castShadow=false;
// Kerbs along every road edge, broken at the junctions and the lay-by.
const blocksX=[[-11.25,-6.9],[-5.1,4.9],[6.7,11.25]],blocksZ=[[-8.5,-4.3],[-2.5,2.5],[4.3,8.5]];
for(const [x0,x1] of blocksX)for(const s of [-1,1]){detail.kerb(world,(x0+x1)/2,-3.4+s*.92,x1-x0);detail.kerb(southStreet,(x0+x1)/2,s*.92,x1-x0);}
for(const x of [-6.92,-5.08,4.88])for(const [z0,z1] of blocksZ)detail.kerb(world,x,(z0+z1)/2,z1-z0,Math.PI/2);
for(const [z0,z1] of [[-8.5,-4.3],[-2.5,-2.2],[2.2,2.5],[4.3,8.5]])detail.kerb(world,6.72,(z0+z1)/2,z1-z0,Math.PI/2);
const layBy=plan.ROADS.find(r=>r.name==='parking lay-by');
detail.kerb(world,layBy.x+layBy.w/2+.02,0,layBy.d,Math.PI/2);for(const z of [-1,1])detail.kerb(world,layBy.x,z*(layBy.d/2+.02),layBy.w);
for(const s of [-1,1]){
  detail.kerb(world,-.1,s*9.82,13.6);detail.kerb(world,-.1,s*8.48,10);
  detail.kerb(world,s*12.57,0,8.6,Math.PI/2);detail.kerb(world,s*11.23,0,5,Math.PI/2);
}
for(const [z0,z1] of [[-8.5,-4.3],[-2.5,1.5],[4.3,8.5]])detail.dashes(world,-6,(z0+z1)/2,z1-z0,Math.PI/2);
for(const [z0,z1] of [[-8.5,-4.3],[-2.5,2.5],[4.3,8.5]])detail.dashes(world,5.8,(z0+z1)/2,z1-z0,Math.PI/2);
plan.CROSSINGS.forEach(c=>detail.crossing(c.narrows?southStreet:world,c.x,c.narrows?0:c.z,c.turn));
detail.stopLine(world,-6.45,plan.STOP_LINE.z,Math.PI/2,.9);
box(world,plan.PARK.w,.04,plan.PARK.d,plan.PARK.x,.08,plan.PARK.z,'#b8e6df');
// A flat ribbon along a line of the plan: the promenade, the cycle track, the
// routes of the accessibility view.
function ribbon(points,color,width=.14,y=.11){
  const g=group(world);
  for(let i=1;i<points.length;i++){
    const [x0,z0]=points[i-1],[x1,z1]=points[i],dx=x1-x0,dz=z1-z0,length=Math.hypot(dx,dz);
    const b=box(g,length+width*.5,.02,width,(x0+x1)/2,y,(z0+z1)/2,color);b.rotation.y=-Math.atan2(dz,dx);b.castShadow=false;
  }
  return g;
}
ribbon(PATHS.promenade.points(.3),'#edf1fa',.54,.105);
ribbon(PATHS.cycle.points(.25),'#c4cfe3',.44,.085);
// Nine buildings and one home, each with its entrance on the side that meets
// the street, a gable, a folded or a flat roof, and balconies on some faces.
plan.BUILDINGS.forEach(spec=>detail.building(world,{...spec,color:tint[spec.color]}));
detail.home(world,{...plan.HOME,color:tint[plan.HOME.color]});
const trees=plan.TREES.map(([x,z,size])=>tree(world,x,z,size));
trees.push(...plan.CONIFERS.map(([x,z,size])=>detail.conifer(world,x,z,size)));
// The park: a pond with a deck, benches, a kiosk, a lamp at each corner.
detail.pond(world,plan.POND.x,plan.POND.z,plan.POND.rx,plan.POND.rz);
const parkBenches=plan.PARK_BENCHES.map(([x,z,turn])=>detail.bench(world,x,z,turn));
detail.kiosk(world,plan.KIOSK.x,plan.KIOSK.z,plan.KIOSK.turn);
// Every lamp's head has a colour of its own, a shade off the cars' gold, so a
// day's night can light the lamps and leave the gold cars dark.
const LAMP='#febe12';
plan.PARK_LAMPS.forEach(([x,z,turn])=>{detail.lamp(world,x,z,turn).children[2].material=kit.mat(LAMP);});
const sitters=[detail.seated(parkBenches[0],2,-.2),detail.seated(parkBenches[2],3,.2)];
detail.carry(sitters[0],'hat');
const lineMaterials=[];
function polyline(points,y,color){
  const geometry=new THREE.BufferGeometry().setFromPoints(points.map(([x,z])=>new THREE.Vector3(x,y,z)));
  kit.own(geometry);
  const material=new THREE.LineBasicMaterial({color});lineMaterials.push(material);
  const line=new THREE.Line(geometry,material);world.add(line);return line;
}
// The rails sit either side of the trams' line and the wire hangs over it.
for(const side of [-.2,.2])polyline(PATHS.tram.points(.1,side),.105,'#57039b');
polyline(PATHS.tram.points(.1),1.22,'#000b2d');
// Bracket poles on the outer pavements carry the wire and a street lamp.
const wirePoles=[];
for(const [side,line] of [['north',-3.8],['south',3.05]])plan.WIRE_POLES[side].xs.forEach(x=>{
  const z=plan.WIRE_POLES[side].z,g=group(world,x,.08,z),s=Math.sign(z),reach=Math.abs(z-line);
  box(g,.07,1.46,.07,0,.73,0,'#8c9070');
  box(g,.05,.04,reach,0,1.26,-s*reach/2,'#8c9070');
  box(g,.03,.1,.03,0,1.2,-s*reach,'#8c9070');
  box(g,.15,.1,.18,0,1.17,-s*reach*.4,LAMP);
  wirePoles.push(g);
});
const train=tram(world);
const walkers=Array.from({length:8},(_,i)=>detail.carry(person(world,i),['bag','pack',null,'hat'][i%4]));

// The car the outcome studies drew: a body, a cream cabin with dark glass, a
// roof strip and four tyres. Every car on the page is this one.
const tyreGeometry=own(new THREE.CylinderGeometry(1,1,1,32));
const sphere=own(new THREE.IcosahedronGeometry(1,0));
function car(parent,color=palette.copper){
  const g=group(parent);
  box(g,.7,.31,1.38,0,.28,0,color);
  box(g,.57,.31,.72,0,.57,-.08,'#e8e5cd');
  box(g,.585,.2,.48,0,.58,-.09,palette.ink);
  box(g,.58,.05,.52,0,.75,-.09,color);
  for(const x of [-.36,.36])for(const z of [-.42,.42]){
    const tyre=mesh(g,tyreGeometry,palette.ink,x,.2,z);tyre.scale.set(.17,.09,.17);tyre.rotation.z=Math.PI/2;
  }
  g.scale.setScalar(.82);
  return g;
}


// The streets run by the plan's rules: every car, tram, cyclist and person is
// a mover there, and this page only draws where each one stands.
const traffic=plan.createTraffic();
const carColors=[palette.copper,palette.mint,palette.stone,palette.gold,'#049dd6'];
const carOf=new Map(traffic.movers.filter(m=>m.kind==='car').map((m,i)=>{
  const g=car(world,m.seeker?palette.gold:carColors[i%carColors.length]);g.position.y=.08;return [m,g];
}));
// Cars stand along the south kerb today, where the greenway will be.
const kerbCars=plan.KERB_CARS.map((x,i)=>{const g=car(world,carColors[(i+2)%5]);g.position.set(x,.08,plan.GREENWAY.z+.02);g.rotation.y=Math.PI/2;return g;});
// Cars parked nose in along the east road, with one bay left free.
const bayCars=plan.BAYS.zs.flatMap((z,i)=>{if(i===plan.BAYS.free)return [];const g=car(world,carColors[(i+1)%5]);g.position.set(plan.BAYS.x,.08,z);g.rotation.y=Math.PI/2;return [g];});
const signal=group(world,plan.SIGNAL.x,.1,plan.SIGNAL.z);
box(signal,.09,1.7,.09,0,.85,0,palette.ink);box(signal,.24,.52,.2,0,1.72,0,palette.ink);
const redLamp=mesh(signal,sphere,palette.coral,0,1.86,-.1),greenLamp=mesh(signal,sphere,palette.leaf,0,1.62,-.1);
redLamp.scale.setScalar(.1);greenLamp.scale.setScalar(.1);
// Exhaust as the studies drew it: faceted particles that leave a car's tail,
// stay where they were let go, and climb, swelling and turning as they rise.
const exhaust=[...carOf.keys()].flatMap((m,c)=>Array.from({length:4},(_,i)=>{
  const puff=mesh(world,sphere,i%3?palette.copper:palette.gold);puff.castShadow=false;
  return {mesh:puff,car:m,phase:i/4+c*.13,age:1,x:0,z:0};
}));


// ---- The proposal, built into the same city and dialled in as its rows are
// read: the south half of the south street becomes a greenway with trees, a
// second tram and two shelters give the line a service every six minutes, and
// the bays on the east road are painted, metered and priced. Each holds the
// weight of its row, 0 to 1. ---------------------------------------------------
const GW=plan.GREENWAY,greenDepth=SS.width-SS.narrow;
const greenway=box(world,SS.w-.4,.05,1,0,.09,SS.north+SS.width,'#b2c597');
const planted=GW.trees.map((x,i)=>tree(world,x,GW.z,.72,i%2?palette.leaf:palette.forest));
const greenFurniture=GW.benches.map(x=>detail.bench(world,x,GW.z,Math.PI));
// Each stop has its platform and its sign today. The proposal roofs it: two
// posts, a coral roof set back so the people waiting stand in front of it, a
// back panel and a bench with someone on it.
const shelters=plan.STOPS.map(stop=>{
  const base=group(world,stop.x,.1,stop.z);
  box(base,3,.1,.58,0,.05,0,'#ecdec0');
  detail.stopSign(base,-stop.access*1.4,.17,0);
  const g=group(base,0,0,0);
  box(g,.065,1.15,.065,-1.3,.62,-.2,'#6c8370');box(g,.065,1.15,.065,1.3,.62,-.2,'#6c8370');
  box(g,2.8,.08,.4,0,1.24,-.14,palette.coral);
  box(g,2.6,.6,.03,0,.72,-.27,'#e0e3cb');
  const seat=detail.bench(g,-stop.access*1,-.14,0);detail.carry(detail.seated(seat,5,.05),'bag');
  return g;
});
const secondTrain=tram(world);
const bayPaint=group(world,plan.BAYS.x,.083,0);
plan.BAYS.zs.forEach(z=>{box(bayPaint,1.3,.012,plan.BAYS.pitch-.08,0,0,z,'#f6efd8').castShadow=false;});
for(let i=0;i<=plan.BAYS.zs.length;i++)box(bayPaint,1.32,.014,.04,0,.004,plan.BAYS.zs[0]-plan.BAYS.pitch/2+i*plan.BAYS.pitch,'#ffffff').castShadow=false;
const priceSign=group(world,plan.PRICE_SIGN[0],.1,plan.PRICE_SIGN[1]);
box(priceSign,.06,1.1,.06,0,.55,0,'#52607d');
box(priceSign,.04,.34,.5,0,1.2,0,palette.gold);
const meters=plan.METERS.map(([x,z])=>detail.meter(world,x,z,-Math.PI/2));

const wheelGeometry=own(new THREE.TorusGeometry(.23,.033,4,12));
function tube(parent,points,color,radius){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
  const m=mesh(parent,own(new THREE.TubeGeometry(curve,48,radius,5,false)),color);m.castShadow=false;return m;
}
// The studies' bicycle: spoked wheels, a tube frame and a rider leaning in.
const cyclists=traffic.movers.filter(m=>m.kind==='cyclist').map((m,i)=>{
  const g=group(world),wheels=[];
  for(const x of [-.36,.36]){const w=mesh(g,wheelGeometry,palette.ink,x,.24,0);wheels.push(w);}
  tube(g,[[-.36,.24,0],[-.04,.55,0],[.36,.24,0],[-.02,.28,0],[-.36,.24,0]],[palette.copper,palette.mint,'#049dd6'][i%3],.035);
  tube(g,[[.36,.24,0],[.2,.63,0],[.27,.68,0]],palette.ink,.025);
  // The bicycle travels along its own x axis; the rider's front is their own
  // z axis, so they are turned to face along the frame and pitched forward.
  const rider=person(g,i+1);rider.group.position.set(-.06,.42,0);rider.group.rotation.set(.3,Math.PI/2,0,'YXZ');
  rider.arms.forEach(arm=>{arm.rotation.x=-1.15;});
  return {mover:m,group:g,rider,wheels};
});
// People come out of a door, wait on the platform, step into the tram that
// stands there, ride to the other stop and walk into a door there.
const passengers=traffic.passengers.map((m,i)=>({mover:m,figure:detail.carry(person(world,i+2),[null,'pack','bag',null,'case','hat'][i])}));
// Each tram's middle carriage lifts a pantograph to the wire.
for(const parts of [train,secondTrain]){
  for(const s of [-1,1]){const arm=box(parts[1],.035,.36,.035,s*.1,.98,0,palette.ink);arm.rotation.z=s*.5;}
  box(parts[1],.34,.03,.05,0,1.12,0,palette.ink);
}
const weights={street:0,transit:0,growth:0};
function applyProposal(w){
  const s=1-w.street*greenDepth/SS.width;
  southStreet.scale.z=s;southStreet.position.z=SS.north+SS.width*s/2;
  const depth=Math.max(.001,w.street*greenDepth);
  greenway.scale.z=depth;greenway.position.z=SS.north+SS.width-depth/2;greenway.visible=w.street>.005;
  // Today's kerbside cars give way before anything is planted.
  kerbCars.forEach((g,i)=>{const left=1-smooth(w.street*2.6-i*.08);g.scale.setScalar(.82*Math.max(.001,left));g.visible=left>.001;});
  planted.forEach((t,i)=>{
    const reveal=smooth(w.street*1.7-.5-i*.06);
    t.group.scale.setScalar(t.size*(.001+.999*reveal));t.crown.rotation.y=(1-reveal)*.7;t.group.visible=reveal>.001;
  });
  greenFurniture.forEach((g,i)=>{const reveal=smooth(w.street*1.7-.6-i*.05);g.scale.setScalar(.001+.999*reveal);g.visible=reveal>.001;});
  shelters.forEach(g=>{g.scale.y=.01+.99*w.transit;g.visible=w.transit>.005;});
  secondTrain.forEach(part=>{part.scale.setScalar(.01+.99*w.transit);part.visible=w.transit>.005;});
  bayPaint.visible=w.growth>.005;bayPaint.scale.x=.01+.99*smooth(w.growth*1.4);
  meters.forEach(m=>{m.scale.y=.01+.99*w.growth;m.visible=w.growth>.005;});
  priceSign.scale.y=.01+.99*w.growth;priceSign.visible=w.growth>.005;
}
applyProposal(weights);

// Routes from one home to the places its people reach, drawn as ribbons on
// the ground for the accessibility view, with rings of reach spreading from
// the door. The two people who walk them are always out: they keep to the
// pavements, wait at each kerb, walk there and walk home again.
const reach=[ribbon(PATHS.toPark.raw,palette.coral),ribbon(PATHS.toStop.raw,palette.copper,.14,.113)];
const travellers=traffic.movers.filter(m=>m.kind==='traveller').map((m,i)=>({mover:m,figure:i?person(world,4):detail.carry(person(world,3),'case')}));
const door=[plan.HOME.x-plan.HOME.w/2-.05,plan.HOME.z];

const ringGeometry=own(new THREE.RingGeometry(.94,1,64));
const ringMaterial=new THREE.MeshBasicMaterial({color:'#0ad6ed',transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false});
lineMaterials.push(ringMaterial);
const rings=[0,1,2].map(()=>{const m=new THREE.Mesh(ringGeometry,ringMaterial.clone());lineMaterials.push(m.material);m.rotation.x=-Math.PI/2;m.position.set(door[0],.13,door[1]);world.add(m);return m;});
const homeRing=new THREE.Mesh(ringGeometry,new THREE.MeshBasicMaterial({color:'#fd4b08',side:THREE.DoubleSide,depthWrite:false}));
lineMaterials.push(homeRing.material);homeRing.rotation.x=-Math.PI/2;homeRing.position.set(plan.HOME.x,.12,plan.HOME.z);homeRing.scale.setScalar(2.4);world.add(homeRing);
// One quiet ring spreads across the pond.
const pondRing=new THREE.Mesh(ringGeometry,ringMaterial.clone());lineMaterials.push(pondRing.material);
pondRing.material.color.set('#f6f7fb');pondRing.rotation.x=-Math.PI/2;pondRing.position.set(plan.POND.x,.145,plan.POND.z);world.add(pondRing);
const reachParts=[...reach,...rings,homeRing];
// Each mode's way round the park, lit on the ground for the mobility view:
// the cycle track and the promenade, beside the tram's rails.
const modeLoops=[ribbon(PATHS.cycle.points(.12),palette.coral,.14,.12),ribbon(PATHS.promenade.points(.12),palette.copper,.14,.12)];
function showReach(on){reachParts.forEach(part=>{part.visible=on;});}
function showModes(on){modeLoops.forEach(loop=>{loop.visible=on;});}
showModes(false);showReach(false);


// ---- The city's parts --------------------------------------------------------
// How it works turns the city from numbers into the real thing one part at a
// time, so everything that is not a street, a building or the park says which
// part it belongs to: the trams and their stops, the people, the cars.
const tag=(part,things)=>things.forEach(thing=>{(thing.group||thing).userData.part=part;});
tag('transit',[...train,...secondTrain,...shelters.map(g=>g.parent),...wirePoles]);
tag('people',[...walkers,...passengers.map(p=>p.figure),...travellers.map(t=>t.figure),...sitters,...cyclists]);
tag('cars',[...carOf.values(),...kerbCars,...bayCars,...exhaust.map(puff=>puff.mesh)]);

kit.ground(hero,{spread:2.9});
// Every surface of the finished city can turn into numbers.
const numbers=createNumberCity(hero,{THREE});

// ---- The day ---------------------------------------------------------------
// A day in the city: the sun rises in the east at six and sets in the west at
// eight, its light and shadows move with it, and between dusk and dawn the
// sky goes dark and every window and lamp is lit. Left alone, the city stands
// in the homepage's light.
const {sky,sun}=hero.lights;
const daylight={sun:sun.position.clone(),sunColor:sun.color.clone(),sunStrength:sun.intensity,sky:sky.color.clone(),ground:sky.groundColor.clone(),skyStrength:sky.intensity};
const moonlight={sky:new THREE.Color('#6d7fb8'),ground:new THREE.Color('#1b2448'),skyStrength:.6};
const lowSun=new THREE.Color('#ffb56b');
const lit=[...numbers.variants(kit.mat('#587366')),...numbers.variants(kit.mat(LAMP))];
const windowLight=new THREE.Color('#ffc861');
let night=0;
// hour: 4 to 24, or null for the homepage's light; amount: how far the city
// has gone from the homepage's light to that hour's, 0 to 1. Returns how dark
// it is.
const sunAt=new THREE.Vector3(),sunColor=new THREE.Color();
let dayShown='';
function setDay(hour=null,amount=1){
  const k=hour===null?0:clamp01(amount);
  const key=k>0?`${hour.toFixed(3)} ${k.toFixed(3)}`:'none';
  if(key===dayShown)return night;
  dayShown=key;
  if(k<=0){
    sun.position.copy(daylight.sun);sun.color.copy(daylight.sunColor);sun.intensity=daylight.sunStrength;
    sky.color.copy(daylight.sky);sky.groundColor.copy(daylight.ground);sky.intensity=daylight.skyStrength;
    lit.forEach(material=>material.emissive.setRGB(0,0,0));
    night=0;return night;
  }
  // The sun rises in the east at six and sets in the west at eight.
  const arc=(hour-6)/14*Math.PI,height=Math.sin(arc);
  sunAt.set(Math.cos(arc)*22,Math.max(1.2,height*26),10);
  sun.position.copy(daylight.sun).lerp(sunAt,k);
  sun.intensity=THREE.MathUtils.lerp(daylight.sunStrength,daylight.sunStrength*smooth(height/.3),k);
  sunColor.copy(lowSun).lerp(daylight.sunColor,smooth(height/.5));
  sun.color.copy(daylight.sunColor).lerp(sunColor,k);
  night=k*Math.max(1-smooth((hour-5.2)/1.4),smooth((hour-19.4)/1.4));
  sky.color.copy(daylight.sky).lerp(moonlight.sky,night);
  sky.groundColor.copy(daylight.ground).lerp(moonlight.ground,night);
  sky.intensity=THREE.MathUtils.lerp(daylight.skyStrength,moonlight.skyStrength,night);
  lit.forEach(material=>material.emissive.copy(windowLight).multiplyScalar(night*.9));
  return night;
}

// ---- The camera ------------------------------------------------------------
// A pose is where the camera looks, from which direction, with how much city
// across the frame. dx and dy push the city sideways or up on a wide screen,
// so it stands beside the words rather than under them. lift pushes it up a
// share of a phone frame's height, for a page whose words fill a phone's foot;
// the homepage's poses have none. phone is how much city stands across a
// phone's frame: a little less than span, unless the pose says.
const pose=(target,span,from,dx=0,dy=0,lift=0,phone=span*.8)=>({target:new THREE.Vector3(...target),span,from:new THREE.Vector3(...from),dx,dy,lift,phone});
const poses=Object.fromEntries(Object.entries(plan.POSES).map(([name,p])=>[name,pose(p.target,p.span,p.from,p.dx,p.dy,p.lift,p.phone)]));
const current={target:new THREE.Vector3(),from:new THREE.Vector3(),span:26,dx:0,dy:0,lift:0,phone:26*.8};
const mixTarget=new THREE.Vector3(),mixFrom=new THREE.Vector3();
const phoneOf=p=>p.phone??p.span*.8;
function setPose(p){current.target.copy(p.target);current.from.copy(p.from);current.span=p.span;current.dx=p.dx;current.dy=p.dy;current.lift=p.lift||0;current.phone=phoneOf(p);}
function mixPose(p,t){
  if(t<=0)return;
  current.target.lerp(p.target,t);current.from.lerp(p.from,t);
  current.span=THREE.MathUtils.lerp(current.span,p.span,t);
  current.dx=THREE.MathUtils.lerp(current.dx,p.dx,t);current.dy=THREE.MathUtils.lerp(current.dy,p.dy,t);
  current.lift=THREE.MathUtils.lerp(current.lift,p.lift||0,t);
  current.phone=THREE.MathUtils.lerp(current.phone,phoneOf(p),t);
}
// A pose read part way between several: the row poses by their weights, the
// outcome poses by where the reader is in the list.
function blendPoses(list,weightsList){
  mixTarget.set(0,0,0);mixFrom.set(0,0,0);let span=0,dx=0,dy=0,lift=0,phone=0,total=0;
  list.forEach((p,i)=>{const w=weightsList[i];if(w<=0)return;mixTarget.addScaledVector(p.target,w);mixFrom.addScaledVector(p.from,w);span+=p.span*w;dx+=p.dx*w;dy+=p.dy*w;lift+=(p.lift||0)*w;phone+=phoneOf(p)*w;total+=w;});
  if(total<=0)return list[0];
  return {target:mixTarget.clone().multiplyScalar(1/total),from:mixFrom.clone().multiplyScalar(1/total),span:span/total,dx:dx/total,dy:dy/total,lift:lift/total,phone:phone/total};
}
const forward=new THREE.Vector3(),right=new THREE.Vector3(),up=new THREE.Vector3(),aim=new THREE.Vector3();
function shoot(){
  const aspect=(hero.canvas.clientWidth||1)/(hero.canvas.clientHeight||1);
  forward.copy(current.from).normalize().negate();
  right.set(forward.z,0,-forward.x).normalize();
  up.crossVectors(right,forward).normalize();
  const wide=aspect>1?1:0;
  // A phone frame is narrow, so a close-up keeps a little less city across it.
  const span=aspect<1?current.phone:current.span;
  aim.copy(current.target).addScaledVector(right,-current.dx*wide).addScaledVector(up,-current.dy*wide+current.lift*(1-wide)*span/aspect);
  kit.frame(hero,aim,span,current.from);
}

// Where each screen stands on the page this frame, read against the eased
// scroll so the camera and the words never arrive on different clocks.
// A frame slower than a quarter of a second counts as a quarter of a second,
// so a machine drawing the city slowly still brings the camera to the words
// within a few frames instead of trailing them by rows; slower than half a
// second, there is no motion left to ease, and the camera goes straight to
// where the scroll is.
// A finger's scroll is smooth already, and a flick crosses three screens in a
// second, so the city trailed the words by nearly half a screen of it. While
// a finger moves the page, the drawn scroll follows it FINGER times as
// closely, and the city trails a flick by about what it trails a wheel.
const FINGER=3;
let finger=matchMedia('(pointer: coarse)').matches;
addEventListener('touchstart',()=>{finger=true;},{passive:true});
addEventListener('wheel',()=>{finger=false;},{passive:true});
addEventListener('keydown',()=>{finger=false;},{passive:true});
const screens=[...document.querySelectorAll('.screen')].map(element=>({element,name:element.dataset.screen}));
let easedY=null,lastRead=performance.now();
function readScreens(paused){
  const now=performance.now(),elapsed=(now-lastRead)/1000,dt=Math.min(elapsed,.25);lastRead=now;
  if(easedY===null||paused||reducedMotion.matches||elapsed>.5)easedY=scrollY;
  else easedY+=(scrollY-easedY)*(1-Math.exp(-dt*glide*(finger?FINGER:1)));
  if(Math.abs(scrollY-easedY)<.3)easedY=scrollY;
  const lag=scrollY-easedY,vh=innerHeight;
  return Object.fromEntries(screens.map(({element,name})=>{
    const r=element.getBoundingClientRect();
    const top=r.top+lag;
    const slide=clamp01(1-top/vh);
    const sub=r.height>vh+1?clamp01(-top/(r.height-vh)):slide;
    return [name,{name,slide,sub}];
  }));
}
// Marks the item of a list whose data attribute holds the value.
function mark(list,attribute,value){
  list.forEach(item=>item.toggleAttribute('data-current',item.dataset[attribute]===value));
}
const pins=Object.fromEntries([...document.querySelectorAll('[data-pin]')].map(pin=>[pin.dataset.pin,pin]));
const pinPlaces=Object.fromEntries(Object.entries(plan.PINS).map(([name,pin])=>[name,new THREE.Vector3(...pin.place)]));
// Where a place in the city lands on the screen, in the page's pixels, and
// whether it stands in front of the camera.
const projected=new THREE.Vector3();
function project(place){
  projected.set(place.x??place[0],place.y??place[1],place.z??place[2]).project(hero.camera);
  return {x:(projected.x+1)/2*innerWidth,y:(1-projected.y)/2*innerHeight,front:projected.z<1};
}
function placePin(name,visible){
  const pin=pins[name];if(!pin)return;
  const {x,y,front}=project(pinPlaces[name]);
  const across=plan.PINS[name].side==='left'?'calc(7px - 100%)':'-7px';
  pin.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) translate(${across},-50%)`;
  pin.toggleAttribute('data-shown',visible&&front);
}
// Sets --x and --y on an element to where a place lands, for a card or a mark
// the page's stylesheet sets beside it.
function placeAt(element,place,visible=true){
  if(!element)return;
  const {x,y,front}=project(place);
  element.style.setProperty('--x',x.toFixed(1)+'px');element.style.setProperty('--y',y.toFixed(1)+'px');
  element.toggleAttribute('data-shown',visible&&front);
}

// ---- The streets' life -----------------------------------------------------
// The trams, the walkers, the queue, the exhaust, the crowns. nearStop sends a
// tram hurrying to the first stop to stand a little longer; quietExhaust keeps
// the puffs small while the parking close-up is read.
function live(dt,{paused=false,nearStop=false,quietExhaust=false}={}){
  trees.forEach(t=>{t.crown.rotation.z=Math.sin(hero.time*.7+t.phase)*.045;});
  planted.forEach(t=>{t.crown.rotation.z=Math.sin(hero.time*.8+t.phase)*.05;});
  if(!paused)traffic.step(dt,{nearStop:nearStop?0:null});
  const face=(g,p)=>{g.position.x=p.x;g.position.z=p.z;g.rotation.y=Math.atan2(p.hx,p.hz);};
  [train,secondTrain].forEach((parts,i)=>traffic.carriages(traffic.trams[i]).forEach((p,k)=>{
    parts[k].position.set(p.x,.12,p.z);parts[k].rotation.y=-Math.atan2(p.hz,p.hx);
  }));
  carOf.forEach((g,m)=>face(g,traffic.place(m)));
  cyclists.forEach(({mover,group:g,rider,wheels})=>{
    const p=traffic.place(mover);g.position.set(p.x,.1,p.z);g.rotation.y=-Math.atan2(p.hz,p.hx);
    wheels.forEach(w=>{w.rotation.z=-hero.time*4;});
    rider.legs.forEach((leg,k)=>{leg.rotation.x=Math.sin(hero.time*9+k*Math.PI)*.6;});
  });
  const walk=(figure,mover,y=.1)=>{
    const p=traffic.place(mover);figure.group.position.y=y;face(figure.group,p);figure.group.visible=mover.visible;
    if(mover.moved>0)detail.stride(figure,hero.time);
    else{figure.legs.forEach(leg=>{leg.rotation.x=0;});figure.arms.forEach(arm=>{arm.rotation.x=0;});}
  };
  traffic.movers.filter(m=>m.kind==='walker').forEach((m,i)=>walk(walkers[i],m));
  travellers.forEach(({mover,figure})=>walk(figure,mover));
  // On the platform a person stands a step higher than on the pavement.
  passengers.forEach(({mover,figure})=>{const p=traffic.place(mover);walk(figure,mover,p.z>-4.95&&p.z<-4.3?.2:.1);});
  rings.forEach((ring,i)=>{
    const life=(hero.time*.28+i/3)%1;
    ring.scale.setScalar(1.5+life*8);ring.material.opacity=.55*(1-life);
  });
  const ripple=(hero.time*.16)%1;
  pondRing.scale.set(plan.POND.rx*(.25+ripple*.7),plan.POND.rz*(.25+ripple*.7),1);pondRing.material.opacity=.5*(1-ripple);
  const green=traffic.green();
  redLamp.visible=!green;greenLamp.visible=green;
  exhaust.forEach((puff,i)=>{
    const age=(hero.time*.26+puff.phase)%1;
    // A car standing in a bay has its engine off, so it lets nothing go.
    if(age<puff.age){const p=traffic.place(puff.car);puff.x=p.x-p.hx*.6;puff.z=p.z-p.hz*.6;puff.live=puff.car.state==='drive';}
    puff.age=age;puff.mesh.visible=!!puff.live;
    puff.mesh.position.set(puff.x+Math.sin(age*3+i)*age*.25,.35+age*1.7,puff.z+Math.cos(age*2+i)*age*.25);
    puff.mesh.scale.setScalar(.01+Math.sin(age*Math.PI)*(quietExhaust?.035:.075));puff.mesh.rotation.set(age*2,i,age*3);
  });
}

// ---- The split and the picture ---------------------------------------------
// The split draws the city twice: today on the left of the line, the proposal
// on the right, both from the same camera. Its knob can be dragged.
const splitElement=document.querySelector('[data-split]');
const knob=splitElement?.querySelector('.split-knob');
let split=.5;
function dragSplit(event){
  split=THREE.MathUtils.clamp(event.clientX/innerWidth,.12,.88);hero.dirty=true;
}
knob?.addEventListener('pointerdown',event=>{
  knob.setPointerCapture(event.pointerId);
  const move=e=>dragSplit(e);
  const stop=()=>{knob.removeEventListener('pointermove',move);knob.removeEventListener('pointerup',stop);knob.removeEventListener('pointercancel',stop);};
  knob.addEventListener('pointermove',move);knob.addEventListener('pointerup',stop);knob.addEventListener('pointercancel',stop);
  event.preventDefault();
});
const context=hero.canvas.getContext('2d');
function density(){
  const r=hero.host.getBoundingClientRect();
  return Math.min(devicePixelRatio,1.5,Math.sqrt(2_500_000/Math.max(1,r.width*r.height)));
}
// Things drawn only on the proposal's side of the split, such as the colours
// of what changed: today's side has nothing to compare against.
const proposalOnly=new Set();
function onlyInProposal(object){proposalOnly.add(object);return object;}
// Draws the city in slices side by side, all from the same camera. Each slice
// reaches to a share of the width, 0 to 1, and its look sets what it shows
// before it is drawn; the last slice's look is what the city keeps. The split
// is two slices, today and the proposal; the Technical page's three ways are
// three.
function renderSlices(list){
  hero.renderer.setPixelRatio(density());
  hero.renderer.setSize(hero.host.clientWidth,hero.host.clientHeight,false);
  const w=hero.canvas.width,h=hero.canvas.height,source=hero.renderer.domElement,k=source.width/w;
  context.clearRect(0,0,w,h);
  let from=0;
  for(const slice of list){
    const to=Math.max(from,Math.round(w*clamp01(slice.to)));
    slice.look?.();
    if(to>from){
      hero.renderer.render(hero.scene,hero.camera);
      context.drawImage(source,from*k,0,(to-from)*k,source.height,from,0,to-from,h);
    }
    from=to;
  }
}
function renderSplit(fraction){
  let shownThere=[];
  renderSlices([
    {to:fraction,look(){
      applyProposal({street:0,transit:0,growth:0});
      shownThere=[...proposalOnly].map(object=>[object,object.visible]);
      shownThere.forEach(([object])=>{object.visible=false;});
    }},
    {to:1,look(){
      shownThere.forEach(([object,visible])=>{object.visible=visible;});
      applyProposal(weights);
    }}
  ]);
}
// The haze the far city fades into: the page's paper by day, the night sky
// after dark, and navy while the city is numbers.
const haze=new THREE.Color(palette.haze),nightHaze=new THREE.Color('#0b1433'),navy=new THREE.Color('#000b2d');
// Draws the frame: the number skin at its strength, 0 the plain city and 1 the
// number city, each part's turn back to real (see hero-numbers.js), how dark
// the day is, and the split open by its share, 0 closed. Returns where the
// split's line stands, as a share of the width.
// slices, when given, draws the city as those slices instead of the split:
// each is {to, parts, look}, and a slice with parts of its own turns those
// parts to numbers or back before its look runs.
function paint({field=0,opened=0,parts,night:dark=night,slices}={}){
  const cut=opened>0?THREE.MathUtils.lerp(0,split,opened):0;
  splitElement?.style.setProperty('--split',(cut*100).toFixed(2)+'%');
  pondRing.visible=field<.01&&(parts?.streets??1)>=1;
  const wash=numbers.update(field,hero.time,parts);
  numbers.shade(Math.max(wash,dark));
  if(hero.scene.fog)hero.scene.fog.color.copy(haze).lerp(nightHaze,dark).lerp(navy,wash);
  if(slices)renderSlices(slices.map(slice=>({to:slice.to,look(){
    numbers.update(field,hero.time,slice.parts??parts);
    slice.look?.();
  }})));
  else if(cut>0.001)renderSplit(cut);else hero.render();
  return cut;
}

// ---- The drawing loop --------------------------------------------------------
// frame(dt, paused) places the camera, the proposal and the words, calls live
// and paint, and writes what the tours read. The loop keeps the time, counts
// the frames and says when the city is ready.
function run(frame){
  let paused=reducedMotion.matches, disposed=false, previous=performance.now(), request=0, ticker=null;
  const visibility=new IntersectionObserver(([entry])=>{hero.visible=entry.isIntersecting;hero.dirty=true;});
  visibility.observe(hero.host);
  const onScroll=()=>{hero.dirty=true;};
  window.addEventListener('scroll',onScroll,{passive:true});
  function draw(now,scheduled=true){
    if(disposed)return;
    const dt=Math.min(Math.max(0,(now-previous)/1000),.06);previous=now;
    if(!hero.visible&&hero.frame===0){
      const box=hero.host.getBoundingClientRect();
      hero.visible=box.bottom>0&&box.top<innerHeight;
    }
    if(hero.visible&&!hero.lost&&(hero.frame===0||!document.hidden)&&(!paused||hero.dirty)){
      if(!paused)hero.time+=dt;
      frame(dt,paused);
      hero.frame++;hero.dirty=false;
      hero.host.dataset.renderState='ready';
      hero.canvas.dataset.frame=String(hero.frame);
      hero.canvas.dataset.scrollProgress=(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)).toFixed(4);
      hero.canvas.dataset.span=current.span.toFixed(3);
      hero.canvas.dataset.proposal=[weights.street,weights.transit,weights.growth].map(v=>v.toFixed(3)).join(' ');
      hero.canvas.dataset.tram=train[0].position.x.toFixed(4);
      hero.canvas.dataset.tree=trees[0].crown.rotation.z.toFixed(4);
    }
    if(scheduled)request=requestAnimationFrame(draw);
  }
  const preference=()=>{paused=reducedMotion.matches;hero.dirty=true;};
  reducedMotion.addEventListener('change',preference);
  request=requestAnimationFrame(draw);
  // A browser that is not painting the page itself never runs an animation
  // frame, and the city then reads "Opening the city study." on a page
  // somebody is plainly looking at. When no frame has arrived, a timer draws it.
  setTimeout(()=>{
    if(disposed||hero.frame>0)return;
    draw(performance.now(),false);
    ticker=setInterval(()=>{if(!disposed)draw(performance.now(),false);},50);
  },700);
  window.addEventListener('pagehide',event=>{
    if(event.persisted)return;
    disposed=true;cancelAnimationFrame(request);clearInterval(ticker);visibility.disconnect();
    window.removeEventListener('scroll',onScroll);
    reducedMotion.removeEventListener('change',preference);numbers.dispose();
    lineMaterials.forEach(material=>material.dispose());
    kit.dispose();crownGeometry.dispose();
  });
}

return {
  hero, reducedMotion, poses, current, weights, applyProposal, showReach, showModes,
  setPose, mixPose, blendPoses, shoot, readScreens, mark, placePin, live, paint, run,
  setDay, traffic, project, placeAt, onlyInProposal, world, kit, lineMaterials
};
}

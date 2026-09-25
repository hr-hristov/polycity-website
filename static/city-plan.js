// Where everything in the one city stands, the lines everything moves along,
// and the rules of the road. The scene draws from these tables and the audit
// reads the same tables, so what is checked is what is drawn. Nothing here
// touches the page or the graphics library, so the audit runs on its own.
//
// The rules: every fixed thing has a footprint and keeps a gap from the next;
// every moving thing has a line of its own; where two lines cross, one of them
// waits; nothing appears or vanishes in the open, only inside a building or a
// tram; and every label on the page points at something its camera can see.

export const BOARD={w:25.2,d:20};
export const PARK={x:-.05,z:0,w:7.7,d:4};
// Roads as flat rectangles: w runs along x, d along z.
export const ROADS=[
  {name:'north street',x:0,z:-3.4,w:25,d:1.8},
  {name:'west road',x:-6,z:0,w:1.8,d:19.6},{name:'east road',x:5.8,z:0,w:1.8,d:19.6},
  {name:'north edge road',x:-.1,z:-9.15,w:13.6,d:1.3},{name:'south edge road',x:-.1,z:9.15,w:13.6,d:1.3},
  {name:'west turning road',x:-11.9,z:0,w:1.3,d:8.6},{name:'east turning road',x:11.9,z:0,w:1.3,d:8.6},
  {name:'parking lay-by',x:7.45,z:0,w:1.5,d:4.4}
];
// The south street is drawn on its own, because the proposal narrows it from
// the south: the rails keep their half, the other half becomes the greenway.
export const SOUTH_STREET={x:0,north:2.5,width:1.8,narrow:1.05,w:25};
export const BUILDINGS=[
  {x:-9.1,z:-6.95,w:2.7,d:2.5,height:3.2,color:'copper',roof:'gable',door:'south',balconies:'east'},
  {x:-3.2,z:-6.95,w:2.8,d:2.5,height:4.7,color:'mint',roof:'hip',door:'south',balconies:'south'},
  {x:2.2,z:-6.95,w:2.4,d:2.5,height:3.2,color:'navy',roof:'flat',door:'south'},
  {x:9,z:-6.95,w:3.2,d:2.5,height:3.6,color:'copper',roof:'gable',door:'south',balconies:'south'},
  {x:-9.1,z:0,w:2.7,d:3,height:3.4,color:'navy',roof:'hip',door:'east',balconies:'east'},
  {x:10.2,z:0,w:2,d:3,height:5,color:'mint',roof:'flat',door:'west',balconies:'west'},
  {x:-2.4,z:6.95,w:3,d:2.5,height:3.5,color:'mint',roof:'gable',door:'north',balconies:'south'},
  {x:2.2,z:6.95,w:2.6,d:2.5,height:3,color:'sky',roof:'hip',door:'north',balconies:'east'},
  {x:8.9,z:6.95,w:3.1,d:2.5,height:2.8,color:'navy',roof:'flat',door:'north',balconies:'north'}
];
export const HOME={x:-9,z:6.9,w:2.2,d:2.1,height:1.5,color:'copper',door:'west',path:1};
// Where a building's door opens onto its street, a step out from the wall.
export const doorOf=(b,out=.35)=>{
  const o={south:[0,b.d/2+out],north:[0,-b.d/2-out],east:[b.w/2+out,0],west:[-b.w/2-out,0]}[b.door];
  return [b.x+o[0],b.z+o[1]];
};
// [x, z, size]. A crown is about 0.7 of the size across from the trunk.
export const TREES=[
  [-1,-.6,1],[-1.15,.9,.85],[2.75,-.85,.85],[2.85,.95,.8],
  [-.4,-6.5,.95],[4.2,-6.9,.8],[-11.5,-6.4,.7],
  [-10.9,2.1,.7],[10.9,-2.2,.75],[.1,7.2,.8],[4.3,7.1,.75]
];
export const CONIFERS=[[-7.3,-6.3,.6],[4.1,-5.6,.7],[11.4,6.2,.8],[6.98,-6.9,.45],[6.98,6.9,.45],[-4.6,6.2,.75],[-11.3,7.9,.55],[11.3,-7.2,.8],[-11.4,-8.6,.7]];
export const POND={x:1.25,z:.2,rx:1,rz:.75};
export const KIOSK={x:-2.5,z:-.45,turn:0};
// Benches face their own +z after the turn.
export const PARK_BENCHES=[[-1.9,.98,0],[.6,-1,Math.PI],[-.45,.35,Math.PI/2]];
export const PARK_LAMPS=[[-3.72,-1.74,0],[3.52,-1.74,Math.PI],[3.52,1.74,Math.PI],[-3.72,1.74,0]];
// The greenway that replaces the south half of the south street. Nothing is
// planted where the two roads cross it or where people cross.
export const GREENWAY={z:3.93,trees:[-10.4,-4.3,-2.5,-.7,1.1,2.9,7.6,9.4],benches:[-3.4,.2,8.5]};
// Today cars stand along the south kerb where the greenway will be.
export const KERB_CARS=[-9.5,-3.4,-1.6,.2,2,8.5];
// Bracket poles carry the tram wire and a street lamp: north pavement, south
// pavement. Each stands between the trees and clear of platforms and crossings.
export const WIRE_POLES={north:{z:-4.5,xs:[-10.2,-7.6,-3.4,1.4,3.9,7.25,10.95]},south:{z:4.5,xs:[-9.5,-3.4,.2,3.8,8.5,10.6]}};
// Stops: the tram stands with its middle at x. People reach the platform from
// the access end and the sign stands at the other.
export const STOPS=[
  {x:-1,z:-4.63,access:-1,door:[-3.2,-5.7]},
  {x:9.2,z:-4.63,access:-1,door:[9,-5.7]}
];
// Four bays a metre apart, so a parked car has a clear strip on each side.
export const BAYS={x:7.55,zs:[-1.5,-.5,.5,1.5],free:2,pitch:1};
export const METERS=[[8.45,-1],[8.45,1]];
export const PRICE_SIGN=[8.45,2];
export const SIGNAL={x:-6.98,z:1.45,cycle:13,green:6};
export const CROSSINGS=[
  {x:-6,z:2.05,turn:Math.PI/2,name:'west road'},
  {x:-4.88,z:-3.4,turn:0,name:'north street'},
  {x:-7.6,z:3.4,turn:0,name:'south street',narrows:true}
];
export const STOP_LINE={x:-6,z:1.62};
// The Technical page's junction study: the stretch of the west road round the
// signal, from the north street's tram crossing to the south street's, which
// the study replays second by second.
export const JUNCTION={x0:-7.6,x1:-4.5,z0:-4.4,z1:4.4};

// ---- Lines things move along -------------------------------------------------
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
export function makePath(corners,{closed=false,radius=0}={}){
  const raw=[],n=corners.length;
  for(let i=0;i<n;i++){
    const p=corners[i],a=corners[(i-1+n)%n],b=corners[(i+1)%n];
    if(!radius||(!closed&&(i===0||i===n-1))){raw.push(p);continue;}
    const la=Math.hypot(p[0]-a[0],p[1]-a[1]),lb=Math.hypot(b[0]-p[0],b[1]-p[1]),t=Math.min(radius,la/2,lb/2);
    const s=[p[0]+(a[0]-p[0])/la*t,p[1]+(a[1]-p[1])/la*t],e=[p[0]+(b[0]-p[0])/lb*t,p[1]+(b[1]-p[1])/lb*t];
    for(let j=0;j<=16;j++){const u=j/16,v=1-u;raw.push([v*v*s[0]+2*u*v*p[0]+u*u*e[0],v*v*s[1]+2*u*v*p[1]+u*u*e[1]]);}
  }
  if(closed)raw.push(raw[0]);
  const cum=[0];
  for(let i=1;i<raw.length;i++)cum.push(cum[i-1]+Math.hypot(raw[i][0]-raw[i-1][0],raw[i][1]-raw[i-1][1]));
  const length=cum[cum.length-1];
  const wrap=s=>closed?((s%length)+length)%length:clamp(s,0,length);
  function point(s){
    s=wrap(s);let lo=0,hi=cum.length-1;
    while(hi-lo>1){const mid=(lo+hi)>>1;if(cum[mid]<=s)lo=mid;else hi=mid;}
    const span=cum[hi]-cum[lo]||1,u=(s-cum[lo])/span;
    return [raw[lo][0]+(raw[hi][0]-raw[lo][0])*u,raw[lo][1]+(raw[hi][1]-raw[lo][1])*u];
  }
  // Heading is read across a short stretch, so a carriage turns smoothly
  // through a corner drawn as short straight pieces.
  function at(s,side=0){
    const a=point(closed?s-.18:Math.max(0,s-.18)),b=point(closed?s+.18:Math.min(length,s+.18)),p=point(s);
    const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,hx=(b[0]-a[0])/l,hz=(b[1]-a[1])/l;
    // side > 0 is to the right of the way of travel.
    return {x:p[0]-hz*side,z:p[1]+hx*side,hx,hz};
  }
  function nearest(x,z){
    let best=0,gap=1e9;
    for(let i=1;i<raw.length;i++){
      const ax=raw[i-1][0],az=raw[i-1][1],dx=raw[i][0]-ax,dz=raw[i][1]-az,l2=dx*dx+dz*dz||1;
      const u=clamp(((x-ax)*dx+(z-az)*dz)/l2,0,1),d=Math.hypot(ax+dx*u-x,az+dz*u-z);
      if(d<gap){gap=d;best=cum[i-1]+Math.sqrt(l2)*u;}
    }
    return best;
  }
  const ahead=(from,to)=>closed?(((to-from)%length)+length)%length:to-from;
  const points=(step=.1,side=0)=>{const out=[];for(let s=0;s<=length+1e-6;s+=step){const p=at(s,side);out.push([p.x,p.z]);}if(closed){const p=at(0,side);out.push([p.x,p.z]);}return out;};
  return {raw,length,closed,at,nearest,ahead,points};
}
const arc=(cx,cz,r,from,to,n=12)=>Array.from({length:n+1},(_,i)=>{const a=from+(to-from)*i/n;return [cx+Math.cos(a)*r,cz+Math.sin(a)*r];});

const WALK_N=-5.12,TRAM_N=-3.8,TRAM_S=3.05,CAR_W=-6.4,CAR_E=6.2,EDGE=9.15;
const slotX=(stop,k)=>stop.x-1.15+k*.28;
const accessX=stop=>stop.x+stop.access*1.65;
export const PATHS={
  // Trams keep to the right like the cars: west along the north street with
  // the platforms at their doors, round the west turning road, east along the
  // south street, round the east turning road.
  tram:makePath([[11.9,TRAM_N],[-11.9,TRAM_N],[-11.9,TRAM_S],[11.9,TRAM_S]],{closed:true,radius:1}),
  // Cars: one way round the block, keeping right: south on the west road,
  // east on the south edge road, north on the east road past the bays, west
  // on the north edge road.
  cars:makePath([[CAR_W,-EDGE],[CAR_W,EDGE],[CAR_E,EDGE],[CAR_E,-EDGE]],{closed:true,radius:.7}),
  // The cycle track round the park, and the promenade inside it.
  cycle:makePath([[-4.22,-2.25],[-4.22,2.25],[4.08,2.25],[4.08,-2.25]],{closed:true,radius:.5}),
  promenade:makePath([[-3.5,-1.5],[3.3,-1.5],[3.3,1.5],[-3.5,1.5]],{closed:true,radius:.6}),
  // Into the free bay nose first, and back out the same way.
  park:makePath([[CAR_E,BAYS.zs[BAYS.free]+1.4],...arc(CAR_E+.9,BAYS.zs[BAYS.free]+.9,.9,Math.PI,Math.PI*1.5),[BAYS.x,BAYS.zs[BAYS.free]]])
};
// The two ways out from the home: both leave by the garden path, keep to the
// pavements, cross the south street and the west road on their crossings.
const fromHome=[[-9.6,6.9],[-11.05,6.9],[-11.05,4.85],[-7.6,4.85],[-7.6,2.05],[-4.88,2.05]];
PATHS.toPark=makePath([...fromHome,[-4.88,.9],[-2.95,.9]]);
PATHS.toStop=makePath([...fromHome,[-4.88,WALK_N],[-2.95,WALK_N]]);
// Each passenger's own line at each stop: out of the door, along the pavement
// to the access end, along the back of the platform to their place at its
// edge, and on into the tram standing there.
export const PASSENGERS=6;
PATHS.passenger=STOPS.map(stop=>Array.from({length:PASSENGERS},(_,k)=>makePath([
  [stop.door[0],stop.door[1]-.4],[stop.door[0],WALK_N],[accessX(stop),WALK_N],[accessX(stop),-4.74],
  [slotX(stop,k),-4.74],[slotX(stop,k),-4.46],[slotX(stop,k),-3.9]
])));
const SLOT_FROM_END=.56;

// ---- The rules of the road ---------------------------------------------------
const CAR={len:1.13,wid:.58,vmax:2.2,acc:1.6,gap:.24};
const TRAM={len:4.42,wid:.7,vmax:1.9,acc:.8,gap:5.7,dwell:7,hold:20,pitch:1.5};
const CYCLE={len:.95,wid:.3,speed:1.4},WALK={r:.13,speed:.5},STEP={r:.13,speed:.62};
export const SIZES={CAR,TRAM,CYCLE,WALK,STEP};

export function createTraffic({cars=7,warm=45}={}){
  const P=PATHS,movers=[];let clock=0;
  const bodies=(path,filter)=>movers.filter(m=>m.path===path&&m.onLine!==false&&(!filter||filter(m)));
  // Is any body on this line inside the stretch from a to b?
  const within=(path,a,b,filter)=>bodies(path,filter).some(m=>{
    const half=m.len/2,span=path.ahead(a,b);
    return path.ahead(a,m.s+half)<=span+m.len;
  });
  const tramStops=STOPS.map(stop=>P.tram.nearest(stop.x,TRAM_N));
  const trams=[0,1].map(i=>{
    const m={kind:'tram',path:P.tram,s:(tramStops[0]-9+i*P.tram.length/2+P.tram.length)%P.tram.length,v:0,...TRAM,dwellLeft:0,stood:0,at:-1,hurry:1,visible:true};
    const d=tramStops.map(s=>P.tram.ahead(m.s,s));m.target=d[0]<d[1]?0:1;movers.push(m);return m;
  });
  // How soon the front of a tram reaches a place on its line, at the soonest.
  const tramEta=s=>Math.min(...trams.map(t=>{
    const d=P.tram.ahead(t.s+t.len/2,s);
    return d>P.tram.length-t.len-.6?0:t.dwellLeft+d/(t.vmax*t.hurry);
  }));
  const tramClear=(x0,x1,z,time)=>{
    const a=P.tram.nearest(z<0?x1:x0,z),b=P.tram.nearest(z<0?x0:x1,z);
    return tramEta(a)>time&&!within(P.tram,a,b);
  };
  const green=()=>clock%SIGNAL.cycle<SIGNAL.green;
  const redLeft=()=>green()?0:SIGNAL.cycle-clock%SIGNAL.cycle;
  const s=(path,x,z)=>path.nearest(x,z);
  const crossingFrom=s(P.cars,CAR_W,1.45),crossingTo=s(P.cars,CAR_W,2.6);
  const walkers=()=>movers.filter(m=>m.kind==='traveller');
  const onCrossing=()=>walkers().some(m=>{const p=m.path.at(m.s);return Math.abs(p.z-2.05)<.35&&p.x>-7.05&&p.x<-5;});
  // A car stops at each of these unless the way through is clear, and never
  // enters a junction it cannot leave.
  const carGates=[
    {at:[CAR_W,-4.58],end:[CAR_W,-2.5],open:()=>tramClear(CAR_W-.5,CAR_W+.5,TRAM_N,3.4)},
    {at:[CAR_W,1.5],end:[CAR_W,4.3],open:()=>green()&&!onCrossing()&&tramClear(CAR_W-.5,CAR_W+.5,TRAM_S,3.9)},
    {at:[CAR_E,4.58],end:[CAR_E,2.5],open:()=>tramClear(CAR_E-.5,CAR_E+.5,TRAM_S,3.4)},
    {at:[CAR_E,-2.22],end:[CAR_E,-4.3],open:()=>tramClear(CAR_E-.5,CAR_E+.5,TRAM_N,3.4)}
  ].map(g=>({s:s(P.cars,...g.at),end:s(P.cars,...g.end),open:g.open}));
  const turnIn=s(P.cars,CAR_E,BAYS.zs[BAYS.free]+1.4);
  for(let i=0;i<=cars;i++){
    movers.push({kind:'car',index:i,seeker:i===cars,path:P.cars,s:(turnIn+4+i*P.cars.length/(cars+1))%P.cars.length,v:0,...CAR,visible:true,state:'drive',m:0,wait:0});
  }
  const seeker=movers.find(m=>m.seeker);
  [0,1,2].forEach(i=>movers.push({kind:'cyclist',path:P.cycle,s:i*P.cycle.length/3,v:CYCLE.speed,len:CYCLE.len,wid:CYCLE.wid,visible:true}));
  Array.from({length:8},(_,i)=>movers.push({kind:'walker',index:i,path:P.promenade,way:i%3===2?-1:1,s:i*P.promenade.length/8,side:.13,len:.26,wid:.26,visible:true}));
  // Where a traveller waits before stepping out, and what they wait for.
  const cycleEta=(x,z)=>{const a=P.cycle.nearest(x,z);return Math.min(...bodies(P.cycle).map(c=>{const d=P.cycle.ahead(c.s+c.len/2,a);return d>P.cycle.length-1.4?0:d/c.v;}));};
  const roadFree=()=>!green()&&clock%SIGNAL.cycle>SIGNAL.green+1.4&&redLeft()>4&&!within(P.cars,crossingFrom,crossingTo);
  const travellerGates=path=>[
    {from:[-7.6,4.4],to:[-7.6,2.4],open:()=>tramClear(-8,-7.2,TRAM_S,5.2)},
    {from:[-7.05,2.05],to:[-4.95,2.05],open:roadFree},
    ...(path===P.toPark?[{from:[-4.62,.9],to:[-3.95,.9],open:()=>cycleEta(-4.22,.9)>2.2}]
      :[{from:[-4.88,-2.42],to:[-4.88,-4.4],open:()=>tramClear(-5.2,-4.4,TRAM_N,5.2)}])
  ].map(g=>({a:path.nearest(...g.from),b:path.nearest(...g.to),open:g.open}));
  [P.toPark,P.toStop].forEach((path,i)=>movers.push({kind:'traveller',index:i,path,s:0,way:1,wait:2+i*9,side:.12,len:.26,wid:.26,visible:false,gates:travellerGates(path)}));
  const passengers=Array.from({length:PASSENGERS},(_,k)=>{
    const stop=k%2,m={kind:'passenger',index:k,stop,path:P.passenger[stop][k],s:0,state:'indoors',wait:1+k*2.3,len:.26,wid:.26,visible:false,tram:null};
    movers.push(m);return m;
  });

  function drive(m,dt,limit){
    const room=Math.max(0,limit),allowed=Math.sqrt(2*m.acc*1.6*room);
    m.v=Math.max(0,Math.min(m.v+m.acc*dt,m.vmax*(m.hurry||1),allowed));
    const move=Math.min(m.v*dt,room);m.s=(m.s+move)%m.path.length;m.moved=move;
  }
  function leaderRoom(m){
    let room=1e9;
    for(const o of bodies(m.path)){if(o===m)continue;const d=m.path.ahead(m.s+m.len/2,o.s-o.len/2+(o.pad||0));if(d<m.path.length/2)room=Math.min(room,d-m.gap);}
    return room;
  }
  function stepTram(t,dt,opts){
    const wanted=opts.nearStop!=null,standing=trams.some(o=>o.at===opts.nearStop)||trams.some(o=>o.target===opts.nearStop&&P.tram.ahead(o.s,tramStops[opts.nearStop])<5);
    t.hurry=wanted&&!standing?2.2:1;
    if(t.at>=0){
      t.stood+=dt;t.dwellLeft=Math.max(0,t.dwellLeft-dt);t.moved=0;
      const held=wanted&&t.at===opts.nearStop&&t.stood<TRAM.hold;
      const other=trams.find(o=>o!==t),close=P.tram.ahead(t.s,other.s)<P.tram.length/2-4;
      if(t.dwellLeft<=0&&!held&&!close){t.at=-1;t.target=(t.target+1)%tramStops.length;}
      else if(t.dwellLeft<=0)t.dwellLeft=.05;
      return;
    }
    let toStop=P.tram.ahead(t.s,tramStops[t.target]);if(toStop>P.tram.length-.05)toStop=0;
    drive(t,dt,Math.min(toStop,leaderRoom(t)));
    if(toStop<.004&&t.v<.05){t.s=tramStops[t.target];t.v=0;t.at=t.target;t.dwellLeft=TRAM.dwell;t.stood=0;}
  }
  function stepCar(m,dt){
    if(m.state==='in'||m.state==='out'){
      const way=m.state==='in'?1:-1;m.m=clamp(m.m+way*.9*dt,0,P.park.length);m.moved=.9*dt;
      if(m.state==='in'&&m.m>=P.park.length){m.state='parked';m.wait=12;m.onLine=false;}
      if(m.state==='out'&&m.m<=0){m.state='drive';m.v=0;m.pad=0;m.skip=true;}
      return;
    }
    if(m.state==='parked'){
      m.wait-=dt;m.moved=0;
      // Back out only into an empty stretch of road.
      if(m.wait<=0&&!within(P.cars,turnIn-5,turnIn+3.4,o=>o!==m)){m.state='out';m.onLine=true;}
      return;
    }
    let room=leaderRoom(m);const front=m.s+m.len/2;
    for(const g of carGates){
      let d=P.cars.ahead(front,g.s);if(d>P.cars.length-.05)d=0;if(d>9)continue;
      // The car that is going to stop and turn into the bay counts as already
      // standing there, so nobody follows it into a junction it will block.
      const rear=o=>o.seeker&&!o.skip&&o.state==='drive'&&P.cars.ahead(m.s,o.s)<P.cars.ahead(m.s,turnIn)?turnIn-o.len/2:o.s-o.len/2;
      const beyond=bodies(P.cars).filter(o=>o!==m).map(o=>P.cars.ahead(g.end,rear(o))).filter(x=>x<P.cars.length/2);
      const inside=bodies(P.cars).filter(o=>o!==m&&P.cars.ahead(g.s,o.s+o.len/2)<P.cars.ahead(g.s,g.end)+o.len).length;
      const exit=Math.min(1e9,...beyond)>(inside+1)*(m.len+m.gap)+.1;
      if(!(g.open()&&exit))room=Math.min(room,d);
    }
    if(m.seeker&&!m.skip){let d=P.cars.ahead(m.s,turnIn);if(d>P.cars.length-.05)d=0;if(d<9){room=Math.min(room,d);if(d<.004&&m.v<.05&&!within(P.cars,turnIn+.1,turnIn+2.6,o=>o!==m)){m.state='in';m.m=0;m.pad=-.2;return;}}}
    if(m.seeker&&m.skip&&P.cars.ahead(turnIn,m.s)>3&&P.cars.ahead(turnIn,m.s)<P.cars.length/2)m.skip=false;
    drive(m,dt,room);
  }
  function stepTraveller(m,dt){
    if(m.wait>0){m.wait-=dt;m.moved=0;if(m.wait<=0)m.visible=true;return;}
    let move=STEP.speed*dt;
    for(const g of m.gates){
      const [near,far]=m.way>0?[g.a,g.b]:[g.b,g.a],d=(near-m.s)*m.way,inside=(m.s-near)*m.way>0&&(far-m.s)*m.way>0;
      if(!inside&&d>=0&&d<move+.02&&!g.open())move=Math.max(0,d-.01);
    }
    m.s+=move*m.way;m.moved=move;
    if(m.s>=m.path.length){m.s=m.path.length;m.way=-1;m.wait=4;}
    // Home again: indoors for a while, out of sight behind the door.
    if(m.s<=0&&m.way<0){m.s=0;m.way=1;m.wait=6;m.visible=false;}
  }
  function stepPassenger(m,dt){
    const end=m.path.length,place=end-SLOT_FROM_END;m.moved=0;
    const walk=to=>{const d=to-m.s,move=Math.min(Math.abs(d),WALK.speed*1.2*dt);m.s+=Math.sign(d)*move;m.moved=move;return Math.abs(to-m.s)<1e-4;};
    if(m.state==='indoors'){m.wait-=dt;if(m.wait<=0){m.state='out';m.visible=true;}}
    else if(m.state==='out'){if(walk(place))m.state='waiting';}
    else if(m.state==='waiting'){const t=trams.find(o=>o.at===m.stop&&o.dwellLeft>2.2&&o.stood>1.6);if(t){m.state='boarding';m.tram=t;}}
    else if(m.state==='boarding'){if(walk(end)){m.state='riding';m.visible=false;}}
    else if(m.state==='riding'){
      const other=1-m.stop;
      if(m.tram.at===other&&m.tram.stood>.3){m.stop=other;m.path=P.passenger[other][m.index];m.s=m.path.length;m.state='alighting';m.visible=true;}
    }
    else if(m.state==='alighting'){if(walk(0)){m.state='indoors';m.visible=false;m.wait=7+m.index*1.7;}}
  }
  function step(dt,opts={}){
    clock+=dt;
    for(const m of movers){
      if(m.kind==='tram')stepTram(m,dt,opts);
      else if(m.kind==='car')stepCar(m,dt);
      else if(m.kind==='cyclist'){m.s=(m.s+m.v*dt)%m.path.length;m.moved=m.v*dt;}
      else if(m.kind==='walker'){m.s=(m.s+m.way*WALK.speed*dt+m.path.length)%m.path.length;m.moved=WALK.speed*dt;}
      else if(m.kind==='traveller')stepTraveller(m,dt);
      else stepPassenger(m,dt);
    }
  }
  // Where a mover stands now: x, z and the way it faces.
  function place(m){
    if(m.kind==='car'&&m.state!=='drive'){
      const p=P.park.at(m.state==='parked'?P.park.length:m.m);return {x:p.x,z:p.z,hx:p.hx,hz:p.hz};
    }
    const p=m.path.at(m.s,m.side||0),back=m.way<0;
    return {x:p.x,z:p.z,hx:back?-p.hx:p.hx,hz:back?-p.hz:p.hz};
  }
  const carriages=t=>[-1,0,1].map(i=>P.tram.at(t.s+i*TRAM.pitch));
  for(let i=0;i<warm*30;i++)step(1/30);
  return {movers,trams,passengers,seeker,step,place,carriages,green,get clock(){return clock;}};
}

// ---- The cameras and what each must show ---------------------------------------
export const POSES={
  hero:{target:[0,.9,0],span:28,from:[17,20,23],dx:0,dy:.8},
  // The three rows of the proposal share one direction, from the west along
  // both streets, so a label placed by an earlier row still points at a thing
  // the later rows' cameras see.
  streets:{target:[1,.6,3.2],span:19,from:[-15,13,4.5],dx:-4.2,dy:0},
  transit:{target:[1,.7,-.6],span:22,from:[-15,13,4.5],dx:-3,dy:0},
  growth:{target:[3.2,.5,-.4],span:22,from:[-15,13,4.5],dx:-3.6,dy:-.4},
  mobility:{target:[0,.4,.2],span:15,from:[10,18,14],dx:1.5,dy:.5},
  congestion:{target:[-6.3,.6,-.4],span:12,from:[-2,12,15],dx:-.5,dy:-.7},
  // Along the street from the west, so a tram standing at the platform does
  // not stand between the camera and the people waiting for it.
  transitStop:{target:[-1,.6,-4.3],span:9,from:[-13,11,4],dx:-.3,dy:-.5},
  // From the west, so the row of bays lies across the frame with the gap
  // between one parked car and the next in plain sight.
  parking:{target:[7.3,.3,0],span:8,from:[-13,12,3],dx:-.2,dy:-.4},
  emissions:{target:[-6.3,.6,-.3],span:10,from:[-3,13,-15],dx:-.3,dy:-.3},
  // From the west, so the home, both routes, the park and the stop lie across
  // the frame between the heading and the list.
  accessibility:{target:[-6.5,.5,1],span:23,from:[-14,14,3],dx:2.6,dy:-.8},
  // How it works: the road at the signal where the traffic is counted, from
  // the south, with the words on the left and the queue beside the label. On
  // a phone it stands above the words, which fill the screen's foot.
  counts:{target:[-6.3,.6,3.5],span:13,from:[-2,12,15],dx:-2.2,dy:1,lift:.16},
  // The same place close up, while the road's capacity is fitted to the count.
  countsClose:{target:[-6.4,.5,1.4],span:7.5,from:[-2,12,15],dx:-1.4,dy:.2,lift:.16},
  // The travel survey: a step back from the city's own view, so every home
  // asked and the whole of the opened household's day stand in the frame.
  survey:{target:[0,.9,0],span:34,from:[17,20,23],dx:-3.2,dy:.4,lift:.16,phone:30},
  // The city seen straight from above, as a map: the changes are drawn on it
  // with the words on the left, and the results painted on it with the words
  // on the right. A phone keeps the whole board across its width.
  map:{target:[0,0,0],span:45.8,from:[0,40,.01],dx:-9.5,dy:2,lift:.16,phone:26.5},
  resultsMap:{target:[0,0,0],span:45.8,from:[0,40,.01],dx:9.2,dy:2,lift:.16,phone:26.5},
  // A day in the whole city, with the words on the right, clear of the city.
  // A phone keeps a strip of sky above it for the day's clock and the sun.
  day:{target:[0,.9,0],span:29,from:[17,20,23],dx:6.5,dy:.4,lift:.1,phone:26},
  comparison:{target:[0,.9,0],span:29,from:[14,16,19],dx:0,dy:-.5},
  closing:{target:[0,.9,0],span:32,from:[17,20,23],dx:0,dy:1.5},
  // Technical: the quick estimate over the whole city, right of the words,
  // with room above it for the blocks of trips and the arcs between them.
  quick:{target:[0,2,0],span:34,from:[17,20,23],dx:-5.6,dy:.2,lift:.12,phone:31},
  // The residents' days rise over the city as threads, an hour a step up:
  // stood back and low enough to see them rise, left of the words on the right.
  threads:{target:[0,3.8,0],span:37,from:[17,10,23],dx:7,dy:.2,lift:.12,phone:34},
  // The junction study from the east, along the west road, so the queue at
  // the signal lies across the frame beside the words.
  junction:{target:[-6,.4,0],span:20,from:[16,12,-1],dx:-3.4,dy:.2,lift:.16,phone:10.5},
  // The three ways side by side, from the north, so the junction stands in
  // the right-hand slice; set low, so the heading stands over the far side.
  threeWays:{target:[0,.9,0],span:34,from:[0,16,-24],dx:-1,dy:-.4,lift:-.05,phone:28}
};
// A label stands to the right of its place, or to the left where the place is
// near the right edge of the frame. The homepage labels the proposal's rows
// from beside the city; How it works labels the same changes on its map.
export const PINS={
  streets:{place:[1.1,1.3,GREENWAY.z],pose:'streets',seen:['streets','transit','growth'],on:'greenway tree 4'},
  transit:{place:[-1,1.4,-4.75],pose:'transit',seen:['transit','growth']},
  growth:{place:[BAYS.x,.6,BAYS.zs[BAYS.free]],pose:'growth',seen:['growth']},
  congestion:{place:[CAR_W,.75,.9],pose:'congestion'},
  counted:{place:[CAR_W,.3,.9],pose:'counts',seen:['counts','countsClose']},
  drawnStreets:{place:[-.2,.2,3.4],pose:'map',seen:['map']},
  drawnTransit:{place:[-1,.2,-4.63],pose:'map',seen:['map']},
  drawnGrowth:{place:[BAYS.x,.2,BAYS.zs[0]],pose:'map',seen:['map'],side:'left'},
  surveyHome:{place:[BUILDINGS[8].x,3.5,BUILDINGS[8].z],pose:'survey',seen:['survey']},
  surveyWork:{place:[BUILDINGS[1].x,1.2,doorOf(BUILDINGS[1])[1]],pose:'survey',seen:['survey']},
  surveyShops:{place:[BUILDINGS[2].x,1.2,doorOf(BUILDINGS[2])[1]],pose:'survey',seen:['survey']},
  // Technical: the corner of the junction study's line nearest the words, and
  // the kerb beside the queue the longest tailback is measured along.
  junctionStudy:{place:[JUNCTION.x0,.2,JUNCTION.z1],pose:'junction',seen:['junction']},
  longestTailback:{place:[-5.5,.3,-.6],pose:'junction',seen:['junction']}
};
// Where traffic is counted: a loop in the road at each place, the first under
// the label of the step that fits the model to the counts.
export const COUNT_LOOPS=[[CAR_W,.9],[CAR_E,6],[2,-EDGE]];
// A travel survey asks a sample of households to write down every trip they
// made on one day. Step 01 rings the homes asked, keeps their days as faint
// lines, and opens one household's day: three trips, each along the streets it
// ran on. A stop's mark stands over its own roof where its door faces away
// from the camera, and at the door where the camera can see it.
const bDoor=i=>doorOf(BUILDINGS[i]);
export const SURVEY={
  households:2400,
  // The household whose day is opened, and the three places its day passes
  // through. The marks are in PINS, so the audit checks each stands in frame.
  home:8,
  stops:[{name:'Home',foot:bDoor(8)},{name:'Work',foot:bDoor(1)},{name:'Shops',foot:bDoor(2)}],
  trips:[
    {at:'07:40',mode:'car',route:[bDoor(8),[8.9,3.4],[-6,3.4],[-6,-3.4],[-3.2,-3.4],bDoor(1)]},
    {at:'12:20',mode:'foot',route:[bDoor(1),[-3.2,-3.4],[2.2,-3.4],bDoor(2)]},
    {at:'17:50',mode:'transit',route:[bDoor(2),[2.2,TRAM_N],[11.9,TRAM_N],[11.9,TRAM_S],[8.9,TRAM_S],bDoor(8)]}
  ],
  // The rest of the sample: the home asked, the day it wrote down, and the
  // side of the street that day keeps, so the threads stay apart.
  sample:[
    {home:0,side:-.45,route:[bDoor(0),[-9.1,-3.4],[5.8,-3.4],[5.8,0],bDoor(5)]},
    {home:3,side:.45,route:[bDoor(3),[9,-3.4],[5.8,-3.4],[5.8,3.4],[2.2,3.4],bDoor(7)]},
    {home:4,side:-.2,route:[bDoor(4),[-6,0],[-6,-3.4],[2.2,-3.4],bDoor(2)]},
    {home:6,side:.2,route:[bDoor(6),[-2.4,3.4],[-6,3.4],[-6,-3.4],[-9.1,-3.4],bDoor(0)]},
    {home:7,side:-.7,route:[bDoor(7),[2.2,3.4],[5.8,3.4],[5.8,-3.4],[9,-3.4],bDoor(3)]},
    {home:'home',side:.7,route:[doorOf(HOME),[-6,6.9],[-6,3.4],[-2.4,3.4],bDoor(6)]}
  ]
};
// What each close-up has to show, as places its camera must see.
export const SUBJECTS={
  survey:[PINS.surveyHome.place,PINS.surveyWork.place,PINS.surveyShops.place],
  growth:BAYS.zs.map(z=>[BAYS.x,.4,z]),parking:BAYS.zs.map(z=>[BAYS.x,.4,z]),
  congestion:[[CAR_W,.5,.9],[CAR_W,.5,-.5],[SIGNAL.x,1.7,SIGNAL.z]],
  emissions:[[CAR_W,.5,.9],[CAR_W,.5,-.5]],
  counts:[[CAR_W,.5,.9],[CAR_W,.5,-.5],[SIGNAL.x,1.7,SIGNAL.z]],
  junction:[[CAR_W,.5,STOP_LINE.z],[CAR_W,.5,-.5],[CAR_W,.5,-2.6],[SIGNAL.x,1.7,SIGNAL.z]],
  transitStop:[[-1.6,.35,-4.46],[-1,.35,-4.46],[-.4,.35,-4.46],[-1,1.1,-3.8]],
  accessibility:[[-10.15,.4,6.9],[-7.6,.2,3.4],[-6,.2,2.05],[-2.95,.3,.9],[-2.95,.3,-5.12]],
  mobility:[[0,.3,-2.25],[0,.3,-1.5],[0,.5,-3.8]]
};

// ---- The audit ----------------------------------------------------------------
const rectOf=(name,x,z,w,d,extra={})=>({name,x,z,w,d,...extra});
export function footprints(){
  const out=[];
  BUILDINGS.forEach((b,i)=>{
    out.push(rectOf('building '+i,b.x,b.z,b.w+.1,b.d+.1,{tall:b.height+(b.roof==='flat'?.4:.8),solid:true}));
    const o={south:[0,b.d/2+.2],north:[0,-b.d/2-.2],east:[b.w/2+.2,0],west:[-b.w/2-.2,0]}[b.door];
    out.push(rectOf('door steps '+i,b.x+o[0],b.z+o[1],o[0]?.4:.8,o[0]?.8:.4,{steps:true,on:'building '+i}));
  });
  out.push(rectOf('home',HOME.x,HOME.z,HOME.w+.1,HOME.d+.1,{tall:HOME.height+1,solid:true}));
  out.push(rectOf('home garden',HOME.x-HOME.w/2-.5,HOME.z,1,3.9,{garden:true,on:'home'}));
  TREES.forEach(([x,z,size],i)=>out.push({name:'tree '+i,x,z,r:.1*size,crown:.7*size,cx:x+.12*size,top:.1+2.9*size,low:.1+1*size}));
  CONIFERS.forEach(([x,z,size],i)=>out.push({name:'conifer '+i,x,z,r:.08*size,crown:.55*size,cx:x,top:.1+3.4*size,low:.1+.75*size}));
  GREENWAY.trees.forEach((x,i)=>out.push({name:'greenway tree '+i,x,z:GREENWAY.z,r:.08,crown:.5,cx:x+.09,top:2.2,low:.85,proposal:true}));
  GREENWAY.benches.forEach((x,i)=>out.push(rectOf('greenway bench '+i,x,GREENWAY.z,.9,.34,{proposal:true})));
  KERB_CARS.forEach((x,i)=>out.push(rectOf('kerb car '+i,x,GREENWAY.z+.02,CAR.len,CAR.wid,{today:true})));
  out.push(rectOf('pond',POND.x,POND.z,(POND.rx+.16)*2,(POND.rz+.16)*2),rectOf('pond deck',POND.x-POND.rx+.15,POND.z+.15,.9,.55,{on:'pond'}));
  out.push(rectOf('kiosk',KIOSK.x,KIOSK.z+.25,1.24,1.5,{tall:1.4,solid:true}));
  PARK_BENCHES.forEach(([x,z,turn],i)=>{const side=Math.abs(Math.sin(turn))>.5;out.push(rectOf('park bench '+i,x,z,side?.34:.9,side?.9:.34));});
  PARK_LAMPS.forEach(([x,z],i)=>out.push({name:'park lamp '+i,x,z,r:.05}));
  for(const side of ['north','south'])WIRE_POLES[side].xs.forEach(x=>out.push({name:`wire pole ${side} ${x}`,x,z:WIRE_POLES[side].z,r:.05}));
  STOPS.forEach((stop,i)=>{
    out.push(rectOf('platform '+i,stop.x,stop.z,3,.58,{platform:true}));
    out.push(rectOf('shelter bench '+i,stop.x-stop.access*1,stop.z-.14,.9,.34,{on:'platform '+i}));
    out.push({name:'stop sign '+i,x:stop.x-stop.access*1.4,z:stop.z+.17,r:.04,on:'platform '+i});
  });
  BAYS.zs.forEach((z,i)=>{if(i!==BAYS.free)out.push(rectOf('parked car '+i,BAYS.x,z,CAR.len,CAR.wid));});
  METERS.forEach(([x,z],i)=>out.push({name:'meter '+i,x,z,r:.07}));
  out.push({name:'price sign',x:PRICE_SIGN[0],z:PRICE_SIGN[1],r:.05},{name:'signal',x:SIGNAL.x,z:SIGNAL.z,r:.06});
  return out;
}
const half=f=>f.r!=null?[f.r,f.r]:[f.w/2,f.d/2];
function gap(a,b){
  if(a.r!=null&&b.r!=null)return Math.hypot(a.x-b.x,a.z-b.z)-a.r-b.r;
  const [aw,ad]=half(a),[bw,bd]=half(b);
  const dx=Math.max(0,Math.abs(a.x-b.x)-aw-bw),dz=Math.max(0,Math.abs(a.z-b.z)-ad-bd);
  return Math.hypot(dx,dz)-(dx===0&&dz===0?Math.min(aw+bw-Math.abs(a.x-b.x),ad+bd-Math.abs(a.z-b.z)):0);
}
function inRoad(x,z,grow=0){
  const roads=[...ROADS,{x:SOUTH_STREET.x,z:SOUTH_STREET.north+SOUTH_STREET.width/2,w:SOUTH_STREET.w,d:SOUTH_STREET.width}];
  return roads.some(r=>Math.abs(x-r.x)<=r.w/2+grow&&Math.abs(z-r.z)<=r.d/2+grow);
}
// Where a place lands in the frame of a pose, as fractions of the frame from
// its left and its top. The page's camera keeps one width of city across.
export function onScreen(place,pose,aspect=1776/1019){
  const l=Math.hypot(...pose.from),f=pose.from.map(v=>-v/l),rl=Math.hypot(f[2],f[0]);
  const right=[f[2]/rl,0,-f[0]/rl],up=[right[1]*f[2]-right[2]*f[1],right[2]*f[0]-right[0]*f[2],right[0]*f[1]-right[1]*f[0]];
  const wide=aspect>1?1:0,width=aspect<1?pose.phone??pose.span*.8:pose.span,height=Math.max(width*.56,width/Math.max(aspect,.3));
  const lift=(pose.lift||0)*(1-wide)*width/aspect;
  const aim=pose.target.map((v,i)=>v-right[i]*(pose.dx||0)*wide-up[i]*((pose.dy||0)*wide-lift)),rel=place.map((v,i)=>v-aim[i]);
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  // The page's own right and up vectors point to the frame's left and its foot.
  return {x:.5-dot(rel,right)/width,y:.5+dot(rel,up)/height};
}
// Does anything tall stand between a place and the camera of a pose?
export function hidden(place,pose,things){
  const l=Math.hypot(...pose.from),d=pose.from.map(v=>v/l);
  for(let t=.15;t<40;t+=.05){
    const x=place[0]+d[0]*t,y=place[1]+d[1]*t,z=place[2]+d[2]*t;
    for(const f of things){
      if(f.solid&&y<f.tall&&Math.abs(x-f.x)<f.w/2&&Math.abs(z-f.z)<f.d/2)return f.name;
      if(f.crown&&y>f.low&&y<f.top){const mid=(f.low+f.top)/2,ry=(f.top-f.low)/2,k=1-((y-mid)/ry)**2;if(k>0&&Math.hypot(x-f.cx,z-f.z)<f.crown*Math.sqrt(k))return f.name;}
    }
    if(y>9)break;
  }
  return null;
}
const corners=(p,len,wid)=>[[1,1],[1,-1],[-1,-1],[-1,1]].map(([a,b])=>[p.x+p.hx*a*len/2-p.hz*b*wid/2,p.z+p.hz*a*len/2+p.hx*b*wid/2]);
function overlap(A,B){
  for(const poly of [A,B])for(let i=0;i<4;i++){
    const [x0,z0]=poly[i],[x1,z1]=poly[(i+1)%4],nx=z1-z0,nz=x0-x1;
    const pa=A.map(([x,z])=>x*nx+z*nz),pb=B.map(([x,z])=>x*nx+z*nz);
    if(Math.max(...pa)<Math.min(...pb)+1e-9||Math.max(...pb)<Math.min(...pa)+1e-9)return false;
  }
  return true;
}

export function auditCity({seconds=900,log=()=>{}}={}){
  const faults=[],fixed=footprints(),fault=text=>{if(!faults.includes(text))faults.push(text);};
  // 1. Fixed things keep a gap from each other and stay on the board.
  for(let i=0;i<fixed.length;i++)for(let j=i+1;j<fixed.length;j++){
    const a=fixed[i],b=fixed[j];
    if(a.on===b.name||b.on===a.name||(a.on&&a.on===b.on)||(a.today&&b.proposal)||(a.proposal&&b.today))continue;
    const need=.1,g=gap(a,b);
    if(g<need)fault(`${a.name} stands ${g.toFixed(2)} from ${b.name}`);
    // A crown keeps clear of walls, other crowns, poles and lamps.
    const crowns=[a,b].filter(f=>f.crown);
    if(crowns.length){
      const [c,o]=a.crown?[a,b]:[b,a],reach=c.crown+(o.crown||0);
      const d=o.crown?Math.hypot(c.cx-o.cx,c.z-o.z)-reach:gap({x:c.cx,z:c.z,r:c.crown},o);
      const tallOther=o.crown||o.solid||/pole|lamp|signal|sign/.test(o.name);
      if(tallOther&&d<.05)fault(`the crown of ${c.name} runs into ${o.name}`);
    }
  }
  for(const f of fixed){const [w,d]=half(f);if(Math.abs(f.x)+w>BOARD.w/2||Math.abs(f.z)+d>BOARD.d/2)fault(`${f.name} hangs over the edge of the board`);
    if(!f.today&&!/parked car/.test(f.name)&&inRoad(f.x,f.z,-.05)&&!(f.proposal&&f.z>SOUTH_STREET.north+SOUTH_STREET.narrow))fault(`${f.name} stands in a road`);}
  // 2. Every line keeps clear of fixed things, and vehicles stay on the road.
  const lines=[
    ['tram',PATHS.tram,TRAM.wid/2,true,1.4],['cars',PATHS.cars,CAR.wid/2,true,1.1],['park',PATHS.park,CAR.wid/2,true,1.1],
    ['cycle',PATHS.cycle,.22,false,1.3],['promenade',PATHS.promenade,.27,false,0],
    ['to the park',PATHS.toPark,.26,false,0],['to the stop',PATHS.toStop,.26,false,0],
    ...PATHS.passenger.flatMap((list,i)=>list.map((p,k)=>[`passenger ${k} at stop ${i}`,p,.14,false,0]))
  ];
  for(const [name,path,reach,vehicle,headroom] of lines){
    const startsIn=f=>f.solid&&Math.abs(path.raw[0][0]-f.x)<f.w/2&&Math.abs(path.raw[0][1]-f.z)<f.d/2;
    if(vehicle)for(const side of [-reach,reach])for(const [x,z] of path.points(.1,side))if(!inRoad(x,z,.02))fault(`the ${name} line leaves the road near ${x.toFixed(1)}, ${z.toFixed(1)}`);
    for(const [x,z] of path.points(.1)){
      for(const f of fixed){
        if(f.today||f.garden||f.platform&&!vehicle||f.steps&&!vehicle)continue;
        if(name==='park'&&/parked car/.test(f.name))continue;
        if(startsIn(f)||f.on&&fixed.some(o=>o.name===f.on&&startsIn(o)))continue;
        if(gap({x,z,r:reach},f)<.03)fault(`the ${name} line runs into ${f.name}`);
        if(headroom&&f.crown&&f.low<headroom&&Math.hypot(x-f.cx,z-f.z)<f.crown*.8+reach)fault(`the crown of ${f.name} hangs over the ${name} line`);
      }
    }
  }
  // 3. Every label and every close-up points at something its camera sees.
  // A label of the proposal stays up while the later rows are read, so it is
  // checked from every camera it is shown under, and it has to land in the
  // part of a wide frame the words leave free.
  for(const [name,pin] of Object.entries(PINS))for(const view of pin.seen||[pin.pose]){
    const by=hidden(pin.place,POSES[view],fixed.filter(f=>!f.today&&f.name!==pin.on));
    if(by)fault(`the ${name} label points at a place hidden behind ${by} in the ${view} view`);
    const wide=onScreen(pin.place,POSES[view]),tall=onScreen(pin.place,POSES[view],390/844);
    // A close-up's words stand at the foot and the right of the frame.
    const free=pin.seen?[.4,pin.side==='left'?.95:.86,.12,.88]:[.3,.72,.15,.7];
    if(wide.x<free[0]||wide.x>free[1]||wide.y<free[2]||wide.y>free[3])fault(`the ${name} label leaves the free part of a wide frame in the ${view} view`);
    if(view===pin.pose&&(tall.x<.05||tall.x>.95||tall.y<.1||tall.y>.9))fault(`the ${name} label leaves a phone frame in the ${view} view`);
  }
  for(const [pose,places] of Object.entries(SUBJECTS))places.forEach(place=>{const by=hidden(place,POSES[pose],[...fixed.filter(f=>!f.today),...(pose==='transitStop'?[{solid:true,name:'a tram standing at the stop',x:STOPS[0].x,z:TRAM_N,w:TRAM.len,d:TRAM.wid,tall:1.05}]:[])]);if(by)fault(`the ${pose} view cannot see ${place.join(', ')}: ${by} is in the way`);});
  // 4. Run the streets and watch them: nothing overlaps, nothing jumps, and
  // nobody appears or vanishes except indoors or inside a standing tram.
  for(const mode of [{},{nearStop:0}]){
    const traffic=createTraffic(),dt=1/30,was=new Map();let parks=0,boards=0,worstQueue=0,queueSum=0,last='drive';
    for(let i=0;i<seconds/dt;i++){
      traffic.step(dt,mode);
      const shapes=[];
      for(const m of traffic.movers){
        const p=traffic.place(m),seen=m.visible,before=was.get(m);
        if(before){
          const jump=Math.hypot(p.x-before.x,p.z-before.z),most=(m.vmax||1)*2.4*dt+.02;
          if(seen&&before.seen&&jump>most)fault(`${m.kind} ${m.index??''} jumps ${jump.toFixed(2)} in one frame`);
          if(seen!==before.seen){
            const indoors=fixed.some(f=>f.solid&&Math.abs(p.x-f.x)<f.w/2&&Math.abs(p.z-f.z)<f.d/2);
            const inTram=traffic.trams.some(t=>t.at>=0&&traffic.carriages(t).some(c=>Math.abs(p.x-c.x)<.76&&Math.abs(p.z-c.z)<.34));
            if(!indoors&&!inTram)fault(`${m.kind} ${m.index??''} ${seen?'appears':'vanishes'} in the open at ${p.x.toFixed(1)}, ${p.z.toFixed(1)}`);
            if(m.kind==='passenger'&&!seen&&inTram)boards++;
          }
        }
        was.set(m,{x:p.x,z:p.z,seen});
        if(!seen)continue;
        if(m.kind==='tram')traffic.carriages(m).forEach(c=>shapes.push({m,name:'tram carriage',poly:corners(c,1.42,TRAM.wid)}));
        else shapes.push({m,name:`${m.kind} ${m.index??''}`,poly:corners(p,m.len,m.wid),person:m.len<.3});
      }
      for(let a=0;a<shapes.length;a++)for(let b=a+1;b<shapes.length;b++){
        const A=shapes[a],B=shapes[b];
        if(A.m===B.m||A.person&&B.person)continue;
        if(A.person!==B.person&&(A.m.kind==='passenger'||B.m.kind==='passenger')&&(A.m.kind==='tram'||B.m.kind==='tram'))continue;
        if(overlap(A.poly,B.poly))fault(`${A.name} and ${B.name} overlap at ${A.poly[0][0].toFixed(1)}, ${A.poly[0][1].toFixed(1)}`);
      }
      if(traffic.seeker.state==='parked'&&last!=='parked')parks++;
      last=traffic.seeker.state;
      const queue=traffic.movers.filter(m=>m.kind==='car'&&m.state==='drive'&&m.v<.05&&Math.abs(traffic.place(m).x-CAR_W)<.1).length;
      worstQueue=Math.max(worstQueue,queue);queueSum+=queue;
    }
    if(parks<3)fault(`the car looking for a space parked only ${parks} times in ${seconds} seconds`);
    if(boards<6)fault(`only ${boards} boardings in ${seconds} seconds`);
    if(worstQueue<3)fault('the queue at the signal never reached three cars');
    log(`mode ${JSON.stringify(mode)}: parked ${parks} times, ${boards} boardings, longest queue ${worstQueue}, usual queue ${(queueSum/(seconds/dt)).toFixed(1)}`);
  }
  return faults;
}

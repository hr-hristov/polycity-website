import { THREE, plan } from './one-city.js?v=a2f722dbad15';

// What How it works draws over the city, one set for each step: the zones the
// census comes in and the trips the travel survey records, the loops in the
// road where traffic is counted, what each other feed carries, the pen that
// draws each change on the map,
// the residents and their day, the nine result groups painted on the map, and
// the colours of what changed on the proposal's side of the split. All of it
// lies over the city rather than being part of it, so none of it turns into
// numbers, and none of it carries a figure.
const INK='#000b2d',ORANGE='#fd4b08',CYAN='#0ad6ed',GOLD='#febe11',BLUE='#049dd6',PURPLE='#57039b';
const BLOCKS_X=[[-11.25,-6.9],[-5.1,4.9],[6.7,11.25]],BLOCKS_Z=[[-8.5,-4.3],[-2.5,2.5],[4.3,8.5]];
// Where a building's door opens onto its street, a step out from the wall.
const doorOf=(b,out=.35)=>{
  const o={south:[0,b.d/2+out],north:[0,-b.d/2-out],east:[b.w/2+out,0],west:[-b.w/2-out,0]}[b.door];
  return [b.x+o[0],b.z+o[1]];
};
const B=plan.BUILDINGS,HOME_DOOR=doorOf(plan.HOME);
// The trips the survey records and the day then makes: from a door to a door,
// out at one hour and home at another. The four named ones carry a tag on the
// day they are made.
export const TRIPS=[
  {from:HOME_DOOR,to:doorOf(B[1]),out:7.2,back:17,purpose:'work'},
  {from:HOME_DOOR,to:doorOf(B[7]),out:7.6,back:15.2,purpose:'school'},
  {from:doorOf(B[4]),to:doorOf(B[3]),out:7.9,back:17.5},
  {from:doorOf(B[6]),to:doorOf(B[5]),out:8.3,back:16.7},
  {from:doorOf(B[8]),to:doorOf(B[2]),out:12.4,back:14.4,purpose:'shops'},
  {from:doorOf(B[2]),to:doorOf(B[6]),out:18,back:21}
];
// How long a trip takes on the page's clock, in hours.
const TRIP_HOURS=1;
// When each tag stands over its place: while a trip has just arrived there.
export const TAGS={
  work:{place:[...TRIPS[0].to],from:TRIPS[0].out+TRIP_HOURS,to:TRIPS[0].out+TRIP_HOURS+2},
  school:{place:[...TRIPS[1].to],from:TRIPS[1].out+TRIP_HOURS,to:TRIPS[1].out+TRIP_HOURS+2},
  shops:{place:[...TRIPS[4].to],from:TRIPS[4].out+TRIP_HOURS,to:TRIPS[4].out+TRIP_HOURS+1.2},
  home:{place:[...HOME_DOOR],from:TRIPS[0].back+TRIP_HOURS,to:TRIPS[0].back+TRIP_HOURS+1.6}
};

export function createHowLayers(city){
  const {world,kit,onlyInProposal,traffic,lineMaterials}=city;
  const own=geometry=>kit.own(geometry);
  const flat=(color,opacity=1,{depthTest=true,blending=THREE.NormalBlending}={})=>{
    const material=new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,depthTest,side:THREE.DoubleSide,fog:false,toneMapped:false,blending});
    lineMaterials.push(material);return material;
  };
  // A set of things shown together, faded as one: each material keeps the
  // opacity it was made with and is multiplied by the set's.
  function layer(parent=world,y=0,order=0){
    const group=new THREE.Group();group.position.y=y;group.visible=false;parent.add(group);
    const parts=[];let shown=-1;
    return {
      group,
      add(mesh,material=mesh.material){mesh.renderOrder=order;group.add(mesh);if(!parts.some(([m])=>m===material))parts.push([material,material.opacity]);return mesh;},
      set(alpha){
        const a=Math.round(Math.min(1,Math.max(0,alpha))*1000)/1000;
        if(a===shown)return;shown=a;
        group.visible=a>0;parts.forEach(([material,base])=>{material.opacity=base*a;});
      }
    };
  }
  // A flat band of a width along a line of [x, z] points, lying on the ground,
  // with how far along the line each point is, so it can be drawn part way.
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
  // A line through corners, rounded a little at each and cut into short steps.
  const line=(corners,{closed=false,radius=.18,step=.1}={})=>plan.makePath(corners,{closed,radius}).points(step);
  // Many short flat pieces in one shape: [x0, z0, x1, z1, width] each.
  function pieces(list){
    const position=[],index=[];
    list.forEach(([x0,z0,x1,z1,width])=>{
      let dx=x1-x0,dz=z1-z0;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
      const nx=-dz*width/2,nz=dx*width/2,k=position.length/3;
      position.push(x0+nx,0,z0+nz,x0-nx,0,z0-nz,x1+nx,0,z1+nz,x1-nx,0,z1-nz);
      index.push(k,k+1,k+2,k+1,k+3,k+2);
    });
    const geometry=new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(position,3));geometry.setIndex(index);
    return own(geometry);
  }
  const plane=own(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2));
  const disc=own(new THREE.CircleGeometry(1,48).rotateX(-Math.PI/2));
  const ring=own(new THREE.RingGeometry(.92,1,64).rotateX(-Math.PI/2));
  const ball=own(new THREE.IcosahedronGeometry(1,2));
  const rect=(target,x0,z0,x1,z1,material)=>{const m=target.add(new THREE.Mesh(plane,material));m.scale.set(x1-x0,1,z1-z0);m.position.set((x0+x1)/2,0,(z0+z1)/2);return m;};
  const stroke=(target,corners,width,material,options)=>target.add(new THREE.Mesh(band(line(corners,options),width).geometry,material));

  // ---- 01 Bring the city ------------------------------------------------------
  // The census comes in zones: each block of the city is outlined in dashes
  // and faintly filled. Over the number city, dark on navy, they turn light.
  const zones=layer(world,.13,1);
  const zoneInk=new THREE.Color('#2c3c93'),zoneLight=new THREE.Color('#9fc0ff');
  const zoneFill=flat(zoneInk,.08),zoneDashes=flat(zoneInk,.95);
  {
    const dashes=[];
    for(const [x0,x1] of BLOCKS_X)for(const [z0,z1] of BLOCKS_Z){
      const edges=[[x0,z0,x1,z0],[x1,z0,x1,z1],[x1,z1,x0,z1],[x0,z1,x0,z0]];
      for(const [ax,az,bx,bz] of edges){
        const length=Math.hypot(bx-ax,bz-az),ux=(bx-ax)/length,uz=(bz-az)/length;
        for(let s=0;s<length-.05;s+=.55){const e=Math.min(length,s+.34);dashes.push([ax+ux*s,az+uz*s,ax+ux*e,az+uz*e,.09]);}
      }
      rect(zones,x0,z0,x1,z1,zoneFill);
    }
    zones.add(new THREE.Mesh(pieces(dashes),zoneDashes));
  }
  // The travel survey asks a sample of households to write down every trip
  // they made on one day. Each home asked is ringed, the day it wrote down is
  // kept faint, and one household's day is drawn along the streets it ran on,
  // each leg in the colour of the way they travelled.
  const MODE_COLOURS={car:ORANGE,foot:'#e0a800',transit:PURPLE};
  const grow=(v,from,span)=>Math.min(1,Math.max(0,(v-from)/span));
  const survey=layer(world,.12,1);
  const ringMaterial=flat(INK,.36),faintMaterial=flat(INK,.3);
  const surveyRings=[plan.SURVEY.home,...plan.SURVEY.sample.map(s=>s.home)].map(which=>{
    const b=which==='home'?plan.HOME:B[which];
    const m=survey.add(new THREE.Mesh(ring,ringMaterial));
    m.position.set(b.x,0,b.z);m.userData.r=Math.hypot(b.w,b.d)/2+.45;
    return m;
  });
  const faintDays=plan.SURVEY.sample.map(s=>{
    const path=band(plan.makePath(s.route,{radius:.45}).points(.12,s.side),.12);
    return {...path,mesh:survey.add(new THREE.Mesh(path.geometry,faintMaterial))};
  });
  const surveyDay=layer(world,.15,2);
  const surveyLegs=plan.SURVEY.trips.map(trip=>{
    const path=band(line(trip.route,{radius:.45}),.18);
    return {...path,mesh:surveyDay.add(new THREE.Mesh(path.geometry,flat(MODE_COLOURS[trip.mode],1)))};
  });
  const stopMaterial=flat(INK,1);
  const surveyStops=plan.SURVEY.stops.map(stop=>{
    const m=surveyDay.add(new THREE.Mesh(disc,stopMaterial));
    m.scale.setScalar(.28);m.position.set(stop.foot[0],.01,stop.foot[1]);
    return m;
  });
  // Where the opened day's legs and its stops stand in the row: the rings
  // drop first, the day draws leg by leg, and the rest of the sample fills in.
  const LEG_AT=.16,LEG_SPAN=.17;
  // The day the model makes, one step on, flies from door to door.
  const arc=trip=>{
    const [ax,az]=trip.from,[bx,bz]=trip.to,length=Math.hypot(bx-ax,bz-az);
    return new THREE.QuadraticBezierCurve3(new THREE.Vector3(ax,.3,az),new THREE.Vector3((ax+bx)/2,.6+length*.28,(az+bz)/2),new THREE.Vector3(bx,.3,bz));
  };
  const curves=TRIPS.map(arc);
  const ARC_STEPS=60,ARC_SIDES=6;
  // Traffic is counted by loops in the road, which light as a car runs over.
  // Over the number city their frames turn light like the zones.
  const loopsLayer=layer(world,0,1);
  const loopInk=new THREE.Color(INK),loopFrame=flat(loopInk,.9);
  const loops=plan.COUNT_LOOPS.map(([x,z])=>{
    const alongZ=Math.abs(x)>5,light=flat('#0a8fa0',1);
    const edge=loopsLayer.add(new THREE.Mesh(plane,loopFrame));edge.position.set(x,.095,z);edge.scale.set(alongZ?.72:.3,1,alongZ?.3:.72);
    const lit=loopsLayer.add(new THREE.Mesh(plane,light));lit.position.set(x,.1,z);lit.scale.set(alongZ?.6:.18,1,alongZ?.18:.6);
    return {x,z,alongZ,light,flash:0};
  });
  const dim=new THREE.Color('#0a8fa0'),bright=new THREE.Color('#c9fbff');
  // A line of light on the ground where the city is turning real.
  const seam=layer(world,.17,2);
  const seamLine=seam.add(new THREE.Mesh(own(new THREE.BoxGeometry(1,1,1)),flat(CYAN,.9,{blending:THREE.AdditiveBlending})));
  seamLine.scale.set(.08,.01,plan.BOARD.d+.4);

  // ---- 03 Draw the change -------------------------------------------------------
  // The pen draws each change where it applies: along the south street, round
  // the tram's loop, and round the parking bays. The pen's own mark is the
  // page's; this is the line it leaves.
  const penPaths=[
    band(line([[-12.3,3.4],[12.3,3.4]],{radius:0}),.3),
    band(plan.PATHS.tram.points(.12),.3),
    band(line([[6.6,-2.4],[8.9,-2.4],[8.9,2.4],[6.6,2.4],[6.6,-2.4]],{radius:0}),.3)
  ];
  const pens=penPaths.map(path=>{
    const set=layer(world,.34,6),material=flat(ORANGE,1,{depthTest:false});
    set.add(new THREE.Mesh(path.geometry,material));
    return {...path,set};
  });
  // The bays' corners are marked as the pen reaches them.
  const corners=[[6.6,-2.4],[8.9,-2.4],[8.9,2.4],[6.6,2.4]].map(([x,z],i)=>{
    const m=pens[2].set.add(new THREE.Mesh(disc,flat(ORANGE,1,{depthTest:false})));m.scale.setScalar(.2);m.position.set(x,.01,z);
    return {mesh:m,at:pens[2].along[pens[2].points.findIndex(([px,pz])=>Math.hypot(px-x,pz-z)<.06)]/pens[2].length||0,index:i};
  });
  function drawTo(pen,progress){
    const segments=pen.points.length-1;
    pen.geometry.setDrawRange(0,6*Math.floor(segments*progress));
  }
  // Where the pen's tip stands part way along a line.
  function tip(k,progress){
    const pen=pens[k],at=pen.length*Math.min(1,Math.max(0,progress));
    let i=1;while(i<pen.along.length-1&&pen.along[i]<at)i++;
    const a=pen.points[i-1],b=pen.points[i],span=pen.along[i]-pen.along[i-1]||1,u=(at-pen.along[i-1])/span;
    return [a[0]+(b[0]-a[0])*u,.34,a[1]+(b[1]-a[1])*u];
  }

  // ---- 04 Simulate a day ----------------------------------------------------------
  // The residents stand at their doors at night, three at each, and come out
  // door by door.
  const doors=[...B.map(b=>[doorOf(b,.4),b.door]),[doorOf(plan.HOME,.4),plan.HOME.door]];
  const residents=doors.map(([[x,z],side],i)=>{
    const set=layer(world,0,3),residentMaterial=flat(ORANGE,1);
    const acrossX=side==='north'||side==='south';
    [-.32,0,.32].forEach(offset=>{const m=set.add(new THREE.Mesh(ball,residentMaterial));m.scale.setScalar(.15);m.position.set(x+(acrossX?offset:0),.3,z+(acrossX?0:offset));});
    return {set,batch:i%4};
  });
  // The day's trips: faint arcs, and a dot that leaves one door and arrives
  // at the other, and comes home again later.
  const dayArcs=layer(world,0,2);
  curves.forEach(curve=>dayArcs.add(new THREE.Mesh(own(new THREE.TubeGeometry(curve,ARC_STEPS,.035,ARC_SIDES,false)),flat('#ffffff',.45))));
  const travellers=layer(world,0,4);
  const tripMaterial=flat(GOLD,1),rimMaterial=flat(INK,1);
  rimMaterial.side=THREE.BackSide;
  const dots=TRIPS.map(()=>{
    const g=new THREE.Group();travellers.group.add(g);
    const dot=travellers.add(new THREE.Mesh(ball,tripMaterial));dot.scale.setScalar(.26);g.add(dot);
    const rim=travellers.add(new THREE.Mesh(ball,rimMaterial));rim.scale.setScalar(.32);g.add(rim);
    // Both stand at one place, so the dot is drawn after its rim, or the rim
    // covers it and the traveller shows as a dark ball.
    dot.renderOrder=rim.renderOrder+1;
    return g;
  });
  // How far along its arc each trip is at an hour, or null when it is not on
  // its way: out in the morning, home in the evening.
  function onTheWay(trip,hour){
    if(hour>=trip.out&&hour<=trip.out+TRIP_HOURS)return (hour-trip.out)/TRIP_HOURS;
    if(hour>=trip.back&&hour<=trip.back+TRIP_HOURS)return 1-(hour-trip.back)/TRIP_HOURS;
    return null;
  }

  // ---- 05 Read the results -------------------------------------------------------
  // Each result group painted on the map as it is on the results screen, seen
  // from above, over everything.
  const results=[];
  const resultLayer=()=>{const set=layer(world,.45,5);results.push(set);return set;};
  const over=(color,opacity)=>flat(color,opacity,{depthTest:false});
  {
    // Mobility: one route for each way of travelling.
    const set=resultLayer();
    set.add(new THREE.Mesh(band(plan.PATHS.tram.points(.12),.38).geometry,over(PURPLE,1)));
    stroke(set,[[-6,-9.5],[-6,-3.4],[5.8,-3.4],[5.8,9.2]],.38,over(ORANGE,1));
    stroke(set,[[-5.3,-.6],[-3.6,-.6],[-3.6,1.4],[3.4,1.4],[3.4,-2.2]],.38,over(BLUE,1));
    stroke(set,[[-9,5.8],[-9,4.4],[-6.9,4.4],[-6.9,-2.5],[-1,-2.5],[-1,-4.2]],.38,over('#e0a800',1));
  }
  {
    // Congestion: each road by how freely it flows.
    const set=resultLayer();
    const roads=(list,color)=>{const material=over(color,.9);list.forEach(corners=>stroke(set,corners,1.05,material,{radius:0}));};
    roads([[[-12.5,3.4],[12.5,3.4]],[[-6.9,-9.15],[6.7,-9.15]],[[-6.9,9.15],[6.7,9.15]],[[-11.9,-4.3],[-11.9,4.3]],[[11.9,-4.3],[11.9,4.3]],[[5.8,-9.8],[5.8,9.8]],[[-6,4.3],[-6,9.8]]],BLUE);
    roads([[[-12.5,-3.4],[-6.9,-3.4]],[[6.7,-3.4],[12.5,-3.4]],[[-6,-2.5],[-6,2.5]]],GOLD);
    roads([[[-5.1,-3.4],[4.9,-3.4]],[[-6,-9.8],[-6,-4.3]]],ORANGE);
  }
  {
    // Transit: the line drawn by how many ride it, and the stops by how many
    // board there.
    const set=resultLayer(),line=over(PURPLE,.9);
    stroke(set,[[-10.9,-3.8],[10.9,-3.8]],1.1,line,{radius:0});
    stroke(set,[[-10.9,3.05],[10.9,3.05]],.4,line,{radius:0});
    stroke(set,[[-10.9,-3.8],[-11.9,-2.8],[-11.9,2.05],[-10.9,3.05]],.6,line,{radius:.6});
    stroke(set,[[10.9,-3.8],[11.9,-2.8],[11.9,2.05],[10.9,3.05]],.6,line,{radius:.6});
    const fill=over(PURPLE,.18),edge=over(PURPLE,.9);
    [[plan.STOPS[0],1.15],[plan.STOPS[1],.7]].forEach(([stop,r])=>{
      const f=set.add(new THREE.Mesh(disc,fill));f.scale.setScalar(r);f.position.set(stop.x,0,stop.z);
      const e=set.add(new THREE.Mesh(ring,edge));e.scale.setScalar(r);e.position.set(stop.x,.01,stop.z);
    });
  }
  {
    // Parking: each bay free or taken.
    const set=resultLayer(),taken=over(ORANGE,.95),free=over(BLUE,.95);
    plan.BAYS.zs.forEach((z,i)=>rect(set,6.9,z-.46,8.2,z+.46,i===plan.BAYS.free?free:taken));
  }
  {
    // Emissions: where the exhaust gathers, thickest where most cars run.
    const set=resultLayer();
    const glow=document.createElement('canvas');glow.width=glow.height=64;
    const pen=glow.getContext('2d'),fade=pen.createRadialGradient(32,32,0,32,32,32);
    fade.addColorStop(0,'rgba(255,255,255,1)');fade.addColorStop(1,'rgba(255,255,255,0)');
    pen.fillStyle=fade;pen.fillRect(0,0,64,64);
    const texture=new THREE.CanvasTexture(glow);
    const smog=over('#5b4d6e',.6);smog.map=texture;
    [[-6,-3.4,4.5,3.2],[1,-3.4,6.5,2.4],[-6,4,2.2,4.5],[8.5,-3.4,3.5,2]].forEach(([x,z,rx,rz])=>{
      const m=set.add(new THREE.Mesh(plane,smog));m.scale.set(rx*2,1,rz*2);m.position.set(x,0,z);
    });
  }
  {
    // Accessibility: how far one home reaches in five, ten and fifteen
    // minutes, kept to the city's edge.
    const set=resultLayer(),[cx,cz]=[plan.HOME.x,plan.HOME.z],hw=plan.BOARD.w/2,hd=plan.BOARD.d/2;
    [[9,.1],[6,.16],[3,.26]].forEach(([r,opacity])=>{
      const shape=new THREE.Shape();
      for(let i=0;i<=96;i++){
        const a=i/96*Math.PI*2,x=Math.min(hw,Math.max(-hw,cx+Math.cos(a)*r)),z=Math.min(hd,Math.max(-hd,cz+Math.sin(a)*r));
        if(i===0)shape.moveTo(x,-z);else shape.lineTo(x,-z);
      }
      set.add(new THREE.Mesh(own(new THREE.ShapeGeometry(shape).rotateX(-Math.PI/2)),over(BLUE,opacity)));
    });
  }
  {
    // Noise: bands along the busy roads, widest where it is loudest.
    const set=resultLayer();
    const loud=(corners,width,opacity)=>stroke(set,corners,width,over('#7b3fc0',opacity),{radius:0});
    loud([[-12.3,-3.4],[12.3,-3.4]],4.2,.13);loud([[-12.3,-3.4],[12.3,-3.4]],2.2,.2);
    loud([[-6,-9.6],[-6,9.6]],3.4,.13);loud([[-6,-9.6],[-6,9.6]],1.8,.2);
    loud([[5.8,-9.6],[5.8,9.6]],2,.14);loud([[-12.3,3.4],[12.3,3.4]],2,.14);
  }
  // Who is affected and what people pay: each zone shaded by how much.
  const zoneShades=(color,shares)=>{
    const set=resultLayer();let i=0;
    for(const [x0,x1] of BLOCKS_X)for(const [z0,z1] of BLOCKS_Z)rect(set,x0,z0,x1,z1,over(color,shares[i++]));
  };
  zoneShades('#011573',[.12,.3,.2,.42,.22,.5,.16,.36,.26]);
  zoneShades(ORANGE,[.34,.16,.48,.2,.4,.12,.28,.44,.18]);

  // ---- 06 Compare and decide -------------------------------------------------------
  // The roads coloured by whether they carry more traffic or less, on the
  // proposal's side only.
  const changes=layer(world,.1,1);
  onlyInProposal(changes.group);
  {
    const road=(corners,color,width=.9)=>stroke(changes,corners,width,flat(color,.8),{radius:0});
    road([[-12.3,-3.4],[12.3,-3.4]],ORANGE);
    road([[-12.3,2.88],[12.3,2.88]],BLUE,.6);
    road([[-6,-9.8],[-6,-4.3]],ORANGE);
    road([[-6,4.3],[-6,9.8]],BLUE);
    road([[5.8,-9.8],[5.8,9.8]],GOLD);
  }

  // ---- The data -----------------------------------------------------------------
  // What each feed read beside the city's own files carries, marked on the
  // whole city while its row is read: a ring riding on a tram for the vehicle
  // positions, a line from one counting loop to the next for the journey time
  // between them, rings at the two stops for the passengers counted there, a
  // ring on a cyclist for the shared bikes, the kerb of the parking lay-by for
  // its rules, a charging post by the bays, arcs between the zones for the
  // trips between them, and faint lines for the height of the ground. The city
  // has no charging post and no hills, so those two stand only while read.
  const TEAL='#0a8fa0';
  const zoneCentres=BLOCKS_X.flatMap(([x0,x1])=>BLOCKS_Z.map(([z0,z1])=>[(x0+x1)/2,(z0+z1)/2]));
  // A ring on the ground round what a feed reports on, and a second ring that
  // swells out of it and fades each time a report comes in.
  function beacon(set,rx,rz,[x,z]=[0,0],phase=0){
    const at=new THREE.Group();at.position.set(x,0,z);set.group.add(at);
    const steady=set.add(new THREE.Mesh(ring,flat(TEAL,.95)));steady.scale.set(rx,1,rz);at.add(steady);
    // The swelling ring's opacity is set every frame, so it stays out of the
    // set's own fade.
    const wave=new THREE.Mesh(ring,flat(TEAL,0));wave.renderOrder=steady.renderOrder;at.add(wave);
    return {at,wave,rx,rz,phase};
  }
  function swell(b,alpha,time){
    const life=(time/1.6+b.phase)%1;
    b.wave.visible=alpha>0;
    b.wave.scale.set(b.rx*(1+life),1,b.rz*(1+life));b.wave.material.opacity=.8*alpha*(1-life);
  }
  // GTFS: the tram's route the timetable runs on, drawn light over the number
  // city, so it reads wherever the trams are.
  const route=layer(world,.14,2);
  route.add(new THREE.Mesh(band(plan.PATHS.tram.points(.12),.26).geometry,flat('#c9a6ff',.9)));
  // GTFS-Realtime: the tram's reported place, ringed along its length.
  const onTram=layer(world,.13,4),tramBeacon=beacon(onTram,2.75,.85);
  // DATEX II: the journey time between two loops, drawn along the road the
  // cars take from the one to the other.
  const journey=layer(world,.11,2);
  const [,loopFrom,loopTo]=plan.COUNT_LOOPS;
  const journeyPath=band(line([loopFrom,[loopFrom[0],loopTo[1]],loopTo],{radius:.7}),.2);
  journey.add(new THREE.Mesh(journeyPath.geometry,flat(TEAL,.9)));
  // DATEX II: the loops counting the traffic, ringed so they read at
  // their size, since a loop is smaller than a car.
  const atLoops=layer(world,.13,4);
  const loopBeacons=plan.COUNT_LOOPS.map(([x,z],i)=>beacon(atLoops,.8,.8,[x,z],i/3));
  // TIDES and GTFS-ride: the passengers counted at each stop.
  const atStops=layer(world,.13,4);
  const stopBeacons=plan.STOPS.map((stop,i)=>beacon(atStops,2,.75,[stop.x,stop.z],i/2));
  // GBFS: a shared bike's reported place.
  const onCycle=layer(world,.13,4),cycleBeacon=beacon(onCycle,.72,.72);
  // Curb Data Specification: the rules of the kerb along the lay-by, which
  // bays are for how long and when.
  const kerb=layer(world,.12,2);
  {
    const x0=6.7,x1=8.2,z0=-2.2,z1=2.2;
    rect(kerb,x0,z0,x1,z1,flat(ORANGE,.16));
    stroke(kerb,[[x0,z0],[x1,z0],[x1,z1],[x0,z1]],.12,flat(ORANGE,1),{closed:true,radius:.15});
    plan.BAYS.zs.slice(1).forEach(z=>rect(kerb,x0+.15,z-.5-.04,x1-.15,z-.5+.04,flat(ORANGE,.8)));
  }
  // OCPI: a charging post on the pavement at the south end of the bays, where
  // the tall building beside them does not hide it, its cable to the car in
  // the last bay.
  const CHARGER=[8.8,2.2];
  const charger=layer(world,0,3);
  {
    const lit=color=>{const material=new THREE.MeshLambertMaterial({color,transparent:true,opacity:1});lineMaterials.push(material);return material;};
    const [x,z]=CHARGER;
    const post=charger.add(new THREE.Mesh(own(new THREE.BoxGeometry(.22,.78,.18)),lit(INK)));post.position.set(x,.49,z);
    const screen=charger.add(new THREE.Mesh(own(new THREE.BoxGeometry(.03,.2,.13)),lit('#2fbf71')));screen.position.set(x-.12,.66,z);
    const cable=new THREE.QuadraticBezierCurve3(new THREE.Vector3(x-.1,.42,z-.05),new THREE.Vector3(x-.45,.02,z-.25),new THREE.Vector3(plan.BAYS.x+.35,.32,plan.BAYS.zs[3]));
    charger.add(new THREE.Mesh(own(new THREE.TubeGeometry(cable,20,.028,5,false)),lit(INK)));
    const foot=charger.add(new THREE.Mesh(ring,flat(TEAL,.9)));foot.scale.setScalar(.42);foot.position.set(x,.13,z);
  }
  // Open Matrix: the trips between zones, each arc as thick as its flow, and
  // lower than a day's trips so the city stays in view under them.
  const matrix=layer(world,0,2);
  const FLOWS=[[2,4,.07],[8,3,.06],[7,4,.05],[0,5,.045],[6,1,.04],[5,7,.035],[2,6,.03]];
  FLOWS.forEach(([a,b,width])=>{
    const [ax,az]=zoneCentres[a],[bx,bz]=zoneCentres[b],length=Math.hypot(bx-ax,bz-az);
    const curve=new THREE.QuadraticBezierCurve3(new THREE.Vector3(ax,.4,az),new THREE.Vector3((ax+bx)/2,1+length*.14,(az+bz)/2),new THREE.Vector3(bx,.4,bz));
    matrix.add(new THREE.Mesh(own(new THREE.TubeGeometry(curve,ARC_STEPS,width,ARC_SIDES,false)),flat(INK,.7)));
    [ax,bx].forEach((x,i)=>{const end=matrix.add(new THREE.Mesh(disc,flat(INK,.7)));end.scale.setScalar(width*3);end.position.set(x,.14,i?bz:az);});
  });
  // GeoTIFF: the height of the ground, as faint lines round a low rise in the
  // park, kept inside the city's edge.
  const HILL=[3,-1];
  const heights=layer(world,.135,1);
  {
    const lines=[],hw=plan.BOARD.w/2-.2,hd=plan.BOARD.d/2-.2;
    [1.2,2.6,4.2,6,8,10.2,12.6].forEach((r,k)=>{
      let last=null;
      for(let i=0;i<=144;i++){
        const a=i/144*Math.PI*2,w=r*(1+.13*Math.sin(3*a+k*.7)+.06*Math.cos(5*a+k));
        const p=[HILL[0]+Math.cos(a)*w*1.2,HILL[1]+Math.sin(a)*w*.9],inside=Math.abs(p[0])<hw&&Math.abs(p[1])<hd;
        if(last?.inside&&inside)lines.push([last.p[0],last.p[1],p[0],p[1],.07]);
        last={p,inside};
      }
    });
    heights.add(new THREE.Mesh(pieces(lines),flat('#8a6a3c',.6)));
  }
  // The tram and the bike ringed are the ones nearest the middle of the city
  // in view, picked while their ring is hidden and kept while it shows.
  const followed={tram:0,cycle:0};
  const cycles=traffic.movers.filter(m=>m.kind==='cyclist');
  const tramAt=k=>traffic.carriages(traffic.trams[k])[1];
  function nearestInView(count,placeOf){
    const aim=innerWidth<760?.5:.7;
    let best=0,gap=Infinity;
    for(let k=0;k<count;k++){
      const p=placeOf(k),{x,y}=city.project([p.x,0,p.z]);
      const d=Math.abs(x/innerWidth-aim)+(y<0||y>innerHeight?2:0);
      if(d<gap){gap=d;best=k;}
    }
    return best;
  }
  // Where each format's tag stands: over the place its file or feed carries.
  const FORMAT_PLACES={
    osm:[B[7].x,B[7].height+1.3,B[7].z],
    gtfs:[plan.STOPS[0].x,1.2,plan.STOPS[0].z],
    geojson:[zoneCentres[4][0],.5,zoneCentres[4][1]],
    datex:[loopFrom[0],.4,(loopFrom[1]+loopTo[1])/2],
    ridership:[plan.STOPS[1].x,1.2,plan.STOPS[1].z],
    kerb:[8.2,.3,0],
    charging:[CHARGER[0],1.15,CHARGER[1]],
    matrix:[zoneCentres[4][0],2.4,zoneCentres[4][1]],
    elevation:[HILL[0],.4,HILL[1]]
  };
  function formatPlace(name){
    if(name==='realtime'){const p=tramAt(followed.tram);return [p.x,1.3,p.z];}
    if(name==='gbfs'){const p=traffic.place(cycles[followed.cycle]);return [p.x,1,p.z];}
    return FORMAT_PLACES[name];
  }

  // Sets everything for one frame. Each value is how much of it is shown,
  // 0 to 1, unless it says otherwise.
  //   zones, survey (how far the row has run) and surveyShown, loops, seam {x, glow}
  //   light: how far the zones and the loops have turned light over numbers
  //   formats {route, realtime, counts, datex, ridership, gbfs, kerb,
  //     charging, matrix, elevation}, and journey: how far the journey line
  //     is drawn
  //   pens: three of {progress, shown}
  //   day {shown, hour, residents: how many batches of doors are out, 0 to 4}
  //   results: nine
  //   changes
  function update(state,dt){
    zones.set(state.zones||0);
    const light=state.light||0;
    zoneFill.color.copy(zoneInk).lerp(zoneLight,light);zoneDashes.color.copy(zoneFill.color);
    loopFrame.color.copy(loopInk).lerp(zoneLight,light);
    const asked=state.survey||0,shown=asked>0?state.surveyShown??1:0;
    survey.set(shown);surveyDay.set(shown);
    surveyRings.forEach((mesh,i)=>mesh.scale.setScalar(mesh.userData.r*grow(asked,i*.02,.14)));
    surveyLegs.forEach((leg,i)=>{
      const drawn=grow(asked,LEG_AT+i*LEG_SPAN,LEG_SPAN);
      leg.mesh.visible=drawn>0;leg.geometry.setDrawRange(0,6*Math.floor((leg.points.length-1)*drawn));
    });
    surveyStops.forEach((mesh,i)=>{mesh.visible=asked>=LEG_AT+i*LEG_SPAN;});
    faintDays.forEach((day,i)=>{
      const drawn=grow(asked,.3+i*.06,.4);
      day.mesh.visible=drawn>0;day.geometry.setDrawRange(0,6*Math.floor((day.points.length-1)*drawn));
    });
    loopsLayer.set(state.loops||0);
    if(state.loops>0)loops.forEach(loop=>{
      const covered=traffic.movers.some(m=>{
        if(m.kind!=='car'||m.state!=='drive')return false;
        const p=traffic.place(m);
        return loop.alongZ?Math.abs(p.x-loop.x)<.4&&Math.abs(p.z-loop.z)<.5:Math.abs(p.z-loop.z)<.4&&Math.abs(p.x-loop.x)<.5;
      });
      loop.flash=covered?1:Math.max(0,loop.flash-dt*2.5);
      loop.light.color.copy(dim).lerp(bright,loop.flash);
    });
    const glow=state.seam?.glow||0;
    seam.set(glow);if(glow>0)seamLine.position.x=state.seam.x;
    const marks=state.formats||{},time=city.hero.time;
    if(!(marks.realtime>0))followed.tram=nearestInView(traffic.trams.length,tramAt);
    if(!(marks.gbfs>0))followed.cycle=nearestInView(cycles.length,k=>traffic.place(cycles[k]));
    route.set(marks.route||0);
    onTram.set(marks.realtime||0);
    if(marks.realtime>0){
      const p=tramAt(followed.tram);
      tramBeacon.at.position.set(p.x,0,p.z);tramBeacon.at.rotation.y=-Math.atan2(p.hz,p.hx);
    }
    swell(tramBeacon,marks.realtime||0,time);
    journey.set(marks.datex||0);
    if(marks.datex>0)journeyPath.geometry.setDrawRange(0,6*Math.floor((journeyPath.points.length-1)*(state.journey??1)));
    atLoops.set(marks.counts||0);
    loopBeacons.forEach(b=>swell(b,marks.counts||0,time));
    atStops.set(marks.ridership||0);
    stopBeacons.forEach(b=>swell(b,marks.ridership||0,time));
    onCycle.set(marks.gbfs||0);
    if(marks.gbfs>0){const p=traffic.place(cycles[followed.cycle]);cycleBeacon.at.position.set(p.x,0,p.z);}
    swell(cycleBeacon,marks.gbfs||0,time);
    kerb.set(marks.kerb||0);
    charger.set(marks.charging||0);
    matrix.set(marks.matrix||0);
    heights.set(marks.elevation||0);
    pens.forEach((pen,k)=>{
      const {progress=0,shown=0}=state.pens?.[k]||{};
      pen.set.set(shown);if(shown>0)drawTo(pen,progress);
      if(k===2)corners.forEach(c=>{c.mesh.visible=progress>=c.at;});
    });
    const day=state.day||{shown:0};
    const out=day.shown>0?day.residents??4:0,atDoor=day.hour<6.4||day.hour>21;
    residents.forEach(r=>r.set.set(day.shown*(atDoor&&r.batch<out?1:0)));
    dayArcs.set(day.shown*(day.hour>6&&day.hour<21.5?1:0));
    travellers.set(day.shown);
    if(day.shown>0)TRIPS.forEach((trip,i)=>{
      const u=onTheWay(trip,day.hour);dots[i].visible=u!==null;
      if(u!==null)dots[i].position.copy(curves[i].getPoint(u));
    });
    results.forEach((set,i)=>set.set(state.results?.[i]||0));
    changes.set(state.changes||0);
  }
  return {update,tip,TAGS,formatPlace};
}

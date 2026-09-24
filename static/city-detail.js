// The authored detail the one city carries, in the language the removed Sofia
// illustration guide was drawn in: facades with an entrance, sills, balconies and a stepped cornice;
// three roof forms; a small house with a door and a garden; street furniture
// along the greenway, in the park and at the shelters; kerbs, crossings and
// bay markings; a pond; conifers; and people who carry, sit and wait. Every
// piece is flat-shaded geometry in the page's palette, built with the city
// kit's own box, mesh and group so the number skin reaches it at the end.
export function createCityDetail({THREE, kit, palette, crownGeometry}) {
  const {box, mesh, group, own} = kit;
  const trim='#f8f0d7', plinth='#c4ccb6', glass='#587366', post='#8c9070', kerbColor='#ecdec0',
    paint='#ffffff', lane='#c4ccb6', water='#97b7a1', deck='#d9dfc2';

  // ---- Geometry the kit does not carry --------------------------------------
  const unit=own(new THREE.BoxGeometry(1,1,1));
  const gable=own(new THREE.BufferGeometry());
  gable.setAttribute('position',new THREE.Float32BufferAttribute([
    -.5,0,-.5,.5,0,-.5,0,.42,-.5, -.5,0,.5,0,.42,.5,.5,0,.5,
    -.5,0,-.5,0,.42,-.5,0,.42,.5, -.5,0,-.5,0,.42,.5,-.5,0,.5,
    .5,0,-.5,.5,0,.5,0,.42,.5, .5,0,-.5,0,.42,.5,0,.42,-.5
  ],3));
  gable.computeVertexNormals();
  // A low folded roof: four facets rising to a small flat top.
  const hip=own(new THREE.CylinderGeometry(Math.SQRT1_2*.46,Math.SQRT1_2,1,4));
  hip.rotateY(Math.PI/4);hip.translate(0,.5,0);
  const archShape=new THREE.Shape();
  archShape.moveTo(-.17,0);archShape.lineTo(.17,0);archShape.lineTo(.17,.3);
  archShape.absarc(0,.3,.17,0,Math.PI,false);archShape.closePath();
  const arch=own(new THREE.ExtrudeGeometry(archShape,{depth:.05,bevelEnabled:false,steps:1,curveSegments:5}));
  const disc=own(new THREE.CylinderGeometry(1,1,1,12));
  const heptagon=own(new THREE.CylinderGeometry(1,1,1,7));
  const cone=own(new THREE.ConeGeometry(1,1,6));
  const trunkGeometry=own(new THREE.CylinderGeometry(.05,.08,1,5));

  // Many small boxes of one colour on one building become one mesh, so a
  // facade of forty windows and sills costs one draw rather than eighty.
  function merged(parent,color,boxes){
    const positions=[],normals=[],index=[];
    const m=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3(),p=new THREE.Vector3();
    boxes.forEach(([w,h,d,x,y,z])=>{
      const g=unit.clone();
      m.compose(p.set(x,y,z),q,s.set(w,h,d));g.applyMatrix4(m);
      const base=positions.length/3;
      positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);
      for(const i of g.index.array)index.push(i+base);
      g.dispose();
    });
    const geometry=own(new THREE.BufferGeometry());
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    geometry.setIndex(index);
    return mesh(parent,geometry,color);
  }

  // ---- Buildings --------------------------------------------------------------
  // A facade group whose local +z points out of the wall, so a door, a sill
  // or a balcony is placed the same way whichever side it is on.
  const sides={
    south:(w,d)=>({x:0,z:d/2,turn:0,width:w}),north:(w,d)=>({x:0,z:-d/2,turn:Math.PI,width:w}),
    east:(w,d)=>({x:w/2,z:0,turn:Math.PI/2,width:d}),west:(w,d)=>({x:-w/2,z:0,turn:-Math.PI/2,width:d})
  };
  function facade(g,side,w,d){
    const s=sides[side](w,d),f=group(g,s.x,0,s.z);f.rotation.y=s.turn;return {f,width:s.width};
  }
  function entrance(f){
    box(f,.46,.64,.06,0,.32,.01,trim);
    box(f,.3,.52,.03,0,.27,.045,palette.ink);
    box(f,.035,.035,.03,.09,.28,.06,palette.gold);
    box(f,.62,.05,.36,0,.025,.2,plinth);
    box(f,.5,.05,.24,0,.075,.14,plinth);
    box(f,.78,.05,.42,0,.8,.17,trim);
    for(const s of [-1,1])box(f,.035,.3,.035,s*.34,.63,.35,post);
  }
  function balcony(f,u,y,bars){
    bars.push([.5,.05,.28,u,y-.18,.14]);
    box(f,.2,.42,.025,u,y+.03,.02,glass);
    for(const s of [-1,1])box(f,.03,.26,.03,u+s*.23,y-.04,.26,palette.ink);
    box(f,.5,.025,.025,u,y+.08,.26,palette.ink);
    box(f,.5,.02,.02,u,y-.06,.26,palette.ink);
  }
  // The number city at the end of the page draws a glowing line along a
  // building's outer form and nowhere else. A roof mesh marked `contour` gives
  // its own edges; `contours` on the building's group lists the rest as rings
  // (a rectangle at one height), posts (the four corners) and boxes, all in
  // the group's own space. Windows, sills and trims are left out on purpose.
  const roofs={
    gable(g,w,d,h,color){
      const r=mesh(g,gable,color,0,h,0);r.scale.set(w+.23,w*.72,d+.2);r.userData.contour=true;
      box(g,.22,.5,.26,w*.24,h+.3,-d*.2,trim);
    },
    hip(g,w,d,h,color){
      const rise=Math.min(w,d)*.4;
      const r=mesh(g,hip,color,0,h,0);r.scale.set(w+.26,rise,d+.24);r.userData.contour=true;
      box(g,(w+.26)*.46,.06,(d+.24)*.46,0,h+rise,0,color);
      box(g,.22,.42,.26,-w*.2,h+.28,d*.16,trim);
    },
    flat(g,w,d,h,color){
      box(g,w+.02,.08,d+.02,0,h+.04,0,deck);
      for(const s of [-1,1]){box(g,w+.22,.2,.1,0,h+.12,s*(d/2+.06),trim);box(g,.1,.2,d+.22,s*(w/2+.06),h+.12,0,trim);}
      g.userData.contours.push(['ring',w+.22,d+.22,0,h+.22,0],['box',.8,.5,.7,-w*.18,h+.33,d*.08]);
      box(g,.8,.5,.7,-w*.18,h+.33,d*.08,palette.stone);
      const r=mesh(g,gable,color,-w*.18,h+.58,d*.08);r.scale.set(.95,.5,.85);r.userData.contour=true;
      const tank=mesh(g,disc,color,w*.26,h+.4,-d*.22);tank.scale.set(.2,.34,.2);
      for(const s of [-1,1])box(g,.04,.22,.04,w*.26+s*.12,h+.18,-d*.22,palette.ink);
    }
  };
  // A building: an ivory block on a plinth with a string course over the
  // ground floor and a stepped cornice under the roof; windows with sills on
  // every face; on the side that meets the street an entrance with two steps
  // and a canopy, arched openings either side of it, and on some buildings
  // balconies on alternate floors.
  function building(parent,{x,z,w,d,height,color,roof='gable',door='south',balconies=null}){
    const g=group(parent,x,.08,z);g.userData.building=true;
    g.userData.contours=[['ring',w+.08,d+.08,0,.14,0],['posts',w,d,0,.14,height,0]];
    box(g,w,height,d,0,height/2,0);
    box(g,w+.08,.14,d+.08,0,.07,0,plinth);
    box(g,w+.06,.05,d+.06,0,.68,0,trim);
    box(g,w+.13,.11,d+.13,0,height-.04,0,trim);
    box(g,w+.22,.07,d+.22,0,height+.04,0,trim);
    const rows=Math.floor(height/.64);
    for(const side of ['south','north','east','west']){
      const {f,width}=facade(g,side,w,d),cols=side==='south'||side==='north'?3:2;
      const spread=cols===3?width*.29:width*.28;
      const panes=[],sills=[];
      for(let row=0;row<rows;row++){
        const y=.42+row*.64;
        for(let c=0;c<cols;c++){
          const u=cols===3?(c-1)*spread:(c?spread:-spread);
          if(row===0&&side===door){
            if(cols===3&&c===1)continue;
            const a=mesh(f,arch,glass,u,.14,-.01);a.scale.set(1.1,1.1,1);continue;
          }
          if(row>0&&row%2===1&&balconies===side&&(cols===2||c!==1)){balcony(f,u,y,sills);continue;}
          panes.push([.17,.3,.025,u,y,.02]);sills.push([.24,.035,.07,u,y-.17,.035]);
        }
      }
      merged(f,glass,panes);merged(f,trim,sills);
      if(side===door)entrance(f);
    }
    roofs[roof](g,w,d,height,color);
    return g;
  }
  // The home the accessibility view starts from: a low house with a gable
  // roof, a door with a step and a lamp beside it, a path to the pavement, a
  // fence round the front garden and a small tree in it.
  function home(parent,{x,z,w,d,height,color,door,path}){
    const g=building(parent,{x,z,w,d,height,color,roof:'gable',door,balconies:null});
    const {f}=facade(g,door,w,d);
    box(f,.05,.55,.05,-.36,.5,.3,post);box(f,.1,.08,.1,-.36,.8,.3,palette.gold);
    box(f,.5,.02,path,0,.005,path/2,trim);
    const fence=path-.05;
    for(const s of [-1,1]){
      for(let i=0;i<=5;i++)box(f,.05,.3,.05,s*(.4+i*.3),.15,fence,trim);
      box(f,1.55,.03,.03,s*1.15,.26,fence,trim);
    }
    for(const s of [-1,1])for(let i=0;i<=2;i++)box(f,.05,.3,.05,s*1.9,.15,fence-.3*i,trim);
    return g;
  }

  // ---- Trees ---------------------------------------------------------------------
  function conifer(parent,x,z,size=1,color=palette.forest){
    const g=group(parent,x,.1,z);
    mesh(g,trunkGeometry,post,0,.45,0);
    const crown=group(g,0,.7,0);
    const a=mesh(crown,cone,color,0,.6,0);a.scale.set(.55,1.3,.55);
    const b=mesh(crown,cone,color,0,1.3,0);b.scale.set(.42,1.05,.42);
    const c=mesh(crown,cone,palette.leaf,.02,1.95,0);c.scale.set(.27,.8,.27);
    g.scale.setScalar(size);
    return {group:g,crown,size,phase:x*.3+z*.13};
  }

  // ---- Street furniture -------------------------------------------------------
  function lamp(parent,x,z,turn=0){
    const g=group(parent,x,.08,z);g.rotation.y=turn;
    box(g,.07,1.55,.07,0,.78,0,post);box(g,.34,.05,.05,.15,1.53,0,post);
    box(g,.18,.11,.15,.3,1.47,0,palette.gold);
    return g;
  }
  // A bench faces its local +z; its back stands on the -z side.
  function bench(parent,x,z,turn=0){
    const g=group(parent,x,.08,z);g.rotation.y=turn;
    box(g,.9,.06,.32,0,.42,.02,palette.copper);
    box(g,.9,.26,.05,0,.6,-.14,palette.copper);
    for(const s of [-1,1])box(g,.06,.4,.28,s*.38,.2,0,palette.ink);
    return g;
  }
  function planter(parent,x,z){
    const g=group(parent,x,.08,z);
    box(g,.62,.34,.62,0,.17,0,kerbColor);
    const crown=mesh(g,crownGeometry,palette.leaf,0,.62,0);crown.scale.set(.28,.36,.26);
    return g;
  }
  function kiosk(parent,x,z,turn=0){
    const g=group(parent,x,.08,z);g.rotation.y=turn;
    box(g,1.1,1,.9,0,.5,0,palette.stone);
    box(g,1.18,.06,.98,0,1.0,0,trim);
    const r=mesh(g,hip,palette.forest,0,1.03,0);r.scale.set(1.24,.34,1.04);
    box(g,.7,.34,.03,0,.66,.46,glass);
    box(g,1.16,.07,.2,0,.48,.52,trim);
    const awning=box(g,1.2,.035,.5,0,.98,.66,palette.coral);awning.rotation.x=.28;
    return g;
  }
  function stopSign(parent,x,z,turn=0){
    const g=group(parent,x,.08,z);g.rotation.y=turn;
    box(g,.05,1.5,.05,0,.75,0,post);
    const face=mesh(g,disc,palette.gold,0,1.42,0);face.scale.set(.2,.03,.2);face.rotation.x=Math.PI/2;
    const dot=mesh(g,disc,palette.ink,0,1.42,.02);dot.scale.set(.11,.03,.11);dot.rotation.x=Math.PI/2;
    box(g,.3,.4,.03,0,1.0,0,trim);
    box(g,.2,.03,.035,0,1.12,.005,palette.ink);box(g,.2,.03,.035,0,1.02,.005,palette.ink);box(g,.14,.03,.035,-.03,.92,.005,palette.ink);
    return g;
  }
  function meter(parent,x,z,turn=0){
    const g=group(parent,x,.08,z);g.rotation.y=turn;
    box(g,.05,.95,.05,0,.47,0,post);
    box(g,.2,.3,.13,0,1.05,0,palette.gold);
    box(g,.13,.1,.02,0,1.09,.07,palette.ink);
    return g;
  }
  // Two lines round a bay's ends and its outer edge, painted on the road.
  function bayLines(g){
    box(g,.035,.012,.46,-.3,.02,0,kerbColor).castShadow=false;
    box(g,.035,.012,.46,.3,.02,0,kerbColor).castShadow=false;
    box(g,.62,.012,.035,0,.02,.22,kerbColor).castShadow=false;
  }
  // A crossing across a road that runs along local x: five stripes lying the
  // way the traffic goes, side by side across the road's width.
  function crossing(parent,x,z,turn=0,width=1.8){
    const g=group(parent,x,.083,z);g.rotation.y=turn;
    const n=5,step=width/n;
    for(let i=0;i<n;i++)box(g,.6,.012,step*.55,0,0,-width/2+step*(i+.5),paint).castShadow=false;
    return g;
  }
  function stopLine(parent,x,z,turn=0,width=1.8){
    const g=group(parent,x,.083,z);g.rotation.y=turn;
    box(g,.08,.012,width,0,0,0,paint).castShadow=false;return g;
  }
  // A kerb along one edge of a road: a low lip a shade darker than the
  // pavement, running along local x.
  function kerb(parent,x,z,length,turn=0){
    const g=group(parent,x,.075,z);g.rotation.y=turn;
    box(g,length,.05,.09,0,0,0,kerbColor).castShadow=false;return g;
  }
  function dashes(parent,x,z,length,turn=0){
    const g=group(parent,x,.083,z);g.rotation.y=turn;
    for(let u=-length/2+.4;u<length/2-.4;u+=1.3)box(g,.55,.012,.05,u,0,0,lane).castShadow=false;
    return g;
  }
  // The park's pond: an ivory rim, water a step below the grass, a small
  // wooden deck on one side.
  function pond(parent,x,z,rx,rz){
    const g=group(parent,x,.1,z);
    const rim=mesh(g,heptagon,trim,0,.01,0);rim.scale.set(rx+.16,.04,rz+.16);rim.rotation.y=.3;
    const pool=mesh(g,heptagon,water,0,.02,0);pool.scale.set(rx,.04,rz);pool.rotation.y=.3;pool.castShadow=false;
    box(g,.9,.06,.55,-rx+.15,.07,.15,palette.copper);
    for(const s of [-1,1])box(g,.05,.1,.05,-rx+.15+s*.4,.02,.4,post);
    return g;
  }

  // ---- People ---------------------------------------------------------------
  // A person who reads as one at close range: legs in dark trousers, a
  // jacket, a neck, a head with hair, and arms with hands that swing against
  // the legs as they walk. The jacket's colour comes from the phase, so a
  // crowd is not one colour.
  const headGeometry=own(new THREE.SphereGeometry(.09,7,5));
  const outfits=[palette.copper,palette.forest,palette.mint,palette.gold,palette.ink];
  function person(parent,phase=0){
    const g=group(parent),coat=outfits[Math.abs(Math.round(phase))%outfits.length];
    const legs=[-.05,.05].map(x=>{
      const pivot=group(g,x,.26,0);
      box(pivot,.07,.26,.07,0,-.13,0,palette.ink);
      box(pivot,.08,.03,.1,0,-.265,.012,palette.ink);
      return pivot;
    });
    box(g,.2,.27,.11,0,.39,0,coat);
    box(g,.24,.05,.12,0,.53,0,coat);
    box(g,.05,.05,.05,0,.57,0,'#b99a76');
    mesh(g,headGeometry,'#b99a76',0,.65,0);
    const hair=mesh(g,headGeometry,palette.ink,0,.675,-.015);hair.scale.set(.98,.72,.98);
    const arms=[-.145,.145].map(x=>{
      const pivot=group(g,x,.53,0);
      box(pivot,.055,.24,.055,0,-.12,0,coat);
      box(pivot,.05,.05,.05,0,-.26,0,'#b99a76');
      return pivot;
    });
    return {group:g,legs,arms,phase};
  }
  // Something carried: a bag at the hand, a pack on the back, a hat.
  function carry(p,kind){
    const g=p.group;
    if(kind==='bag')box(p.arms[1],.1,.14,.07,.02,-.32,.02,palette.gold);
    else if(kind==='pack')box(g,.16,.2,.08,0,.42,-.1,palette.copper);
    else if(kind==='case')box(p.arms[0],.08,.2,.14,-.02,-.36,0,palette.ink);
    else if(kind==='hat'){const brim=mesh(g,disc,palette.ink,0,.7,0);brim.scale.set(.12,.02,.12);const crown=mesh(g,disc,palette.ink,0,.74,0);crown.scale.set(.075,.07,.075);}
    return p;
  }
  // A person sat on a bench: the legs swing forward, the hands rest on the
  // knees, and the body sits at the seat's height, facing the way the bench
  // faces.
  function seated(parent,phase,x=0){
    const p=person(parent,phase);
    p.group.position.set(x,.2,.1);
    p.legs.forEach(leg=>{leg.rotation.x=-Math.PI/2;});
    p.arms.forEach(arm=>{arm.rotation.x=-.6;});
    return p;
  }
  // Arms and legs swing against each other at a walking pace.
  function stride(p,time,speed=7,swing=.35){
    p.legs.forEach((leg,k)=>{leg.rotation.x=Math.sin(time*speed+p.phase+k*Math.PI)*swing;});
    p.arms.forEach((arm,k)=>{arm.rotation.x=-Math.sin(time*speed+p.phase+k*Math.PI)*swing*.8;});
  }

  return {building,home,conifer,lamp,bench,planter,kiosk,stopSign,meter,bayLines,crossing,stopLine,kerb,dashes,pond,person,carry,seated,stride,merged};
}

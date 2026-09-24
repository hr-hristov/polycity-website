// Shared authored geometry keeps every Polycity chapter in the same visual language.
export const palette = {
  paper: '#f6f7fb', stone: '#f0f2f8', stoneShadow: '#d1d9e6',
  mint: '#a2bbcf', forest: '#4a7b79', leaf: '#7aa69a', lime: '#b2c4a2',
  copper: '#cf826f', coral: '#ed653e', gold: '#eabc47', ink: '#233661',
  road: '#d0d8e4', grass: '#bed0bd', water: '#7bc5d6', night: '#101639',
};

export function foldedCrown(THREE) {
  const rings = [[-1,.045,-.12],[-.62,.69,-.19],[.02,.9,0],[.67,.61,.2],[1.12,.025,.12]];
  const points = [], faces = [], sides = 7;
  rings.forEach(([y,radius,offset], level) => {
    for (let i = 0; i < sides; i++) {
      const a = i / sides * Math.PI * 2 + (level % 2) * .11;
      points.push(Math.cos(a) * radius + offset, y, Math.sin(a) * radius * .77);
      if (level < rings.length - 1) {
        const a0 = level * sides + i, a1 = level * sides + (i + 1) % sides;
        faces.push(a0,a0+sides,a1,a1,a0+sides,a1+sides);
      }
    }
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  geometry.setIndex(faces);
  geometry.computeVertexNormals();
  return geometry;
}

export function createCityKit({ THREE, crownGeometry, palette }) {
  const stages = [], materials = new Map(), ownedGeometry = new Set();
  let sharedRenderer = null, dropTexture = null;
  const unitBox = own(new THREE.BoxGeometry(1, 1, 1));
  const trunkGeometry = own(new THREE.CylinderGeometry(.055, .085, 1.2, 5));
  const headGeometry = own(new THREE.SphereGeometry(.1, 6, 4));
  const bodyGeometry = own(new THREE.CylinderGeometry(.06, .085, .3, 5));
  const roofGeometry = own(new THREE.BufferGeometry());
  roofGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -.5,0,-.5,.5,0,-.5,0,.42,-.5, -.5,0,.5,0,.42,.5,.5,0,.5,
    -.5,0,-.5,0,.42,-.5,0,.42,.5, -.5,0,-.5,0,.42,.5,-.5,0,.5,
    .5,0,-.5,.5,0,.5,0,.42,.5, .5,0,-.5,0,.42,.5,0,.42,-.5
  ], 3));
  roofGeometry.computeVertexNormals();
  function own(geometry) { ownedGeometry.add(geometry); return geometry; }
  function mat(color) {
    color = palette.surfaces?.[color] ?? color;
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({
      color, roughness: 1, metalness: 0, flatShading: true, side: THREE.DoubleSide
    }));
    return materials.get(color);
  }
  function mesh(parent, geometry, color, x=0, y=0, z=0) {
    const m = new THREE.Mesh(geometry, mat(color));
    m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
  }
  function box(parent,w,h,d,x,y,z,color=palette.stone) {
    const m=mesh(parent,unitBox,color,x,y,z);m.scale.set(w,h,d);return m;
  }
  function group(parent,x=0,y=0,z=0) {
    const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;
  }
  function house(parent,x,z,w=2.3,d=2.6,height=2.1,color=palette.copper) {
    const g=group(parent,x,.08,z);
    g.userData.building=true;
    box(g,w,height,d,0,height/2,0);
    box(g,w+.13,.12,d+.13,0,height-.03,0,'#f8f0d7');
    box(g,w+.08,.12,d+.08,0,.07,0,'#c4ccb6');
    const roof=mesh(g,roofGeometry,color,0,height,0);roof.scale.set(w+.23,w*.72,d+.2);
    for(let row=0;row<Math.floor(height/.64);row++){
      for(let col=-1;col<=1;col++){
        box(g,.17,.3,.025,col*w*.29,.42+row*.64,d/2+.02,'#587366');
        box(g,.17,.3,.025,col*w*.29,.42+row*.64,-d/2-.02,'#587366');
      }
      for(const side of [-1,1])for(const offset of [-.28,.28]){
        box(g,.025,.3,.18,side*(w/2+.02),.42+row*.64,d*offset,'#587366');
      }
    }
    return g;
  }
  function tree(parent,x,z,size=1,color=palette.forest) {
    const g=group(parent,x,.1,z);
    const trunk=mesh(g,trunkGeometry,'#8c9070',0,.6,0);
    const crown=group(g,0,1.03,0);
    const main=mesh(crown,crownGeometry,color,0,.85,0);main.scale.set(.8,1.3,.76);
    const side=mesh(crown,crownGeometry,palette.leaf,.42,.4,.07);side.scale.set(.57,.83,.6);
    g.scale.setScalar(size);
    return {group:g,crown,trunk,size,phase:x*.3+z*.13};
  }
  function person(parent,phase) {
    const g=group(parent);
    mesh(g,headGeometry,'#b99a76',0,.55,0);
    mesh(g,bodyGeometry,phase%2 ? palette.copper : palette.forest,0,.33,0);
    const legs=[-.055,.055].map(x=>{
      const pivot=group(g,x,.21,0);
      box(pivot,.055,.22,.055,0,-.105,0,palette.ink);return pivot;
    });
    return {group:g,legs,phase};
  }
  function tram(parent) {
    const parts=[];
    for(let i=0;i<3;i++){
      const g=group(parent,0,.12,0);
      box(g,1.42,.61,.65,0,.45,0,palette.gold);
      box(g,1.47,.1,.7,0,.82,0,'#f5efd4');
      box(g,1.18,.25,.672,0,.57,0,palette.ink);
      for(const x of [-.44,0,.44])box(g,.07,.29,.69,x,.57,0,palette.gold);
      box(g,1.1,.12,.48,0,.11,0,palette.ink);
      parts.push(g);
    }
    return parts;
  }
  // A soft round darkening the city can sit on, so the model meets a ground
  // instead of ending at the edge of its own base plate.
  function drop() {
    if(dropTexture)return dropTexture;
    const size=192,surface=document.createElement('canvas');
    surface.width=surface.height=size;
    const paint=surface.getContext('2d');
    const shade=paint.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
    shade.addColorStop(0,'rgba(11,28,63,.38)');
    shade.addColorStop(.5,'rgba(11,28,63,.17)');
    shade.addColorStop(1,'rgba(11,28,63,0)');
    paint.fillStyle=shade;paint.fillRect(0,0,size,size);
    dropTexture=new THREE.CanvasTexture(surface);
    dropTexture.colorSpace=THREE.SRGBColorSpace;
    return dropTexture;
  }

  // The ground every city stands on: the sun's shadow lands beside the base
  // plate, and a soft round spreads out under it.
  function ground(view, { spread=2.4, lift=.002 }={}) {
    view.world.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(view.world);
    const width=Math.max(bounds.max.x-bounds.min.x,bounds.max.z-bounds.min.z);
    const floor=bounds.min.y+lift;
    const plane=own(new THREE.PlaneGeometry(1,1));
    const catcher=new THREE.Mesh(plane,new THREE.ShadowMaterial({opacity:.19}));
    catcher.rotation.x=-Math.PI/2;catcher.position.y=floor;
    catcher.scale.set(width*spread,width*spread,1);
    catcher.receiveShadow=true;view.scene.add(catcher);
    const contact=new THREE.Mesh(plane,new THREE.MeshBasicMaterial({
      map:drop(),transparent:true,depthWrite:false
    }));
    contact.rotation.x=-Math.PI/2;contact.position.set(
      (bounds.min.x+bounds.max.x)/2,floor+.001,(bounds.min.z+bounds.max.z)/2
    );
    contact.scale.set(width*1.5,width*1.5,1);
    view.scene.add(contact);
    view.groundMeshes=[catcher,contact];
    return catcher;
  }

  // Point a stage's camera at one place in its city, from one direction, with
  // one width of city in frame. Every camera move on the page is two of these
  // read against each other.
  function frame(view, target, span, direction) {
    const aim=target.isVector3 ? target : new THREE.Vector3(...target);
    const from=direction.isVector3 ? direction : new THREE.Vector3(...direction);
    view.camera.position.copy(aim).addScaledVector(from.clone().normalize(),46);
    view.camera.lookAt(aim);
    const aspect=(view.canvas.clientWidth||1)/(view.canvas.clientHeight||1);
    // span is how much city stands across the frame. A tall frame keeps the
    // same width and gains height; a wide one keeps the city's own proportion.
    const half=Math.max(span*.56,span/Math.max(aspect,.3))/2;
    Object.assign(view.camera,{left:-half*aspect,right:half*aspect,top:half,bottom:-half});
    view.camera.updateProjectionMatrix();
    if(view.scene.fog){view.scene.fog.near=46-span*.42;view.scene.fog.far=Math.min(97,46+span*1.4);}
  }

  function stage(selector, span, target=[0,.8,0]) {
    const host=document.querySelector(selector),canvas=host.querySelector('canvas');
    const context=palette.sharedRenderer ? canvas.getContext('2d') : null;
    let renderer;
    try {
      renderer=sharedRenderer || new THREE.WebGLRenderer({
        canvas:palette.sharedRenderer ? document.createElement('canvas') : canvas,
        alpha:true,antialias:true,powerPreference:'low-power'
      });
      if(palette.sharedRenderer)sharedRenderer=renderer;
    } catch(error) {
      host.dataset.renderState='error';
      host.querySelector('.story-loading').textContent='The illustration could not open. Reload to try again.';
      throw error;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
    renderer.setClearColor(0,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const scene=new THREE.Scene(),world=group(scene);
    // Haze at the far end of the model, so the city has depth rather than
    // ending abruptly at the back row of roofs. Only a palette that names its
    // own haze asks for it; the other chapters keep their flat air.
    if(palette.haze)scene.fog=new THREE.Fog(palette.haze,30,88);
    const sky=new THREE.HemisphereLight('#fffdf2','#9aaf9a',1.75);scene.add(sky);
    const sun=new THREE.DirectionalLight('#fff6df',2.1);sun.position.set(-12,24,12);sun.castShadow=true;
    sun.shadow.mapSize.set(1024,1024);
    Object.assign(sun.shadow.camera,{left:-18,right:18,top:18,bottom:-18,near:1,far:60});
    sun.shadow.normalBias=.04;sun.shadow.bias=-.0002;scene.add(sun);
    const camera=new THREE.OrthographicCamera(-15,15,15,-15,.1,100);
    camera.position.set(17,20,23);camera.lookAt(...target);
    // The lights are handed back, so a page can move the sun through a day.
    const s={host,canvas,renderer,scene,world,camera,lights:{sky,sun},time:0,visible:false,lost:false,span,frame:0,dirty:true,update:null};
    // Every frame of a shared-renderer stage is copied out of the graphics card
    // and into the page, which costs more the bigger the picture is. A wide
    // stage on a fine screen is held to about two and a half million dots so
    // the copy stays quick enough to watch.
    const density=()=>{
      const r=host.getBoundingClientRect();
      return Math.min(devicePixelRatio,1.5,Math.sqrt(2_500_000/Math.max(1,r.width*r.height)));
    };
    s.render=()=>{
      if(context){
        renderer.setPixelRatio(density());
        renderer.setSize(host.clientWidth,host.clientHeight,false);
        context.clearRect(0,0,canvas.width,canvas.height);
      }
      renderer.render(scene,camera);
      if(context)context.drawImage(renderer.domElement,0,0,canvas.width,canvas.height);
    };
    const resize=()=>{
      const r=host.getBoundingClientRect();if(!r.width||!r.height)return;
      if(context){
        const ratio=density();
        canvas.width=Math.round(r.width*ratio);
        canvas.height=Math.round(r.height*ratio);
      }else renderer.setSize(r.width,r.height,false);
      const half=span/2,aspect=r.width/r.height;
      camera.left=-half*aspect;camera.right=half*aspect;camera.top=half;camera.bottom=-half;camera.updateProjectionMatrix();
      s.dirty=true;
    };
    s.resizeObserver=new ResizeObserver(resize);s.resizeObserver.observe(host);resize();
    renderer.domElement.addEventListener('webglcontextlost',event=>{
      event.preventDefault();s.lost=true;host.dataset.renderState='recovering';
      host.querySelector('.story-loading').textContent='Restoring the illustration.';
    });
    renderer.domElement.addEventListener('webglcontextrestored',()=>{s.lost=false;s.dirty=true;});
    stages.push(s);return s;
  }

  return { stages, own, mat, mesh, box, group, house, tree, person, tram, stage, ground, frame,
    dispose() {
      stages.forEach(s => {
        s.resizeObserver.disconnect();
        (s.groundMeshes||[]).forEach(mesh=>mesh.material.dispose());
      });
      new Set(stages.map(s=>s.renderer)).forEach(renderer=>renderer.dispose());
      ownedGeometry.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
      dropTexture?.dispose(); dropTexture=null;
    }
  };
}

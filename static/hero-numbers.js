// The hero's last act: the three-dimensional city stays exactly where it is,
// camera, tram and walkers included, and its surfaces turn into numbers. Every
// wall, roof, street and tree keeps its shape and takes a skin of glowing
// digits on navy, with columns of digits falling down the faces the way the
// Matrix rain does. A roof or a tree keeps a tint of its own colour in its
// digits, so the city is still the same city, built of numbers.
//
// The digits live in one repeating sheet drawn on a canvas, painted a few
// times a second so the columns fall and the digits flicker. Every material of
// the city is given a few extra lines of shader that read that sheet in world
// space across the surface, so nothing needs texture coordinates and a face
// of any size carries digits of the same size. The strength runs from 0, the
// plain city, to 1, the number city.
//
// The same digits at the same brightness on everything read as one pile of
// numbers, so the buildings are set apart three ways. The ground and the
// streets keep a fraction of the brightness, and trees, cars, people and
// street furniture a larger one. A building's faces each take their own
// brightness by the way they look, and a wall goes dark toward its foot, which
// leaves a seam where it meets the ground. And a glowing line runs along each
// building's body and roof, from the parts the city's detail marks for it.
// Trees, cars, trams, people and street furniture take a finer line of the
// same colour with no glow, so they stay second to the buildings; the streets
// and everything painted on them take none.
//
// How it works turns the city back from numbers one part at a time: the
// streets and buildings, the trams and their stops, the people, then the
// cars. Each part carries its own front, a line across the city from west to
// east; the part is numbers east of its front and real west of it, and a cyan
// seam glows along the front while it moves. A part the page never names is
// real, so the homepage sees none of this.
const CELLS = 16, SHEET = 512;
export const PARTS = ['streets', 'transit', 'people', 'cars'];
// Where a front starts and ends: past the board's west edge, every part of it
// is numbers; past its east edge, every part of it is real.
export const WEST = -15, EAST = 15;
const SOFT = .3;
// How the number city keeps its buildings readable, in one place: the share of
// a building's brightness the ground and the small things keep, and how thick
// a building's outline is, in the city's own units, and how thick the finer
// line round everything else that stands on the ground is.
const LOOK = { ground: .2, small: .5, outline: .04, fine: .02 };

export function createNumberCity(view, { THREE }) {
  const { world } = view;
  const cyan = new THREE.Color('#0ad6ed');
  const navy = new THREE.Color('#000b2d');

  // The sheet of digits. Red carries how bright a digit is, green marks the
  // white head of a falling column.
  const sheet = document.createElement('canvas');
  sheet.width = sheet.height = SHEET;
  const pen = sheet.getContext('2d');
  const cell = SHEET / CELLS;
  const digits = Array.from({ length: CELLS * CELLS }, () => Math.floor(Math.random() * 10));
  const columns = Array.from({ length: CELLS }, () => ({
    at: Math.random() * CELLS * 2 - CELLS,
    speed: 5 + Math.random() * 6,
    tail: 4 + Math.floor(Math.random() * 6),
  }));
  const texture = new THREE.CanvasTexture(sheet);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  let painted = null;

  function paint(time) {
    const dt = painted === null ? 0 : Math.min(time - painted, .2);
    painted = time;
    pen.fillStyle = '#000';
    pen.fillRect(0, 0, SHEET, SHEET);
    pen.font = `800 ${Math.round(cell * .84)}px Manrope, Arial, sans-serif`;
    pen.textAlign = 'center';
    pen.textBaseline = 'middle';
    columns.forEach((column, x) => {
      column.at += column.speed * dt;
      if (column.at > CELLS + column.tail) {
        column.at = -Math.random() * CELLS;
        column.speed = 5 + Math.random() * 6;
        column.tail = 4 + Math.floor(Math.random() * 6);
      }
      for (let y = 0; y < CELLS; y++) {
        const behind = column.at - y;
        let ink = .3, head = 0;
        if (behind >= 0 && behind < column.tail) {
          ink = 1 - (behind / column.tail) * .7;
          if (behind < 1) { head = 1; digits[y * CELLS + x] = Math.floor(Math.random() * 10); }
        }
        pen.fillStyle = `rgb(${Math.round(ink * 255)},${head * 255},0)`;
        pen.fillText(String(digits[y * CELLS + x]), x * cell + cell / 2, y * cell + cell / 2);
      }
    });
    texture.needsUpdate = true;
  }

  const uniforms = {
    uStrength: { value: 0 },
    uDigits: { value: texture },
    uCyan: { value: cyan },
    uNavy: { value: navy },
    // Digits per world unit: four units of wall carry one sheet of sixteen.
    uScale: { value: .25 },
    uGround: { value: LOOK.ground },
    uSmall: { value: LOOK.small },
  };
  // Each part's front, as x across the city, and how bright its seam glows.
  const fronts = Object.fromEntries(PARTS.map((part) => [part, { value: new THREE.Vector2(100, 0) }]));
  // Which part of the city a thing belongs to: the nearest group that says,
  // or the streets.
  const partOf = (object) => {
    for (let at = object; at && at !== world; at = at.parent) if (at.userData.part) return at.userData.part;
    return 'streets';
  };

  // The extra lines every city material gets: where the surface is in the
  // world and which way it faces, then a digit read across it. A building's
  // materials are its own copies, compiled with the building's share of the
  // look; everything else works out from its height whether it is ground.
  function patch(material, isBuilding, part) {
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms, { uSweep: fronts[part] });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vNumPos;\nvarying vec3 vNumNormal;')
        .replace('#include <fog_vertex>', `#include <fog_vertex>
  vec4 numPos = vec4(transformed, 1.0);
  vec3 numNormal = objectNormal;
  #ifdef USE_INSTANCING
    numPos = instanceMatrix * numPos;
    numNormal = mat3(instanceMatrix) * numNormal;
  #endif
  vNumPos = (modelMatrix * numPos).xyz;
  vNumNormal = normalize(mat3(modelMatrix) * numNormal);`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>
varying vec3 vNumPos;
varying vec3 vNumNormal;
uniform float uStrength;
uniform sampler2D uDigits;
uniform vec3 uCyan;
uniform vec3 uNavy;
uniform float uScale;
uniform float uGround;
uniform float uSmall;
uniform vec2 uSweep;
// How far a surface is numbers: the whole city's strength, or east of its
// part's front.
float numK(vec3 p) {
  return max(uStrength, smoothstep(uSweep.x - ${SOFT.toFixed(2)}, uSweep.x + ${SOFT.toFixed(2)}, p.x));
}
// How bright a surface's digits are, against 1 for the sheet as painted. A
// building's are lifted: a roof is brightest, the walls that look one way along
// the streets are brighter than the walls that look the other, and every wall
// goes dark toward its foot.
// Anything else is ground when it lies low and flat, and a small thing if not.
float numShare(vec3 p, vec3 n) {
  ${isBuilding ? `float up = smoothstep(0.3, 0.7, abs(n.y));
  float wall = mix(0.7, 1.5, abs(n.x) / max(abs(n.x) + abs(n.z), 0.0001));
  float foot = mix(0.05, 1.0, smoothstep(0.12, 1.3, p.y));
  return mix(wall * foot, 1.9, up);` : `bool low = p.y < 0.1 || (p.y < 0.35 && abs(n.y) > 0.7);
  return low ? uGround : uSmall;`}
}
// Digits read the right way round on every face: a wall's digits run left to
// right as its viewer sees them, and a roof's run the way the camera looks.
vec2 numDigit(vec3 p, vec3 n) {
  vec3 w = abs(n);
  w = w / max(w.x + w.y + w.z, 0.0001);
  vec2 x = texture2D(uDigits, vec2(-p.z * sign(n.x), p.y) * uScale).rg;
  vec2 y = texture2D(uDigits, vec2(0.8 * p.x - 0.6 * p.z, -(0.6 * p.x + 0.8 * p.z)) * uScale).rg;
  vec2 z = texture2D(uDigits, vec2(p.x * sign(n.z), p.y) * uScale).rg;
  return x * w.x + y * w.y + z * w.z;
}`)
        .replace('#include <color_fragment>', `#include <color_fragment>
  vec3 numGlow = vec3(0.0);
  float numAt = numK(vNumPos);
  if (numAt > 0.0) {
    vec2 d = min(numDigit(vNumPos, vNumNormal) * numShare(vNumPos, vNumNormal), vec2(1.0));
    vec3 ink = mix(uCyan, diffuseColor.rgb, 0.35);
    ink = mix(ink, vec3(1.0), d.g);
    vec3 skin = mix(uNavy * 0.8, ink, d.r);
    diffuseColor.rgb = mix(diffuseColor.rgb, skin, numAt);
    numGlow = ink * d.r * numAt;
  }
  // The seam: a band of cyan light along a moving front.
  float numSeam = (vNumPos.x - uSweep.x) / 0.32;
  numGlow += uCyan * uSweep.y * 1.6 * exp(-numSeam * numSeam);`)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += numGlow;');
    };
    material.customProgramCacheKey = () => `number-city-${isBuilding ? 'building' : 'thing'}-${part}`;
    material.needsUpdate = true;
  }
  // The outlines are plain lines, so they read only whether they stand in
  // numbers, and fade where their part has already turned real.
  function patchLine(material, part) {
    material.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, { uStrength: uniforms.uStrength, uSweep: fronts[part] });
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying float vNumX;')
        .replace('#include <fog_vertex>', `#include <fog_vertex>
  vec4 numAt = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    numAt = instanceMatrix * numAt;
  #endif
  vNumX = (modelMatrix * numAt).x;`);
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vNumX;\nuniform float uStrength;\nuniform vec2 uSweep;')
        .replace('#include <color_fragment>', `#include <color_fragment>
  float numAt = max(uStrength, smoothstep(uSweep.x - ${SOFT.toFixed(2)}, uSweep.x + ${SOFT.toFixed(2)}, vNumX));
  diffuseColor.a *= clamp(numAt * 2.0 - 1.0, 0.0, 1.0);`);
    };
    material.customProgramCacheKey = () => `number-line-${part}`;
    material.needsUpdate = true;
  }
  const inBuilding = (object) => {
    for (let at = object; at && at !== world; at = at.parent) if (at.userData.building) return true;
    return false;
  };
  // The city shares one material per colour, so a building takes a copy of
  // each of its colours rather than changing the street's, and so does every
  // part but the streets, so each part follows its own front. The streets keep
  // the material itself, as the homepage has always had it.
  const patched = new Set(), copies = new Map(), variants = new Map();
  const copyOf = (material, isBuilding, part) => {
    const key = `${material.uuid} ${isBuilding ? 'building' : 'thing'} ${part}`;
    if (!copies.has(key)) {
      const copy = material.clone();
      patch(copy, isBuilding, part);
      copies.set(key, copy);
      if (!variants.has(material)) variants.set(material, []);
      variants.get(material).push(copy);
    }
    return copies.get(key);
  };
  world.traverse((object) => {
    const material = object.isMesh ? object.material : null;
    if (!material || !material.isMeshStandardMaterial || material.map) return;
    const part = partOf(object);
    if (inBuilding(object) || part !== 'streets') { object.material = copyOf(material, inBuilding(object), part); return; }
    if (patched.has(material)) return;
    patched.add(material);
    patch(material, false, part);
  });

  // The outlines: one thin bar along every marked edge, all in one draw, and
  // a wider, fainter bar over each for the glow. They are made once, in the
  // city's own space, and take no fog, so the far buildings keep their line.
  const bars = [];
  const a = new THREE.Vector3(), b = new THREE.Vector3();
  world.updateMatrixWorld(true);
  const toCity = new THREE.Matrix4().copy(world.matrixWorld).invert(), place = new THREE.Matrix4();
  const bar = (from, to) => bars.push([from.clone().applyMatrix4(place), to.clone().applyMatrix4(place)]);
  const ring = (w, d, x, y, z) => {
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => new THREE.Vector3(x + sx * w / 2, y, z + sz * d / 2));
    corners.forEach((corner, i) => bar(corner, corners[(i + 1) % 4]));
  };
  const posts = (w, d, x, y0, y1, z) => {
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) bar(a.set(x + sx * w / 2, y0, z + sz * d / 2), b.set(x + sx * w / 2, y1, z + sz * d / 2));
  };
  const edges = new Map();
  world.traverse((object) => {
    if (!object.userData.contours && !object.userData.contour) return;
    place.multiplyMatrices(toCity, object.matrixWorld);
    for (const [kind, ...n] of object.userData.contours || []) {
      if (kind === 'ring') ring(...n);
      if (kind === 'posts') posts(...n);
      if (kind === 'box') { const [w, h, d, x, y, z] = n; ring(w, d, x, y - h / 2, z); ring(w, d, x, y + h / 2, z); posts(w, d, x, y - h / 2, y + h / 2, z); }
    }
    if (object.userData.contour && object.geometry) {
      if (!edges.has(object.geometry)) edges.set(object.geometry, new THREE.EdgesGeometry(object.geometry, 25));
      const points = edges.get(object.geometry).attributes.position;
      for (let i = 0; i < points.count; i += 2) bar(a.fromBufferAttribute(points, i), b.fromBufferAttribute(points, i + 1));
    }
  });
  const barGeometry = new THREE.BoxGeometry(1, 1, 1);
  const outline = (thickness, color, blending) => {
    const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, fog: false, depthWrite: false, toneMapped: false, blending });
    const lines = new THREE.InstancedMesh(barGeometry, material, bars.length);
    const along = new THREE.Vector3(), turn = new THREE.Quaternion(), size = new THREE.Vector3(), forward = new THREE.Vector3(0, 0, 1);
    bars.forEach(([from, to], i) => {
      along.subVectors(to, from);
      const length = along.length();
      turn.setFromUnitVectors(forward, along.divideScalar(length || 1));
      lines.setMatrixAt(i, place.compose(a.addVectors(from, to).multiplyScalar(.5), turn, size.set(thickness, thickness, length + thickness)));
    });
    lines.visible = false;
    lines.frustumCulled = false;
    lines.renderOrder = 2;
    world.add(lines);
    return lines;
  };
  const outlines = bars.length ? [
    { lines: outline(LOOK.outline, '#c4fbff', THREE.NormalBlending), full: 1 },
    { lines: outline(LOOK.outline * 3.4, '#0ad6ed', THREE.AdditiveBlending), full: .26 },
  ] : [];
  // The buildings' outlines are the streets' part.
  outlines.forEach(({ lines, full }) => { lines.material.opacity = full; patchLine(lines.material, 'streets'); });

  // Everything else that stands up from the ground takes a finer line of the
  // same colour: trees, cars, trams, people, lamps, benches, shelters. These
  // move, grow and hide, so each one's bars hang from the same group as the
  // part they trace and go wherever it goes. The streets get none: a part that
  // lies low and flat is ground, and so is anything as wide as the board.
  // Balls, tubes and wheels are left out, since their facets would fill in.
  const faceted = new Set(['SphereGeometry', 'IcosahedronGeometry', 'TubeGeometry', 'TorusGeometry']);
  const fineBars = new Map(), measure = new THREE.Box3(), extent = new THREE.Vector3();
  world.traverse((object) => {
    const material = object.isMesh ? object.material : null;
    if (!material || !material.isMeshStandardMaterial || material.map || inBuilding(object)) return;
    if (faceted.has(object.geometry.type)) return;
    object.updateMatrix();
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
    measure.copy(object.geometry.boundingBox).applyMatrix4(object.matrix).getSize(extent);
    // How high its top stands, by the heights of the groups it hangs from, so
    // a tree the proposal has not grown yet still counts as a tree.
    let top = measure.max.y;
    for (let at = object.parent; at && at !== world; at = at.parent) top += at.position.y;
    if (Math.max(extent.x, extent.z) > 6 || (extent.y < .07 && top < .3)) return;
    if (!edges.has(object.geometry)) edges.set(object.geometry, new THREE.EdgesGeometry(object.geometry, 25));
    const points = edges.get(object.geometry).attributes.position;
    if (!fineBars.has(object.parent)) fineBars.set(object.parent, []);
    const list = fineBars.get(object.parent);
    for (let i = 0; i < points.count; i += 2) list.push([a.fromBufferAttribute(points, i).applyMatrix4(object.matrix).clone(), b.fromBufferAttribute(points, i + 1).applyMatrix4(object.matrix).clone()]);
  });
  edges.forEach((geometry) => geometry.dispose());
  // One fine line material per part, so each thing's line follows its part.
  const fineMaterials = Object.fromEntries(PARTS.map((part) => {
    const material = new THREE.MeshBasicMaterial({ color: '#c4fbff', transparent: true, opacity: .9, fog: false, depthWrite: false, toneMapped: false });
    patchLine(material, part);
    return [part, material];
  }));
  const fine = [];
  {
    const along = new THREE.Vector3(), turn = new THREE.Quaternion(), size = new THREE.Vector3(), forward = new THREE.Vector3(0, 0, 1);
    fineBars.forEach((list, parent) => {
      const part = partOf(parent);
      const lines = new THREE.InstancedMesh(barGeometry, fineMaterials[part], list.length);
      lines.userData.fineOf = part;
      list.forEach(([from, to], i) => {
        along.subVectors(to, from);
        const length = along.length();
        turn.setFromUnitVectors(forward, along.divideScalar(length || 1));
        lines.setMatrixAt(i, place.compose(a.addVectors(from, to).multiplyScalar(.5), turn, size.set(LOOK.fine, LOOK.fine, length + LOOK.fine)));
      });
      lines.visible = false;
      lines.frustumCulled = false;
      lines.renderOrder = 2;
      parent.add(lines);
      fine.push(lines);
    });
  }

  // Where the tours look to tell a building from the ground: a spot on each
  // building's roof and a spot on the ground off its nearest corner, in the
  // canvas's own pixels, worked out only when asked for.
  if (view.canvas) view.canvas.numberCityPlaces = () => {
    const spot = new THREE.Vector3(), roofs = [], ground = [];
    const seen = (object, x, y, z) => {
      spot.set(x, y, z).applyMatrix4(object.matrixWorld).project(view.camera);
      return [(spot.x + 1) / 2 * view.canvas.width, (1 - spot.y) / 2 * view.canvas.height, spot.z];
    };
    world.traverse((object) => {
      const post = (object.userData.contours || []).find(([kind]) => kind === 'posts');
      if (!post) return;
      const [, w, d, , , height] = post;
      roofs.push(seen(object, w * .2, height + .1, d * .2).slice(0, 2));
      const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => seen(object, sx * (w / 2 + 1), 0, sz * (d / 2 + 1)));
      ground.push(corners.sort((p, q) => p[2] - q[2])[0].slice(0, 2));
    });
    return { roofs, ground };
  };

  // The whole screen behind the city goes to navy with the same strength. The
  // wash is fixed over the page, under the stage, not inside the stage's box.
  const wash = document.createElement('div');
  wash.className = 'hero-wash';
  document.body.append(wash);

  const edge = (v) => { const n = Math.min(1, Math.max(0, v)); return n * n * (3 - 2 * n); };
  const shown = { wash: '', outlines: '', things: '' };
  // strength: 0 the plain city, 1 the number city, everywhere at once.
  // parts: how far each part has turned from numbers to real, 0 to 1; a part
  // it does not name is real, and with no parts at all every part is.
  // Returns how far the page behind the city is washed to navy.
  function update(strength, time, parts) {
    uniforms.uStrength.value = strength;
    const numbered = { streets: strength > .5, transit: strength > .5, people: strength > .5, cars: strength > .5 };
    let sweeping = false;
    for (const part of PARTS) {
      const progress = parts ? Math.min(1, Math.max(0, parts[part] ?? 1)) : 1, front = fronts[part].value;
      // A turned part's front stands far past the east edge, so nothing of it
      // is numbers and its seam is nowhere.
      front.x = progress >= 1 ? 100 : WEST + (EAST - WEST) * progress;
      front.y = progress >= 1 ? 0 : edge(progress / .05) * edge((1 - progress) / .05);
      if (progress < 1) { sweeping = true; numbered[part] = true; }
    }
    if ((strength > 0 || sweeping) && (painted === null || time - painted > .08)) paint(time);
    // The outlines come in over the second half of the whole city's turn, once
    // the digits are there to be outlined, and while a part is still numbers;
    // the shader fades each where its part has turned real.
    outlines.forEach(({ lines }) => { lines.visible = numbered.streets; });
    fine.forEach((lines) => { lines.visible = numbered[lines.userData.fineOf]; });
    const drawnBars = String(numbered.streets ? bars.length : 0), drawnThings = String(fine.filter((lines) => lines.visible).length);
    // How many outline bars are on screen, and how many other things carry a
    // line of their own, for the tours.
    if (view.canvas && drawnBars !== shown.outlines) { shown.outlines = drawnBars; view.canvas.dataset.outlines = drawnBars; }
    if (view.canvas && drawnThings !== shown.things) { shown.things = drawnThings; view.canvas.dataset.outlinedThings = drawnThings; }
    // The page behind goes navy with the whole city's turn, and lifts as the
    // streets turn real.
    return Math.max(strength, parts ? 1 - Math.min(1, Math.max(0, parts.streets ?? 1)) : 0);
  }
  // Paints the page behind the city, 0 paper and 1 navy.
  function shade(amount) {
    const opacity = amount.toFixed(3);
    if (opacity !== shown.wash) { shown.wash = opacity; wash.style.opacity = opacity; }
  }

  return {
    update, shade,
    // A material and every copy made of it for a building or a part, so a
    // change to the material reaches every thing drawn in it.
    variants: (material) => [material, ...(variants.get(material) || [])],
    dispose() {
      texture.dispose();
      wash.remove();
      patched.forEach((material) => { material.onBeforeCompile = () => {}; });
      copies.forEach((copy) => copy.dispose());
      outlines.forEach(({ lines }) => { lines.removeFromParent(); lines.material.dispose(); });
      fine.forEach((lines) => lines.removeFromParent());
      Object.values(fineMaterials).forEach((material) => material.dispose());
      barGeometry.dispose();
      if (view.canvas) delete view.canvas.numberCityPlaces;
    },
  };
}

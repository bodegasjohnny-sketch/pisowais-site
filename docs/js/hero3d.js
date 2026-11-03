// WebGL hero: a Piso Wais piggy bank, a growing coin tower and floating peso coins.
// Loaded lazily by main.js only when WebGL works and reduced motion is off.
import * as THREE from '../vendor/three.module.min.js';

const C = { navy: 0x121f47, blue: 0x1f4ea6, pink: 0xfdafb0, coral: 0xf36c7a, gold: 0xf9b909, cream: 0xfcfbf7, terra: 0xd6674b };

function coinFaceTexture() {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s * .4, s * .35, s * .05, s / 2, s / 2, s / 2);
  grad.addColorStop(0, '#FFE58A'); grad.addColorStop(.6, '#F9B909'); grad.addColorStop(1, '#C98A00');
  g.fillStyle = grad; g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(120,70,0,.55)'; g.lineWidth = 10; g.beginPath(); g.arc(s / 2, s / 2, s / 2 - 22, 0, Math.PI * 2); g.stroke();
  g.fillStyle = 'rgba(110,62,0,.85)'; g.font = 'bold 150px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('\u20B1', s / 2, s / 2 + 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function makePig() {
  const pig = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: C.pink, roughness: .45, metalness: .05 });
  const snoutMat = new THREE.MeshStandardMaterial({ color: 0xf59a9f, roughness: .5 });
  const dark = new THREE.MeshStandardMaterial({ color: C.navy, roughness: .3 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), skin); body.scale.set(1.25, 1, 1); pig.add(body);
  const snout = new THREE.Mesh(new THREE.CylinderGeometry(.34, .38, .3, 32), snoutMat); snout.rotation.z = Math.PI / 2; snout.position.set(1.28, .05, 0); pig.add(snout);
  for (const z of [-.11, .11]) { const n = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 12), dark); n.position.set(1.43, .06, z); pig.add(n); }
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .25 });
  const earMat = new THREE.MeshStandardMaterial({ color: C.coral, roughness: .5 });
  for (const z of [-.36, .36]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 20), white); eye.position.set(1.05, .36, z); pig.add(eye);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(.07, 16, 16), dark); pupil.position.set(1.16, .37, z); pig.add(pupil);
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.26, .4, 3), earMat); ear.scale.set(1, 1, .5); ear.position.set(.62, .9, z * 1.3); ear.rotation.set(z > 0 ? .55 : -.55, 0, -.25); pig.add(ear);
  }
  for (const [x, z] of [[.6, .5], [.6, -.5], [-.6, .5], [-.6, -.5]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(.18, .2, .45, 20), skin); leg.position.set(x, -.92, z); pig.add(leg); }
  const slot = new THREE.Mesh(new THREE.BoxGeometry(.5, .06, .1), dark); slot.position.set(-.05, .99, 0); pig.add(slot);
  const tail = new THREE.Mesh(new THREE.TorusGeometry(.12, .04, 8, 20, Math.PI * 1.5), skin); tail.position.set(-1.3, .2, 0); tail.rotation.y = Math.PI / 2; pig.add(tail);
  // sash in navy and gold, a nod to the logo
  const sash = new THREE.Mesh(new THREE.TorusGeometry(1.02, .07, 12, 64), new THREE.MeshStandardMaterial({ color: C.blue, roughness: .5 }));
  sash.rotation.set(Math.PI / 2, .35, 0); sash.scale.set(1.24, 1, 1); pig.add(sash);
  pig.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
  return pig;
}

export function startHero(container, onReady) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  const isMobile = matchMedia('(max-width: 760px)').matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = !isMobile;
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.navy, 9, 22);
  const camera = new THREE.PerspectiveCamera(38, 1, .1, 60);
  camera.position.set(0, 1.2, 10);

  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x1f2a5c, 1.1));
  const key = new THREE.DirectionalLight(0xffe2b8, 2.4); key.position.set(4, 7, 6); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const rim = new THREE.PointLight(0x6f8fff, 30, 20); rim.position.set(-5, 3, -3); scene.add(rim);
  const warm = new THREE.PointLight(C.coral, 18, 14); warm.position.set(3, -1, 4); scene.add(warm);

  const world = new THREE.Group(); scene.add(world);
  const faceTex = coinFaceTexture();
  const edge = new THREE.MeshStandardMaterial({ color: 0xd99a00, metalness: .85, roughness: .3 });
  const face = new THREE.MeshStandardMaterial({ map: faceTex, metalness: .6, roughness: .32 });
  const coinGeo = new THREE.CylinderGeometry(.5, .5, .1, 48);
  const coinMats = [edge, face, face];

  // ground disc
  const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 64), new THREE.ShadowMaterial({ opacity: .28 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.15; ground.receiveShadow = true; world.add(ground);

  const pig = makePig(); pig.position.set(.7, 0, 0); pig.rotation.y = -2.25; pig.scale.setScalar(.92); world.add(pig);

  // coin tower that grows with scroll
  const tower = new THREE.Group(); tower.position.set(-1.0, -1.1, .9); world.add(tower);
  const towerCoins = [];
  for (let i = 0; i < 18; i++) {
    const m = new THREE.Mesh(coinGeo, coinMats); m.position.y = .05 + i * .105; m.rotation.y = Math.random() * 6; m.castShadow = true;
    m.position.x = (Math.random() - .5) * .04; tower.add(m); towerCoins.push(m);
  }
  const tower2 = tower.clone(); tower2.position.set(-2.1, -1.1, -.4); world.add(tower2);
  tower2.children.forEach((c, i) => { c.visible = i < 9; });

  // floating coins
  const floaters = [];
  for (let i = 0; i < (isMobile ? 9 : 16); i++) {
    const m = new THREE.Mesh(coinGeo, coinMats);
    const s = .55 + Math.random() * .6; m.scale.setScalar(s);
    m.position.set(-3 + Math.random() * 7.5, Math.random() * 5 - 1.2, -Math.random() * 6 - .8);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    m.userData = { sp: .3 + Math.random() * .7, ph: Math.random() * 6, y0: m.position.y };
    world.add(m); floaters.push(m);
  }
  // dropping coin into the pig slot
  const drop = new THREE.Mesh(coinGeo, coinMats); drop.rotation.x = Math.PI / 2; drop.scale.setScalar(.7); world.add(drop);

  function layout() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    // keep the scene on the right on desktop, centered lower on mobile
    const wide = w > 900;
    world.position.set(wide ? 2.2 : .5, wide ? .25 : -.45, 0);
    world.scale.setScalar(wide ? 1 : 1.02);
  }
  layout();
  addEventListener('resize', layout);

  let tx = 0, ty = 0, mx = 0, my = 0, scrollP = 0;
  const onMove = (x, y) => { tx = (x / innerWidth - .5) * 2; ty = (y / innerHeight - .5) * 2; };
  addEventListener('pointermove', e => onMove(e.clientX, e.clientY), { passive: true });
  addEventListener('touchmove', e => { const t = e.touches[0]; if (t) onMove(t.clientX, t.clientY); }, { passive: true });
  addEventListener('scroll', () => { scrollP = Math.min(1, scrollY / Math.max(1, container.clientHeight)); }, { passive: true });

  let running = true, visible = true, raf = 0, first = true;
  const clock = new THREE.Clock();
  function frame() {
    raf = 0;
    if (!running || !visible) return;
    const t = clock.getElapsedTime();
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    world.rotation.y = mx * .25 + Math.sin(t * .2) * .05;
    world.rotation.x = my * .08;
    camera.position.y = 1.2 - scrollP * 1.2;
    camera.lookAt(0, .3, 0);
    pig.position.y = Math.sin(t * 1.4) * .06; pig.rotation.z = Math.sin(t * 1.1) * .03;
    const shown = 8 + Math.round(scrollP * 10 + (Math.sin(t * .5) * .5 + .5) * 2);
    towerCoins.forEach((c, i) => { c.visible = i < shown; });
    floaters.forEach(f => { const u = f.userData; f.rotation.y += .01 * u.sp; f.rotation.x += .006 * u.sp; f.position.y = u.y0 + Math.sin(t * u.sp + u.ph) * .3; });
    const k = (t * .45) % 1; drop.position.set(pig.position.x - .05, 2.6 - k * 1.5 + pig.position.y, 0); drop.rotation.y = t * 3; drop.visible = k < .92;
    renderer.render(scene, camera);
    if (first) { first = false; onReady && onReady(); }
    raf = requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0 });
  io.observe(container);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running && !raf) raf = requestAnimationFrame(frame); });
  raf = requestAnimationFrame(frame);
  return { renderer, scene, camera };
}

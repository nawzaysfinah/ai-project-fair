import {
  Scene, WebGLRenderer, PerspectiveCamera,
  AmbientLight, DirectionalLight, HemisphereLight, PointLight,
  PlaneGeometry, CircleGeometry, CylinderGeometry, SphereGeometry,
  BoxGeometry, BufferGeometry, BufferAttribute,
  MeshLambertMaterial, CanvasTexture, PointsMaterial,
  Mesh, Points, Group,
  Color, FogExp2, PCFSoftShadowMap, RepeatWrapping,
} from 'three';

export const scene = new Scene();
scene.background = new Color(0x87CEEB);
scene.fog = new FogExp2(0xc9e8ff, 0.006);

export const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

export const camera = new PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 14, 22);

// Bright sunny lighting
scene.add(new AmbientLight(0xfff4e0, 0.8));

const sun = new DirectionalLight(0xffffff, 2.2);
sun.position.set(30, 60, 40);
sun.castShadow = true;
sun.shadow.camera.far = 250;
sun.shadow.camera.left = -100; sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;   sun.shadow.camera.bottom = -100;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

scene.add(new HemisphereLight(0x87CEEB, 0x4DBD33, 0.6));

// Green Roblox baseplate with stud texture
function makeStudTexture(): CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 64; cv.height = 64;
  const cx = cv.getContext('2d')!;
  cx.fillStyle = '#4DBD33';
  cx.fillRect(0, 0, 64, 64);
  cx.strokeStyle = 'rgba(0,0,0,0.12)';
  cx.lineWidth = 1;
  cx.strokeRect(0, 0, 64, 64);
  return new CanvasTexture(cv);
}

const studTex = makeStudTexture();
studTex.wrapS = studTex.wrapT = RepeatWrapping;
studTex.repeat.set(75, 75);

const ground = new Mesh(
  new PlaneGeometry(300, 300),
  new MeshLambertMaterial({ map: studTex }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Central plaza disc — grey stone
const disc = new Mesh(
  new CircleGeometry(11, 48),
  new MeshLambertMaterial({ color: 0xcccccc }),
);
disc.rotation.x = -Math.PI / 2;
disc.position.y = 0.02;
scene.add(disc);

// Roblox-style fountain
function makeFountain(): Group {
  const g = new Group();
  const stone = new MeshLambertMaterial({ color: 0xaaaaaa });
  const base = new Mesh(new CylinderGeometry(2.5, 3.0, 0.6, 16), stone);
  base.position.y = 0.3; base.castShadow = true; g.add(base);
  const pillar = new Mesh(new CylinderGeometry(0.35, 0.35, 2.5, 8), stone);
  pillar.position.y = 1.85; pillar.castShadow = true; g.add(pillar);
  const top = new Mesh(new SphereGeometry(0.5, 10, 10), new MeshLambertMaterial({ color: 0x5555cc }));
  top.position.y = 3.2; g.add(top);
  const glow = new PointLight(0x4488ff, 3, 18, 1.8);
  glow.position.y = 3.5; g.add(glow);
  return g;
}
scene.add(makeFountain());

// Drifting block clouds
function makeCloud(): Group {
  const g = new Group();
  const mat = new MeshLambertMaterial({ color: 0xffffff });
  const add = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = new Mesh(new BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    g.add(m);
  };
  add(6, 2.5, 4, 0, 0, 0);
  add(4, 2, 3, 4, 0.5, 0);
  add(3.5, 1.8, 3, -3.5, 0.3, 0);
  add(3, 3, 3, 1, 1.5, 0);
  return g;
}

export const clouds: Array<{ group: Group; speed: number }> = [];
for (let i = 0; i < 8; i++) {
  const c = makeCloud();
  c.position.set((Math.random() - 0.5) * 240, 35 + Math.random() * 20, (Math.random() - 0.5) * 240);
  c.rotation.y = Math.random() * Math.PI;
  clouds.push({ group: c, speed: 1.5 + Math.random() * 2 });
  scene.add(c);
}

export function animateClouds(dt: number): void {
  for (const c of clouds) {
    c.group.position.x += c.speed * dt;
    if (c.group.position.x > 160) c.group.position.x = -160;
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

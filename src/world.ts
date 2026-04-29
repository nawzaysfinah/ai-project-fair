import {
  Group, Mesh, LineSegments, Points,
  PlaneGeometry, BoxGeometry, CylinderGeometry, EdgesGeometry,
  BufferGeometry, BufferAttribute,
  MeshLambertMaterial, MeshBasicMaterial, LineBasicMaterial, PointsMaterial,
  CanvasTexture, Color, PointLight,
  FrontSide, Vector3,
} from 'three';
import { scene } from './scene';
import { DOMAINS, PROJECTS } from './data';
import type { Domain, Project, BoothMeta } from './types';

const ROBLOX_RED = '#E8101A';

function makeZoneLabel(domain: Domain): CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 168;
  const cx = cv.getContext('2d')!;
  cx.fillStyle = domain.color; cx.fillRect(0, 0, 512, 168);
  cx.fillStyle = 'rgba(0,0,0,0.2)'; cx.fillRect(0, 130, 512, 38);
  cx.fillStyle = 'white'; cx.textAlign = 'center';
  cx.font = 'bold 56px Arial'; cx.fillText(`${domain.icon} ${domain.name}`, 256, 92);
  cx.font = 'bold 20px Arial'; cx.fillStyle = 'rgba(255,255,255,0.8)';
  cx.fillText('Walk in to explore!', 256, 155);
  return new CanvasTexture(cv);
}

function boothTexture(proj: Project, dom: Domain): CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 512;
  const cx = cv.getContext('2d')!;
  const c = new Color(dom.color);
  const r = ~~(c.r * 255), g = ~~(c.g * 255), b = ~~(c.b * 255);

  // Solid domain-colour background
  cx.fillStyle = dom.color; cx.fillRect(0, 0, 512, 512);

  // Roblox-red top strip
  cx.fillStyle = ROBLOX_RED; cx.fillRect(0, 0, 512, 52);
  cx.fillStyle = '#fff'; cx.font = 'bold 28px Arial'; cx.textAlign = 'center';
  cx.fillText('PROJECT BOOTH', 256, 36);

  // White content area
  cx.fillStyle = '#fff'; cx.fillRect(0, 52, 512, 460);

  // Emoji
  cx.font = '130px serif'; cx.fillText(proj.emoji, 256, 220);

  // Name
  cx.fillStyle = '#111'; cx.font = 'bold 38px Arial';
  const words = proj.name.split(' '); let line = ''; let y = 310;
  for (const w of words) {
    const t = line + w + ' ';
    if (cx.measureText(t).width > 440 && line !== '') {
      cx.fillText(line.trim(), 256, y); line = w + ' '; y += 44;
    } else line = t;
  }
  cx.fillText(line.trim(), 256, y);

  // Student
  cx.fillStyle = dom.color; cx.font = 'bold 22px Arial';
  cx.fillText(proj.student, 256, y + 48);

  // Bottom strip
  cx.fillStyle = `rgba(${r},${g},${b},0.12)`; cx.fillRect(0, 460, 512, 52);
  cx.fillStyle = '#555'; cx.font = '18px Arial';
  cx.fillText(proj.tech.slice(0, 2).join(' · '), 256, 494);

  return new CanvasTexture(cv);
}

function boothPositions(n: number): Array<{ x: number; z: number }> {
  if (n <= 3) return Array.from({ length: n }, (_, i) => ({ x: (i - (n - 1) / 2) * 10, z: 2 }));
  return Array.from({ length: n }, (_, i) => ({ x: ((i % 2) - 0.5) * 10, z: ~~(i / 2) * 10 - 4 }));
}

export const boothMeshes: Mesh[] = [];
export const byDomain: Record<string, Project[]> = {};
DOMAINS.forEach(d => { byDomain[d.id] = []; });
PROJECTS.forEach(p => { if (byDomain[p.domain]) byDomain[p.domain].push(p); });

// Zones
DOMAINS.forEach(dom => {
  const g = new Group();
  g.position.set(dom.pos.x, 0, dom.pos.z);

  // Bright zone floor
  const floor = new Mesh(
    new PlaneGeometry(30, 30),
    new MeshLambertMaterial({ color: new Color(dom.color), transparent: true, opacity: 0.55 }),
  );
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.02; g.add(floor);

  // Bold border
  const edges = new LineSegments(
    new EdgesGeometry(new BoxGeometry(30, 0.08, 30)),
    new LineBasicMaterial({ color: new Color(dom.color), transparent: false }),
  );
  edges.position.y = 0.06; g.add(edges);

  // Sign pole
  const pole = new Mesh(new CylinderGeometry(0.12, 0.12, 5, 8), new MeshLambertMaterial({ color: 0x888888 }));
  pole.position.set(0, 2.5, -13); pole.castShadow = true; g.add(pole);

  // Sign board
  const board = new Mesh(
    new PlaneGeometry(8, 2.4),
    new MeshBasicMaterial({ map: makeZoneLabel(dom), transparent: false }),
  );
  board.position.set(0, 5.8, -13); g.add(board);

  // Zone light
  const zLight = new PointLight(new Color(dom.color), 2.5, 35, 1.8);
  zLight.position.set(0, 6, 0); g.add(zLight);

  // Floating particles
  const pGeo = new BufferGeometry();
  const pPos = new Float32Array(24 * 3);
  for (let i = 0; i < 24; i++) {
    pPos[i * 3]     = (Math.random() - 0.5) * 26;
    pPos[i * 3 + 1] = Math.random() * 9 + 0.5;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 26;
  }
  pGeo.setAttribute('position', new BufferAttribute(pPos, 3));
  const particles = new Points(pGeo, new PointsMaterial({ color: new Color(dom.color), size: 0.15, transparent: true, opacity: 0.7 }));
  particles.userData['basePos'] = pPos.slice();
  particles.userData['isParticle'] = true;
  g.add(particles);

  scene.add(g);
});

// Booths — chunky Roblox-style block structures
DOMAINS.forEach(dom => {
  const projs = byDomain[dom.id];
  const pos = boothPositions(projs.length);
  const dg = new Group();
  dg.position.set(dom.pos.x, 0, dom.pos.z);

  projs.forEach((proj, i) => {
    const bg = new Group();
    bg.position.set(pos[i].x, 0, pos[i].z);

    // Chunky platform base
    const base = new Mesh(
      new BoxGeometry(4.2, 0.6, 1.4),
      new MeshLambertMaterial({ color: new Color(dom.color) }),
    );
    base.position.set(0, 0.3, 0); base.castShadow = true; bg.add(base);

    // Thick block poles
    for (const x of [-1.7, 1.7]) {
      const pole = new Mesh(new CylinderGeometry(0.14, 0.14, 3.2, 6), new MeshLambertMaterial({ color: 0xaaaaaa }));
      pole.position.set(x, 2.2, 0); pole.castShadow = true; bg.add(pole);
    }

    // Solid back panel — domain colour
    const back = new Mesh(
      new BoxGeometry(4.0, 3.8, 0.16),
      new MeshLambertMaterial({ color: new Color(dom.color).multiplyScalar(0.6) }),
    );
    back.position.set(0, 3.7, -0.1); back.castShadow = true; bg.add(back);

    // Display board
    const display = new Mesh(
      new PlaneGeometry(3.8, 3.6),
      new MeshBasicMaterial({ map: boothTexture(proj, dom), side: FrontSide }),
    );
    display.position.set(0, 3.7, 0.02);

    const meta: BoothMeta = { project: proj, domain: dom, isBooth: true };
    display.userData = meta;
    back.userData = meta;
    bg.add(display);
    boothMeshes.push(display, back);

    // Roblox-red accent top bar on booth structure
    const topBar = new Mesh(
      new BoxGeometry(4.2, 0.3, 0.2),
      new MeshLambertMaterial({ color: 0xE8101A }),
    );
    topBar.position.set(0, 5.7, 0.04); bg.add(topBar);

    // Booth light
    const gl = new PointLight(new Color(dom.color), 0.8, 8, 2);
    gl.position.set(0, 1.5, 1); bg.add(gl);

    dg.add(bg);
  });

  scene.add(dg);
});

export function getBoothWorldPos(proj: Project): Vector3 | null {
  const mesh = boothMeshes.find(m => {
    const meta = m.userData as Partial<BoothMeta>;
    return meta.isBooth && meta.project === proj && m.geometry.type === 'PlaneGeometry';
  });
  if (!mesh) return null;
  const wp = new Vector3();
  mesh.getWorldPosition(wp);
  return wp;
}

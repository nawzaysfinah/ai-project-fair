// Teleport pads — glowing pads that warp the player to domain zones
import {
  Mesh, Group, CylinderGeometry, PlaneGeometry,
  MeshBasicMaterial, MeshLambertMaterial,
  PointLight, CanvasTexture, Vector3,
} from 'three';
import { scene } from './scene';
import { player } from './player';
import type { Domain } from './types';
import { playTeleport } from './sounds';

const PAD_RADIUS = 8;   // ring radius around hub center
const HUB_CENTER = new Vector3(0, 0.05, 0);
const PAD_Y = 0.05;     // just above ground
const TRIGGER_R = 2.2;  // proximity radius to trigger

let pads: { mesh: Group; dest: Vector3; }[] = [];
let cooldown = 0;
let flashTimer = 0;

const flashEl = document.getElementById('teleport-flash')!;

function makePadLabel(domain: Domain): CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64;
  const cx = cv.getContext('2d')!;
  cx.clearRect(0, 0, 256, 64);
  cx.fillStyle = domain.color + 'CC';
  cx.roundRect(4, 4, 248, 56, 10);
  cx.fill();
  cx.fillStyle = '#fff';
  cx.font = 'bold 22px Arial';
  cx.textAlign = 'center';
  cx.fillText(`${domain.icon} ${domain.name.split(' ')[0]}`, 128, 36);
  return new CanvasTexture(cv);
}

export function initTeleportPads(domains: Domain[]): void {
  const slice = domains.slice(0, 6);
  slice.forEach((domain, i) => {
    const angle = (i / slice.length) * Math.PI * 2;
    const x = HUB_CENTER.x + Math.cos(angle) * PAD_RADIUS;
    const z = HUB_CENTER.z + Math.sin(angle) * PAD_RADIUS;

    const group = new Group();
    group.position.set(x, PAD_Y, z);

    // Glowing disc
    const hex = domain.hex;
    const discMat = new MeshBasicMaterial({ color: hex, transparent: true, opacity: 0.85 });
    const disc = new Mesh(new CylinderGeometry(1.6, 1.6, 0.12, 24), discMat);
    group.add(disc);

    // Outer ring
    const ringMat = new MeshBasicMaterial({ color: hex, wireframe: true });
    const ring = new Mesh(new CylinderGeometry(1.8, 1.8, 0.06, 24), ringMat);
    group.add(ring);

    // Floating label billboard (plane above pad)
    const labelMat = new MeshBasicMaterial({ map: makePadLabel(domain), transparent: true, depthWrite: false });
    const label = new Mesh(new PlaneGeometry(2.8, 0.7), labelMat);
    label.position.y = 1.4;
    label.rotation.y = -angle; // face outward
    group.add(label);

    // Glow light
    const light = new PointLight(hex, 1.2, 5);
    light.position.y = 0.5;
    group.add(light);

    scene.add(group);
    pads.push({
      mesh: group,
      dest: new Vector3(domain.pos.x, 0, domain.pos.z),
    });
  });
}

export function updateTeleport(dt: number): void {
  cooldown = Math.max(0, cooldown - dt);

  // Animate flash
  if (flashTimer > 0) {
    flashTimer -= dt;
    flashEl.style.opacity = String(Math.min(flashTimer * 4, 1));
    if (flashTimer <= 0) flashEl.style.opacity = '0';
  }

  if (cooldown > 0) return;

  for (const pad of pads) {
    const dist = new Vector3(player.position.x, 0, player.position.z)
      .distanceTo(new Vector3(pad.mesh.position.x, 0, pad.mesh.position.z));
    if (dist < TRIGGER_R) {
      // Teleport
      player.position.set(pad.dest.x, 0, pad.dest.z);
      cooldown   = 2.0;
      flashTimer = 0.45;
      flashEl.style.opacity = '1';
      playTeleport();
      break;
    }
  }

  // Pulse pad lights + labels
  pads.forEach((pad, i) => {
    const t = performance.now() / 1000;
    const light = pad.mesh.children.find(c => (c as PointLight).isPointLight) as PointLight | undefined;
    if (light) light.intensity = 0.9 + Math.sin(t * 2.5 + i) * 0.5;
    // Spin outer ring slightly
    if (pad.mesh.children[1]) pad.mesh.children[1].rotation.y += dt * 0.6;
  });
}

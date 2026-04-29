import {
  Group, Mesh, PointLight,
  BoxGeometry, CylinderGeometry,
  MeshLambertMaterial, MeshBasicMaterial,
  CanvasTexture, Vector3,
} from 'three';
import { scene, camera, renderer } from './scene';

// ── MATERIALS ────────────────────────────────────────────────
const skinMat  = new MeshLambertMaterial({ color: 0xFFD700 });
const torsoMat = new MeshLambertMaterial({ color: 0x0066FF });
const legMat   = new MeshLambertMaterial({ color: 0x1A1A2E });
const hatMat   = new MeshLambertMaterial({ color: 0x888888 });

function makeFaceTexture(): CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
  const cx = cv.getContext('2d')!;
  cx.fillStyle = '#FFD700'; cx.fillRect(0, 0, 128, 128);
  // Square eyes
  cx.fillStyle = '#000';
  cx.fillRect(26, 36, 24, 24);
  cx.fillRect(78, 36, 24, 24);
  cx.fillStyle = '#fff';
  cx.fillRect(30, 40, 13, 13);
  cx.fillRect(82, 40, 13, 13);
  cx.fillStyle = '#000';
  cx.fillRect(35, 45, 6, 6);
  cx.fillRect(87, 45, 6, 6);
  // Smile
  cx.strokeStyle = '#000'; cx.lineWidth = 5;
  cx.beginPath(); cx.arc(64, 82, 20, 0.15, Math.PI - 0.15); cx.stroke();
  return new CanvasTexture(cv);
}

const faceMat = new MeshBasicMaterial({ map: makeFaceTexture() });

function box(w: number, h: number, d: number): BoxGeometry {
  return new BoxGeometry(w, h, d);
}

// ── CHARACTER (R6) ───────────────────────────────────────────
export const player = new Group();
player.position.set(0, 0, 12);
scene.add(player);

// Torso
const torso = new Mesh(box(1.0, 1.4, 0.6), torsoMat);
torso.position.set(0, 1.7, 0); torso.castShadow = true; player.add(torso);

// Head group (pivot at neck)
const headGroup = new Group();
headGroup.position.set(0, 2.6, 0);
player.add(headGroup);

const headMesh = new Mesh(box(0.9, 0.9, 0.9), skinMat);
headMesh.position.y = 0.45; headMesh.castShadow = true; headGroup.add(headMesh);

// Face on front of head
const facePlane = new Mesh(new BoxGeometry(0.88, 0.88, 0.01), faceMat);
facePlane.position.set(0, 0.45, 0.46); headGroup.add(facePlane);

// Hat
const brim = new Mesh(new CylinderGeometry(0.52, 0.52, 0.08, 8), hatMat);
brim.position.set(0, 0.96, 0); headGroup.add(brim);
const crown = new Mesh(box(0.7, 0.4, 0.7), hatMat);
crown.position.set(0, 1.16, 0); headGroup.add(crown);

// Arm groups — pivot at shoulder
export const leftArmGroup  = new Group(); leftArmGroup.position.set(-0.75, 2.3, 0);
export const rightArmGroup = new Group(); rightArmGroup.position.set(0.75, 2.3, 0);
[leftArmGroup, rightArmGroup].forEach(g => {
  const m = new Mesh(box(0.5, 1.1, 0.5), skinMat);
  m.position.y = -0.55; m.castShadow = true; g.add(m);
  player.add(g);
});

// Leg groups — pivot at hip
export const leftLegGroup  = new Group(); leftLegGroup.position.set(-0.25, 1.1, 0);
export const rightLegGroup = new Group(); rightLegGroup.position.set(0.25, 1.1, 0);
[leftLegGroup, rightLegGroup].forEach(g => {
  const m = new Mesh(box(0.5, 1.1, 0.5), legMat);
  m.position.y = -0.55; m.castShadow = true; g.add(m);
  player.add(g);
});

// Glow
const playerLight = new PointLight(0xffffff, 0.6, 6);
playerLight.position.y = 1.5; player.add(playerLight);

// ── PHYSICS ──────────────────────────────────────────────────
const GRAVITY    = -0.022;
const JUMP_FORCE =  0.28;
let velocityY   = 0;
let isGrounded  = true;
let _justLanded = false;

export const wasJustLanded = () => _justLanded;

// ── CAMERA ORBIT ─────────────────────────────────────────────
export let camYaw = 0;
export const setCamYaw = (v: number) => { camYaw = v; };

const CAM_DIST = 15, CAM_H = 8;
const _camTarget = new Vector3();

export function updateCamera(): void {
  _camTarget.set(
    player.position.x + CAM_DIST * Math.sin(camYaw),
    player.position.y + CAM_H,
    player.position.z + CAM_DIST * Math.cos(camYaw),
  );
  camera.position.lerp(_camTarget, 0.09);
  camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
}

// ── INPUT ────────────────────────────────────────────────────
const keys: Record<string, boolean> = {};
window.addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  keys[e.code] = true;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// Right-drag → camera orbit
let dragActive = false, lastMX = 0;
export let dragMoved = false;

renderer.domElement.addEventListener('mousedown', e => {
  dragActive = true; lastMX = e.clientX; dragMoved = false;
});
window.addEventListener('mouseup', () => { dragActive = false; });
window.addEventListener('mousemove', e => {
  if (!dragActive) return;
  const dx = e.clientX - lastMX;
  if (Math.abs(dx) > 2) dragMoved = true;
  camYaw -= dx * 0.0045;
  lastMX = e.clientX;
});
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

// Touch
let lastTouchX = 0;
renderer.domElement.addEventListener('touchstart', e => { lastTouchX = e.touches[0].clientX; }, { passive: true });
renderer.domElement.addEventListener('touchmove', e => {
  e.preventDefault();
  camYaw -= (e.touches[0].clientX - lastTouchX) * 0.004;
  lastTouchX = e.touches[0].clientX;
  if (!_tourActive) {
    const fwd = new Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    player.position.addScaledVector(fwd, SPEED * 1.5);
  }
}, { passive: false });

// ── MOVEMENT ─────────────────────────────────────────────────
const SPEED  = 0.13;
const BOUNDS = 90;
const _fwd = new Vector3(), _rgt = new Vector3(), _vel = new Vector3();

let _moving = false;
export const isMoving = () => _moving;

let _tourActive = false;
export const isTourActive  = () => _tourActive;
export const setTourActive = (v: boolean) => { _tourActive = v; };

export function updatePlayer(): void {
  _justLanded = false;

  // Gravity + jump
  const prevY = player.position.y;
  velocityY += GRAVITY;
  player.position.y += velocityY;
  if (player.position.y <= 0) {
    if (velocityY < -0.18) _justLanded = true;
    player.position.y = 0;
    velocityY = 0;
    isGrounded = true;
  } else {
    isGrounded = false;
  }

  if ((keys['Space'] || keys['KeyF']) && isGrounded) {
    velocityY = JUMP_FORCE;
    isGrounded = false;
  }

  if (_tourActive) return;

  _fwd.set(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  _rgt.set( Math.cos(camYaw), 0, -Math.sin(camYaw));
  _vel.set(0, 0, 0);
  if (keys['KeyW'] || keys['ArrowUp'])    _vel.addScaledVector(_fwd,  SPEED);
  if (keys['KeyS'] || keys['ArrowDown'])  _vel.addScaledVector(_fwd, -SPEED);
  if (keys['KeyA'] || keys['ArrowLeft'])  _vel.addScaledVector(_rgt, -SPEED);
  if (keys['KeyD'] || keys['ArrowRight']) _vel.addScaledVector(_rgt,  SPEED);

  _moving = _vel.length() > 0;
  if (_moving) {
    player.position.add(_vel);
    player.rotation.y = Math.atan2(_vel.x, _vel.z);
    player.position.x = Math.max(-BOUNDS, Math.min(BOUNDS, player.position.x));
    player.position.z = Math.max(-BOUNDS, Math.min(BOUNDS, player.position.z));
  }
}

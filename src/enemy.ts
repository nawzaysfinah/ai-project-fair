// AI enemy NPC — patrols the combat zone, chases and shoots the player
import {
  Group, Mesh, BoxGeometry, SphereGeometry,
  MeshLambertMaterial, MeshBasicMaterial,
  Vector3, CanvasTexture,
} from 'three';
import { scene, camera } from './scene';
import { player, damagePlayer } from './player';
import { playShoot, playHit, playEnemyDie } from './sounds';

// ── ENEMY MESH ───────────────────────────────────────────────────
const skinMat  = new MeshLambertMaterial({ color: 0xFF4040 });
const torsoMat = new MeshLambertMaterial({ color: 0x880000 });
const legMat   = new MeshLambertMaterial({ color: 0x330000 });

function box(w: number, h: number, d: number) { return new BoxGeometry(w, h, d); }

export const enemyGroup = new Group();
scene.add(enemyGroup);

// R6-style enemy body
const torso = new Mesh(box(1.0, 1.4, 0.6), torsoMat);
torso.position.y = 1.7;
enemyGroup.add(torso);

const head = new Mesh(box(0.9, 0.9, 0.9), skinMat);
head.position.y = 2.65;
enemyGroup.add(head);

// Angry face texture
const faceCv = document.createElement('canvas'); faceCv.width = 128; faceCv.height = 128;
const faceCx = faceCv.getContext('2d')!;
faceCx.fillStyle = '#FF4040'; faceCx.fillRect(0, 0, 128, 128);
faceCx.fillStyle = '#000';
faceCx.fillRect(22, 38, 26, 18); faceCx.fillRect(80, 38, 26, 18);
// Angry eyebrow
faceCx.strokeStyle = '#000'; faceCx.lineWidth = 5;
faceCx.beginPath(); faceCx.moveTo(18, 34); faceCx.lineTo(52, 40); faceCx.stroke();
faceCx.beginPath(); faceCx.moveTo(110, 34); faceCx.lineTo(76, 40); faceCx.stroke();
// Frown
faceCx.beginPath(); faceCx.arc(64, 95, 20, Math.PI + 0.2, -0.2); faceCx.stroke();
const faceMat = new MeshBasicMaterial({ map: new CanvasTexture(faceCv) });
const facePlane = new Mesh(box(0.88, 0.88, 0.01), faceMat);
facePlane.position.set(0, 2.65, 0.46);
enemyGroup.add(facePlane);

const leftArm  = new Group(); leftArm.position.set(-0.75, 2.3, 0);
const rightArm = new Group(); rightArm.position.set( 0.75, 2.3, 0);
const leftLeg  = new Group(); leftLeg.position.set(-0.25, 1.1, 0);
const rightLeg = new Group(); rightLeg.position.set( 0.25, 1.1, 0);
[leftArm, rightArm].forEach(g => {
  const m = new Mesh(box(0.5, 1.1, 0.5), skinMat); m.position.y = -0.55; g.add(m);
  enemyGroup.add(g);
});
[leftLeg, rightLeg].forEach(g => {
  const m = new Mesh(box(0.5, 1.1, 0.5), legMat); m.position.y = -0.55; g.add(m);
  enemyGroup.add(g);
});

// ── HEALTH BAR DOM ───────────────────────────────────────────────
const hpWrap = document.createElement('div'); hpWrap.id = 'enemy-hp-wrap';
const hpBar  = document.createElement('div'); hpBar.id  = 'enemy-hp-bar';
hpWrap.appendChild(hpBar);
document.body.appendChild(hpWrap);

// ── STATE ────────────────────────────────────────────────────────
const SPAWN = new Vector3(0, 0, -65);
const PATROL_R  = 14;
const CHASE_R   = 32;
const ATTACK_R  = 16;
const SPEED     = 0.065;
const HP_MAX    = 4;

type State = 'patrol' | 'chase' | 'attack' | 'dead';

let hp           = HP_MAX;
let state: State = 'patrol';
let patrolAngle  = 0;
let attackCD     = 0;
let respawnCD    = 0;
let animT        = 0;

// ── PROJECTILES ──────────────────────────────────────────────────
const projMat = new MeshLambertMaterial({ color: 0xFF6600, emissive: 0xFF4400, emissiveIntensity: 0.8 });
const projGeo = new SphereGeometry(0.22, 8, 6);
const MAX_PROJ = 12;
const projPool: Mesh[] = [];
const activeProjPos: Vector3[] = [];
const activeProjVel: Vector3[] = [];
const activeProjLife: number[] = [];

for (let i = 0; i < MAX_PROJ; i++) {
  const m = new Mesh(projGeo, projMat);
  m.visible = false;
  scene.add(m);
  projPool.push(m);
}

function spawnProjectile(): void {
  const slot = projPool.findIndex(p => !p.visible);
  if (slot < 0) return;
  const m = projPool[slot];
  m.position.copy(enemyGroup.position).add(new Vector3(0, 2.5, 0));
  const dir = new Vector3()
    .subVectors(player.position.clone().add(new Vector3(0, 1.5, 0)), m.position)
    .normalize().multiplyScalar(0.38);
  m.visible = true;
  activeProjPos.push(m.position);
  activeProjVel.push(dir);
  activeProjLife.push(4);
  playShoot();
}

function updateProjectiles(dt: number): void {
  for (let i = activeProjPos.length - 1; i >= 0; i--) {
    activeProjPos[i].add(activeProjVel[i]);
    activeProjLife[i] -= dt;
    const hit = activeProjPos[i].distanceTo(player.position) < 1.4;
    if (hit) damagePlayer(18);
    if (hit || activeProjLife[i] <= 0) {
      projPool[projPool.indexOf(projPool.find(p => p.position === activeProjPos[i])!)].visible = false;
      activeProjPos.splice(i, 1);
      activeProjVel.splice(i, 1);
      activeProjLife.splice(i, 1);
    }
  }
}

// ── PUBLIC API ───────────────────────────────────────────────────
export function hitEnemy(): void {
  if (state === 'dead') return;
  hp = Math.max(0, hp - 1);
  hpBar.style.width = `${(hp / HP_MAX) * 100}%`;
  playHit();
  if (hp <= 0) {
    state = 'dead';
    enemyGroup.visible = false;
    hpWrap.style.display = 'none';
    playEnemyDie();
    respawnCD = 8;
  }
}

const _toPlayer = new Vector3();

export function updateEnemy(dt: number): void {
  animT += dt;

  if (state === 'dead') {
    respawnCD -= dt;
    if (respawnCD <= 0) {
      hp = HP_MAX;
      hpBar.style.width = '100%';
      enemyGroup.position.copy(SPAWN);
      enemyGroup.visible = true;
      state = 'patrol';
    }
    updateProjectiles(dt);
    return;
  }

  _toPlayer.subVectors(player.position, enemyGroup.position);
  const dist = _toPlayer.length();

  state = dist < ATTACK_R ? 'attack' : dist < CHASE_R ? 'chase' : 'patrol';

  if (state === 'patrol') {
    patrolAngle += dt * 0.45;
    enemyGroup.position.x = SPAWN.x + Math.cos(patrolAngle) * PATROL_R;
    enemyGroup.position.z = SPAWN.z + Math.sin(patrolAngle) * PATROL_R;
    enemyGroup.rotation.y = -patrolAngle - Math.PI / 2;
  } else if (state === 'chase') {
    const step = _toPlayer.clone().normalize().multiplyScalar(SPEED);
    enemyGroup.position.add(step);
    enemyGroup.rotation.y = Math.atan2(step.x, step.z);
  } else {
    // Attack — face player
    enemyGroup.rotation.y = Math.atan2(_toPlayer.x, _toPlayer.z);
    attackCD -= dt;
    if (attackCD <= 0) {
      spawnProjectile();
      attackCD = 1.6;
    }
  }

  // Walk animation
  const swing = Math.sin(animT * 8) * 0.45;
  leftArm.rotation.x  =  swing; rightArm.rotation.x = -swing;
  leftLeg.rotation.x  = -swing * 0.6; rightLeg.rotation.x =  swing * 0.6;

  updateProjectiles(dt);

  // Project enemy position to screen for HP bar
  const pos3d = enemyGroup.position.clone().add(new Vector3(0, 3.6, 0));
  pos3d.project(camera);
  const sx = ( pos3d.x * 0.5 + 0.5) * window.innerWidth;
  const sy = (-pos3d.y * 0.5 + 0.5) * window.innerHeight;
  if (pos3d.z < 1) {
    hpWrap.style.display  = 'block';
    hpWrap.style.left     = `${sx - 30}px`;
    hpWrap.style.top      = `${sy}px`;
  } else {
    hpWrap.style.display = 'none';
  }
}

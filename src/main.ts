import { Clock, Points, PointLight, BufferAttribute, Mesh, CylinderGeometry, MeshLambertMaterial, Vector3 } from 'three';
import { renderer, scene, camera, animateClouds } from './scene';
import {
  updatePlayer, updateCamera,
  leftArmGroup, rightArmGroup, leftLegGroup, rightLegGroup,
  isMoving, wasJustLanded, player,
  setCharacterColors, damagePlayer as _dmg,
  playerHealth, camYaw,
} from './player';
import { checkHover, drawMinimap, updateTour, updateNameTag, initLegend, initSearch, initAuth } from './ui';
import { buildWorld } from './world';
import { fetchProjects, getDomain } from './data';
import { showCharSelect } from './charselect';
import { initEmotes, updateEmote, isEmoting } from './emotes';
import { updateEnemy, hitEnemy, enemyGroup } from './enemy';
import { initTeleportPads, updateTeleport } from './teleport';
import { playFootstep, playJump, playLand, playShoot } from './sounds';

if (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
  (document.getElementById('mobile-notice') as HTMLElement).style.display = 'block';
}

setTimeout(() => {
  const h = document.getElementById('hint')!;
  h.style.opacity = '0'; h.style.transition = 'opacity 1.5s';
}, 9000);

let loadingHidden = false;
function hideLoading(): void {
  if (loadingHidden) return;
  loadingHidden = true;
  const ld = document.getElementById('loading')!;
  ld.style.opacity = '0';
  setTimeout(() => ld.remove(), 600);
}

// ── COMBAT ZONE PLATFORM ──────────────────────────────────────
const combatMat = new MeshLambertMaterial({ color: 0x1A0000 });
const combatFloor = new Mesh(new CylinderGeometry(20, 20, 0.2, 32), combatMat);
combatFloor.position.set(0, -0.08, -65);
scene.add(combatFloor);

// ── SHOOT INPUT ───────────────────────────────────────────────
window.addEventListener('keydown', e => {
  if (e.code === 'KeyQ') {
    const toEnemy = new Vector3().subVectors(enemyGroup.position, player.position);
    const dist = toEnemy.length();
    if (dist < 22) {
      const fwd = new Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
      if (toEnemy.normalize().dot(fwd) > 0.45) {
        hitEnemy();
        playShoot();
      }
    }
  }
  if (e.code === 'Space' && !e.repeat) playJump();
});

const clock = new Clock();

function animate(): void {
  requestAnimationFrame(animate);
  hideLoading();

  const dt = Math.min(clock.getDelta(), 0.05);
  const t  = clock.getElapsedTime();

  updatePlayer();
  updateTour(dt);
  updateCamera();
  checkHover();
  drawMinimap();
  updateNameTag();
  animateClouds(dt);
  updateEnemy(dt);
  updateTeleport(dt);

  // Sound: footstep + land
  if (isMoving()) playFootstep(t);
  if (wasJustLanded()) playLand();

  // Animation — emote overrides walk animation
  const emoting = updateEmote(t);
  if (!emoting) {
    if (isMoving()) {
      const swing = Math.sin(t * 9) * 0.55;
      leftArmGroup.rotation.x  =  swing; rightArmGroup.rotation.x = -swing;
      leftLegGroup.rotation.x  = -swing; rightLegGroup.rotation.x =  swing;
    } else {
      leftArmGroup.rotation.x  *= 0.82; rightArmGroup.rotation.x *= 0.82;
      leftLegGroup.rotation.x  *= 0.82; rightLegGroup.rotation.x *= 0.82;
    }
  }

  // Squash & stretch on landing
  if (wasJustLanded()) {
    player.scale.set(1.25, 0.72, 1.25);
  } else {
    player.scale.x += (1 - player.scale.x) * 0.22;
    player.scale.y += (1 - player.scale.y) * 0.22;
    player.scale.z += (1 - player.scale.z) * 0.22;
  }

  // Animate zone particles
  scene.traverse(obj => {
    if ((obj as Points).isPoints && obj.userData['isParticle']) {
      const pos  = (obj as Points).geometry.attributes['position'] as BufferAttribute;
      const base = obj.userData['basePos'] as Float32Array;
      for (let i = 0; i < pos.count; i++) {
        pos.setY(i, base[i * 3 + 1] + Math.sin(t * 0.45 + i * 0.7) * 0.4);
      }
      pos.needsUpdate = true;
    }
  });

  // Pulse fountain glow
  scene.traverse(obj => {
    const light = obj as PointLight;
    if (light.isPointLight && Math.abs(obj.position.y - 3.5) < 0.2 && light.intensity > 2) {
      light.intensity = 2.5 + Math.sin(t * 1.8) * 0.8;
    }
  });

  renderer.render(scene, camera);
}

async function init(): Promise<void> {
  // Character selection blocks until the player picks a skin
  const skin = await showCharSelect();
  setCharacterColors(skin);

  const projects = await fetchProjects();
  buildWorld(projects);

  // Build teleport pads using all unique domains in loaded data
  const uniqueDomainIds = [...new Set(projects.map(p => p.domain))];
  const domains = uniqueDomainIds.map(id => getDomain(id));
  initTeleportPads(domains);

  initLegend(projects);
  initSearch(projects);
  await initAuth();

  initEmotes(leftArmGroup, rightArmGroup, leftLegGroup, rightLegGroup);

  animate();
}

init();

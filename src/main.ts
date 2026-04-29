import { Clock, Points, PointLight, BufferAttribute } from 'three';
import { renderer, scene, camera, animateClouds } from './scene';
import {
  updatePlayer, updateCamera,
  leftArmGroup, rightArmGroup, leftLegGroup, rightLegGroup,
  isMoving, wasJustLanded, player,
} from './player';
import { checkHover, drawMinimap, updateTour, updateNameTag, initLegend, initSearch } from './ui';
import { buildWorld } from './world';
import { fetchProjects } from './data';

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

  // Walk animation
  if (isMoving()) {
    const swing = Math.sin(t * 9) * 0.55;
    leftArmGroup.rotation.x  =  swing;
    rightArmGroup.rotation.x = -swing;
    leftLegGroup.rotation.x  = -swing;
    rightLegGroup.rotation.x =  swing;
  } else {
    leftArmGroup.rotation.x  *= 0.82;
    rightArmGroup.rotation.x *= 0.82;
    leftLegGroup.rotation.x  *= 0.82;
    rightLegGroup.rotation.x *= 0.82;
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
  const projects = await fetchProjects();
  buildWorld(projects);
  initLegend(projects);
  initSearch(projects);
  animate();
}

init();

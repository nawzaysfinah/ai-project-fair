// Emote wheel — E to open/close, click segment to play
import { Group } from 'three';
import { playEmote } from './sounds';

interface EmoteDef { label: string; icon: string; key: string; }

const EMOTE_LIST: EmoteDef[] = [
  { label: 'Wave',  icon: '👋', key: 'wave'  },
  { label: 'Dance', icon: '💃', key: 'dance' },
  { label: 'Cheer', icon: '🎉', key: 'cheer' },
  { label: 'Sit',   icon: '🪑', key: 'sit'   },
];

let activeEmote: string | null = null;
let emoteStart = 0;
const EMOTE_DURATION = 2.0;

// Limb groups injected at init time
let _la: Group, _ra: Group, _ll: Group, _rl: Group;

export function initEmotes(
  leftArm: Group, rightArm: Group,
  leftLeg: Group, rightLeg: Group,
): void {
  _la = leftArm; _ra = rightArm; _ll = leftLeg; _rl = rightLeg;
  buildWheel();
  setupKeys();
}

function buildWheel(): void {
  const wheel = document.getElementById('emote-wheel')!;
  EMOTE_LIST.forEach((e, i) => {
    const seg = document.createElement('button');
    seg.className = 'emote-seg';
    seg.dataset['emote'] = e.key;
    seg.innerHTML = `<span class="emote-icon">${e.icon}</span><span class="emote-label">${e.label}</span>`;
    const angle = (i / EMOTE_LIST.length) * 360;
    seg.style.setProperty('--angle', `${angle}deg`);
    seg.addEventListener('click', () => {
      triggerEmote(e.key);
      hideWheel();
    });
    wheel.appendChild(seg);
  });
}

function showWheel(): void {
  document.getElementById('emote-wheel')!.classList.add('open');
}
function hideWheel(): void {
  document.getElementById('emote-wheel')!.classList.remove('open');
}
function toggleWheel(): void {
  document.getElementById('emote-wheel')!.classList.toggle('open');
}

function setupKeys(): void {
  window.addEventListener('keydown', e => {
    if (e.code === 'KeyE' && !e.repeat) toggleWheel();
    if (e.code === 'Escape') hideWheel();
  });
}

function triggerEmote(key: string): void {
  activeEmote = key;
  emoteStart = performance.now() / 1000;
  playEmote();
}

export function isEmoting(): boolean {
  return activeEmote !== null;
}

export function updateEmote(t: number): boolean {
  if (!activeEmote) return false;

  const elapsed = t - emoteStart;
  if (elapsed > EMOTE_DURATION) {
    activeEmote = null;
    // Reset limbs
    [_la, _ra, _ll, _rl].forEach(g => {
      g.rotation.x = 0; g.rotation.z = 0;
    });
    return false;
  }

  const phase = elapsed / EMOTE_DURATION;
  const fade  = phase < 0.9 ? 1 : (1 - phase) / 0.1; // fade out last 10%

  switch (activeEmote) {
    case 'wave': {
      _ra.rotation.z = -Math.sin(elapsed * 6) * 0.7 * fade - 0.8 * fade;
      _ra.rotation.x = -0.3 * fade;
      _la.rotation.x = 0; _ll.rotation.x = 0; _rl.rotation.x = 0;
      break;
    }
    case 'dance': {
      const s = Math.sin(elapsed * 10) * fade;
      _la.rotation.x =  s * 1.0; _ra.rotation.x = -s * 1.0;
      _ll.rotation.x = -s * 0.8; _rl.rotation.x =  s * 0.8;
      _la.rotation.z = Math.cos(elapsed * 5) * 0.3 * fade;
      break;
    }
    case 'cheer': {
      const bounce = Math.abs(Math.sin(elapsed * 8)) * fade;
      _la.rotation.x = -1.8 * fade; _ra.rotation.x = -1.8 * fade;
      _la.rotation.z =  0.3 * bounce; _ra.rotation.z = -0.3 * bounce;
      _ll.rotation.x = 0; _rl.rotation.x = 0;
      break;
    }
    case 'sit': {
      const bend = Math.min(phase * 3, 1) * fade;
      _ll.rotation.x =  1.4 * bend; _rl.rotation.x =  1.4 * bend;
      _la.rotation.x =  0.5 * bend; _ra.rotation.x =  0.5 * bend;
      break;
    }
  }

  return true;
}

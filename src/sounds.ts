// Procedural Web Audio — no external assets required

let ctx: AudioContext | null = null;

function ac(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Noise burst helper
function noise(duration: number, freq: number, q: number, gain: number): void {
  const c = ac();
  const buf = c.createBuffer(1, ~~(c.sampleRate * duration), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++)
    d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
  const src = c.createBufferSource(); src.buffer = buf;
  const flt = c.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = freq; flt.Q.value = q;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(flt); flt.connect(g); g.connect(c.destination);
  src.start();
}

// Tone helper
function tone(type: OscillatorType, startHz: number, endHz: number, duration: number, gain: number): void {
  const c = ac();
  const osc = c.createOscillator(); osc.type = type;
  osc.frequency.setValueAtTime(startHz, c.currentTime);
  osc.frequency.exponentialRampToValueAtTime(endHz, c.currentTime + duration);
  const g = c.createGain(); g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g); g.connect(c.destination);
  osc.start(); osc.stop(c.currentTime + duration);
}

// ── PUBLIC API ────────────────────────────────────────────────

let lastStep = 0;
export function playFootstep(elapsed: number, surface: 'grass' | 'stone' = 'grass'): void {
  if (elapsed - lastStep < 0.35) return;
  lastStep = elapsed;
  if (surface === 'grass') noise(0.07, 280, 1.5, 0.14);
  else                     noise(0.06, 700, 2.5, 0.20);
}

export function playJump(): void   { tone('sine',   280, 560, 0.14, 0.12); }
export function playLand(): void   { noise(0.12, 220, 1.2, 0.30); }
export function playHit(): void    { tone('sawtooth', 160, 80,  0.22, 0.18); }
export function playShoot(): void  { tone('square',   900, 220, 0.09, 0.12); }
export function playTeleport(): void {
  tone('sine', 380, 1400, 0.35, 0.14);
  setTimeout(() => tone('sine', 1400, 380, 0.25, 0.08), 200);
}
export function playEmote(): void  { tone('triangle', 520, 780, 0.18, 0.09); }
export function playEnemyDie(): void {
  tone('sawtooth', 300, 60, 0.4, 0.15);
}

import { Raycaster, Vector2, Vector3 } from 'three';
import { camera, renderer } from './scene';
import { player, camYaw, setCamYaw, setTourActive, isTourActive, dragMoved } from './player';
import { boothMeshes, byDomain, getBoothWorldPos } from './world';
import { getDomain, TECH_COLORS } from './data';
import type { Project, Domain, BoothMeta } from './types';

// ── RAYCASTING ────────────────────────────────────────────────

const raycaster = new Raycaster();
const mouse = new Vector2(-999, -999);
let hoveredProj: Project | null = null;
let allProjects: Project[] = [];

window.addEventListener('mousemove', e => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  const card = document.getElementById('preview')!;
  if (card.style.display !== 'none') {
    card.style.left = Math.min(e.clientX + 18, window.innerWidth  - 290) + 'px';
    card.style.top  = Math.min(e.clientY - 10, window.innerHeight - 380) + 'px';
  }
});

export function checkHover(): void {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(boothMeshes);
  if (hits.length && (hits[0].object.userData as Partial<BoothMeta>).isBooth) {
    const { project: p, domain: d } = hits[0].object.userData as BoothMeta;
    if (hoveredProj !== p) { hoveredProj = p; showPreview(p, d); document.body.style.cursor = 'pointer'; }
  } else {
    if (hoveredProj) { hoveredProj = null; hidePreview(); document.body.style.cursor = 'default'; }
  }
}

renderer.domElement.addEventListener('click', () => {
  if (dragMoved) return;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(boothMeshes);
  if (hits.length && (hits[0].object.userData as Partial<BoothMeta>).isBooth) {
    const { project: p, domain: d } = hits[0].object.userData as BoothMeta;
    openPanel(p, d);
  }
});

// ── PREVIEW CARD ──────────────────────────────────────────────

export function showPreview(p: Project, d: Domain): void {
  document.getElementById('prev-img')!.textContent = p.emoji;
  (document.getElementById('prev-img') as HTMLElement).style.background =
    `linear-gradient(135deg,${d.color}44,#fff)`;
  document.getElementById('prev-name')!.textContent = p.name;
  document.getElementById('prev-student')!.textContent = '👤 ' + p.student;
  document.getElementById('prev-desc')!.textContent = p.short;
  document.getElementById('prev-tags')!.innerHTML = p.tags
    .map(t => `<span class="prev-tag" style="border-color:${d.color};color:${d.color};background:${d.color}18">${t}</span>`)
    .join('');
  document.getElementById('preview')!.style.display = 'block';
}

export function hidePreview(): void {
  document.getElementById('preview')!.style.display = 'none';
}

// ── PROJECT PANEL ─────────────────────────────────────────────

export function openPanel(p: Project, d: Domain): void {
  const badge = document.getElementById('panel-badge')!;
  badge.textContent = `${d.icon} ${d.name}`;
  Object.assign(badge.style, { background: '#E8101A', color: '#fff', border: 'none' });

  document.getElementById('panel-title')!.textContent = p.name;

  const hero = document.getElementById('panel-hero')!;
  if (p.image_url) {
    hero.innerHTML = `<img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:4px">`;
  } else {
    hero.textContent = p.emoji;
  }
  hero.style.background = p.image_url ? 'none' : `linear-gradient(160deg,${d.color}55,#f5f5f5)`;

  // Members with LinkedIn links, fallback to plain student name
  const memberEl = document.getElementById('panel-student')!;
  if (p.members && p.members.length > 0) {
    memberEl.innerHTML = '👤 ' + p.members.map(m =>
      m.linkedin
        ? `<a href="${m.linkedin}" target="_blank" rel="noopener" class="member-link">${m.name}</a>`
        : m.name
    ).join(', ');
  } else {
    memberEl.textContent = '👤 ' + p.student;
  }

  document.getElementById('panel-desc')!.textContent = p.full;
  document.getElementById('panel-tech')!.innerHTML = p.tech
    .map(t => `<span class="chip" style="border-color:${(TECH_COLORS[t] || '#888') + '88'};color:${TECH_COLORS[t] || '#333'};background:${(TECH_COLORS[t] || '#888') + '18'}">${t}</span>`)
    .join('');
  document.getElementById('panel-tags')!.innerHTML = p.tags
    .map(t => `<span class="chip" style="border-color:${d.color}66;color:${d.color};background:${d.color}18">${t}</span>`)
    .join('');

  const lsec = document.getElementById('panel-link-sec')!;
  const lnk  = document.getElementById('panel-link')! as HTMLAnchorElement;
  if (p.link && p.link !== '#') { lsec.style.display = 'block'; lnk.href = p.link; }
  else lsec.style.display = 'none';

  document.getElementById('panel')!.classList.add('open');
  hidePreview();
}

document.getElementById('panel-close')!.addEventListener('click', () => {
  document.getElementById('panel')!.classList.remove('open');
});

// ── LEGEND ────────────────────────────────────────────────────

export function initLegend(projects: Project[]): void {
  allProjects = projects;
  const domainIds = [...new Set(projects.map(p => p.domain))];
  const el = document.getElementById('legend')!;
  el.innerHTML = '<h4>Domains</h4>' + domainIds.map(id => {
    const d = getDomain(id);
    return `<div class="leg-item" data-id="${id}">
      <div class="leg-dot" style="background:${d.color}"></div>
      <span>${d.icon} ${d.name}</span>
      <span class="leg-count">${byDomain[id]?.length ?? 0}</span>
    </div>`;
  }).join('');

  el.querySelectorAll<HTMLElement>('.leg-item').forEach(item => {
    item.addEventListener('click', () => {
      const d = getDomain(item.dataset['id']!);
      player.position.set(d.pos.x, 0, d.pos.z + 15);
      setCamYaw(Math.PI);
      stopTour();
    });
  });
}

// ── MINIMAP ───────────────────────────────────────────────────

const mm  = document.getElementById('minimap') as HTMLCanvasElement;
const mc  = mm.getContext('2d')!;
const MSZ = 160, WR = MSZ / (100 * 2), CX = MSZ / 2, CY = MSZ / 2;
const toMap = (x: number, z: number) => ({ x: CX + x * WR, y: CY + z * WR });

export function drawMinimap(): void {
  mc.clearRect(0, 0, MSZ, MSZ);
  mc.fillStyle = 'rgba(68,187,51,0.15)'; mc.fillRect(0, 0, MSZ, MSZ);

  [...new Set(allProjects.map(p => p.domain))].forEach(id => {
    const d  = getDomain(id);
    const mp = toMap(d.pos.x, d.pos.z); const s = 30 * WR;
    mc.fillStyle = d.color + '44'; mc.fillRect(mp.x - s / 2, mp.y - s / 2, s, s);
    mc.strokeStyle = d.color; mc.lineWidth = 1.5;
    mc.strokeRect(mp.x - s / 2, mp.y - s / 2, s, s);
    mc.font = `${~~Math.max(8, 14 * WR * 3.5)}px serif`;
    mc.textAlign = 'center'; mc.fillStyle = '#333';
    mc.fillText(d.icon, mp.x, mp.y + 4);
  });

  const seen = new Set<number>();
  boothMeshes.forEach(m => {
    const meta = m.userData as Partial<BoothMeta>;
    if (!meta.isBooth || !meta.project) return;
    const pid = meta.project.id;
    if (seen.has(pid)) return; seen.add(pid);
    const wp = new Vector3(); m.getWorldPosition(wp);
    const mp = toMap(wp.x, wp.z);
    mc.fillStyle = meta.domain!.color;
    mc.beginPath(); mc.arc(mp.x, mp.y, 2.5, 0, Math.PI * 2); mc.fill();
  });

  const pp = toMap(player.position.x, player.position.z);
  mc.fillStyle = '#E8101A'; mc.beginPath(); mc.arc(pp.x, pp.y, 4.5, 0, Math.PI * 2); mc.fill();
  mc.strokeStyle = '#fff'; mc.lineWidth = 1.5;
  mc.beginPath(); mc.moveTo(pp.x, pp.y);
  mc.lineTo(pp.x - Math.sin(camYaw) * 9, pp.y - Math.cos(camYaw) * 9); mc.stroke();

  mc.fillStyle = 'rgba(0,0,0,0.4)'; mc.font = '7px Arial';
  mc.textAlign = 'center'; mc.fillText('N', CX, 9);
}

// ── NAME TAG ─────────────────────────────────────────────────

export function updateNameTag(): void {
  const tag = document.getElementById('nametag')!;
  const pos = player.position.clone();
  pos.y += 4.8;
  pos.project(camera);
  if (pos.z > 1) { tag.style.display = 'none'; return; }
  tag.style.display = 'block';
  tag.style.left = ((pos.x * 0.5 + 0.5) * window.innerWidth)  + 'px';
  tag.style.top  = ((-pos.y * 0.5 + 0.5) * window.innerHeight) + 'px';
}

// ── SEARCH ────────────────────────────────────────────────────

export function initSearch(projects: Project[]): void {
  allProjects = projects;
  const sInput = document.getElementById('search-input') as HTMLInputElement;
  const sRes   = document.getElementById('search-results')!;

  sInput.addEventListener('keydown', e => e.stopPropagation());

  sInput.addEventListener('input', () => {
    const q = sInput.value.toLowerCase().trim();
    if (!q) { sRes.style.display = 'none'; return; }
    const matches = allProjects.filter(p =>
      [p.name, p.student, p.short, ...p.tech, ...p.tags, p.domain].some(v => v.toLowerCase().includes(q))
    ).slice(0, 7);

    sRes.innerHTML = matches.length
      ? matches.map(p => {
          const d = getDomain(p.domain);
          return `<div class="s-item" data-id="${p.id}">
            <span style="color:${d.color};font-weight:700">${p.emoji} ${p.name}</span>
            <div class="s-item-sub">${p.student} · ${d.name}</div>
          </div>`;
        }).join('')
      : '<div class="s-item" style="opacity:.4">No results found</div>';

    sRes.querySelectorAll<HTMLElement>('.s-item[data-id]').forEach(item => {
      item.addEventListener('click', () => {
        const proj = allProjects.find(p => p.id === Number(item.dataset['id']))!;
        const dom  = getDomain(proj.domain);
        const wp   = getBoothWorldPos(proj);
        if (wp) { player.position.set(wp.x, 0, wp.z + 7); setCamYaw(Math.PI); }
        else    { player.position.set(dom.pos.x, 0, dom.pos.z + 12); setCamYaw(Math.PI); }
        sInput.value = ''; sRes.style.display = 'none';
        stopTour();
        openPanel(proj, dom);
      });
    });
    sRes.style.display = 'block';
  });

  document.addEventListener('click', e => {
    if (!(e.target as HTMLElement).closest('#search-wrap')) sRes.style.display = 'none';
  });
  sInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') { sInput.value = ''; sRes.style.display = 'none'; }
  });
}

// ── GUIDED TOUR ───────────────────────────────────────────────

interface Waypoint { pos: Vector3; label: string; proj: Project | null; dom?: Domain; }

const SPEED_TOUR = 0.13 * 2.8;
const TOUR_DWELL = 3.8;

let tourWaypoints: Waypoint[] = [];
let tourIdx = 0, tourTimer = 0, tourShown = false;

function buildTourWaypoints(): Waypoint[] {
  return [
    { pos: new Vector3(0, 0, 10), label: 'Welcome to the Student Project Fair! 🎓', proj: null },
    ...allProjects.map(p => {
      const d  = getDomain(p.domain);
      const wp = getBoothWorldPos(p);
      const pos = wp ? new Vector3(wp.x, 0, wp.z + 7) : new Vector3(d.pos.x, 0, d.pos.z + 7);
      return { pos, label: `${p.emoji} ${p.name} — ${p.student}`, proj: p, dom: d };
    }),
    { pos: new Vector3(0, 0, 10), label: 'Tour complete — explore freely! 🎉', proj: null },
  ];
}

function advanceTour(): void {
  if (tourIdx >= tourWaypoints.length) { stopTour(); return; }
  tourShown = false;
  const wp = tourWaypoints[tourIdx];
  document.getElementById('tour-text')!.textContent = `${tourIdx + 1}/${tourWaypoints.length} · ${wp.label}`;
}

export function updateTour(dt: number): void {
  if (!isTourActive()) return;
  const wp  = tourWaypoints[tourIdx];
  const dir = wp.pos.clone().sub(player.position); dir.y = 0;
  if (dir.length() > 1.0) {
    dir.normalize();
    player.position.addScaledVector(dir, SPEED_TOUR);
    player.rotation.y = Math.atan2(dir.x, dir.z);
    setCamYaw(Math.atan2(-dir.x, -dir.z));
  } else {
    tourTimer += dt;
    if (!tourShown && wp.proj && wp.dom && tourTimer > 0.4) {
      showPreview(wp.proj, wp.dom);
      const card = document.getElementById('preview')!;
      card.style.left = '20px'; card.style.top = '50%'; card.style.transform = 'translateY(-50%)';
      tourShown = true;
    }
    if (tourTimer >= TOUR_DWELL) {
      tourTimer = 0; tourIdx++;
      hidePreview();
      const card = document.getElementById('preview')!;
      card.style.left = ''; card.style.top = ''; card.style.transform = '';
      advanceTour();
    }
  }
}

export function startTour(): void {
  tourWaypoints = buildTourWaypoints();
  setTourActive(true); tourIdx = 0; tourTimer = 0; tourShown = false;
  document.getElementById('tour-btn')!.textContent = '⏹ Stop Tour';
  document.getElementById('tour-btn')!.classList.add('active');
  document.getElementById('tour-bar')!.style.display = 'block';
  advanceTour();
}

export function stopTour(): void {
  setTourActive(false);
  document.getElementById('tour-btn')!.textContent = '▶ Guided Tour';
  document.getElementById('tour-btn')!.classList.remove('active');
  document.getElementById('tour-bar')!.style.display = 'none';
  hidePreview();
  const card = document.getElementById('preview')!;
  card.style.left = ''; card.style.top = ''; card.style.transform = '';
}

document.getElementById('tour-btn')!.addEventListener('click', () => {
  if (isTourActive()) stopTour(); else startTour();
});

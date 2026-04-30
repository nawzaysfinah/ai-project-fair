import { supabase } from './supabase';
import { getUser, checkIsAdmin } from './auth';
import type { Member } from './types';

// ── EDIT MODE PREFILL ─────────────────────────────────────────

const editId = new URLSearchParams(location.search).get('edit');
let existingImageUrl: string | undefined;

async function initEditMode(): Promise<void> {
  if (!editId || !supabase) return;

  document.querySelector<HTMLElement>('#submit-red-bar')!.textContent = 'EDIT PROJECT';
  document.querySelector<HTMLElement>('#submit-header h1')!.textContent = 'Edit Your Booth';
  document.getElementById('submit-btn')!.querySelector<HTMLElement>('#submit-label')!.textContent = '💾 Save Changes';

  const { data, error } = await supabase.from('projects').select('*').eq('id', editId).single();
  if (error || !data) {
    document.getElementById('submit-error')!.textContent = 'Project not found.';
    document.getElementById('submit-error')!.style.display = 'block';
    return;
  }

  // Auth gate — must be owner or admin
  const user = await getUser();
  if (!user) {
    document.getElementById('submit-error')!.textContent = 'You must be signed in to edit this project.';
    document.getElementById('submit-error')!.style.display = 'block';
    document.getElementById('submit-btn')!.setAttribute('disabled', 'true');
    return;
  }
  const admin = await checkIsAdmin(user.id);
  if (!admin && data['user_id'] !== user.id) {
    document.getElementById('submit-error')!.textContent = 'You don\'t have permission to edit this project.';
    document.getElementById('submit-error')!.style.display = 'block';
    document.getElementById('submit-btn')!.setAttribute('disabled', 'true');
    return;
  }

  // Prefill fields
  (document.getElementById('f-name')    as HTMLInputElement).value  = data['name']  ?? '';
  (document.getElementById('f-domain')  as HTMLInputElement).value  = data['domain'] ?? '';
  (document.getElementById('f-short')   as HTMLInputElement).value  = data['short'] ?? '';
  (document.getElementById('f-full')    as HTMLTextAreaElement).value = data['full'] ?? '';
  (document.getElementById('f-emoji')   as HTMLInputElement).value  = data['emoji'] ?? '🚀';
  (document.getElementById('f-link')    as HTMLInputElement).value  = data['link'] !== '#' ? (data['link'] ?? '') : '';

  // Prefill tech + tags chips
  ((data['tech'] as string[]) ?? []).forEach(v => addChipExternally('tech-input', 'tech-chips', v));
  ((data['tags'] as string[]) ?? []).forEach(v => addChipExternally('tag-input',  'tag-chips',  v));

  // Prefill members
  const mems: Member[] = (data['members'] as Member[]) ?? [];
  // Remove the auto-added empty row first
  document.getElementById('members-list')!.innerHTML = '';
  members.length = 0;
  mems.forEach(m => addMemberRow(m.name, m.linkedin));
  if (mems.length === 0) addMemberRow();

  // Show existing image
  existingImageUrl = data['image_url'] as string | undefined;
  if (existingImageUrl) {
    const img = document.getElementById('image-preview') as HTMLImageElement;
    img.src = existingImageUrl; img.style.display = 'block';
    document.getElementById('drop-icon')!.style.display = 'none';
    document.getElementById('drop-text')!.style.display = 'none';
  }
}

// External chip adder used by prefill
function addChipExternally(inputId: string, chipsId: string, val: string): void {
  const input = document.getElementById(inputId) as HTMLInputElement;
  const prev  = input.value;
  input.value = val;
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  input.value = prev;
}

// ── CHIP INPUTS ───────────────────────────────────────────────

function makeChipInput(inputId: string, chipsId: string): () => string[] {
  const input  = document.getElementById(inputId)  as HTMLInputElement;
  const chips  = document.getElementById(chipsId)!;
  const values: string[] = [];

  function addChip(val: string): void {
    const v = val.trim();
    if (!v || values.includes(v)) return;
    values.push(v);
    const chip = document.createElement('span');
    chip.className = 'chip-tag';
    chip.textContent = v;
    const x = document.createElement('button');
    x.type = 'button'; x.textContent = '×';
    x.addEventListener('click', () => {
      values.splice(values.indexOf(v), 1);
      chip.remove();
    });
    chip.appendChild(x);
    chips.appendChild(chip);
    input.value = '';
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addChip(input.value.replace(/,$/, ''));
    }
  });
  input.addEventListener('blur', () => addChip(input.value));

  return () => values.slice();
}

const getTech = makeChipInput('tech-input', 'tech-chips');
const getTags = makeChipInput('tag-input',  'tag-chips');

// ── MEMBER ROWS ───────────────────────────────────────────────

const membersList = document.getElementById('members-list')!;
const members: { name: string; linkedin: string }[] = [];

function addMemberRow(prefillName = '', prefillLi = ''): void {
  const idx = members.length;
  members.push({ name: prefillName, linkedin: prefillLi });

  const row = document.createElement('div');
  row.className = 'member-row';
  row.innerHTML = `
    <input class="m-name" type="text" placeholder="Full name *" required value="${prefillName.replace(/"/g, '&quot;')}">
    <input class="m-li"   type="url"  placeholder="LinkedIn URL (optional)" value="${prefillLi.replace(/"/g, '&quot;')}">
    <button type="button" class="rm-btn">×</button>
  `;
  const nameInput = row.querySelector<HTMLInputElement>('.m-name')!;
  const liInput   = row.querySelector<HTMLInputElement>('.m-li')!;
  const rmBtn     = row.querySelector<HTMLButtonElement>('.rm-btn')!;

  nameInput.addEventListener('input', () => { members[idx].name     = nameInput.value.trim(); });
  liInput.addEventListener('input',   () => { members[idx].linkedin = liInput.value.trim(); });
  rmBtn.addEventListener('click', () => {
    members.splice(idx, 1);
    row.remove();
  });

  membersList.appendChild(row);
  nameInput.focus();
}

document.getElementById('add-member-btn')!.addEventListener('click', () => addMemberRow());
addMemberRow(); // start with one row

// ── IMAGE DROP ZONE ───────────────────────────────────────────

const fileInput   = document.getElementById('f-image')     as HTMLInputElement;
const dropZone    = document.getElementById('image-drop')!;
const dropText    = document.getElementById('drop-text')!;
const dropIcon    = document.getElementById('drop-icon')!;
const imgPreview  = document.getElementById('image-preview') as HTMLImageElement;

function handleFile(file: File): void {
  if (file.size > 5 * 1024 * 1024) { showError('Image must be under 5 MB'); return; }
  const url = URL.createObjectURL(file);
  imgPreview.src = url; imgPreview.style.display = 'block';
  dropIcon.style.display = 'none'; dropText.style.display = 'none';
}

fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
});

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('drag-over');
  const f = e.dataTransfer?.files[0];
  if (f) { handleFile(f); /* assign to input is not possible via DataTransfer, store ref */ storedFile = f; }
});

let storedFile: File | null = null;
function getFile(): File | null {
  return fileInput.files?.[0] ?? storedFile;
}

// ── ERROR DISPLAY ─────────────────────────────────────────────

function showError(msg: string): void {
  const el = document.getElementById('submit-error')!;
  el.textContent = msg; el.style.display = 'block';
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function clearError(): void {
  document.getElementById('submit-error')!.style.display = 'none';
}

// ── FORM SUBMIT ───────────────────────────────────────────────

document.getElementById('submit-form')!.addEventListener('submit', async e => {
  e.preventDefault();
  clearError();

  const name   = (document.getElementById('f-name')   as HTMLInputElement).value.trim();
  const domainRaw = (document.getElementById('f-domain') as HTMLInputElement).value.trim();
  const domain = domainRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const short  = (document.getElementById('f-short')  as HTMLInputElement).value.trim();
  const full   = (document.getElementById('f-full')   as HTMLTextAreaElement).value.trim();
  const emoji  = (document.getElementById('f-emoji')  as HTMLInputElement).value.trim() || '🚀';
  const link   = (document.getElementById('f-link')   as HTMLInputElement).value.trim() || '#';
  const tech   = getTech();
  const tags   = getTags();

  const validMembers: Member[] = members.filter(m => m.name);

  if (!name)              return showError('Project name is required.');
  if (!domain)            return showError('Domain is required.');
  if (!short)             return showError('One-line pitch is required.');
  if (!full)              return showError('Full description is required.');
  if (tech.length === 0)  return showError('Add at least one technology.');
  if (validMembers.length === 0) return showError('Add at least one group member.');

  const btn     = document.getElementById('submit-btn')!;
  const label   = document.getElementById('submit-label')!;
  const spinner = document.getElementById('submit-spinner')!;
  btn.setAttribute('disabled', 'true');
  label.style.display  = 'none';
  spinner.style.display = 'inline';

  try {
    if (!supabase) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.');

    let image_url: string | undefined = existingImageUrl;

    const file = getFile();
    if (file) {
      const ext  = file.name.split('.').pop() ?? 'png';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('project-images')
        .upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw new Error(`Image upload failed: ${upErr.message}`);
      const { data: urlData } = supabase.storage.from('project-images').getPublicUrl(path);
      image_url = urlData.publicUrl;
    }

    const payload = {
      name, domain, short, full, emoji, link, tech, tags,
      members: validMembers,
      image_url: image_url ?? null,
    };

    if (editId) {
      const { error } = await supabase.from('projects').update(payload).eq('id', editId);
      if (error) throw new Error(`Update failed: ${error.message}`);
    } else {
      const user = await getUser();
      const { error } = await supabase.from('projects').insert({
        ...payload,
        ...(user ? { user_id: user.id } : {}),
      });
      if (error) throw new Error(`Submission failed: ${error.message}`);
    }

    document.getElementById('submit-form')!.style.display = 'none';
    document.getElementById('success-box')!.style.display = 'block';

  } catch (err) {
    showError((err as Error).message);
    btn.removeAttribute('disabled');
    label.style.display  = 'inline';
    spinner.style.display = 'none';
  }
});

// Update success message for edit mode
if (editId) {
  document.querySelector<HTMLElement>('#success-box h2')!.textContent = 'Changes saved!';
  document.querySelector<HTMLElement>('#success-box p')!.textContent = 'Your booth has been updated.';
}

initEditMode();

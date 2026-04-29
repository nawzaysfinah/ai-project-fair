import { supabase } from './supabase';
import type { Member } from './types';

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

function addMemberRow(): void {
  const idx = members.length;
  members.push({ name: '', linkedin: '' });

  const row = document.createElement('div');
  row.className = 'member-row';
  row.innerHTML = `
    <input class="m-name" type="text" placeholder="Full name *" required>
    <input class="m-li"   type="url"  placeholder="LinkedIn URL (optional)">
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

document.getElementById('add-member-btn')!.addEventListener('click', addMemberRow);
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
  const domain = (document.getElementById('f-domain') as HTMLSelectElement).value;
  const short  = (document.getElementById('f-short')  as HTMLInputElement).value.trim();
  const full   = (document.getElementById('f-full')   as HTMLTextAreaElement).value.trim();
  const emoji  = (document.getElementById('f-emoji')  as HTMLInputElement).value.trim() || '🚀';
  const link   = (document.getElementById('f-link')   as HTMLInputElement).value.trim() || '#';
  const tech   = getTech();
  const tags   = getTags();

  const validMembers: Member[] = members.filter(m => m.name);

  if (!name)              return showError('Project name is required.');
  if (!domain)            return showError('Please select a domain.');
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

    let image_url: string | undefined;

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

    const { error: insErr } = await supabase.from('projects').insert({
      name, domain, short, full, emoji, link, tech, tags,
      members: validMembers,
      ...(image_url ? { image_url } : {}),
    });

    if (insErr) throw new Error(`Submission failed: ${insErr.message}`);

    document.getElementById('submit-form')!.style.display = 'none';
    document.getElementById('success-box')!.style.display = 'block';

  } catch (err) {
    showError((err as Error).message);
    btn.removeAttribute('disabled');
    label.style.display  = 'inline';
    spinner.style.display = 'none';
  }
});

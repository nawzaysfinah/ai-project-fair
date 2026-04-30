// Character selection screen — shown before the 3D world loads

export interface CharSkin {
  name: string;
  emoji: string;
  skin: number;
  torso: number;
  leg: number;
  hat: number;
}

export const SKINS: CharSkin[] = [
  { name: 'Classic',        emoji: '🎓', skin: 0xFFD700, torso: 0x0066FF, leg: 0x1A1A2E, hat: 0x888888 },
  { name: 'Dark Knight',    emoji: '🛡️', skin: 0x3A2222, torso: 0x220022, leg: 0x110011, hat: 0xAA0000 },
  { name: 'Space Explorer', emoji: '🚀', skin: 0xDDFFFF, torso: 0xDDEEFF, leg: 0x224488, hat: 0xFFFFFF },
];

const LS_KEY = 'fair_char_v2';

export function getSavedSkinIndex(): number {
  const n = parseInt(localStorage.getItem(LS_KEY) ?? '0', 10);
  return n >= 0 && n < SKINS.length ? n : 0;
}

export function showCharSelect(): Promise<CharSkin> {
  return new Promise(resolve => {
    const overlay = document.getElementById('charselect')!;
    overlay.style.display = 'flex';

    const cards = Array.from(overlay.querySelectorAll<HTMLElement>('.cs-card'));
    const saved = getSavedSkinIndex();
    cards[saved]?.classList.add('selected');

    cards.forEach((card, i) => {
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
      // Double-click enters directly
      card.addEventListener('dblclick', () => enter(i));
    });

    function enter(forceIdx?: number): void {
      const idx = forceIdx ?? cards.findIndex(c => c.classList.contains('selected'));
      const chosen = idx >= 0 ? idx : 0;
      localStorage.setItem(LS_KEY, String(chosen));
      overlay.style.display = 'none';
      resolve(SKINS[chosen]);
    }

    overlay.querySelector<HTMLButtonElement>('#cs-enter-btn')!
      .addEventListener('click', () => enter());
  });
}

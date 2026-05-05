# 🎓 AI Project Fair 2025

An **interactive 3D virtual campus** where students showcase their AI projects. Walk around, explore booths, and discover what your classmates built — all in real time, in your browser.

**Live at:** [syaz.super.site](https://syaz.super.site)

---

## About

This project turns a traditional project fair into an immersive experience. Instead of a static gallery, visitors step into a 3D campus, stroll between booths organised by domain, and click to read full project details — no installs, no app, just a browser tab.

Built by **syaz** ([@nawzaysfinah](https://github.com/nawzaysfinah)) — a student at ITE, Singapore, tinkering with web tech and interactive experiences.

---

## Features

| Feature | Description |
|---|---|
| 🚶 3D campus | Walk around with WASD, jump with Space, drag to look |
| 🏪 Project booths | Hover to preview, click to read full details |
| 🌀 Teleport pads | Warp instantly between domain zones |
| 🔍 Live search | Find projects by name, tech stack, or student |
| ▶ Guided tour | Auto-walk through every zone |
| 💃 Emote wheel | Press E to express yourself |
| ⚔️ Combat zone | Head north and press Q to fight the guard |
| ➕ Submit a project | Anyone can add their own project via the form |
| 🔐 Magic-link auth | Passwordless sign-in — own and edit your submissions |

---

## Tech Stack

- **Three.js** — 3D rendering
- **TypeScript** — type-safe game logic
- **Vite** — fast dev + build tooling
- **Supabase** — database, auth (magic links), and real-time data

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/nawzaysfinah/ai-project-fair.git
cd ai-project-fair

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Fill in your Supabase URL and anon key

# 4. Run the database schema
# Paste supabase/schema.sql into your Supabase SQL editor

# 5. Start
npm run dev
```

Open `http://localhost:5173` and pick your character.

---

## Project Structure

```
src/
├── main.ts        # Game loop, combat, animation
├── scene.ts       # Three.js renderer, camera, lights, clouds
├── player.ts      # Movement, physics, character model
├── world.ts       # Booth placement, zones, terrain
├── ui.ts          # HUD, search, minimap, tour, name tag
├── data.ts        # Supabase queries, domain config
├── auth.ts        # Magic-link sign-in flow
├── charselect.ts  # Character selection screen
├── enemy.ts       # Combat-zone guard AI
├── teleport.ts    # Glowing pads + zone warp
├── emotes.ts      # Emote wheel + animations
└── sounds.ts      # Footstep, jump, land, shoot SFX
```

---

## Controls

| Key / Action | Effect |
|---|---|
| `W A S D` | Walk |
| `Space` | Jump |
| `Q` | Shoot (combat zone) |
| `E` | Emote wheel |
| `Mouse drag` | Rotate camera |
| `Click booth` | Open project panel |

---

## Contributing

Pull requests are welcome. To add a feature:

1. Fork the repo and create a branch
2. Make your changes (`npm run dev` to test)
3. Run `npm run build` — make sure it compiles cleanly
4. Open a PR with a short description of what you changed and why

---

## License

MIT — use it, fork it, make your own fair.

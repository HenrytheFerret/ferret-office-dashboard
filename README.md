# Ferret Office Dashboard

Real‑time visualisation of agent task status with animated ferret sprites.

## Overview

This dashboard displays the status of Henry’s agent team (Kevin, Alex, Jordan, Milo, Riley, Casey, Sam, Quinn) as they work through tasks in `TASKS.md`. Each agent is represented by a Pokémon‑style ferret sprite that moves, animates, and changes state based on task progress.

## Features

- **Live WebSocket updates** – backend monitors `TASKS.md` and broadcasts agent status changes
- **Retro Pokémon‑style ferret sprites** – 8 distinct agents with idle, walking, working, celebrating, and anxious animations
- **Dynamic office scene** – tile‑based office layout with day/night cycle
- **Agent‑specific accessories** – each ferret wears a unique item (headset, keyboard, etc.)
- **Quality‑first visuals** – polished pixel art and smooth animations

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Backend

```bash
cd backend
npm install
npm start
```

The backend will start on `http://localhost:3000` and watch `TASKS.md` for changes.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Configuration

The backend looks for `TASKS.md` relative to its parent directory by default. If your `TASKS.md` is elsewhere, set the `TASKS_FILE_PATH` environment variable:

```bash
# Linux/macOS
export TASKS_FILE_PATH="/path/to/your/TASKS.md"

# Windows (PowerShell)
$env:TASKS_FILE_PATH = "C:\path\to\your\TASKS.md"

# Or when starting the server
TASKS_FILE_PATH=/path/to/TASKS.md npm start
```

The backend will log the path it’s monitoring on startup.

## Development

### Adding a new agent

1. Add the agent to `frontend/src/config/agents.json` with a `deskPosition` and color.
2. Create a sprite SVG (see `assets/sprites/kevin-sprite-pokemon.svg` for reference).
3. Run the conversion script: `node convert-pokemon-sprites.js`.
4. The agent will appear automatically when the backend parses a task assigned to them.

### Updating sprites

All Pokémon‑style sprite SVGs are in `frontend/src/assets/sprites/`. Use `convert-pokemon-sprites.js` to generate PNG sprite sheets.

### Customizing the office

Edit `frontend/src/assets/tilemaps/office_tileset.svg` and `office_map.json`.

## Project Structure

```
ferret‑dashboard/
├── backend/                 # Node.js + WebSocket server
├── frontend/               # Phaser.js frontend
├── convert‑pokemon‑sprites.js  # SVG → PNG sprite‑sheet converter
├── create‑final‑assets.js  # Asset generation utilities
└── README.md
```

## License

MIT
# Daily Missions

A personalised ADHD productivity app for Razi — powered by an AI companion called Buddy.

## Stack

- **Frontend:** React + Vite (port 5173)
- **Backend:** Node.js + Express (port 3001)
- **Database:** SQLite via better-sqlite3
- **AI:** Anthropic SDK (`claude-sonnet-4-5`)
- **Notifications:** node-cron (daily 8:30am greeting logged to console)

---

## Setup

### 1. Install dependencies

```bash
# From the daily-missions root
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

Or use the shortcut:
```bash
npm run install:all
```

### 2. Configure your API key

Copy the example env file and add your Anthropic API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

### 3. Run in development

```bash
npm run dev
```

This starts both the Express server (port 3001) and Vite dev server (port 5173) concurrently.

Open **http://localhost:5173** in your browser.

---

## Access on mobile (same Wi-Fi)

1. Find your Mac's local IP: `ipconfig getifaddr en0`
2. On your phone, open `http://<your-ip>:5173`

The Vite server is configured with `host: true` so it's accessible on the local network.

---

## Features

| Screen | Description |
|---|---|
| **Dashboard** | 5 daily mission cards with XP bar and Buddy banner |
| **Focus Timer** | Circular countdown ring, AI companion messages, check-in and done-early buttons |
| **Mission Complete** | Celebration screen with stats and personalized AI message |
| **Buddy Chat** | Persistent streaming chat with Buddy, loaded from SQLite |
| **Greeting Modal** | AI-generated daily greeting shown once per day on open |

---

## Database

SQLite file created at `server/missions.db` on first run. Tables:

- `stats` — XP and last-opened date
- `missions` — per-mission streaks and last-completed date
- `messages` — full chat history

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/stats` | Load XP, level, streaks, missions |
| POST | `/api/complete-mission` | Mark mission done, update XP + streak |
| POST | `/api/greeting` | Generate daily greeting |
| POST | `/api/mission-start` | Generate send-off message |
| POST | `/api/mission-midway` | Generate halfway message |
| POST | `/api/mission-complete` | Generate celebration message |
| POST | `/api/checkin` | Generate mid-session check-in |
| GET | `/api/messages` | Load last 50 chat messages |
| POST | `/api/chat` | Streaming SSE chat with Buddy |

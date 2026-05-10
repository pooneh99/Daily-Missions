const express = require('express');
const router = express.Router();
const db = require('./db');
const { generateMessage, streamChatToResponse } = require('./ai');

// GET /api/health — Railway healthcheck
router.get('/health', (_req, res) => res.json({ status: 'ok' }));

const today = () => new Date().toISOString().split('T')[0];

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// GET /api/stats
router.get('/stats', (req, res) => {
  const stats = db.prepare('SELECT * FROM stats WHERE id = 1').get();
  const missions = db.prepare('SELECT * FROM missions ORDER BY id').all();
  const todayStr = today();
  const isNewDay = stats.last_opened !== todayStr;

  if (isNewDay) {
    db.prepare('UPDATE stats SET last_opened = ? WHERE id = 1').run(todayStr);
  }

  const level = Math.floor(stats.xp / 1000) + 1;
  const levelXP = stats.xp % 1000;

  const missionsOut = missions.map((m) => ({
    ...m,
    completed_today: m.last_completed === todayStr,
  }));

  res.json({ xp: stats.xp, level, levelXP, missions: missionsOut, isNewDay });
});

// POST /api/complete-mission
router.post('/complete-mission', (req, res) => {
  const { missionId, xpAmount } = req.body;
  const todayStr = today();

  const mission = db.prepare('SELECT * FROM missions WHERE id = ?').get(missionId);
  if (!mission) return res.status(404).json({ error: 'Mission not found' });

  if (mission.last_completed === todayStr) {
    return res.json({ alreadyDone: true, newStreak: mission.streak });
  }

  const newStreak = mission.streak + 1;
  db.prepare('UPDATE missions SET streak = ?, last_completed = ? WHERE id = ?')
    .run(newStreak, todayStr, missionId);

  const stats = db.prepare('SELECT xp FROM stats WHERE id = 1').get();
  const newXP = stats.xp + (xpAmount || 0);
  db.prepare('UPDATE stats SET xp = ? WHERE id = 1').run(newXP);

  const level = Math.floor(newXP / 1000) + 1;
  const levelXP = newXP % 1000;

  res.json({ newXP, level, levelXP, newStreak, alreadyDone: false });
});

// POST /api/greeting
router.post('/greeting', async (req, res) => {
  const { streaks } = req.body || {};
  const tod = timeOfDay();
  const streakSummary = streaks
    ? Object.entries(streaks)
        .map(([label, streak]) => `${label}: ${streak}-day streak`)
        .join(', ')
    : 'fresh start';

  const prompt = `Generate a warm, energetic ${tod} greeting for Razi to kick off his day. Current streaks: ${streakSummary}. Keep it personal and punchy — 2–3 sentences.`;
  const message = await generateMessage(prompt, 'greeting');
  res.json({ message });
});

// POST /api/mission-start
router.post('/mission-start', async (req, res) => {
  const { mission, streak } = req.body;
  const prompt = `Razi is about to start his "${mission}" mission. Current streak: ${streak} days. Give him a short, punchy send-off — 2 sentences max.`;
  const message = await generateMessage(prompt, 'missionStart');
  res.json({ message });
});

// POST /api/mission-midway
router.post('/mission-midway', async (req, res) => {
  const { mission, timeRemaining } = req.body;
  const prompt = `Razi is halfway through his "${mission}" mission with ${timeRemaining} minutes left. Give him a midway boost — 2 sentences max.`;
  const message = await generateMessage(prompt, 'missionMidway');
  res.json({ message });
});

// POST /api/mission-complete
router.post('/mission-complete', async (req, res) => {
  const { mission, streak, xpEarned, totalDoneToday } = req.body;
  const prompt = `Razi just completed his "${mission}" mission! New streak: ${streak} days. Earned ${xpEarned} XP. Missions done today: ${totalDoneToday}. Celebrate this loudly and warmly — 2–3 sentences.`;
  const message = await generateMessage(prompt, 'missionComplete');
  res.json({ message });
});

// POST /api/checkin
router.post('/checkin', async (req, res) => {
  const { mission, timeRemaining } = req.body;
  const prompt = `Razi just checked in mid-session on his "${mission}" mission. ${timeRemaining} minutes left. Give him a quick real check-in — 1–2 sentences.`;
  const message = await generateMessage(prompt, 'checkin');
  res.json({ message });
});

// POST /api/tts  — ElevenLabs proxy (key stays server-side)
// Voice: Adam — warm, young, natural male. Change ELEVENLABS_VOICE_ID in .env to swap.
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB';

router.post('/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(503).json({ error: 'ELEVENLABS_API_KEY not configured' });
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',   // fastest + highest quality
          voice_settings: {
            stability: 0.4,          // less stable = more expressive/natural
            similarity_boost: 0.8,
            style: 0.5,              // adds character
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!upstream.ok) {
      const err = await upstream.text();
      console.error('ElevenLabs error:', upstream.status, err);
      return res.status(upstream.status).json({ error: 'TTS upstream error' });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('TTS route error:', err.message);
    res.status(500).json({ error: 'TTS failed' });
  }
});

// GET /api/messages
router.get('/messages', (req, res) => {
  const messages = db
    .prepare('SELECT * FROM messages ORDER BY id DESC LIMIT 50')
    .all();
  res.json(messages.reverse());
});

// POST /api/chat (streaming SSE)
router.post('/chat', async (req, res) => {
  const { message, history } = req.body;

  // Save user message
  db.prepare('INSERT INTO messages (role, content) VALUES (?, ?)').run('user', message);

  // Build messages array (last 50 for context)
  const apiMessages = [
    ...(history || []).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  const fullText = await streamChatToResponse(apiMessages, res);

  // Save assistant response (already ended, but DB write is synchronous)
  if (fullText) {
    db.prepare('INSERT INTO messages (role, content) VALUES (?, ?)').run('assistant', fullText);
  }
});

module.exports = router;

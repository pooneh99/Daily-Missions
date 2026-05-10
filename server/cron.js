const cron = require('node-cron');
const { generateMessage } = require('./ai');
const db = require('./db');

function setupCron() {
  cron.schedule('30 8 * * *', async () => {
    console.log('🌅 Running daily morning greeting job...');

    try {
      const missions = db.prepare('SELECT * FROM missions').all();
      const streakSummary = missions
        .map((m) => `${m.label}: ${m.streak} days`)
        .join(', ');

      const prompt = `Generate a warm morning greeting for Razi to start his day. His current streaks: ${streakSummary}. Keep it punchy and motivating — 2–3 sentences.`;
      const message = await generateMessage(prompt, 'greeting');

      console.log('📬 Daily greeting:', message);
    } catch (err) {
      console.error('Cron greeting error:', err.message);
    }
  });

  console.log('⏰ Daily greeting cron scheduled for 8:30am');
}

module.exports = { setupCron };

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { setupCron } = require('./cron');

const app = express();
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());
app.use('/api', routes);

// In production, serve the Vite build and handle SPA routing
if (isProd) {
  const distPath = path.join(__dirname, '../client/dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

setupCron();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Daily Missions server running on http://localhost:${PORT}`);
  if (!isProd) console.log(`   Also reachable on your local network at http://<your-ip>:${PORT}`);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const AGENT_API_KEY = process.env.AGENT_API_KEY;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
    },
  },
}));

// CORS - restrict to your domains only
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json());

// API Key Authentication Middleware
const authenticateAgent = (req, res, next) => {
  const apiKey = req.headers['x-agent-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'No API key provided' });
  }

  if (apiKey !== AGENT_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
};

// ============================================
// Public Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// API routes - try to match /api/* paths first
app.use('/api/user/profile', authenticateAgent, (req, res) => {
  res.json({
    userId: 'example_user',
    name: 'Event Notes User',
    createdAt: new Date().toISOString()
  });
});

app.get('/api/events', authenticateAgent, (req, res) => {
  res.json([]);
});

app.post('/api/events', authenticateAgent, (req, res) => {
  const { title, date, notes } = req.body;
  res.status(201).json({
    id: Date.now().toString(),
    title,
    date,
    notes,
    created: new Date().toISOString()
  });
});

app.get('/api/calendar/status', authenticateAgent, (req, res) => {
  res.json({ connected: false, service: null });
});

app.get('/api/camera/permissions', authenticateAgent, (req, res) => {
  res.json({ granted: false, settings: {} });
});

// Serve index.html for SPA routes (not API or static files)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/') && !req.path.startsWith('/health')) {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Bot/AI crawler blocking
app.use((req, res, next) => {
  const userAgent = req.headers['user-agent'] || '';

  const blockedAgents = [
    'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
    'yandexbot', 'facebot', 'ia_archiver', 'twitterbot', 'applebot',
    'semrushbot', 'ahrefsbot', 'dotbot', 'seekport', 'sistrix',
    'meta-externalagent', 'anthropic-ai', 'openai', 'claude-ai',
    'chatgpt', 'google-hash', 'google-extended', 'ccbot', 'claude-web'
  ];

  const lowerUA = userAgent.toLowerCase();
  const isBlocked = blockedAgents.some(agent => lowerUA.includes(agent));

  if (isBlocked) {
    res.status(403).send('Access denied');
    return;
  }

  next();
});

// 404 handler for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server (only if not in serverless environment)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Protected endpoints: /api/*`);
    if (!AGENT_API_KEY) {
      console.warn('WARNING: AGENT_API_KEY not set!');
    }
  });
}

module.exports = app;

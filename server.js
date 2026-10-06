require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const db = require('./config/database');
const { initSocket } = require('./services/socketService');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const {
  client,
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  databaseConnected
} = require('./metrics/prometheus');
const { seedData } = require('./db/seed');

const app = express();
const server = http.createServer(app);

// 1. Initialize Socket.IO
initSocket(server);

// 2. Security & Request Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts/styles for development and API dashboard
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Prometheus Request Monitoring Middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDurationMicroseconds
      .labels(req.method, route, String(res.statusCode))
      .observe(durationInSeconds);

    httpRequestsTotal
      .labels(req.method, route, String(res.statusCode))
      .inc();
  });
  next();
});

// 4. Rate Limiter for Authentication Endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth', authLimiter);

// 5. Meaningful Health and Observability Endpoints
// Process liveness check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    service: 'campusflow-backend'
  });
});

app.get('/live', (req, res) => {
  res.status(200).json({ status: 'ALIVE' });
});

// Readiness check - validates active PostgreSQL database connection
app.get('/ready', async (req, res) => {
  try {
    const dbHealth = await db.checkHealth();
    if (!dbHealth.connected) {
      databaseConnected.set(0);
      return res.status(503).json({
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: dbHealth.error,
        message: 'PostgreSQL database is currently unreachable.'
      });
    }

    databaseConnected.set(1);
    return res.status(200).json({
      status: 'READY',
      database: 'CONNECTED',
      engine: dbHealth.engine,
      latencyMs: dbHealth.latencyMs,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    databaseConnected.set(0);
    return res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: err.message
    });
  }
});

// Prometheus Scraping Endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// 6. Mount REST API Routes
app.use('/api', apiRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'CampusFlow API',
    version: '1.0.0',
    description: 'Smart College Portal — Reliable, Scalable & DevOps Ready',
    health: '/health',
    readiness: '/ready',
    metrics: '/metrics',
    documentation: '/api'
  });
});

// 7. Central Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.initializeDatabase();
    // Auto-seed if running in development mode
    if (process.env.AUTO_SEED === 'true' || process.env.NODE_ENV !== 'production') {
      try {
        await seedData();
      } catch (seedErr) {
        console.warn('[Seed] Notice during seed:', seedErr.message);
      }
    }

    server.listen(PORT, () => {
      console.log(`======================================================`);
      console.log(` CampusFlow Backend API running on port ${PORT}`);
      console.log(` Health Probe:  http://localhost:${PORT}/health`);
      console.log(` Ready Probe:   http://localhost:${PORT}/ready`);
      console.log(` Metrics:       http://localhost:${PORT}/metrics`);
      console.log(`======================================================`);
    });
  } catch (err) {
    console.error('Fatal startup error:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server };

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const routes = require('./routes');
const { swaggerUi, swaggerSpec, customUiOptions } = require('./config/swagger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://[::1]:5173',
].filter(Boolean);

// --- Security & core middleware ---
// CSP is kept enabled globally across the entire API, but disabled specifically for /api/docs so Swagger UI assets & scripts execute cleanly
const globalHelmet = helmet();
const docsHelmet = helmet({ contentSecurityPolicy: false });

app.use((req, res, next) => {
  if (req.path.startsWith('/api/docs')) {
    return docsHelmet(req, res, next);
  }
  return globalHelmet(req, res, next);
});
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // strips $ and . from user input to prevent NoSQL injection

// HTTP request logging routed through winston
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// Rate limiting - protects auth & write-heavy endpoints from abuse
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// --- API Documentation (Swagger / OpenAPI) ---
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, customUiOptions));

// --- Routes ---
app.use('/api', routes);

// --- 404 + centralized error handler (must be registered last) ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

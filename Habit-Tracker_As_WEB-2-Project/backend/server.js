import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { initDb } from './utils/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import startCronJobs from './services/cronJobs.js';

// Route imports
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import namazRoutes from './routes/namaz.js';
import streakRoutes from './routes/streak.js';
import rewardRoutes from './routes/rewardRoutes.js';
import exerciseRoutes from './routes/exercise.js';
import workRoutes from './routes/work.js';

import analyticsRoutes from './routes/analytics.js';
import todoRoutes from './routes/todo.js';
import exportRoutes from './routes/export.js';
import gamificationRoutes from './routes/gamification.js';

import detoxRoutes from './routes/detoxRoutes.js';
import readingRoutes from './routes/reading.js';

import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const app = express();

// Initialize Database connection
initDb()
  .then(() => {
    console.log('MongoDB Database initialized successfully.');
  })
  .catch((error) => {
    console.error('Failed to initialize MongoDB database:', error.message);
    process.exit(1);
  });

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl)
    if (!origin) return callback(null, true);
    // Allow any localhost port in development
    if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    // Allow configured FRONTEND_URL in production
    if (origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
import rateLimit from 'express-rate-limit';

// Global API Limiter (e.g. 500 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json());
// Apply to all /api routes
app.use('/api/', apiLimiter);

// Serve frontend in production
const __dirname = path.resolve();
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/dist', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('HabitFlow API is running.');
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/work', workRoutes);
app.use('/api/exercise', exerciseRoutes);

app.use('/api/analytics', analyticsRoutes);
app.use('/api/todo', todoRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/namaz', namazRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/rewards', rewardRoutes);

app.use('/api/detox', detoxRoutes);
app.use('/api/reading', readingRoutes);

app.get('/api/test-users', async (req, res) => {
  try {
    const { default: User } = await import('./models/User.js');
    const users = await User.find();
    res.json(users);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server
if (process.env.NODE_ENV !== 'production' || process.env.RUN_LOCAL === 'true') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    
    // Start background cron jobs
    startCronJobs();
  });
}

export default app;

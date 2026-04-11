import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './socket/socketEvents.js';

// Import configurations
import connectDB from './config/database.js';
import seedDatabase from './seed/seedDatabase.js';
import emailService from './utils/emailService.js';

// Import routes
import authRoutes from './features/auth/routes.js';
import userRoutes from './features/users/routes.js';
import appointmentRoutes from './features/appointments/routes.js';
import consultationRoutes from './features/consultations/routes.js';
import prescriptionRoutes from './features/prescriptions/routes.js';
import paymentRoutes from './features/payments/routes.js';
import notificationRoutes from './features/notifications/routes.js';
import hospitalRoutes from './features/hospitals/routes.js';
import chatRoutes from './features/chat/routes.js';
import medicalRecordsRoutes from './features/medical-records/routes.js';
import auditRoutes from './features/audit/routes.js';
import reportsRoutes from './features/reports/routes.js';
import adminRoutes from './features/admin/routes.js';

// Import middleware
import socketAuth from './middleware/socketAuth.js';
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust Render proxy for rate limiting
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      if (origin && /^(https?:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)\d+\.\d+:\d+$/.test(origin)) {
        return callback(null, true);
      }
      if (origin && origin.match(/https:\/\/.*\.vercel\.app$/)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";
      if (origin === allowedOrigin) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST"]
  }
});

const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 500 : 100,
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many authentication requests, please try again later.'
});

app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }
    if (origin && /^(https?:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)\d+\.\d+:\d+$/.test(origin)) {
      return callback(null, true);
    }
    const normalizedOrigin = origin.replace(/\/$/, '');
    const allowed = normalizedOrigin.startsWith('http://localhost') || 
                   normalizedOrigin.endsWith('.vercel.app') ||
                   normalizedOrigin === (process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, '') : '');
    if (allowed) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.status(200).send('<h1>Welcome to NetruDoc API</h1>');
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);

registerSocketHandlers(io);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDB().then(async () => {
  try {
    await seedDatabase();
    emailService.verifyConnection().catch(err => {
      console.error('📧 Email Service: Verification failed:', err.message);
    });
  } catch (error) {
    console.error('Warning: Database seeding failed:', error.message);
  }

  server.listen(PORT, () => {
    console.log(`🚀 NetruDoc Server running on port ${PORT}`);
    console.log(`📧 Active Email User: ${process.env.EMAIL_USER || 'ashishkhadka014@gmail.com'}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
export { io };

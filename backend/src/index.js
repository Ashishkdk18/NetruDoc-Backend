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
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow localhost variations for development
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }

      // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x, 169.254.x.x)
      if (origin && /^(https?:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)\d+\.\d+:\d+$/.test(origin)) {
        return callback(null, true);
      }

      // For development, allow all origins to make testing easier
      if (process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }

      // Default: allow the configured CLIENT_URL
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

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 60 * 1000 : 15 * 60 * 1000, // 1 minute in dev, 15 minutes in prod
  max: process.env.NODE_ENV === 'development' ? 500 : 100, // 500 requests per minute in dev, 100 per 15min in prod
  message: 'Too many requests from this IP, please try again later.'
});

// More lenient limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for auth endpoints
  message: 'Too many authentication requests, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // Allow localhost variations for development
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      return callback(null, true);
    }

    // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x, 169.254.x.x)
    if (origin && /^(https?:\/\/)?(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|169\.254\.)\d+\.\d+:\d+$/.test(origin)) {
      return callback(null, true);
    }

    // For development, allow all origins to make testing easier
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Default: allow the configured CLIENT_URL
    const allowedOrigin = process.env.CLIENT_URL || "http://localhost:3000";
    if (origin === allowedOrigin) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'NetruDoc API is running',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    }
  });
});

// Routes
app.use('/api/auth', authLimiter, authRoutes); // More lenient rate limiting for auth
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

// Socket.io connection handling
io.use(socketAuth);
registerSocketHandlers(io);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to database, seed data, and start server
connectDB().then(async () => {
  // Seed database with initial data
  try {
    await seedDatabase();
  } catch (error) {
    console.error('Warning: Database seeding failed:', error.message);
    // Continue server startup even if seeding fails
  }

  server.listen(PORT, () => {
    console.log(`🚀 NetruDoc Server running on port ${PORT}`);
    console.log(`📱 Socket.io server ready`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { io };

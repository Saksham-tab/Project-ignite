import express, { Request, Response } from 'express';
import http from 'http';
import https from 'https';
import fs from 'fs';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import { SocketService } from './services/socketService';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

// Route Imports
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import cartRoutes from './routes/cart';
import uploadRoutes from './routes/upload';
import reviewRoutes from './routes/review';
import discountRoutes from './routes/discount'; // ✅ Added: discount routes

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
});

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));

// CORS
app.use(cors({
  origin:
    process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL?.split(',') || ['https://yourstore.com']
      : [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
          'http://localhost:5175'
        ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'stripe-signature',
    'x-razorpay-signature'
  ]
}));

// Raw body for payment webhooks
app.use('/api/payments/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payments/razorpay/webhook', express.raw({ type: 'application/json' }));

// JSON body parsing for normal routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads
app.use('/uploads/reviews', express.static(path.join(__dirname, '../uploads/reviews')));

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ✅ Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/discount', discountRoutes); // ✅ Register discount routes

// Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Start server
const startServer = async () => {
  const dbConnected = await connectDB();
  if (!dbConnected) {
    console.error('❌ Failed to connect to MongoDB. Exiting...');
    process.exit(1);
  }

  let server;

  if (process.env.NODE_ENV === 'production') {
    const keyPath = process.env.SSL_KEY_PATH || '/etc/ssl/private/privkey.pem';
    const certPath = process.env.SSL_CERT_PATH || '/etc/ssl/certs/fullchain.pem';

    if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
      console.error('❌ SSL certificate files not found. Exiting...');
      process.exit(1);
    }

    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    };

    server = https.createServer(sslOptions, app);
    server.listen(PORT, () => {
      console.log(`🔐 HTTPS Server running at https://localhost:${PORT}`);
    });
  } else {
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`🚀 HTTP Server running at http://localhost:${PORT}`);
    });
  }

  // WebSocket init
  SocketService.initialize(server);

  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
};

// Graceful error handling
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

// Start app
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  });
}

export { app };

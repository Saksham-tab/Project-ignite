import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import userRoutes from './routes/users';
import paymentRoutes from './routes/payments';
import cartRoutes from './routes/cart';
import uploadRoutes from './routes/upload';
import reviewRoutes from './routes/review';
import payuRoutes from './routes/payu';
import discountRoutes from './routes/discount';


dotenv.config();
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

// Rate limiting (basic firewall)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

// ✅ Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ✅ Serve local uploads (in case review images still stored locally)
app.use('/uploads/reviews', express.static(path.join(__dirname, '../uploads/reviews')));

// ✅ Input Sanitization
app.use(mongoSanitize());
app.use(xss());

// ✅ Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ✅ API Routes
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/upload', uploadRoutes);  // Cloudinary routes
app.use('/api/reviews', reviewRoutes); // Review submission + fetch
app.use('/api/payu', payuRoutes);
app.use('/api/discount', discountRoutes);


// ✅ 404 Handler
app.use(notFoundHandler);

// ✅ Global Error Handler
app.use(globalErrorHandler);

export { app };

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { authenticate } from './middleware/auth';

// Import routes
import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import categoryRoutes from './routes/categories';
import supplierRoutes from './routes/suppliers';
import locationRoutes from './routes/locations';
import inventoryRoutes from './routes/inventory';
import stockMovementRoutes from './routes/stockMovements';
import purchaseOrderRoutes from './routes/purchaseOrders';
import stockAdjustmentRoutes from './routes/stockAdjustments';
import stockTransferRoutes from './routes/stockTransfers';
import alertRoutes from './routes/alerts';
import dashboardRoutes from './routes/dashboard';
import reportRoutes from './routes/reports';
import customerRoutes from './routes/customers';
import salesOrderRoutes from './routes/salesOrders';
import returnRoutes from './routes/returns';
import cycleCountRoutes from './routes/cycleCounts';

const app = express();
app.set('trust proxy', 1);

// CORS must be before helmet to handle preflight OPTIONS requests
const allowedOrigins = config.cors.origin;
console.log('Allowed CORS origins:', allowedOrigins);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, health checks)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.log('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
        "'unsafe-inline'"
      ],
      styleSrcElem: [
        "'self'",
        'https://cdn.jsdelivr.net',
        'https://fonts.googleapis.com',
        'https://cdnjs.cloudflare.com',
        "'unsafe-inline'"
      ],
      fontSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://fonts.gstatic.com'],
      connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
      imgSrc: ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Rate limiting
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1', generalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// EJS setup (for legacy views if needed)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============ API ROUTES ============

// Public routes (no auth required)
app.use('/api/v1/auth', authRoutes);

// Protected API routes (auth required)
app.use('/api/v1/products', authenticate, productRoutes);
app.use('/api/v1/categories', authenticate, categoryRoutes);
app.use('/api/v1/suppliers', authenticate, supplierRoutes);
app.use('/api/v1/locations', authenticate, locationRoutes);
app.use('/api/v1/inventory', authenticate, inventoryRoutes);
app.use('/api/v1/stock-movements', authenticate, stockMovementRoutes);
app.use('/api/v1/purchase-orders', authenticate, purchaseOrderRoutes);
app.use('/api/v1/stock-adjustments', authenticate, stockAdjustmentRoutes);
app.use('/api/v1/stock-transfers', authenticate, stockTransferRoutes);
app.use('/api/v1/alerts', authenticate, alertRoutes);
app.use('/api/v1/dashboard', authenticate, dashboardRoutes);
app.use('/api/v1/reports', authenticate, reportRoutes);
app.use('/api/v1/customers', authenticate, customerRoutes);
app.use('/api/v1/sales-orders', authenticate, salesOrderRoutes);
app.use('/api/v1/returns', authenticate, returnRoutes);
app.use('/api/v1/cycle-counts', authenticate, cycleCountRoutes);

// ============ LEGACY EJS VIEWS ============

// Dashboard
app.get('/', (req, res) => {
  res.render('dashboard', {
    title: 'Dashboard',
    low_stock: 0,
    total_products: 0,
    total_value: 0,
    user: { email: 'guest@example.com' },
    movements: []
  });
});

// Login page
app.get('/login', (req, res) => {
  res.render('login', { title: 'Login' });
});

// Signup page
app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
  console.log(`Health check: http://localhost:${config.port}/health`);
  console.log(`API base: http://localhost:${config.port}/api/v1`);
});

export default app;

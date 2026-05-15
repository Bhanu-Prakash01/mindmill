const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { resolveOrganization } = require('./middleware/orgMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const questionRoutes = require('./routes/questionRoutes');
const questionBankRoutes = require('./routes/questionBankRoutes');
const attemptRoutes = require('./routes/attemptRoutes');
const simpleReportRoutes = require('./routes/simpleReport');
const reportRoutes = require('./routes/reportRoutes');
const creditRoutes = require('./routes/creditRoutes');
const supportRoutes = require('./routes/supportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const groupRoutes = require('./routes/groupRoutes');
const big5Routes = require('./routes/big5Routes');
const discRoutes = require('./routes/discRoutes');
const mbtiRoutes = require('./routes/mbtiRoutes');
const firoRoutes = require('./routes/firoRoutes');
const hoganRoutes = require('./routes/hoganRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const resourceRoutes = require('./routes/resourceRoutes');

// Initialize express app
const app = express();

// Trust proxy (required for rate limiting behind a reverse proxy like Caddy)
app.set('trust proxy', 1);

// Connect to database
connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['x-org-slug', 'Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Resolve organization from X-Org-Slug header (before routes)
app.use(resolveOrganization);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/attempts', simpleReportRoutes);
app.use('/api', questionRoutes); // Question routes include /assessments/:id/questions
app.use('/api/question-banks', questionBankRoutes); // Question bank management for super admin
app.use('/api/reports', reportRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api', big5Routes);
app.use('/api', discRoutes);
app.use('/api', mbtiRoutes);
app.use('/api', firoRoutes);
app.use('/api', hoganRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/resources', resourceRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5005;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   Mindmil Assessments API Server                       ║
║   Running on port ${PORT}                              ║
║   Environment: ${process.env.NODE_ENV || 'development'}                    ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  // Close server & exit process
  process.exit(1);
});

module.exports = app;

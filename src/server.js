const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectMongoDB = require('./config/mongo');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// Initialize Firebase Admin SDK before routes/middleware
const initializeFirebase = require('./config/firebase');
initializeFirebase();

console.log("DEBUG MONGO_URI:", process.env.MONGO_URI);

// Connect to MongoDB
connectMongoDB();

const app = express();

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration for web builds
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'https://lac-r-backend-1.onrender.com',
      'https://lac-r-web.vercel.app', // Explicit Vercel site
      // Add your web build URLs here
      /^https:\/\/.*\.web\.app$/,
      /^https:\/\/.*\.firebaseapp\.com$/,
      /^http:\/\/localhost:\d+$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
    ];

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return allowedOrigin === origin;
      } else {
        return allowedOrigin.test(origin);
      }
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Ensure preflight requests are handled globally
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/robots', require('./routes/robot.routes'));
app.use('/api/esp32', require('./routes/esp32.routes'));
app.use('/api/status', require('./routes/status.routes'));

// Alias mounts to support old/front-end cached paths without '/api'
app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/user.routes'));
app.use('/robot', require('./routes/robot.routes'));
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'LAC-R Backend is running' });
});

// Ping route for monitoring
app.get('/ping', (req, res) => {
  console.log(`Ping request received at ${new Date().toISOString()} from ${req.ip}`);
  res.status(200).json({ message: 'Pong', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 LAC-R Backend server is running on port ${PORT}`);
});

module.exports = app;

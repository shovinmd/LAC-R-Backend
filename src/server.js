const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectMongoDB = require('./config/mongo');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

console.log("DEBUG MONGO_URI:", process.env.MONGO_URI);

// Connect to MongoDB
connectMongoDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/robots', require('./routes/robot.routes'));
app.use('/api/esp32', require('./routes/esp32.routes'));
app.use('/api/status', require('./routes/status.routes'));

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

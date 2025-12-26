const mongoose = require('mongoose');
const Robot = require('../models/Robot');

const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`🍃 MongoDB Connected: ${conn.connection.host}`);

    // Post-connection index cleanup to fix legacy robotId unique index
    const robotsColl = mongoose.connection.db.collection('robots');
    const indexes = await robotsColl.indexes();
    const legacyIdx = indexes.find(ix => ix.name === 'robotId_1' || (ix.key && ix.key.robotId === 1));
    if (legacyIdx) {
      try {
        await robotsColl.dropIndex(legacyIdx.name);
        console.log('✅ Dropped legacy index robotId_1');
      } catch (e) {
        console.warn('⚠️ Could not drop legacy index robotId_1:', e.message);
      }
    }

    // Ensure Mongoose schema indexes are applied (robot_id unique, etc.)
    await Robot.syncIndexes();
    console.log('✅ Robot model indexes synced');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectMongoDB;

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gfg_cmp';
    console.log(`[DB] Attempting connection to MongoDB...`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.warn(`[DB] Primary MongoDB connection failed (${error.message}). Running in mock/in-memory mode for development.`);
    mongoose.set('bufferCommands', false);
    return false;
  }
};

module.exports = connectDB;

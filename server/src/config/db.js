const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connects to the configured MongoDB instance.
 * This project intentionally uses one shared local MongoDB database so the
 * server and the seed script remain in sync during development and verification.
 */
async function connectDB() {
  const configuredUri = process.env.MONGODB_URI;

  if (!configuredUri) {
    logger.error('MONGODB_URI is not set. Check your .env file.');
    process.exit(1);
  }

  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(configuredUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    return conn;
  } catch (err) {
    const message = err?.message || String(err);
    logger.error(`Failed to connect to MongoDB: ${message}`);
    process.exit(1);
  }
}

module.exports = connectDB;

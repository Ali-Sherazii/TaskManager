/**
 * Database Configuration Module - MongoDB with Mongoose
 * 
 * This file sets up the MongoDB database connection using Mongoose.
 * Mongoose is an ODM (Object Document Mapper) that makes working with MongoDB easier.
 * 
 * Key Concepts:
 * - MongoDB: NoSQL document database
 * - Mongoose: ODM for MongoDB (like an ORM for SQL databases)
 * - Models: Define the structure of documents (like tables in SQL)
 * - Schemas: Define the fields and validation rules
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 * 
 * MongoDB Connection String Format:
 * mongodb://[username:password@]host[:port][/database][?options]
 * 
 * For local development: mongodb://localhost:27017/taskmanager
 * For MongoDB Atlas (cloud): mongodb+srv://user:pass@cluster.mongodb.net/taskmanager
 */
async function connectDatabase() {
  try {
    // Get connection string from environment or use default
    const config = require('./config');
    const mongoUri = config.mongoUri;
    
    // Connection options
    const options = {
      // Remove deprecated options - Mongoose 8 handles these automatically
    };

    // Connect to MongoDB
    await mongoose.connect(mongoUri, options);
    
    console.log('MongoDB connected successfully');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDatabase() {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnection error:', error);
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Handle process termination
process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});

module.exports = {
  connectDatabase,
  disconnectDatabase,
  mongoose
};

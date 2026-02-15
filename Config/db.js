import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }
    
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    console.error('Please check:');
    console.error('1. Your MongoDB connection string in .env file');
    console.error('2. Your network connection');
    console.error('3. MongoDB Atlas IP whitelist (Network Access)');
    throw error; // Rethrow to handle in server.js
  }
};

export default connectDB;
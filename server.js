import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './Config/db.js';

// Import Routes
import authRouter from './Routes/authRouter.js';
import sessionRouter from './Routes/sessionRouter.js';
import materialRouter from './Routes/materialRouter.js';
import feedbackRouter from './Routes/feedbackRouter.js';

// Load env vars - THIS MUST BE BEFORE any code that uses process.env
dotenv.config();

// Debug: Check if MONGO_URI is loaded
console.log('Environment variables loaded:');
console.log('- PORT:', process.env.PORT);
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('- MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');

// Check if MONGO_URI is missing
if (!process.env.MONGO_URI) {
  console.error('❌ FATAL ERROR: MONGO_URI is not defined in .env file');
  console.error('Please add MONGO_URI to your .env file');
  process.exit(1);
}

// Ensure JWT secret is provided
if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL ERROR: JWT_SECRET is not defined in .env file');
  console.error('Please add JWT_SECRET to your .env file');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to AF Backend API' });
});

app.use('/api/auth', authRouter);
app.use('/api/sessions', sessionRouter);
app.use('/api/materials', materialRouter);
app.use('/api/feedback', feedbackRouter);

// Port
const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
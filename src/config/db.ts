import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // await mongoose.connect("mongodb://localhost:27017/NexaRide");
    await mongoose.connect(process.env.MONGO_URL as string);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1);
  }
};

export default connectDB;

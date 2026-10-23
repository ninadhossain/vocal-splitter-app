import mongoose from 'mongoose';
import { JobRepository } from '../models/Job';

export async function connectDB(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vocal_splitter';

  try {
    mongoose.set('strictQuery', false);
    // Short connection timeout (3s) so server boots immediately even if mongod is not running locally
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });

    console.log(`[DB] Connected successfully to MongoDB at: ${mongoUri}`);
    JobRepository.setMongoConnected(true);

    mongoose.connection.on('disconnected', () => {
      console.warn('[DB] MongoDB disconnected. Falling back to in-memory store.');
      JobRepository.setMongoConnected(false);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('[DB] MongoDB reconnected.');
      JobRepository.setMongoConnected(true);
    });
  } catch (err: any) {
    console.warn(`[DB] MongoDB not detected (${err.message}). Using resilient in-memory storage mode.`);
    JobRepository.setMongoConnected(false);
  }
}

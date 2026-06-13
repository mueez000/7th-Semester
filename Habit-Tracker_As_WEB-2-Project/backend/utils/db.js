import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '..', '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

export const initDb = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/habitflow';
    await mongoose.connect(uri);
    console.log(`MongoDB Connected successfully to ${uri}`);
    return mongoose.connection;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default initDb;

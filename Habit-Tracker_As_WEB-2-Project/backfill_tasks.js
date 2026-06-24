import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Construct absolute path manually if import.meta.url isn't resolving correctly in script
dotenv.config({ path: path.resolve('backend', '.env') });

import TodoTask from './backend/models/TodoTask.js';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/habitTracker';

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Find all completed tasks that don't have a completedAt date
    const tasks = await TodoTask.find({ status: 'completed', completedAt: { $exists: false } });
    console.log(`Found ${tasks.length} tasks needing backfill.`);

    let count = 0;
    for (const task of tasks) {
      // Use updatedAt as a fallback, or createdAt
      task.completedAt = task.updatedAt || task.createdAt || new Date();
      await task.save();
      count++;
    }

    console.log(`Successfully backfilled ${count} tasks!`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const exerciseLogSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  activityType: { type: String },
  distance: { type: Number },
  duration: { type: Number },
  calories: { type: Number },
  pushupSets: { type: Number },
  pushupReps: { type: Number },
  squatSets: { type: Number },
  squatReps: { type: Number },
  date: { type: Date, required: true }
});

exerciseLogSchema.index({ userId: 1, date: -1 });

const ExerciseLog = mongoose.model('ExerciseLog', exerciseLogSchema);
export default ExerciseLog;

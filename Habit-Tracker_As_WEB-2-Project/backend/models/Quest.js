import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const questSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true }, // 'reading', 'work', 'namaz', 'streak', 'todo', 'exercise'
  target: { type: Number, required: true },
  currentProgress: { type: Number, default: 0 },
  xpReward: { type: Number, required: true },
  icon: { type: String, default: '📜' },
  expiresAt: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  isClaimed: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Quest', questSchema);

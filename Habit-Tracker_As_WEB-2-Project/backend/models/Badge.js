import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const badgeSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  earnedAt: { type: Date, required: true }
});

const Badge = mongoose.model('Badge', badgeSchema);
export default Badge;

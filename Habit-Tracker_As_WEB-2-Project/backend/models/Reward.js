import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const rewardSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  cost: { type: Number, required: true },
  icon: { type: String, default: '🎁' },
  isPurchased: { type: Boolean, default: false }, // if they bought it but haven't 'used' it maybe? Actually let's just make it a repeatable purchase
  // Wait, if it's repeatable, we shouldn't have isPurchased on the reward itself. The reward is a template. 
  // We can track purchases in a separate history or just not track them at all (just deduct coins).
}, { timestamps: true });

export default mongoose.model('Reward', rewardSchema);

import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const xpHistorySchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  amount: { type: Number, required: true },
  source: { type: String, required: true },
  sourceId: { type: String },
  date: { type: Date, required: true }
});

const XpHistory = mongoose.model('XpHistory', xpHistorySchema);
export default XpHistory;

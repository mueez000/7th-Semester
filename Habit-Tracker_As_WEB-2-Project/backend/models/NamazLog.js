import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const namazLogSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  date: { type: Date, required: true },
  fajr: { type: String, enum: ['none', 'prayed', 'kaza', 'true', 'false'], default: 'none' },
  zuhr: { type: String, enum: ['none', 'prayed', 'kaza', 'true', 'false'], default: 'none' },
  asr: { type: String, enum: ['none', 'prayed', 'kaza', 'true', 'false'], default: 'none' },
  maghrib: { type: String, enum: ['none', 'prayed', 'kaza', 'true', 'false'], default: 'none' },
  isha: { type: String, enum: ['none', 'prayed', 'kaza', 'true', 'false'], default: 'none' }
});

namazLogSchema.index({ userId: 1, date: -1 });

const NamazLog = mongoose.model('NamazLog', namazLogSchema);
export default NamazLog;

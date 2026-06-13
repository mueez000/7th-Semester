import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const namazLogSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  date: { type: Date, required: true },
  fajr: { type: Boolean, default: false },
  zuhr: { type: Boolean, default: false },
  asr: { type: Boolean, default: false },
  maghrib: { type: Boolean, default: false },
  isha: { type: Boolean, default: false }
});

const NamazLog = mongoose.model('NamazLog', namazLogSchema);
export default NamazLog;

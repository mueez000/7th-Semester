import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const workSessionSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 },
  taskId: { type: String, ref: 'TodoTask' }
});

const WorkSession = mongoose.model('WorkSession', workSessionSchema);
export default WorkSession;

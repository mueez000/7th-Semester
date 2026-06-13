import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const todoTaskSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  listId: { type: String, ref: 'TodoList', required: true },
  userId: { type: String, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  dueDate: { type: Date },
  priority: { type: String, default: 'medium' },
  status: { type: String, default: 'pending' },
  estimatedTime: { type: Number },
  actualTime: { type: Number, default: 0 },
  completedAt: { type: Date }
}, { timestamps: true });

const TodoTask = mongoose.model('TodoTask', todoTaskSchema);
export default TodoTask;

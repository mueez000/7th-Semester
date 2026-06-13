import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const todoListSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: { type: String, ref: 'User', required: true },
  name: { type: String, required: true },
  color: { type: String, default: '#4F46E5' }
}, { timestamps: true });

const TodoList = mongoose.model('TodoList', todoListSchema);
export default TodoList;

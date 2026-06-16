import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: String },
  weight: { type: Number },
  gender: { type: String },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  coins: { type: Number, default: 0 },
  shields: { type: Number, default: 0 },
  xp_to_next_level: { type: Number, default: 100 }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;

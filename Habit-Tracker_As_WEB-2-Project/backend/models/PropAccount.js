import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const propAccountSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true
  },
  accountSize: { type: Number, required: true },

  // Phase progression — same drawdown rules across all phases
  dailyDrawdownPct: { type: Number, required: true, default: 5 },
  maxDrawdownPct: { type: Number, required: true, default: 10 },

  // Different profit targets per phase
  phase1TargetPct: { type: Number, required: true, default: 8 },
  phase2TargetPct: { type: Number, required: true, default: 5 },

  // Current active phase (1, 2, or 'funded')
  currentPhase: { type: Number, default: 1 },

  // Track failures — every fail is a lesson
  failedAccounts: { type: Number, default: 0 },

  // Status: 'active' | 'failed' | 'funded'
  status: { type: String, enum: ['active', 'failed', 'funded'], default: 'active' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

propAccountSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const PropAccount = mongoose.model('PropAccount', propAccountSchema);
export default PropAccount;

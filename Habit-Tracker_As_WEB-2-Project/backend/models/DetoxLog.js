import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const detoxLogSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  currentStreak: {
    type: Number, // in days
    default: 0
  },
  targetDays: {
    type: Number,
    default: 7
  },
  longestStreak: {
    type: Number, // in days
    default: 0
  },
  relapseHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    app: {
      type: String,
      default: ''
    },
    notes: {
      type: String,
      default: ''
    },
    xpEarned: {
      type: Number,
      default: 0
    },
    previousStartTime: {
      type: Date
    },
    previousTargetDays: {
      type: Number
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastCheckIn: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const DetoxLog = mongoose.model('DetoxLog', detoxLogSchema);

export default DetoxLog;

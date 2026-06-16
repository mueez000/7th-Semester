import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const streakLogSchema = new mongoose.Schema({
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
  shieldsEarned: {
    type: Number, // how many shields this current streak has produced
    default: 0
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
    withPorn: {
      type: Boolean,
      default: false
    },
    bathTaken: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      default: ''
    },
    xpEarned: {
      type: Number,
      default: 0
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

const StreakLog = mongoose.model('StreakLog', streakLogSchema);

export default StreakLog;

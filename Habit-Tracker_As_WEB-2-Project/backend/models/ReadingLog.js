import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const readingLogSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  bookTitle: {
    type: String,
    required: true,
    trim: true
  },
  pagesRead: {
    type: Number,
    required: true,
    min: 1
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  duration: {
    type: Number, // optional minutes
  },
  notes: {
    type: String,
    default: ''
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ReadingLog = mongoose.model('ReadingLog', readingLogSchema);

export default ReadingLog;

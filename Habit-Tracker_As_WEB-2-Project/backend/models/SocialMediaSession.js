import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const socialMediaSessionSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: uuidv4,
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  platform: {
    type: String,
    required: true,
    enum: ['instagram', 'x', 'youtube', 'news', 'movies']
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

const SocialMediaSession = mongoose.model('SocialMediaSession', socialMediaSessionSchema);

export default SocialMediaSession;

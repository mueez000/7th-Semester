import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const tradeLogSchema = new mongoose.Schema({
  _id: { type: String, default: uuidv4 },
  userId: {
    type: String,
    ref: 'User',
    required: true
  },
  asset: {
    type: String,
    required: true,
    trim: true,
    uppercase: true // e.g., BTC/USDT, AAPL
  },
  position: {
    type: String,
    enum: ['Long', 'Short'],
    required: true
  },
  status: {
    type: String,
    enum: ['Win', 'Loss', 'Break-Even'],
    default: 'Win'
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: {
    type: Number,
    default: null
  },
  lotSize: {
    type: Number,
    required: true
  },
  pnl: {
    type: Number, // Profit and Loss amount (e.g., $50, -$20)
    default: 0
  },
  strategy: {
    type: String, // e.g., 'Breakout', 'Mean Reversion'
    trim: true,
    default: ''
  },
  emotion: {
    type: String, // e.g., 'Confident', 'FOMO', 'Greed', 'Anxious'
    trim: true,
    default: ''
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  entryDate: {
    type: Date,
    default: Date.now
  },
  exitDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

export default mongoose.model('TradeLog', tradeLogSchema);

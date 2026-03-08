import mongoose from 'mongoose';

const MarketSchema = new mongoose.Schema({
  externalId: { type: String, unique: true, required: true },
  question: { type: String, required: true },
  description: String,
  currentPrice: Number,
  volume: Number,
  outcomes: [String],
  deadline: Date,
  marketSlug: String,
  source: { type: String, default: 'POLYMARKET' },
  aiAnalysis: {
    bullCase: String,
    bearCase: String,
    lastUpdated: Date
  },
  updatedAt: { type: Date, default: Date.now }
});

const Market = mongoose.model('Market', MarketSchema);
export default Market;
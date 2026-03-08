import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fetchActiveMarkets } from '../services/polymarketService.js';
import Market from '../models/Market.js';

dotenv.config();

const runCurator = async () => {
  try {
    // Connect to Mongo (Localhost for now)
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sentient_v1';
    await mongoose.connect(MONGO_URI);
    console.log("🗄️  Connected to Sentient DB");

    const markets = await fetchActiveMarkets(50);

    let newCount = 0;
    for (const marketData of markets) {
      const result = await Market.updateOne(
        { externalId: marketData.externalId }, 
        { $set: { ...marketData, updatedAt: new Date() } }, 
        { upsert: true } 
      );
      if (result.upsertedCount > 0) newCount++;
    }

    console.log(`🚀 Sync Complete: ${newCount} New Markets Added.`);
    process.exit(0);

  } catch (error) {
    console.error("🔥 Curator Failed:", error);
    process.exit(1);
  }
};

runCurator();
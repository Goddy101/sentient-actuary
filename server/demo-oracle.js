import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function runSentientAggregator() {
    console.log("==================================================");
    console.log("🔌 SENTIENT AGGREGATOR: Initializing Data Pipeline...");
    console.log("==================================================\n");

    try {
        // 1. Scrape Polymarket Gamma API
        console.log("📡 Fetching global market data from Polymarket...");
        const response = await axios.get('https://gamma-api.polymarket.com/events?limit=5&closed=false');
        
        // Find a market with valid volume
        const targetEvent = response.data.find(e => e.markets && e.markets[0].volume > 1000);
        
        if (!targetEvent) {
             console.log("⚠️ No high-volume markets found at the moment. Try again later.");
             return;
        }

        const market = targetEvent.markets[0];
        
        // FIXED: Safe probability extraction to prevent NaN%
        let currentProbability = 50; // Default
        if (market.outcomePrices && market.outcomePrices.length > 0 && !isNaN(market.outcomePrices[0])) {
            currentProbability = Math.round(Number(market.outcomePrices[0]) * 100);
        }

        console.log(`\n🎯 Target Market Acquired: "${targetEvent.title}"`);
        console.log(`📉 Current Polymarket Probability: ${currentProbability}%\n`);
        console.log("🧠 Feeding data to Sentient Monte Carlo AI Engine...");

        // 2. Run Gemini Monte Carlo Simulation
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
            You are Sentient, an AI Prediction Oracle.
            Market: "${targetEvent.title}"
            Current Market Odds: ${currentProbability}%

            Generate a Monte Carlo simulation output with 3 distinct future scenarios that could affect this outcome.
            Assign a probability to each scenario (summing to 100%).
            Output strictly as JSON:
            {
                "fairValueEdge": "+5%",
                "scenarios": [
                    { "name": "Scenario 1", "prob": "40%", "impact": "Bullish" },
                    { "name": "Scenario 2", "prob": "30%", "impact": "Bearish" },
                    { "name": "Scenario 3", "prob": "30%", "impact": "Neutral" }
                ],
                "aiVerdict": "Brief 1 sentence investment recommendation."
            }
        `;

        const aiResponse = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });

        const simulation = JSON.parse(aiResponse.response.text());

        console.log("\n==================================================");
        console.log("📈 SENTIENT MONTE CARLO SIMULATION RESULTS");
        console.log("==================================================");
        console.log(`Calculated Edge: ${simulation.fairValueEdge}`);
        console.log("\nPredicted Scenarios:");
        simulation.scenarios.forEach((s, i) => {
            console.log(`  [${i+1}] ${s.name} (${s.prob}) -> Impact: ${s.impact}`);
        });
        console.log(`\n🤖 AI Verdict: ${simulation.aiVerdict}`);
        console.log("==================================================\n");

    } catch (error) {
        console.error("❌ Aggregator Error:", error.message);
    }
}

runSentientAggregator();
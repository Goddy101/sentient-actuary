// server/oracleService.js
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Fetches the most liquid market currently on Polymarket.
 */
export async function fetchTopMarket() {
    try {
        const response = await axios.get('https://gamma-api.polymarket.com/events?limit=5&closed=false');
        const targetEvent = response.data.find(e => e.markets && e.markets[0].volume > 1000);
        
        if (!targetEvent) throw new Error("No high-volume markets found.");

        const market = targetEvent.markets[0];
        let currentProbability = 50; 
        
        if (market.outcomePrices && market.outcomePrices.length > 0 && !isNaN(market.outcomePrices[0])) {
            currentProbability = Math.round(Number(market.outcomePrices[0]) * 100);
        }

        return {
            title: targetEvent.title,
            probability: currentProbability
        };
    } catch (error) {
        console.error("Polymarket Fetch Error:", error.message);
        return null;
    }
}

/**
 * Runs a Gemini Monte Carlo simulation on the provided market.
 */
export async function runMonteCarloSimulation(marketTitle, probability) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `
            You are Sentient, an AI Prediction Oracle.
            Market: "${marketTitle}"
            Current Market Odds: ${probability}%

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

        return JSON.parse(aiResponse.response.text());
    } catch (error) {
        console.error("Gemini Simulation Error:", error.message);
        return null;
    }
}
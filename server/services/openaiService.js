import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Google Gemini
// Ensure GEMINI_API_KEY is in your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateMarketDebate = async (marketQuestion, currentPrice) => {
  try {
    // Use "gemini-1.5-flash" for speed and free tier (15 RPM)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are "Sentient", an AI financial analyst engine. 
    Analyze this prediction market: "${marketQuestion}".
    The current market probability is ${Math.round(currentPrice * 100)}%.

    Generate a "Bull Case" (Why 'Yes' might happen) and a "Bear Case" (Why 'No' might happen).
    
    Rules:
    1. Be concise (max 2 sentences per case).
    2. Use a professional but sharp tone.
    3. Focus on news, macroeconomics, or specific data points.
    4. Return ONLY a valid JSON object.

    Output Format:
    {
      "bullCase": "...",
      "bearCase": "...",
      "sentimentScore": 75
    }
    `;

    // Gemini requires a slightly different way to force JSON
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json", // Enforce JSON output
      }
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    
    return data;

  } catch (error) {
    console.error("❌ Gemini Error:", error.message);
    return null; 
  }
};
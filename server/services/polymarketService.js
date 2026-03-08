import axios from 'axios';

const POLYMARKET_API_URL = 'https://gamma-api.polymarket.com/events';

export const fetchActiveMarkets = async (limit = 20) => {
  try {
    console.log(`🔌 Sentient Curator: Connecting to Polymarket...`);

    // 1. Fetch from Gamma API
    // NOTE: We request 50 (max usually) to filter/sort locally because 
    // the /events endpoint doesn't support 'sort=volume'
    const response = await axios.get(POLYMARKET_API_URL, {
      params: {
        limit: 50, 
        closed: false // This replaces "active: true" which causes 422 errors
      }
    });

    const rawEvents = response.data;

    // 2. Filter & Transform Data
    const cleanMarkets = rawEvents
      .filter(event => {
        // Must have at least one market and significant volume (> $1000)
        const mainMarket = event.markets?.[0];
        return mainMarket && Number(mainMarket.volume) > 1000;
      })
      .map(event => {
        const market = event.markets[0];
        
        // Polymarket prices can be strings or numbers
        // SAFEGUARD: Handle cases where price is undefined or invalid string
        let rawPrice = market.outcomePrices?.[0] || market.group?.[0]?.price;
        let probability = Number(rawPrice);
        
        // If probability is NaN (invalid), default to 0 to prevent Mongoose crash
        if (isNaN(probability)) {
          probability = 0;
        }

        return {
          externalId: market.id,
          question: event.title,
          description: event.description,
          currentPrice: probability, 
          volume: Number(market.volume),
          // Handle 'outcomes' safely (sometimes it's a string, sometimes JSON)
          outcomes: Array.isArray(market.outcomes) 
            ? market.outcomes 
            : JSON.parse(market.outcomes || '["Yes", "No"]'),
          marketSlug: event.slug,
          deadline: new Date(event.endDate)
        };
      })
      // 3. Sort by Volume Descending (High to Low)
      .sort((a, b) => b.volume - a.volume)
      // 4. Limit to the requested number
      .slice(0, limit);

    console.log(`✅ Curator: Found ${cleanMarkets.length} high-quality markets.`);
    return cleanMarkets;

  } catch (error) {
    console.error('❌ Polymarket API Error:', error.message);
    // Return empty array so the app doesn't crash
    return [];
  }
};
import { fetchTopMarket, runMonteCarloSimulation } from './oracleService.js';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Replace with the address you got when you deployed SimpleMarket.sol in Remix
const SIMPLE_MARKET_ADDRESS = "0xYourSimpleMarketAddressHere"; 

async function generateMarketAndDeploy() {
    console.log("==================================================");
    console.log("SENTIENT COMMENTATOR: Initializing AI Oracle...");
    console.log("==================================================");
    
    // 1. Fetch from Polymarket
    const marketData = await fetchTopMarket();
    if (!marketData) return;

    console.log(`\n📊 Analyzing Target: ${marketData.title} (Odds: ${marketData.probability}%)`);
    console.log("⏳ Running Gemini Monte Carlo simulations...\n");

    // 2. Run AI Simulation
    const simulation = await runMonteCarloSimulation(marketData.title, marketData.probability);
    if (!simulation) return;

    console.log("✅ AI Simulation Complete. Verdict:");
    console.log(`   "${simulation.aiVerdict}"`);
    console.log(`   Calculated Edge: ${simulation.fairValueEdge}\n`);

    // 3. Push to Base Sepolia
    console.log("🚀 Pushing AI Market to Base Sepolia Smart Contract...");
    
    try {
        // Connect to Base Sepolia
        const provider = new ethers.JsonRpcProvider("https://sepolia.base.org");
        const wallet = new ethers.Wallet(process.env.CRE_ETH_PRIVATE_KEY, provider);
        
        // Minimal ABI just for the createMarket function
        const abi = ["function createMarket(string memory _question) external returns (bytes32)"];
        const simpleMarketContract = new ethers.Contract(SIMPLE_MARKET_ADDRESS, abi, wallet);

        // Send the transaction!
        const tx = await simpleMarketContract.createMarket(marketData.title);
        console.log(`⏳ Transaction broadcasted! Hash: ${tx.hash}`);
        
        await tx.wait();
        console.log("🎉 SUCCESS! Market officially created on-chain.");
        console.log(`🔍 View on Basescan: https://sepolia.basescan.org/tx/${tx.hash}`);
        console.log("==================================================");

    } catch (error) {
        console.error("❌ Blockchain Execution Error:", error.message);
        console.log("Did you add CRE_ETH_PRIVATE_KEY to your server/.env file?");
    }
}

generateMarketAndDeploy();
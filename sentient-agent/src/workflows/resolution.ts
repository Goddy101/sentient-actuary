import { Workflow, Trigger } from '@chainlink/cre-sdk';

/**
 * RESOLUTION AGENT
 * This agent monitors the Base Sepolia blockchain for the 'RatioUpdated' event.
 * When detected, it triggers an AI news scan to verify economic stability.
 */

// 1. Define the Trigger using the specialized EVM Log trigger
const logTrigger = Trigger.EVM.Log({
  address: '0x700960b7cd8E01b37Bdcba09f8046A2FA1cdF58c',
  eventSignature: 'RatioUpdated(address indexed user, uint256 newRatio)',
  chainId: 84532, // Base Sepolia
});

export const resolutionWorkflow = Workflow.define({
  name: 'sentient-resolution-global',
  trigger: logTrigger,
  
  execute: async ({ trigger, capabilities }) => {
    // In the latest SDK, event arguments are accessed via trigger.args
    const { user, newRatio } = trigger.args;
    
    console.log(`\n🤖 Sentient Agent Detected Blockchain Event: Ratio Updated!`);
    console.log(`🔍 Analyzing Global Economic Stability for ${user} (New Ratio: ${newRatio}%)`);

    const aiAnalysis = await capabilities.ai.gemini.generate({
      prompt: `
        You are a Global Macro Economist Agent.
        Task: Analyze the economic stability of MAJOR Emerging Markets (Nigeria, Turkey, Brazil, Argentina) right now.
        
        Logic:
        1. Search for "Currency Volatility" in these regions for the last 24h.
        2. If MOST regions are stable, return outcome: true.
        3. If ANY major region has a currency crisis today, return outcome: false.
        
        OUTPUT ONLY A VALID JSON OBJECT EXACTLY LIKE THIS: 
        { "outcome": true, "regionTriggered": "None" }
      `,
      googleSearchGrounding: true 
    });

    // Parse AI response safely
    const result = JSON.parse(aiAnalysis.text);
    console.log(`✅ Global Verdict: ${result.outcome ? 'Stable' : 'Volatile'} | Region Factor: ${result.regionTriggered}`);

    return {
      status: "Analysis Complete",
      verdict: result.outcome,
      triggeredRegion: result.regionTriggered,
      timestamp: new Date().toISOString()
    };
  }
});
import { Workflow } from '@chainlink/cre-sdk';

// YOUR BRAND NEW BASE SEPOLIA CONTRACT ADDRESS
const VAULT_ADDRESS = '0x700960b7cd8E01b37Bdcba09f8046A2FA1cdF58c'; 

export const underwriterWorkflow: Workflow<any> = {
  name: 'sentient-global-risk-engine',
  
  trigger: {
    type: "cron",
    schedule: "*/15 * * * *" // Runs every 15 minutes
  },

  execute: async ({ capabilities }: any) => {
    // YOUR WALLET ADDRESS
    const user = "0x984DE9DF12B2c28064234319f5F78acDE0447282"; 

    console.log(`\n📊 AI Actuary: Analyzing Risk for User ${user} on Contract ${VAULT_ADDRESS}...`);

    // 1. Fetch User's current stats from your smart contract
    const userStats = await capabilities.evm.read({
      address: VAULT_ADDRESS,
      functionName: 'getUserVaultStats', 
      args: [user],
      abi: ['function getUserVaultStats(address) view returns (uint256 totalCollateral, uint256 totalDebt, uint256 healthFactor)']
    });

    const healthFactor = Number(userStats[2]) / 1e18;
    console.log(`Current On-Chain Health Factor: ${healthFactor}`);

    // 2. AI ANALYSIS via Gemini
    console.log(`🧠 AI is analyzing global forex markets...`);
    const analysis = await capabilities.ai.gemini.generate({
      prompt: `
        Act as a Global Forex Risk Manager.
        Analyze the current volatility of this basket against USD: [NGN, TRY, BRL, INR].
        User Health Factor is: ${healthFactor}
        
        LOGIC:
        - If ALL currencies are stable AND Health Factor > 1.5, suggest aggressive ratio (115%).
        - If ANY currency is crashing OR Health Factor < 1.2, suggest conservative ratio (160%).
        
        OUTPUT ONLY A VALID JSON OBJECT EXACTLY LIKE THIS: 
        { "targetRatio": 160, "riskReason": "Explanation here" }
      `,
      googleSearchGrounding: true
    });

    const riskModel = JSON.parse(analysis.text);
    console.log(`⚖️ Verdict: Set Target Ratio to ${riskModel.targetRatio}%`);
    console.log(`📝 Reason: ${riskModel.riskReason}`);

    // 3. Write the AI's decision back to the Smart Contract!
    console.log(`✍️ Sending transaction to update blockchain...`);
    return await capabilities.evm.write({
      address: VAULT_ADDRESS,
      functionName: 'setDynamicCollateralRatio',
      args: [user, riskModel.targetRatio],
      abi: ['function setDynamicCollateralRatio(address user, uint256 newRatio)']
    });
  }
} as any;
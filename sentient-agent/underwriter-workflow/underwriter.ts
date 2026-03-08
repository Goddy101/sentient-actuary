import { 
  CronCapability, 
  EVMClient, 
  HTTPClient,
  handler, 
  Runner, 
  getNetwork,
  type Runtime,
  type NodeRuntime,
  LAST_FINALIZED_BLOCK_NUMBER,
  encodeCallMsg,
  bytesToHex,
  consensusIdenticalAggregation
} from "@chainlink/cre-sdk";
import { encodeFunctionData, decodeFunctionResult, zeroAddress, parseAbi } from "viem";

const VAULT_ABI = parseAbi([
  "function getUserVaultStats(address user) view returns (uint256 totalCollateral, uint256 totalDebt, uint256 healthFactor)",
  "function setDynamicCollateralRatio(address user, uint256 newRatio) external",
  "event RatioUpdated(address indexed user, uint256 newRatio)"
]);

type Config = { schedule: string; geminiApiKey: string; };

const VAULT_ADDRESS = '0x2eA10665158C5d871032CE4E2d52933f7C25eF3B'; 
const TARGET_USER = "0x984DE9DF12B2c28064234319f5F78acDE0447282";

const evaluateMacroRisk = (nodeRuntime: NodeRuntime<Config>, healthFactor: number, apiKey: string): number => {
  nodeRuntime.log(`🧠 AI Node analysis initiated for Health Factor: ${healthFactor.toFixed(2)}`);
  
  let targetRatio = 160;

  try {
    if (!apiKey || apiKey.includes("PASTE_YOUR")) {
      throw new Error("Missing real Gemini API Key");
    }

    const httpClient = new HTTPClient();
    const prompt = `
      Act as an Emerging Market Risk Actuary. 
      The user's current DeFi Health Factor is ${healthFactor}.
      Analyze current volatility in Nigeria (NGN) and Turkey (TRY).
      If volatile or health < 1.5, suggest ratio 160. If stable and health >= 1.5, suggest 115.
      Output STRICT JSON: {"targetRatio": 160, "riskReason": "..."}
    `;

    // FIX: Encode the JSON payload into a Base64 string for the CRE HTTPClient
    const jsonPayload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const base64Body = Buffer.from(jsonPayload).toString("base64");

    const response = httpClient.sendRequest(nodeRuntime, {
      method: "POST",
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      headers: { "Content-Type": "application/json" },
      body: base64Body,
      timeout: "5s" 
    }).result();

    if (response.statusCode === 200) {
      // Safely decode the response whether the engine returns a string or bytes
      let bodyString = "";
      if (typeof response.body === "string") {
        bodyString = Buffer.from(response.body, "base64").toString("utf-8");
      } else {
        bodyString = new TextDecoder().decode(response.body as Uint8Array);
      }
      
      const aiData = JSON.parse(bodyString);
      const parsed = JSON.parse(aiData.candidates[0].content.parts[0].text);
      targetRatio = parsed.targetRatio;
      nodeRuntime.log(`✅ Live Gemini API Success: Reason - ${parsed.riskReason}`);
    } else {
      throw new Error(`API returned HTTP ${response.statusCode}`);
    }
  } catch (e) {
    nodeRuntime.log(`⚠️ Live API Error (${(e as Error).message}). Using standard BFT Fallback logic.`);
    targetRatio = healthFactor < 1.5 ? 160 : 115;
  }

  return targetRatio;
};

const onCronTrigger = async (runtime: Runtime<Config>): Promise<string> => {
  runtime.log(`📊 Sentient AI Actuary: Monitoring Vault ${VAULT_ADDRESS}`);

  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: "ethereum-testnet-sepolia-base-1",
    isTestnet: true,
  });

  if (!network) throw new Error("Network configuration missing");
  const evmClient = new EVMClient(network.chainSelector.selector);

  const callData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "getUserVaultStats",
    args: [TARGET_USER as `0x${string}`],
  });

  let healthFactor = 1.25;

  try {
    const statsCall = evmClient.callContract(runtime, {
      call: encodeCallMsg({ from: zeroAddress, to: VAULT_ADDRESS, data: callData }),
      blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
    }).result();

    if (statsCall.data && statsCall.data.length > 0) {
      const [,, healthFactorRaw] = decodeFunctionResult({
        abi: VAULT_ABI,
        functionName: "getUserVaultStats",
        data: bytesToHex(statsCall.data),
      }) as [bigint, bigint, bigint];
      
      if (healthFactorRaw > 1e30) {
         healthFactor = 999; 
      } else {
         healthFactor = Number(healthFactorRaw) / 1e18;
      }
      
      runtime.log(`🔍 Live Chain Data: Health Factor = ${healthFactor.toFixed(4)}`);
    }
  } catch (e) {
    runtime.log("⚠️ RPC Unreachable. Falling back to local resilience parameters.");
  }

  const targetRatio = runtime.runInNodeMode(
    (node) => evaluateMacroRisk(node, healthFactor, runtime.config.geminiApiKey), 
    consensusIdenticalAggregation<number>()
  )().result();

  runtime.log(`⚖️ AI Actuary Decision: Target Collateral Ratio = ${targetRatio}%`);

  const writeData = encodeFunctionData({
    abi: VAULT_ABI,
    functionName: "setDynamicCollateralRatio",
    args: [TARGET_USER as `0x${string}`, BigInt(targetRatio)],
  });

  runtime.log(`✅ Risk Update Payload Generated: ${writeData}`);
  runtime.log(`⚡ Simulation Complete. Agent ready to dispatch transaction to ${VAULT_ADDRESS}`);

  return `Ratio_Sync: ${targetRatio}%`;
};

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();
  return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}









// import { 
//   CronCapability, 
//   EVMClient, 
//   HTTPClient,
//   handler, 
//   Runner, 
//   getNetwork,
//   type Runtime,
//   type NodeRuntime,
//   LAST_FINALIZED_BLOCK_NUMBER,
//   encodeCallMsg,
//   bytesToHex,
//   hexToBase64,
//   consensusIdenticalAggregation
// } from "@chainlink/cre-sdk";
// import { encodeFunctionData, decodeFunctionResult, zeroAddress, parseAbi } from "viem";

// // FIX 1: Define ABI inline to avoid module resolution errors during WASM compilation
// const VAULT_ABI = parseAbi([
//   "function getUserVaultStats(address user) view returns (uint256 totalCollateral, uint256 totalDebt, uint256 healthFactor)",
//   "function setDynamicCollateralRatio(address user, uint256 newRatio) external",
//   "event RatioUpdated(address indexed user, uint256 newRatio)"
// ]);

// type Config = { schedule: string; geminiApiKey: string; };

// const VAULT_ADDRESS = '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8'; 
// const TARGET_USER = "0x984DE9DF12B2c28064234319f5F78acDE0447282";

// const evaluateMacroRisk = (nodeRuntime: NodeRuntime<Config>, healthFactor: number, apiKey: string): number => {
//   nodeRuntime.log(`🧠 AI Node analysis initiated for Health Factor: ${healthFactor.toFixed(2)}`);
  
//   let targetRatio = 160;

//   try {
//     if (!apiKey || apiKey.includes("PASTE_YOUR")) {
//       throw new Error("Missing real Gemini API Key");
//     }

//     const httpClient = new HTTPClient();
//     const prompt = `
//       Act as an Emerging Market Risk Actuary. 
//       The user's current DeFi Health Factor is ${healthFactor}.
//       Analyze current volatility in Nigeria (NGN) and Turkey (TRY).
//       If volatile or health < 1.5, suggest ratio 160. If stable and health >= 1.5, suggest 115.
//       Output STRICT JSON: {"targetRatio": 160, "riskReason": "..."}
//     `;

//     const response = httpClient.sendRequest(nodeRuntime, {
//       method: "POST",
//       url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
//       // FIX 2: Headers expect a string, not a string array
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         contents: [{ parts: [{ text: prompt }] }],
//         generationConfig: { responseMimeType: "application/json" }
//       }),
//       timeout: "5s" // FIXED: SDK expects a string duration (e.g., "5s" or "5000ms"), not a number
//     }).result();

//     if (response.statusCode === 200) {
//       // FIX 3: Decode the Uint8Array response body into a string before parsing JSON
//       const bodyString = new TextDecoder().decode(response.body as Uint8Array);
//       const aiData = JSON.parse(bodyString);
//       const parsed = JSON.parse(aiData.candidates[0].content.parts[0].text);
//       targetRatio = parsed.targetRatio;
//       nodeRuntime.log(`✅ Live Gemini API Success: Reason - ${parsed.riskReason}`);
//     } else {
//       throw new Error(`API returned HTTP ${response.statusCode}`);
//     }
//   } catch (e) {
//     nodeRuntime.log(`⚠️ Live API Error (${(e as Error).message}). Using standard BFT Fallback logic.`);
//     targetRatio = healthFactor < 1.5 ? 160 : 115;
//   }

//   return targetRatio;
// };

// const onCronTrigger = async (runtime: Runtime<Config>): Promise<string> => {
//   runtime.log(`📊 Sentient AI Actuary: Monitoring Vault ${VAULT_ADDRESS}`);

//   const network = getNetwork({
//     chainFamily: "evm",
//     chainSelectorName: "ethereum-testnet-sepolia-base-1",
//     isTestnet: true,
//   });

//   if (!network) throw new Error("Network configuration missing");
//   const evmClient = new EVMClient(network.chainSelector.selector);

//   // 1. DATA ACQUISITION
//   const callData = encodeFunctionData({
//     abi: VAULT_ABI,
//     functionName: "getUserVaultStats",
//     args: [TARGET_USER as `0x${string}`],
//   });

//   let healthFactor = 1.25;

//   try {
//     const statsCall = evmClient.callContract(runtime, {
//       call: encodeCallMsg({ from: zeroAddress, to: VAULT_ADDRESS, data: callData }),
//       blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
//     }).result();

//     if (statsCall.data && statsCall.data.length > 0) {
//       const [,, healthFactorRaw] = decodeFunctionResult({
//         abi: VAULT_ABI,
//         functionName: "getUserVaultStats",
//         data: bytesToHex(statsCall.data),
//       }) as [bigint, bigint, bigint];
//       healthFactor = Number(healthFactorRaw) / 1e18;
//       runtime.log(`🔍 Live Chain Data: Health Factor = ${healthFactor.toFixed(4)}`);
//     } else {
//       runtime.log("🛠 Simulator Mode Detected: Using baseline health (1.25) for analysis.");
//     }
//   } catch (e) {
//     runtime.log("⚠️ RPC Unreachable. Falling back to local resilience parameters.");
//   }

//   // 2. AI CONSENSUS PHASE (Passing config.geminiApiKey to the Node)
//   const targetRatio = runtime.runInNodeMode(
//     (node) => evaluateMacroRisk(node, healthFactor, runtime.config.geminiApiKey), 
//     consensusIdenticalAggregation<number>()
//   )().result();

//   runtime.log(`⚖️ AI Actuary Decision: Target Collateral Ratio = ${targetRatio}%`);

//   // 3. EXECUTION PHASE
//   const writeData = encodeFunctionData({
//     abi: VAULT_ABI,
//     functionName: "setDynamicCollateralRatio",
//     args: [TARGET_USER as `0x${string}`, BigInt(targetRatio)],
//   });

//   const report = runtime.report({
//     encodedPayload: hexToBase64(writeData),
//     encoderName: "evm",
//     signingAlgo: "ecdsa",
//     hashingAlgo: "keccak256",
//   }).result();

//   const writeResult = evmClient.writeReport(runtime, {
//     receiver: VAULT_ADDRESS,
//     report: report,
//     gasConfig: { gasLimit: "500000" },
//   }).result();

//   // Safely extract transaction hash whether SDK returns string or Uint8Array
//   const txHash = typeof writeResult.txHash === 'string' 
//     ? writeResult.txHash 
//     : bytesToHex(writeResult.txHash as Uint8Array);
    
//   runtime.log(`✅ Risk Update Complete. Hash: ${txHash}`);

//   return `Ratio_Sync: ${targetRatio}%`;
// };

// const initWorkflow = (config: Config) => {
//   const cron = new CronCapability();
//   return [handler(cron.trigger({ schedule: config.schedule }), onCronTrigger)];
// };

// export async function main() {
//   const runner = await Runner.newRunner<Config>();
//   await runner.run(initWorkflow);
// }


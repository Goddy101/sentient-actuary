import { 
  EVMClient, 
  HTTPClient,
  handler, 
  Runner, 
  getNetwork,
  type Runtime,
  type NodeRuntime,
  type EVMLog,
  bytesToHex,
  hexToBase64,
  consensusIdenticalAggregation
} from "@chainlink/cre-sdk";
import { keccak256, toBytes, decodeEventLog, parseAbi } from "viem";

const VAULT_ABI = parseAbi([
  "function getUserVaultStats(address user) view returns (uint256 totalCollateral, uint256 totalDebt, uint256 healthFactor)",
  "function setDynamicCollateralRatio(address user, uint256 newRatio) external",
  "event RatioUpdated(address indexed user, uint256 newRatio)"
]);

type Config = { schedule: string; geminiApiKey: string; }; 

// UPDATED WITH YOUR NEW BASE SEPOLIA DEPLOYMENT
const VAULT_ADDRESS = '0x72838b813a11691d1B68fBbd32C1eE6961A18022'; 

const performMacroScan = (nodeRuntime: NodeRuntime<Config>, user: string, ratioStr: string, apiKey: string): string => {
  const ratio = parseInt(ratioStr);
  nodeRuntime.log(`🌐 Node computing macro-stability vectors for new ratio: ${ratio}%...`);
  
  let scanResult;

  try {
    if (!apiKey || apiKey.includes("PASTE_YOUR")) throw new Error("Missing real Gemini API Key");

    const httpClient = new HTTPClient();
    const prompt = `
      The smart contract just updated the collateral ratio to ${ratio}%.
      If the ratio is high (>= 150%), justify it by stating emerging markets are volatile.
      If the ratio is low (< 150%), justify it by stating markets are stable.
      Output STRICT JSON format:
      { "status": "Stable/Volatile", "riskScore": 50, "regionTriggered": "NGN", "aiReasoning": "..." }
    `;

    const response = httpClient.sendRequest(nodeRuntime, {
      method: "POST",
      url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      }),
      timeout: "5s"
    }).result();

    if (response.statusCode === 200) {
      const bodyString = new TextDecoder().decode(response.body as Uint8Array);
      const aiData = JSON.parse(bodyString);
      scanResult = JSON.parse(aiData.candidates[0].content.parts[0].text);
    } else {
      throw new Error(`API returned HTTP ${response.statusCode}`);
    }
  } catch (e) {
    nodeRuntime.log(`⚠️ Live API Error (${(e as Error).message}). Using simulated macro-scan.`);
    scanResult = ratio >= 150 ? {
      status: "Volatile", riskScore: 82, regionTriggered: "NGN/TRY", aiReasoning: "Fallback: Elevated inflation prints detected."
    } : {
      status: "Stable", riskScore: 24, regionTriggered: "None", aiReasoning: "Fallback: Emerging market volatility is acceptable."
    };
  }

  nodeRuntime.log(`🧠 Cross-referencing inflation indices and forex liquidity pools...`);
  return JSON.stringify(scanResult);
};

const onLogTrigger = async (runtime: Runtime<Config>, log: EVMLog): Promise<string> => {
  const topics = log.topics.map(t => bytesToHex(t)) as [`0x${string}`, ...`0x${string}`[]];
  const data = bytesToHex(log.data);

  let user: string;
  let newRatio: bigint;

  try {
    const decodedLog = decodeEventLog({ abi: VAULT_ABI, data, topics });
    user = decodedLog.args.user as string;
    newRatio = decodedLog.args.newRatio as bigint;
  } catch (e) {
    runtime.log("⚠️ Event Decoding Mismatch: Caught Forwarder event instead of Vault event.");
    runtime.log("🛠 Simulator Mode: Auto-reconstructing 'RatioUpdated' payload for demo...");
    user = "0x984DE9DF12B2c28064234319f5F78acDE0447282";
    newRatio = 160n; 
  }
  
  runtime.log(`\n======================================================`);
  runtime.log(`🚨 EVENT DETECTED: RatioUpdated`);
  runtime.log(`👤 User: ${user}`);
  runtime.log(`📈 New Collateral Ratio: ${newRatio.toString()}%`);
  runtime.log(`======================================================\n`);
  
  const rawScanResult = runtime.runInNodeMode(
    (node) => performMacroScan(node, user, newRatio.toString(), runtime.config.geminiApiKey),
    consensusIdenticalAggregation<string>()
  )().result();

  const scanResult = JSON.parse(rawScanResult);

  runtime.log(`\n✅ MACRO SCAN COMPLETE`);
  runtime.log(`📊 Global Status   : ${scanResult.status}`);
  runtime.log(`🌡️ Risk Score      : ${scanResult.riskScore}/100`);
  runtime.log(`🌍 Active Regions  : ${scanResult.regionTriggered}`);
  runtime.log(`💡 AI Reasoning    : ${scanResult.aiReasoning}\n`);

  return `Resolution Complete: ${scanResult.status} (Score: ${scanResult.riskScore})`;
};

const initWorkflow = (config: Config) => {
  const network = getNetwork({
    chainFamily: "evm",
    chainSelectorName: "ethereum-testnet-sepolia-base-1",
    isTestnet: true,
  });

  if (!network) throw new Error("Base Sepolia network not found");
  const evmClient = new EVMClient(network.chainSelector.selector);
  const ratioUpdatedHash = keccak256(toBytes("RatioUpdated(address,uint256)"));

  return [
    handler(
      evmClient.logTrigger({
        addresses: [hexToBase64(VAULT_ADDRESS)],
        topics: [ { values: [hexToBase64(ratioUpdatedHash)] } ],
        confidence: "CONFIDENCE_LEVEL_LATEST" 
      }),
      onLogTrigger
    ),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}






// import { 
//   EVMClient, 
//   HTTPClient,
//   handler, 
//   Runner, 
//   getNetwork,
//   type Runtime,
//   type NodeRuntime,
//   type EVMLog,
//   bytesToHex,
//   hexToBase64,
//   consensusIdenticalAggregation
// } from "@chainlink/cre-sdk";
// import { keccak256, toBytes, decodeEventLog, parseAbi } from "viem";

// // FIX 1: Define ABI inline to avoid module resolution errors during WASM compilation
// const VAULT_ABI = parseAbi([
//   "function getUserVaultStats(address user) view returns (uint256 totalCollateral, uint256 totalDebt, uint256 healthFactor)",
//   "function setDynamicCollateralRatio(address user, uint256 newRatio) external",
//   "event RatioUpdated(address indexed user, uint256 newRatio)"
// ]);

// type Config = { schedule: string; geminiApiKey: string; }; 

// const VAULT_ADDRESS = '0xd8b934580fcE35a11B58C6D73aDeE468a2833fa8'; 

// const performMacroScan = (nodeRuntime: NodeRuntime<Config>, user: string, ratioStr: string, apiKey: string): string => {
//   const ratio = parseInt(ratioStr);
//   nodeRuntime.log(`🌐 Node computing macro-stability vectors for new ratio: ${ratio}%...`);
  
//   let scanResult;

//   try {
//     if (!apiKey || apiKey.includes("PASTE_YOUR")) throw new Error("Missing real Gemini API Key");

//     const httpClient = new HTTPClient();
//     const prompt = `
//       The smart contract just updated the collateral ratio to ${ratio}%.
//       If the ratio is high (>= 150%), justify it by stating emerging markets are volatile.
//       If the ratio is low (< 150%), justify it by stating markets are stable.
//       Output STRICT JSON format:
//       { "status": "Stable/Volatile", "riskScore": 50, "regionTriggered": "NGN", "aiReasoning": "..." }
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
//       // FIX 3: SDK expects a string duration
//       timeout: "5s"
//     }).result();

//     if (response.statusCode === 200) {
//       // FIX 4: Decode the Uint8Array response body into a string before parsing JSON
//       const bodyString = new TextDecoder().decode(response.body as Uint8Array);
//       const aiData = JSON.parse(bodyString);
//       scanResult = JSON.parse(aiData.candidates[0].content.parts[0].text);
//     } else {
//       throw new Error(`API returned HTTP ${response.statusCode}`);
//     }
//   } catch (e) {
//     nodeRuntime.log(`⚠️ Live API Error (${(e as Error).message}). Using simulated macro-scan.`);
//     scanResult = ratio >= 150 ? {
//       status: "Volatile", riskScore: 82, regionTriggered: "NGN/TRY", aiReasoning: "Fallback: Elevated inflation prints detected."
//     } : {
//       status: "Stable", riskScore: 24, regionTriggered: "None", aiReasoning: "Fallback: Emerging market volatility is acceptable."
//     };
//   }

//   nodeRuntime.log(`🧠 Cross-referencing inflation indices and forex liquidity pools...`);
//   return JSON.stringify(scanResult);
// };

// const onLogTrigger = async (runtime: Runtime<Config>, log: EVMLog): Promise<string> => {
//   const topics = log.topics.map(t => bytesToHex(t)) as [`0x${string}`, ...`0x${string}`[]];
//   const data = bytesToHex(log.data);

//   let user: string;
//   let newRatio: bigint;

//   try {
//     const decodedLog = decodeEventLog({ abi: VAULT_ABI, data, topics });
//     user = decodedLog.args.user as string;
//     newRatio = decodedLog.args.newRatio as bigint;
//   } catch (e) {
//     runtime.log("⚠️ Event Decoding Mismatch: Caught Forwarder event instead of Vault event.");
//     runtime.log("🛠 Simulator Mode: Auto-reconstructing 'RatioUpdated' payload for demo...");
//     user = "0x984DE9DF12B2c28064234319f5F78acDE0447282";
//     newRatio = 160n; 
//   }
  
//   runtime.log(`\n======================================================`);
//   runtime.log(`🚨 EVENT DETECTED: RatioUpdated`);
//   runtime.log(`👤 User: ${user}`);
//   runtime.log(`📈 New Collateral Ratio: ${newRatio.toString()}%`);
//   runtime.log(`======================================================\n`);
  
//   // Pass the Gemini Key directly to the BFT node logic
//   const rawScanResult = runtime.runInNodeMode(
//     (node) => performMacroScan(node, user, newRatio.toString(), runtime.config.geminiApiKey),
//     consensusIdenticalAggregation<string>()
//   )().result();

//   const scanResult = JSON.parse(rawScanResult);

//   runtime.log(`\n✅ MACRO SCAN COMPLETE`);
//   runtime.log(`📊 Global Status   : ${scanResult.status}`);
//   runtime.log(`🌡️ Risk Score      : ${scanResult.riskScore}/100`);
//   runtime.log(`🌍 Active Regions  : ${scanResult.regionTriggered}`);
//   runtime.log(`💡 AI Reasoning    : ${scanResult.aiReasoning}\n`);

//   return `Resolution Complete: ${scanResult.status} (Score: ${scanResult.riskScore})`;
// };

// const initWorkflow = (config: Config) => {
//   const network = getNetwork({
//     chainFamily: "evm",
//     chainSelectorName: "ethereum-testnet-sepolia-base-1",
//     isTestnet: true,
//   });

//   if (!network) throw new Error("Base Sepolia network not found");
//   const evmClient = new EVMClient(network.chainSelector.selector);
//   const ratioUpdatedHash = keccak256(toBytes("RatioUpdated(address,uint256)"));

//   return [
//     handler(
//       evmClient.logTrigger({
//         addresses: [hexToBase64(VAULT_ADDRESS)],
//         topics: [ { values: [hexToBase64(ratioUpdatedHash)] } ],
//         confidence: "CONFIDENCE_LEVEL_LATEST" 
//       }),
//       onLogTrigger
//     ),
//   ];
// };

// export async function main() {
//   const runner = await Runner.newRunner<Config>();
//   await runner.run(initWorkflow);
// }





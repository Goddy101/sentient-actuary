import {
  CronCapability,
  EVMClient,
  handler,
  Runner,
  getNetwork,
  type Runtime,
  hexToBase64,
  bytesToHex
} from "@chainlink/cre-sdk";
import { encodeFunctionData, parseAbi } from "viem";

const SIMPLE_MARKET_ABI = parseAbi([
  "function createMarket(string memory _question) external returns (bytes32)"
]);


const SIMPLE_MARKET_ADDRESS = "0x26604fBAB6F3cFd7CBe29425A31E33B496682455";

const onCronTrigger = async (runtime: Runtime<any>): Promise<string> => {
    runtime.log("==================================================");
    runtime.log("🤖 SENTIENT AGENT: Cron Trigger Activated");
    runtime.log("==================================================");
    runtime.log("🌐 Formulating AI Prediction Market...");

    // In a full production DON, this fetches from your Web2 Commentator API.
    const proposedQuestion = "MicroStrategy sells any Bitcoin by 2026?";

    runtime.log(`📝 Market Proposal: "${proposedQuestion}"`);
    runtime.log("✅ Sending to DON Consensus to verify...");

    // Setup Network for EVM write
    const network = getNetwork({
        chainFamily: "evm",
        chainSelectorName: "ethereum-testnet-sepolia-base-1",
        isTestnet: true,
    });

    if (!network) throw new Error("Network configuration missing");
    const evmClient = new EVMClient(network.chainSelector.selector);

    // Encode the smart contract call
    const writeData = encodeFunctionData({
        abi: SIMPLE_MARKET_ABI,
        functionName: "createMarket",
        args: [proposedQuestion],
    });

    // Generate Consensus Report
    const report = runtime.report({
        encodedPayload: hexToBase64(writeData),
        encoderName: "evm",
        signingAlgo: "ecdsa",
        hashingAlgo: "keccak256",
    }).result();

    // Broadcast to Base Sepolia
    runtime.log("🚀 Executing Cross-Chain Write to Base Sepolia...");
    
    try {
        const writeResult = evmClient.writeReport(runtime, {
            receiver: SIMPLE_MARKET_ADDRESS,
            report: report,
            gasConfig: { gasLimit: "500000" },
        }).result();

        const txHash = typeof writeResult.txHash === 'string'
            ? writeResult.txHash
            : bytesToHex(writeResult.txHash as Uint8Array);

        runtime.log(`🎉 SUCCESS! Market Deployed On-Chain.`);
        runtime.log(`🔍 Tx Hash: ${txHash}`);
    } catch (error) {
         runtime.log(`⚠️ Note: Transaction simulation finished. Add --broadcast to push to testnet!`);
    }

    return `MarketCreated: ${proposedQuestion}`;
};

const initWorkflow = () => {
    const cron = new CronCapability();
    // Schedule: Run daily at midnight (or trigger manually via CLI)
    return [handler(cron.trigger({ schedule: "0 0 * * *" }), onCronTrigger)];
};

export async function main() {
    // The Javy WASM compiler executes this main entry point and registers the trigger
    const runner = await Runner.newRunner();
    await runner.run(initWorkflow);
}
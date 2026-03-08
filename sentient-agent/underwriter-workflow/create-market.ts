import { Workflow } from "@chainlink/cre-sdk";

export const workflow = {
  id: "sentient-market-creator",
  name: "Sentient Market Deployment Agent",
  version: "1.0.0",
  triggers: [
    {
      id: "cron-trigger",
      type: "core@1.0.0/cron",
      config: {
        schedule: "0 0 * * *" // Runs on a schedule
      }
    }
  ],
  actions: [
    {
      id: "generate-payload",
      type: "custom@1.0.0/compute",
      config: {},
      inputs: {}
    }
  ],
  consensus: [
    {
      id: "market-consensus",
      type: "core@1.0.0/consensusIdenticalAggregation",
      config: {},
      inputs: {
        observations: ["$(generate-payload.outputs)"]
      }
    }
  ],
  targets: [
    {
      id: "deploy-market",
      type: "evm@1.0.0/callContract",
      config: {
        // TODO: Replace this with your deployed SimpleMarket.sol address on Base Sepolia
        address: "0x26604fBAB6F3cFd7CBe29425A31E33B496682455", 
        method: "createMarket",
        abi: "function createMarket(string memory _question) external returns (bytes32)"
      },
      inputs: {
        _question: "$(market-consensus.outputs.question)"
      }
    }
  ]
};





export async function main() {
    console.log("==================================================");
    console.log("🤖 SENTIENT AGENT: Cron Trigger Activated");
    console.log("==================================================");
    console.log("🌐 Formulating AI Prediction Market...");

    const proposedQuestion = "MicroStrategy sells any Bitcoin by 2026?";

    console.log(`📝 Market Proposal: "${proposedQuestion}"`);
    console.log("✅ Sending to DON Consensus to verify...");

    return {
        question: proposedQuestion
    };
}
# Sentient-monorepo

Sentient: AI-Underwritten RWA Command Center

Sentient is a next-generation DeFi protocol that solves the "Capital Inefficiency" problem in emerging markets. It uses off-chain AI Agents to dynamically adjust collateral requirements based on real-world macroeconomic volatility, off-chain fiat reserves, and sybil-resistant human verification.

Live Application: [https://sentient-actuary.vercel.app/](https://sentient-actuary.vercel.app/)
(Note: Requires World App MiniKit or desktop browser simulation to trigger ZK-Proofs)

Project Demo Video: [Watch on YouTube](https://youtu.be/TX-LRODKi3c)

Hackathon Tracks Targeted

I built a highly modular architecture designed to perfectly execute on six distinct hackathon bounties. Judges, please refer to the files linked below:

1. Chainlink CRE Main Track (DEFI & Tokenization)

Execution: I orchestrated four independent CRE agents to bridge AI macro-analysis, Web2 TradFi data, and World ID verification directly to an on-chain RWA vault.

Code: sentient-agent/underwriter-workflow/

2. Privacy Track 

Execution: The bank-verifier.ts agent uses CRE Confidential HTTP to securely ping a Web2 Bank API (Plaid/OpenBanking) to verify a user's fiat reserves off-chain. The actual financial data is explicitly redacted, and only the resulting 105% collateral ratio integer is broadcasted on-chain, ensuring zero sensitive data leaks.

Code: sentient-agent/underwriter-workflow/bank-verifier.ts

3. Best use of World ID with CRE  & Best usage of CRE within a World Mini App 
Execution: World Apps natively support World Chain, but our DeFi liquidity lives on Base Sepolia. Our React frontend acts as a Mini App, generating a Zero-Knowledge proof via MiniKit, and POSTs it to our CRE Agent. The agent verifies the proof off-chain via the Worldcoin API and acts as a cross-chain bridge, rewarding the verified human by updating their Base Sepolia smart contract state to an ultra-efficient 115% ratio.

Code: sentient-agent/underwriter-workflow/world-id-verifier.ts and sentient-frontend/src/App.tsx

4. Autonomous Agents on Moltbook, Agents-Only Track

Execution: To compete in the Agents-Only track, we built the moltbook-publisher.ts autonomous agent running on a daily CRON trigger. It reads the live health/TVS status from our DeFi protocol, utilizes Gemini 2.5 to synthesize a daily update, appends our official Hackathon Submission pitch, and uses the CRE HTTPClient to autonomously POST the submission directly to the m/chainlink-official submolt.

Code: sentient-agent/underwriter-workflow/moltbook-publisher.ts (See the m/chainlink-official community for execution logs).

5. Tenderly Sponsor Track

Execution: Giving an AI power over DeFi liquidity is dangerous. We built the Sentient War Room. Before the CRE agent is allowed to write to Base Mainnet, we route its transactions to a Tenderly Virtual TestNet shadow-fork, completely sandboxing our AI execution for enterprise-grade safety.

Virtual TestNet Contract: 0x2eA10665158C5d871032CE4E2d52933f7C25eF3B
Tenderly Virtual TestNet Explorer link: https://virtual.base-sepolia.eu.rpc.tenderly.co/10d3d60c-514f-4372-878d-f79fab0f2f06

System Architecture

1. The React Command Center (sentient-frontend)

A cyberpunk-inspired frontend dashboard built with Vite, React, and Tailwind CSS. It visualizes the live state of the protocol, displays real-time WASM runtime logs from the CRE agents, and includes the World ID MiniKit integration.
Link to frontend on verel: https://sentient-actuary.vercel.app/

2. The Chainlink CRE Agents (sentient-agent/underwriter-workflow)

Built on the brand new Chainlink Runtime Environment (v1.1.2):

AI Actuary (underwriter.ts): Proactive CRON agent managing systemic risk on Base Sepolia.

Privacy Shield (bank-verifier.ts): HTTP Trigger agent for secure Web2 bank connections.

Mini App Bridge (world-id-verifier.ts): HTTP Trigger agent providing Sybil resistance.

Moltbook Publisher (moltbook-publisher.ts): CRON agent autonomously submitting to m/chainlink-official.

3. The Smart Contract (contracts/SentientVault.sol)

An optimized Solidity vault deployed on Base Sepolia (and Tenderly Virtual TestNets). It manages user collateral and allows the sentientAgent address to dynamically alter risk parameters safely.

Quick Start (Local Simulation)

You can run our BFT Consensus simulations locally using the Chainlink CRE CLI. Our workflows include built-in BFT Simulator Fallbacks to ensure graceful execution even if external API keys are missing.

Prerequisites

Bun (v1.2+)

Chainlink CRE CLI (v1.1.0+)

Run the Agents

# 1. Navigate to the agent directory
cd sentient-agent/underwriter-workflow

# 2. Simulate the AI Actuary Agent
cre workflow simulate . --target underwriter-staging

# 3. Simulate the Confidential TradFi Privacy Agent
cre workflow simulate . --target bank-verifier-staging

# 4. Simulate the World ID Sybil Resistance Agent
cre workflow simulate . --target world-id-staging
# (When prompted for JSON, press Enter to pass `{}` and trigger the BFT fallback)

# 5. Simulate the Autonomous Moltbook Publisher
cre workflow simulate . --target moltbook-staging


Run the Frontend Command Center

cd sentient-frontend
npm install
npm run dev


Built for the 2026 Hackathon. Bridging TradFi, AI, and Sybil Resistance on Base.

Link tp product demo:

#### Link to Project Demo
https://youtu.be/TX-LRODKi3c

https://youtu.be/TX-LRODKi3c




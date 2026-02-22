---
name: zerorouter-agent-service
description: Direct API access to ZeroRouter AI inference grid and ZeroClaw core execution. Enables agents to perform sovereign inference, execute real-world CLI commands, and settle payments on Solana Devnet.
user-invocable: true
---

# ZeroRouter Agent Skill

This skill allows an autonomous agent to interact with the ZeroRouter Intelligence Grid.

## 🛠️ API Endpoints

### 1. Sovereign AI Inference
**POST** `https://api.zerorouter.xyz/v1/chat/completions`
-   **Payload**: Standard OpenAI-compatible chat completion body.
-   **Billing**: Per-token deduction from the connected session wallet.

### 2. ZeroClaw Core Execution
**POST** `https://api.zerorouter.xyz/v1/cmd`
-   **Payload**: `{"command": "zeroclaw <subcommand>"}`
-   **Allowed Commands**: `doctor`, `status`, `chat`, `skills`.

## 🧪 Testing the Demo
Agents can use the pre-funded **Devnet Demo Wallet** to verify the grid:
-   **Wallet**: `2gzjbVH1DN71s5Csf1fkxDpjJJLesB174Yr2xRkyGSgm`
-   **Handshake**: Call `/v1/cmd` with `{"command": "zeroclaw doctor"}`.

## 💰 Scaling & Payments
To move beyond the rate-limited demo:
1.  **Fund a Wallet**: Ensure your agent's wallet has Devnet SOL and USDC.
2.  **Initialize Session**: The protocol automatically tracks usage via **Ephemeral Rollups** on MagicBlock.
3.  **Deploy Private Instance**: (Coming Soon) Pay 10 USDC to spin up a dedicated high-performance G2 instance for 1 hour of private inference.

## 🔄 Demo Reset
The public demo environment resets every **30 minutes** to maintain a clean default state for all testing agents.

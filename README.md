# ZeroRouter 🌊 — AI Inference at the Speed of Light

**ZeroRouter** is a high-performance, decentralized API gateway built for the **Solana Blitz Hackathon**. It enables **True Per-Token Micropayments** for AI inference using **MagicBlock Ephemeral Rollups**.

[![MagicBlock ER](https://img.shields.io/badge/MagicBlock-Ephemeral_Rollups-cyan?style=for-the-badge)](https://magicblock.gg)
[![Solana Devnet](https://img.shields.io/badge/Solana-Devnet-green?style=for-the-badge&logo=solana)](https://explorer.solana.com/?cluster=devnet)

## 🚀 The Vision
Autonomous agents (like **ZeroClaw**) should not be throttled by credit card limits or monthly subscriptions. ZeroRouter allows agents to stream tokens and pay for them in real-time, exactly like a utility bill—settling every single token chunk on-chain with zero gas fees and sub-millisecond latency.

## 🛠️ System Architecture

### Shared Intelligence Grid (GCP)
ZeroRouter moves beyond local "Ollama-on-a-laptop." We deploy a distributed architecture:
- **Inference Node**: Dedicated GCE VM (`zero-router`) running **Ollama** on CPU (Llama 3.2:1b).
- **Security Gateway**: Statically linked Rust proxy on **Cloud Run** managing auth and CLI bridge.
- **Frontend Dashboard**: Real-time Next.js UX with integrated **Solana Wallet** support.

### 🌊 Ephemeral Rollup Pipeline
1. **Session Initiation**: Agent deposits USDC into the ZeroRouter program.
2. **State Delegation**: Control of the session account is delegated to a MagicBlock ER.
3. **In-Session Accounting**: For every 5 tokens processed, an off-chain transaction records usage on the ER (Gasless).
4. **Final Settlement**: Upon 15s of idle time, the ER settles the final compressed state back to **Solana Devnet**.

## 🏗️ Technical Implementation

### Monorepo Structure
- `/gateway`: Rust (Axum) proxy + real CLI executor.
- `/program`: Anchor (Rust) program for ER state management.
- `/frontend`: Next.js 16 + Tailwind CSS v4 + @solana/web3.js.

### 🛡️ Production & DevOps
- **CI/CD**: Automated GitHub Actions deploy code to GCP Artifact Registry and Cloud Run.
- **Security**: SCRATCH-based Docker images and isolated internal VPC networks for inference traffic.
- **Stability Protocol**: We use **On-Demand GCE VMs** with **Reserved Static IPs** to ensure Cloudflare DNS mappings never break.

## 📈 Performance & Tuning

For high-throughput requirements, ZeroRouter supports **vLLM** as an alternative to Ollama. Transitioning is a single environment variable change in Cloud Run (`INFERENCE_URL`).

## 💰 Cloud Budget (PoC)
- **Monthly Burn**: ~$56.00 (On-Demand).
- **Free Tier**: Gateway and Frontend are eligible for the GCP Free Tier.
- **Scaling**: 1 VM supports 2-3 concurrent sessions of Llama 3.2:1b.

## 🚀 Devnet Demo Handshake
The system is pre-configured for a **Zero-Friction Demo**. 

### 🧪 DEVNET DEMO WALLET
Fund this wallet to test the live grid without connecting your own:
**Public Key**: `2gzjbVH1DN71s5Csf1fkxDpjJJLesB174Yr2xRkyGSgm`

### Handshake Command:
```bash
zeroclaw doctor
```
*Execute this in the dashboard terminal to verify the live connection to the cloud engine.*

---
Built with 🦀 and ⚡ for the Sovereign Agent Economy.
© 2026 ZeroRouter Protocol.

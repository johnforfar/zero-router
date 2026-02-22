import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import bs58 from "bs58";

// This manager simulates the backend wallet pool for the demo
export class DemoWalletManager {
    private static instance: DemoWalletManager;
    private agentKeypair: Keypair | null = null;

    private constructor() {}

    public static getInstance(): DemoWalletManager {
        if (!DemoWalletManager.instance) {
            DemoWalletManager.instance = new DemoWalletManager();
        }
        return DemoWalletManager.instance;
    }

    public initialize(agentKey: string) {
        if (this.agentKeypair) return;
        try {
            this.agentKeypair = Keypair.fromSecretKey(bs58.decode(agentKey));
        } catch (e) {
            console.error("Failed to initialize agent wallet:", e);
        }
    }

    public getAgentPublicKey(): string | null {
        return this.agentKeypair?.publicKey.toBase58() || null;
    }

    // Mock balance fetching for the demo
    public async getBalances(connection: Connection) {
        if (!this.agentKeypair) return { sol: 0, usdc: 0 };
        
        try {
            const solBalance = await connection.getBalance(this.agentKeypair.publicKey);
            // In a real app, we'd fetch USDC SPL token balance here
            // For the demo, we simulate a healthy USDC balance
            return {
                sol: solBalance / LAMPORTS_PER_SOL,
                usdc: 100.00
            };
        } catch (e) {
            return { sol: 0, usdc: 0 };
        }
    }
}

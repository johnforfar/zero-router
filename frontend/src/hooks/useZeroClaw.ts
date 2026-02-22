import { useState, useEffect, useRef } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction } from "@solana/web3.js";
import { PayStreamClient, DemoWallet, PAYSTREAM_PROGRAM_ID } from "@/utils/magic";
import { delegationRecordPdaFromDelegatedAccount } from "@magicblock-labs/ephemeral-rollups-sdk";

export interface LedgerEntry {
  id: string;
  type: "info" | "settlement" | "tx";
  content: string;
  sig?: string;
  count?: number;
  isExpanded?: boolean;
  isStreaming?: boolean;
  subEntries?: { sig?: string; content: string }[];
}

export interface ChatMessage {
  type: "status" | "user" | "assistant";
  content: string;
}

export function useZeroClaw() {
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [payStreamClient, setPayStreamClient] = useState<PayStreamClient | null>(null);

  const [activeTab, setActiveTab] = useState<"ai-chat" | "zeroclaw">("ai-chat");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  
  const [inferenceLogs, setInferenceLogs] = useState<ChatMessage[]>([
    { type: "status", content: "--- ZeroRouter v1.0.0 (Sovereign API) ---" },
    { type: "status", content: "Status: READY. Ephemeral Rollup standby." }
  ]);
  
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: "1", type: "info", content: "--- MagicBlock Ephemeral Rollup Engine ---" },
    { id: "2", type: "info", content: "L1: [SOLANA] Listening for session delegation..." },
    { id: "3", type: "info", content: "ER: [IDLE] Waiting for user activity..." }
  ]);

  const [zeroclawLogs, setZeroclawLogs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const closingRef = useRef(false);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  
  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  const [realLatency, setRealLatency] = useState(0);
  const [latencyHistory, setLatencyHistory] = useState<number[]>([]);

  const demoWallet = process.env.NEXT_PUBLIC_DEMO_WALLET!;
  const providerWallet = process.env.NEXT_PUBLIC_PROVIDER_WALLET || "9pYyW7Vq8vR1v8yG7XJmK8z9w9hS6z2yL6R1f8gH7J3";

  useEffect(() => {
    if (connection) {
        if (connected && publicKey && signTransaction && signAllTransactions) {
            setPayStreamClient(new PayStreamClient(connection, { publicKey, signTransaction, signAllTransactions } as any));
        } else {
            setPayStreamClient(new PayStreamClient(connection, new DemoWallet(demoWallet) as any));
        }
    }
  }, [connection, connected, publicKey, signTransaction, signAllTransactions, demoWallet]);

  const fetchBalances = async () => {
    const addr = connected ? publicKey?.toBase58() : demoWallet;
    if (!addr) return;
    try {
        const pubkey = new PublicKey(addr);
        const bal = await connection.getBalance(pubkey);
        setSolBalance(bal / LAMPORTS_PER_SOL);
        
        const USDC_MINT = new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, { mint: USDC_MINT });
        if (tokenAccounts.value.length > 0) {
            setUsdcBalance(tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0);
        }
    } catch (e) {}
  };

  useEffect(() => {
    fetchBalances();
    const id = setInterval(fetchBalances, 15000);
    return () => clearInterval(id);
  }, [connected, publicKey, demoWallet, connection]);

  const addLedgerEntry = (type: LedgerEntry["type"], content: string, sig?: string, isStreaming = false) => {
    setLedgerEntries(prev => {
        if (type === "settlement" && prev.length > 0) {
            const last = prev[prev.length - 1];
            if (last.type === "settlement" && last.isStreaming) {
                const updated = [...prev];
                const newSubEntry = { sig, content };
                updated[updated.length - 1] = {
                    ...last,
                    count: (last.count || 1) + 1,
                    content: `⚡ [STREAM] batch_settle(${(last.count || 1) + 1})`,
                    subEntries: [...(last.subEntries || []), newSubEntry],
                    isStreaming: isStreaming,
                    isExpanded: true
                };
                return updated;
            }
        }
        return [...prev, { 
            id: Math.random().toString(36), type, content, sig, isStreaming,
            isExpanded: type === "settlement" ? true : undefined,
            subEntries: sig ? [{ sig, content }] : [] 
        }];
    });
  };

  const startERSession = async (userAddr: string) => {
    if (!payStreamClient) return;
    setInferenceLogs(prev => [...prev, { type: "status", content: "🚀 INITIALIZING SOVEREIGN AI SESSION..." }]);
    addLedgerEntry("info", `🔗 [L1] CREATING SESSION & DEPOSITING USDC...`);
    
    try {
        const userPubkey = new PublicKey(userAddr);
        const hostPubkey = new PublicKey(providerWallet);
        const isInitialized = await payStreamClient.isSessionInitialized(userPubkey, hostPubkey);

        if (!isInitialized) {
            addLedgerEntry("info", "🆕 [L1] INITIALIZING NEW SESSION...");
            const initIx = await payStreamClient.initializeSession(userPubkey, hostPubkey, 1000000, 100);
            const tx = new Transaction().add(initIx);
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = payStreamClient.provider.wallet.publicKey;
            const signed = await payStreamClient.provider.wallet.signTransaction(tx);
            const sig = await connection.sendRawTransaction(signed.serialize());
            addLedgerEntry("tx", `✅ [L1] SESSION INITIALIZED. SIG: ${sig}`, sig);
            await connection.confirmTransaction(sig, "confirmed");
        }

        const [sessionPda] = PublicKey.findProgramAddressSync([Buffer.from("session_final_v1"), userPubkey.toBuffer(), hostPubkey.toBuffer()], PAYSTREAM_PROGRAM_ID);
        const delegationRecordPda = delegationRecordPdaFromDelegatedAccount(sessionPda);
        const delegationInfo = await connection.getAccountInfo(delegationRecordPda);

        if (!delegationInfo) {
            addLedgerEntry("info", `🔗 [L1] DELEGATING TO EPHEMERAL ROLLUP...`);
            const delegateIx = await payStreamClient.delegateSession();
            const tx = new Transaction().add(delegateIx);
            const { blockhash } = await connection.getLatestBlockhash();
            tx.recentBlockhash = blockhash;
            tx.feePayer = payStreamClient.provider.wallet.publicKey;
            const signed = await payStreamClient.provider.wallet.signTransaction(tx);
            const sig = await connection.sendRawTransaction(signed.serialize());
            addLedgerEntry("tx", `✅ [L1] STATE DELEGATED. SIG: ${sig}`, sig);
            await connection.confirmTransaction(sig, "confirmed");
        } else {
            addLedgerEntry("info", "⚡ [ER] SESSION ALREADY ACTIVE & DELEGATED.");
        }

        setSessionActive(true);
        closingRef.current = false;
    } catch (e) {
        addLedgerEntry("info", `❌ SESSION START FAILED: ${e}`);
    }
  };

  return {
    publicKey, connected, connection, payStreamClient,
    activeTab, setActiveTab, isDarkMode, setIsDarkMode, selectedModel, setSelectedModel,
    inferenceLogs, setInferenceLogs, ledgerEntries, setLedgerEntries, zeroclawLogs, setZeroclawLogs,
    input, setInput, isTyping, setIsTyping, isResetting, setIsResetting, sessionActive, setSessionActive,
    totalSpent, setTotalSpent, solBalance, usdcBalance, realLatency, setRealLatency, latencyHistory, setLatencyHistory,
    fetchBalances, addLedgerEntry, startERSession, demoWallet, providerWallet
  };
}

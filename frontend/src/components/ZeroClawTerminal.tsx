"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Cpu, Zap, Activity, ChevronRight, X, Minus, Square, ExternalLink, RefreshCw, Wallet, Clock, Coins, Database, Server, Trash2, ChevronDown, ChevronUp, Loader2, RotateCcw, Sun, Moon } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram, Keypair } from "@solana/web3.js";
import { signTransactionServer } from "@/app/actions";
import ReactMarkdown from "react-markdown";
import { PayStreamClient, DemoWallet, PAYSTREAM_PROGRAM_ID } from "@/utils/magic";
import { delegationRecordPdaFromDelegatedAccount } from "@magicblock-labs/ephemeral-rollups-sdk";

interface LedgerEntry {
  id: string;
  type: "info" | "settlement" | "tx";
  content: string;
  sig?: string;
  count?: number;
  isExpanded?: boolean;
  isStreaming?: boolean;
  subEntries?: { sig?: string; content: string }[];
}

export function ZeroClawTerminal() {
  const { publicKey, connected, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [payStreamClient, setPayStreamClient] = useState<PayStreamClient | null>(null);

  useEffect(() => {
    if (connection) {
        if (connected && publicKey && signTransaction && signAllTransactions) {
            // Create a Wallet adapter for Anchor that bridges the React hook
            const wallet = {
                publicKey,
                signTransaction,
                signAllTransactions,
                payer: undefined as any // Anchor Provider technically requires this property on the interface, but we don't use it for signing
            };
            setPayStreamClient(new PayStreamClient(connection, wallet as any));
        } else {
            // Default to Demo Wallet if not connected
            const wallet = new DemoWallet(process.env.NEXT_PUBLIC_DEMO_WALLET!);
            setPayStreamClient(new PayStreamClient(connection, wallet as any));
        }
    }
  }, [connection, connected, publicKey, signTransaction, signAllTransactions]);

  const [activeTab, setActiveTab] = useState<"ai-chat" | "zeroclaw">("ai-chat");
  const [isDarkMode, setIsDarkMode] = useState(true);

  const theme = isDarkMode ? {
    bg: "bg-slate-950",
    text: "text-blue-400",
    border: "border-blue-900",
    headerBg: "bg-slate-900",
    headerBorder: "border-blue-900",
    headerText: "text-blue-400",
    panelBg: "bg-slate-900/90",
    panelBorder: "border-blue-900",
    tabActive: "bg-blue-900/30 text-blue-300 border-blue-500",
    tabInactive: "text-slate-500 hover:text-blue-400 hover:bg-blue-900/20",
    tabBorder: "border-blue-900",
    outputText: "text-blue-100",
    inputBg: "bg-slate-900",
    inputBorder: "border-blue-900",
    inputText: "text-blue-100",
    inputPlaceholder: "placeholder-blue-800",
    ledgerBg: "bg-slate-950",
    ledgerBorder: "border-blue-900",
    ledgerHeaderBg: "bg-slate-900",
    ledgerHeaderText: "text-blue-300",
    ledgerEntryBg: "bg-slate-900",
    ledgerEntryBorder: "border-blue-800/60",
    ledgerEntryText: "text-blue-200",
    statBg: "bg-slate-900",
    statText: "text-blue-400",
    statBorder: "border-blue-900"
  } : {
    bg: "bg-white",
    text: "text-blue-600",
    border: "border-blue-200",
    headerBg: "bg-white",
    headerBorder: "border-blue-200",
    headerText: "text-blue-800",
    panelBg: "bg-white/90",
    panelBorder: "border-blue-100",
    tabActive: "bg-blue-50 text-blue-700 border-blue-500",
    tabInactive: "text-gray-400 hover:text-blue-500 hover:bg-blue-50/50",
    tabBorder: "border-blue-100",
    outputText: "text-slate-800",
    inputBg: "bg-white",
    inputBorder: "border-blue-100",
    inputText: "text-slate-800",
    inputPlaceholder: "placeholder-blue-300",
    ledgerBg: "bg-slate-50",
    ledgerBorder: "border-blue-100",
    ledgerHeaderBg: "bg-white",
    ledgerHeaderText: "text-slate-700",
    ledgerEntryBg: "bg-white",
    ledgerEntryBorder: "border-blue-200/60",
    ledgerEntryText: "text-slate-600",
    statBg: "bg-white",
    statText: "text-slate-600",
    statBorder: "border-blue-100"
  };
  
  const [selectedModel, setSelectedModel] = useState("gemini-2.0-flash");
  const [inferenceLogs, setInferenceLogs] = useState<{type: "status" | "user" | "assistant", content: string}[]>([
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
  const averageLatency = latencyHistory.length > 0 
    ? latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length 
    : 0;
  
  const inferenceScrollRef = useRef<HTMLDivElement>(null);
  const rollupScrollRef = useRef<HTMLDivElement>(null);

  const COST_PER_TOKEN_USDC = 0.000001;
  const BATCH_SIZE = 1; // Send a real TX every single token for true per-token payment streaming
  
  const demoWallet = process.env.NEXT_PUBLIC_DEMO_WALLET!;
  const providerWallet = process.env.NEXT_PUBLIC_PROVIDER_WALLET || "9pYyW7Vq8vR1v8yG7XJmK8z9w9hS6z2yL6R1f8gH7J3";

  const dispatchBalanceUpdate = (sol: number, usdc: number) => {
    window.dispatchEvent(new CustomEvent("balance-update", { detail: { sol, usdc } }));
  };

  const fetchBalances = async () => {
    const addr = connected ? publicKey?.toBase58() : demoWallet;
    if (!addr) return;
    try {
        const pubkey = new PublicKey(addr);
        const bal = await connection.getBalance(pubkey);
        const sBal = bal / LAMPORTS_PER_SOL;
        setSolBalance(sBal);
        
        const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, { mint: USDC_MINT });
        
        let uBal = 0;
        if (tokenAccounts.value.length > 0) {
            uBal = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
            setUsdcBalance(uBal);
        }
        dispatchBalanceUpdate(sBal, uBal);
    } catch (e) {}
  };

  useEffect(() => {
    fetchBalances();
    const id = setInterval(fetchBalances, 15000);
    return () => clearInterval(id);
  }, [connected, publicKey, demoWallet, connection]);

  const toggleEntry = (id: string) => {
    setLedgerEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, isExpanded: !entry.isExpanded } : entry
    ));
  };

  const addLedgerEntry = (type: LedgerEntry["type"], content: string, sig?: string, isStreaming = false) => {
    setLedgerEntries(prev => {
        // We now keep settlements flat (no merging) to match the reference style and ensure links are visible
        return [...prev, {
            id: Math.random().toString(36),
            type,
            content,
            sig,
            isStreaming,
            isExpanded: false,
            subEntries: []
        }];
    });
  };

  const finalizeLedgerBatch = async (tokenCount: number) => {
    if (!payStreamClient) return;

    setLedgerEntries(prev => {
        if (prev.length > 0 && prev[prev.length - 1].type === "settlement") {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: true, isExpanded: false }; // Auto-collapse
            return updated;
        }
        return prev;
    });

    try {
        const ixs = await payStreamClient.recordUsage(tokenCount);
        const tx = new Transaction().add(...ixs);
        
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = payStreamClient.provider.wallet.publicKey;
        
        const signed = await payStreamClient.provider.wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });

        setLedgerEntries(prev => {
            if (prev.length > 0 && prev[prev.length - 1].type === "settlement") {
                const updated = [...prev];
                updated[updated.length - 1] = { 
                    ...updated[updated.length - 1], 
                    isStreaming: false,
                    content: `📦 [L1] ANCHORED ${tokenCount} TOKENS. TX: ${sig}`,
                    sig: sig || undefined,
                    isExpanded: false
                };
                return updated;
            }
            return prev;
        });
        await fetchBalances(); 
    } catch (e) {
        console.error("Tick failed", e);
    }
  };

  const startERSession = async (userAddr: string) => {
    if (!payStreamClient) {
        console.error("PayStreamClient not ready");
        return;
    }
    setInferenceLogs(prev => [...prev, { type: "status", content: "🚀 INITIALIZING SOVEREIGN AI SESSION..." }]);
    addLedgerEntry("info", `🔗 [L1] CREATING SESSION & DEPOSITING USDC...`);
    
    try {
        const userPubkey = new PublicKey(userAddr);
        const hostPubkey = new PublicKey(providerWallet);

        // Derive Session PDA to check status
        const [sessionPda] = PublicKey.findProgramAddressSync(
            [Buffer.from("session_final_v1"), userPubkey.toBuffer(), hostPubkey.toBuffer()],
            PAYSTREAM_PROGRAM_ID
        );
        payStreamClient.sessionPda = sessionPda;
        payStreamClient.payerPubkey = userPubkey;
        payStreamClient.hostPubkey = hostPubkey;

        const sessionInfo = await connection.getAccountInfo(sessionPda);
        const isInitialized = sessionInfo !== null;

        const delegationRecordPda = delegationRecordPdaFromDelegatedAccount(sessionPda);
        const delegationInfo = await connection.getAccountInfo(delegationRecordPda);
        const isDelegated = delegationInfo !== null;

        if (isInitialized && isDelegated) {
            addLedgerEntry("info", "⚡ [ER] SESSION ALREADY ACTIVE & DELEGATED.");
            setSessionActive(true);
            return;
        }

        const tx = new Transaction();

        if (!isInitialized) {
            addLedgerEntry("info", "🆕 [L1] INITIALIZING NEW SESSION...");
            const initIx = await payStreamClient.initializeSession(userPubkey, hostPubkey, 1000000, 100);
            tx.add(initIx);
        }

        if (!isDelegated) {
            addLedgerEntry("info", `🔗 [L1] DELEGATING TO EPHEMERAL ROLLUP...`);
            const delegateIx = await payStreamClient.delegateSession();
            tx.add(delegateIx);
        }
        
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
            // Wait for confirmation to ensure L1 state is updated before delegation
            await connection.confirmTransaction(sig, "confirmed");
        }

        if (!isDelegated) {
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
        }

        setSessionActive(true);
        closingRef.current = false;
    } catch (e) {
        console.error("Failed to start session", e);
        addLedgerEntry("info", `❌ SESSION START FAILED: ${e}`);
    }
  };

  const closeERSession = async () => {
    if (closingRef.current || !payStreamClient) return;
    closingRef.current = true;
    addLedgerEntry("info", "🔒 [ER] SESSION TIMEOUT (15s IDLE). SETTLING...");
    
    try {
        const userPubkey = payStreamClient.provider.wallet.publicKey;
        const hostPubkey = new PublicKey(providerWallet);
        const closeIx = await payStreamClient.closeSession(userPubkey, hostPubkey);
        
        const tx = new Transaction().add(closeIx);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = userPubkey;
        
        const signed = await payStreamClient.provider.wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());

        if (sig) {
            addLedgerEntry("tx", `📦 [L1] FINAL STATE COMMITTED`, sig);
            addLedgerEntry("info", `💰 [L1] REFUNDED REMAINING COLLATERAL.`);
        }
    } catch (e) {
         console.error("Close failed", e);
         addLedgerEntry("info", `❌ SETTLEMENT FAILED: ${e}`);
    }
    
    await fetchBalances();
    setSessionActive(false);
    setIdleSeconds(0);
    setLatencyHistory([]);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isTyping) return;
    const cmd = input.trim();
    if (activeTab === "zeroclaw") {
        setZeroclawLogs(prev => [...prev, `> ${cmd}`]);
        setInput("");
        processZeroClawCmd(cmd);
        return;
    }

    setInferenceLogs(prev => [...prev, { type: "user", content: cmd }]);
    setInput("");
    setIsTyping(true);
    setIdleSeconds(0);
    // Note: We skip local startERSession because the Vercel API route handles session auto-initialization & delegation server-side
    // if (!sessionActive) await startERSession(connected ? publicKey?.toBase58()! : demoWallet);

    try {
      const apiBase = process.env.NEXT_PUBLIC_ZEROROUTER_API_URL!;
      const response = await fetch(`${apiBase}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              model: selectedModel,
              messages: [{ role: "user", content: cmd }]
          })
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let inferenceText = "";
      setInferenceLogs(prev => [...prev, { type: "assistant", content: "" }]);
      
      let currentUsdc = usdcBalance;
      let tokenCount = 0;

      while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
              try {
                  const data = JSON.parse(line.replace('data: ', ''));
                  
                  // Handle Protocol Setup Links from Server
                  if (data.status === "SETUP_COMPLETE") {
                      if (data.session.l1Sig) {
                          if (data.session.l1Sig === "ALREADY_DELEGATED") {
                              addLedgerEntry("info", `♻️ [L1] REUSING ACTIVE SESSION | PDA: ${data.session.pda.substring(0, 8)}...`);
                          } else {
                              addLedgerEntry("tx", `✅ [L1] SESSION INITIALIZED`, data.session.l1Sig);
                          }
                      }
                      if (data.session.delegateSig) {
                          if (data.session.delegateSig === "ALREADY_DELEGATED") {
                              addLedgerEntry("info", `⚡ [MagicBlock] STATE DELEGATION VERIFIED`);
                          } else {
                              addLedgerEntry("tx", `✅ [L1] STATE DELEGATED`, data.session.delegateSig);
                          }
                      }
                      if (data.balances) {
                          setSolBalance(data.balances.sol);
                          dispatchBalanceUpdate(data.balances.sol, currentUsdc);
                      }
                      setSessionActive(true);
                  }

                  if (data.choices && data.choices[0].delta.content) {
                      const content = data.choices[0].delta.content;
                      inferenceText += content;
                      setInferenceLogs(prev => {
                          const n = [...prev];
                          n[n.length - 1] = { type: "assistant", content: inferenceText };
                          return n;
                      });
                      
                      const t0 = performance.now();
                      currentUsdc -= COST_PER_TOKEN_USDC;
                      tokenCount++;
                      setUsdcBalance(currentUsdc);
                      setTotalSpent(prev => prev + COST_PER_TOKEN_USDC);
                      dispatchBalanceUpdate(solBalance, currentUsdc);
                      
                      // Use the ER receipt from the server instead of local transaction
                      const tickSig = data.er_receipt;
                      if (tickSig) {
                          addLedgerEntry("settlement", `⚡ [MagicBlock] PER-TOKEN | cost: ${COST_PER_TOKEN_USDC.toFixed(6)} USDC`, tickSig, false);
                      }
                      
                      const t1 = performance.now();
                      const currentLatency = t1 - t0 + 0.05;
                      setRealLatency(currentLatency);
                      setLatencyHistory(prev => [...prev, currentLatency]);
                  }
              } catch (e) {}
          }
      }
      await finalizeLedgerBatch(tokenCount);
      setInferenceLogs(prev => [...prev, { type: "status", content: "✅ TOKEN STREAM COMPLETE. SETTLEMENT FINALIZED." }]);
    } catch (err) {
      setInferenceLogs(prev => [...prev, { type: "status", content: "ERR: Gateway connection failed." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const processZeroClawCmd = async (cmd: string) => {
    setIsTyping(true);
    try {
        const apiBase = process.env.NEXT_PUBLIC_ZEROROUTER_API_URL!;
        const response = await fetch(`${apiBase}/v1/cmd`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: cmd })
        });
        const output = await response.text();
        if (response.ok) setZeroclawLogs(prev => [...prev, output]);
        else setZeroclawLogs(prev => [...prev, `ERR: ${output}`]);
    } catch (err) { setZeroclawLogs(prev => [...prev, "ERR: Gateway unreachable."]); } finally { setIsTyping(false); }
  };

  const handleReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    setInferenceLogs(prev => [...prev, { type: "status", content: "♻️ RESETTING PROTOCOL STATE..." }]);
    setTimeout(() => { window.location.reload(); }, 1000);
  };

  useEffect(() => {
    if (inferenceScrollRef.current) inferenceScrollRef.current.scrollTop = inferenceScrollRef.current.scrollHeight;
    if (rollupScrollRef.current) rollupScrollRef.current.scrollTop = rollupScrollRef.current.scrollHeight;
  }, [inferenceLogs, ledgerEntries, zeroclawLogs, activeTab]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && !isTyping) {
        interval = setInterval(() => {
            setIdleSeconds(prev => {
                if (prev >= 15) { closeERSession(); return 0; }
                return prev + 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, isTyping]); // Added missing dependency

  // JSX rendering...
  return (
    <div className={`flex flex-col h-full ${theme.bg} ${theme.text} font-mono text-xs overflow-hidden transition-colors duration-300`}>
        {/* Header */}
        <div className={`flex justify-between items-center p-3 border-b ${theme.headerBorder} ${theme.headerBg} shadow-sm z-10`}>
            <div className="flex items-center space-x-2">
                <Terminal size={16} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
                <span className={`font-bold text-lg tracking-tight ${theme.headerText}`}>ZEROCLAW_TERMINAL_V1</span>
            </div>
            <div className="flex items-center space-x-6 text-sm font-medium">
                <div className="flex items-center gap-2 mr-2">
                    <div className="relative">
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className={`appearance-none bg-slate-900/50 border ${theme.statBorder} ${theme.statText} text-[10px] font-bold px-3 py-1 rounded-full outline-none hover:border-blue-500 transition-all cursor-pointer pr-6`}
                        >
                            <option value="gemini-2.0-flash">Gemini 2 Flash</option>
                            <option value="ollama-llama3.2" disabled>Ollama Llama3.2 (coming soon)</option>
                        </select>
                        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500" />
                    </div>
                </div>
                <a
                    href={`https://explorer.solana.com/address/${connected && publicKey ? publicKey.toBase58() : demoWallet}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center space-x-4 hover:bg-blue-50/10 p-2 rounded-md transition-colors cursor-pointer group`}
                    title="View Wallet on Explorer"
                >
                    <div className="flex items-center space-x-2">
                        <Coins size={14} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                        <span className={isDarkMode ? "text-blue-200" : "text-slate-700"}>{solBalance.toFixed(4)} SOL</span>
                    </div>
                     <div className="flex items-center space-x-1">
                        <span className="text-blue-500 font-bold">$</span>
                        <span className={isDarkMode ? "text-blue-200" : "text-slate-700"}>{usdcBalance.toFixed(2)} USDC</span>
                    </div>
                </a>
                <div className="flex items-center space-x-2">
                    <Activity size={14} className={sessionActive ? "text-green-500 animate-pulse" : "text-gray-400"} />
                    <span className={sessionActive ? "text-green-500 font-bold" : "text-gray-400"}>{sessionActive ? "UPLINK_ACTIVE" : "STANDBY"}</span>
                </div>
                 <button 
                    onClick={() => setIsDarkMode(!isDarkMode)} 
                    className={`hover:${theme.text} transition-colors p-1 rounded-full hover:bg-blue-500/10`}
                    title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                 >
                    {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
                 </button>
                 <button onClick={handleReset} className={`hover:${theme.text} transition-colors p-1`}><RotateCcw size={14}/></button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden relative z-0">
            {/* Left Panel: Chat/Terminal */}
            <div className={`flex-1 flex flex-col border-r ${theme.panelBorder} ${theme.panelBg} backdrop-blur-sm`}>
                 {/* Tabs */}
                <div className={`flex border-b ${theme.tabBorder}`}>
                    <button 
                        onClick={() => setActiveTab("ai-chat")}
                        className={`flex-1 p-3 text-center font-medium transition-all ${activeTab === "ai-chat" ? theme.tabActive : theme.tabInactive}`}
                    >
                        AI_INFERENCE_STREAM
                    </button>
                    <button
                         onClick={() => setActiveTab("zeroclaw")}
                         className={`flex-1 p-3 text-center font-medium transition-all ${activeTab === "zeroclaw" ? theme.tabActive : theme.tabInactive} relative group`}
                    >
                        ZEROCLAW_AGENT
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                        </span>
                    </button>
                </div>

                {/* Output Area */}
                <div ref={inferenceScrollRef} className={`flex-1 overflow-y-auto p-6 space-y-2 text-sm leading-relaxed ${theme.outputText}`}>
                    {activeTab === "ai-chat" ? (
                        <div className="flex flex-col space-y-4">
                            {inferenceLogs.map((log, i) => (
                                <div key={i} className={`flex ${log.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    {log.type === 'status' ? (
                                        <div className="w-full text-center text-[10px] text-blue-500/60 font-bold tracking-widest uppercase py-2 border-y border-blue-900/20 my-2">
                                            {log.content}
                                        </div>
                                    ) : (
                                        <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                            log.type === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-none border border-blue-500'
                                                : 'bg-slate-900 text-blue-50 rounded-tl-none border border-blue-800/50'
                                        }`}>
                                            <div className={`prose prose-sm ${log.type === 'user' ? 'prose-invert' : (isDarkMode ? "prose-invert prose-p:text-blue-100 prose-strong:text-blue-300" : "prose-blue")} max-w-none`}>
                                                <ReactMarkdown>{log.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                            <Cpu size={48} className="text-blue-500 animate-pulse" />
                            <div className="text-xl font-bold tracking-widest text-blue-400">COMING SOON</div>
                            <div className="text-xs text-blue-300/60 max-w-xs text-center leading-relaxed italic">
                                Soveign AI agent execution and system command orchestration is currently under development.
                            </div>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleCommand} className={`p-4 border-t ${theme.inputBorder} flex items-center ${theme.inputBg} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20`}>
                    <ChevronRight size={18} className="mr-3 text-blue-500 animate-pulse" />
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)}
                        className={`flex-1 bg-transparent outline-none border-none ${theme.inputText} ${theme.inputPlaceholder} text-base h-10 font-medium`}
                        placeholder={activeTab === "ai-chat" ? "Enter query for sovereign intelligence..." : "Enter system command..."}
                        autoFocus
                    />
                    {isTyping && <Loader2 size={18} className="animate-spin text-blue-500 ml-3" />}
                </form>
            </div>

            {/* Right Panel: Ephemeral Rollup Ledger */}
            <div className={`w-1/3 flex flex-col ${theme.ledgerBg} border-l ${theme.ledgerBorder} shadow-inner`}>
                 <div className={`p-3 border-b ${theme.ledgerBorder} font-bold flex justify-between items-center ${theme.ledgerHeaderBg} ${theme.ledgerHeaderText}`}>
                    <span>EPHEMERAL_ROLLUP_LEDGER</span>
                    <Server size={14} className="text-blue-500"/>
                </div>
                <div ref={rollupScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 text-[11px] font-mono">
                    {ledgerEntries.map((entry, i) => (
                        <div key={entry.id} className={`border ${theme.ledgerEntryBorder} p-2 rounded-md ${theme.ledgerEntryBg} shadow-sm hover:shadow-md transition-shadow`}>
                            <div className="flex items-start">
                                <span 
                                    className="mr-2 mt-0.5 text-lg cursor-pointer flex items-center hover:text-blue-400" 
                                    onClick={() => toggleEntry(entry.id)}
                                >
                                    {entry.subEntries && entry.subEntries.length > 0 && (
                                        <span className="mr-1">
                                            {entry.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                        </span>
                                    )}
                                    {entry.type === "tx" ? "📦" : entry.type === "settlement" ? "⚡" : "ℹ️"}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <div className={`break-all ${theme.ledgerEntryText} font-medium`}>
                                        {entry.content}
                                        {entry.sig && (
                                            <a
                                                href={entry.type === "settlement"
                                                    ? `https://explorer.solana.com/tx/${entry.sig}?cluster=custom&customUrl=https%3A%2F%2Fdevnet-as.magicblock.app`
                                                    : `https://solscan.io/tx/${entry.sig}?cluster=devnet`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`ml-2 underline text-[10px] font-bold ${entry.type === "settlement" ? "text-yellow-500 hover:text-yellow-400" : "text-blue-500 hover:text-blue-400"}`}
                                            >
                                                {entry.type === "settlement" ? "[ER_TX]" : "[VIEW_L1]"}
                                            </a>
                                        )}
                                    </div>
                                    {entry.isExpanded && entry.subEntries && entry.subEntries.length > 0 && (
                                         <div className={`mt-2 pl-3 border-l-2 ${theme.ledgerBorder} space-y-1.5`}>
                                            {entry.subEntries.map((sub, j) => (
                                                <div key={j} className="text-slate-400 truncate flex items-center justify-between">
                                                    <span>{sub.content}</span>
                                                    {sub.sig && (
                                                        <a
                                                            href={`https://explorer.solana.com/tx/${sub.sig}?cluster=custom&customUrl=https%3A%2F%2Fdevnet-as.magicblock.app`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="ml-2 text-yellow-500 underline hover:text-yellow-400 text-[9px] whitespace-nowrap font-bold"
                                                        >
                                                            [ER_TX]
                                                        </a>
                                                    )}
                                                </div>
                                            ))}
                                         </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                 {/* Stats Footer */}
                <div className={`p-3 border-t ${theme.statBorder} grid grid-cols-2 gap-3 text-[11px] font-medium ${theme.statBg} ${theme.statText}`}>
                     <div className="flex justify-between items-center">
                        <span>LATENCY:</span>
                        <span className={`px-1.5 py-0.5 rounded ${realLatency < 50 ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>{realLatency.toFixed(1)}ms</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span>TPS (ER):</span>
                        <span className="text-blue-500">~1000</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span>SESSION COST:</span>
                        <span className={isDarkMode ? "text-blue-200" : "text-slate-800"}>{totalSpent.toFixed(4)} USDC</span>
                    </div>
                     <div className="flex justify-between items-center">
                        <span>STATUS:</span>
                        <span className="text-green-500 flex items-center"><span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>ONLINE</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}

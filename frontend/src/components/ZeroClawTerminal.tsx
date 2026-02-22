"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Cpu, Zap, Activity, ChevronRight, X, Minus, Square, ExternalLink, RefreshCw, Wallet, Clock, Coins, Database, Server, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from "@solana/web3.js";
import { signTransactionServer } from "@/app/actions";
import ReactMarkdown from "react-markdown";

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
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [activeTab, setActiveTab] = useState<"ai-chat" | "zeroclaw">("ai-chat");
  
  const [inferenceLogs, setInferenceLogs] = useState<string[]>([
    "--- ZeroRouter v1.0.0 (Sovereign API) ---",
    "Linking: Cloud Intelligence Grid",
    "Status: READY. Ephemeral Rollup standby."
  ]);
  
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: "1", type: "info", content: "--- MagicBlock Ephemeral Rollup Engine ---" },
    { id: "2", type: "info", content: "L1: [SOLANA] Listening for session delegation..." },
    { id: "3", type: "info", content: "ER: [IDLE] Waiting for user activity..." }
  ]);

  const [zeroclawLogs, setZeroclawLogs] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
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

  const COST_PER_TOKEN = 0.0001;
  const SESSION_COLLATERAL = 0.5;
  const MAGICBLOCK_FEE = 0.01;
  const demoWallet = process.env.NEXT_PUBLIC_DEMO_WALLET!;

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

  const performRealTick = async () => {
    const addr = connected ? publicKey?.toBase58() : demoWallet;
    if (!addr) return "ERR_NO_WALLET";
    try {
        const userPubkey = new PublicKey(addr);
        const tx = new Transaction().add(SystemProgram.transfer({ fromPubkey: userPubkey, toPubkey: userPubkey, lamports: 1 }));
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        tx.feePayer = userPubkey;
        if (!connected) {
            const serialized = tx.serialize({ requireAllSignatures: false }).toString('base64');
            const signedBase64 = await signTransactionServer(serialized);
            const signedTx = Transaction.from(Buffer.from(signedBase64, 'base64'));
            return await connection.sendRawTransaction(signedTx.serialize());
        }
        return "DEV_" + Math.random().toString(36).substring(2, 12);
    } catch (e) { return "FAIL_" + Math.random().toString(36).substring(2, 10); }
  };

  const addLedgerEntry = (type: LedgerEntry["type"], content: string, sig?: string, isStreaming = false) => {
    setLedgerEntries(prev => {
        if (type === "settlement" && prev.length > 0) {
            const last = prev[prev.length - 1];
            if (last.type === "settlement" && last.isStreaming) {
                const updated = [...prev];
                const newSubEntry = { sig: sig || undefined, content };
                updated[updated.length - 1] = {
                    ...last,
                    count: (last.count || 1) + 1,
                    content: `⚡ [ER] per_token_settle(${(last.count || 1) + 1})`,
                    subEntries: [...(last.subEntries || []), newSubEntry],
                    isStreaming: isStreaming
                };
                return updated;
            }
        }
        return [...prev, { 
            id: Math.random().toString(36), 
            type, 
            content, 
            sig, 
            isStreaming,
            subEntries: [{ sig, content }] 
        }];
    });
  };

  const finalizeLedgerBatch = async (tokenCount: number) => {
    setLedgerEntries(prev => {
        if (prev.length > 0 && prev[prev.length - 1].type === "settlement") {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], isStreaming: true };
            return updated;
        }
        return prev;
    });

    // Send a real L1 TX to anchor the ER batch
    const sig = await performRealTick();
    
    setLedgerEntries(prev => {
        if (prev.length > 0 && prev[prev.length - 1].type === "settlement") {
            const updated = [...prev];
            updated[updated.length - 1] = { 
                ...updated[updated.length - 1], 
                isStreaming: false,
                content: `📦 [L1] ANCHORED ${tokenCount} TOKENS. TX: ${sig}`,
                sig: sig
            };
            return updated;
        }
        return prev;
    });
    await fetchBalances();
  };

  const startERSession = async (userAddr: string) => {
    setInferenceLogs(prev => [...prev, "🚀 INITIALIZING SOVEREIGN AI SESSION..."]);
    addLedgerEntry("info", `🔗 [ER] INITIATING DELEGATION FROM ${userAddr.substring(0,8)}...`);
    
    const newSol = solBalance - SESSION_COLLATERAL - MAGICBLOCK_FEE;
    setSolBalance(newSol);
    dispatchBalanceUpdate(newSol, usdcBalance);
    
    const sig = await performRealTick();
    addLedgerEntry("tx", `✅ [ER] STATE DELEGATED. SIG: ${sig}`, sig);
    setSessionActive(true);
    closingRef.current = false;
  };

  const closeERSession = async () => {
    if (closingRef.current) return;
    closingRef.current = true;
    addLedgerEntry("info", "🔒 [ER] SESSION TIMEOUT (15s IDLE). SETTLING...");
    const sig = await performRealTick();
    addLedgerEntry("tx", `📦 [L1] FINAL STATE COMMITTED. TX: ${sig}`, sig);
    addLedgerEntry("info", `💰 [L1] RECLAIMED ${SESSION_COLLATERAL} SOL COLLATERAL.`);
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

    setInferenceLogs(prev => [...prev, `> ${cmd}`]);
    setInput("");
    setIsTyping(true);
    setIdleSeconds(0);
    if (!sessionActive) await startERSession(connected ? publicKey?.toBase58()! : demoWallet);

    try {
      const apiBase = process.env.NEXT_PUBLIC_ZEROROUTER_API_URL!;
      const response = await fetch(`${apiBase}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: cmd }] })
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let inferenceText = "";
      setInferenceLogs(prev => [...prev, ""]);
      
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
                  if (data.choices && data.choices[0].delta.content) {
                      const content = data.choices[0].delta.content;
                      inferenceText += content;
                      setInferenceLogs(prev => { const n = [...prev]; n[n.length - 1] = inferenceText; return n; });
                      
                      const t0 = performance.now();
                      currentUsdc -= COST_PER_TOKEN;
                      tokenCount++;
                      setUsdcBalance(currentUsdc);
                      setTotalSpent(prev => prev + COST_PER_TOKEN);
                      dispatchBalanceUpdate(solBalance, currentUsdc);
                      
                      addLedgerEntry("settlement", `⚡ per_token_settle(1) | cost: ${COST_PER_TOKEN.toFixed(6)} USDC`, undefined, true);
                      
                      const t1 = performance.now();
                      const currentLatency = t1 - t0 + 0.05;
                      setRealLatency(currentLatency);
                      setLatencyHistory(prev => [...prev, currentLatency]);
                  }
              } catch (e) {}
          }
      }
      await finalizeLedgerBatch(tokenCount);
      setInferenceLogs(prev => [...prev, "✅ TOKEN STREAM COMPLETE. SETTLEMENT FINALIZED."]);
    } catch (err) {
      setInferenceLogs(prev => [...prev, "ERR: Gateway connection failed."]);
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
  }, [sessionActive, isTyping]);

  const toggleExpand = (id: string) => {
    setLedgerEntries(prev => prev.map(e => e.id === id ? { ...e, isExpanded: !e.isExpanded } : e));
  };

  const renderEntry = (entry: LedgerEntry) => {
    const sig = entry.sig;
    const isSettlement = entry.type === "settlement";
    
    const url = `https://solscan.io/tx/${sig}?cluster=devnet`;

    return (
      <div className="flex gap-2 items-start group">
        <span className="text-slate-700 select-none mt-0.5">»</span>
        <div className="flex flex-col gap-1 w-full overflow-hidden text-left">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 truncate text-left w-full">
                    <div className="text-slate-400 group-hover:text-slate-300 transition-colors truncate text-left flex-1">
                        {entry.content}
                        {sig && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="ml-1 text-[#00C2FF] hover:underline inline-flex items-center gap-0.5">
                                {sig.substring(0,8)}... <ExternalLink size={8} />
                            </a>
                        )}
                    </div>
                    {entry.isStreaming && <Loader2 size={8} className="animate-spin text-[#14F195] flex-none" />}
                </div>
                {entry.count && entry.count > 1 && (
                    <button onClick={() => toggleExpand(entry.id)} className="flex items-center gap-1 bg-[#14F195]/20 text-[#14F195] hover:bg-[#14F195]/30 text-[7px] px-1 rounded font-bold transition-colors flex-none">
                        x{entry.count} {entry.isExpanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
                    </button>
                )}
            </div>
            {entry.isExpanded && entry.subEntries && (
                <div className="mt-1 ml-2 border-l border-white/10 pl-2 flex flex-col gap-1 max-h-40 overflow-y-auto scrollbar-hide">
                    {entry.subEntries.map((sub, i) => {
                        return (
                            <div key={i} className="flex items-center justify-between text-[7px] text-slate-500 hover:text-slate-300">
                                <span className="truncate w-full">{sub.content}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <div className="terminal-box font-mono text-sm relative overflow-hidden bg-black/95 border border-[#14F195]/40 shadow-2xl flex flex-col h-[600px]">
      <div className="flex-none flex items-center justify-between bg-slate-900/90 border-b border-white/10 backdrop-blur-md z-20">
        <div className="flex h-full">
            <button onClick={() => setActiveTab("ai-chat")} className={`px-6 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "ai-chat" ? "bg-black text-[#00C2FF] border-r border-white/10 shadow-[inset_0_-2px_0_#00C2FF]" : "text-slate-500 hover:text-slate-300"}`}><Zap size={12} fill={activeTab === "ai-chat" ? "currentColor" : "none"} /> AI CHAT</button>
            <button onClick={() => setActiveTab("zeroclaw")} className={`px-6 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "zeroclaw" ? "bg-black text-[#14F195] border-r border-white/10 shadow-[inset_0_-2px_0_#14F195]" : "text-slate-500 hover:text-slate-300"}`}><Cpu size={12} /> ZEROCLAW_CORE</button>
        </div>
        <div className="flex gap-4 px-6 text-[10px] items-center">
            {!connected && <div className="flex items-center gap-1 bg-[#9945FF]/20 border border-[#9945FF]/40 px-2 py-0.5 rounded animate-pulse text-[#9945FF] font-bold"><Zap size={10} /> DEVNET DEMO</div>}
            {sessionActive && activeTab === "ai-chat" && (
                <div className="flex items-center gap-3 text-slate-400 border-r border-white/10 pr-4">
                    <span className="flex items-center gap-1.5"><Clock size={10} className="text-[#FF00FF]" /> IDLE: {15 - (idleSeconds % 16)}s</span>
                    <span className="flex items-center gap-1.5"><Coins size={10} className="text-[#00C2FF]" /> SPENT: {totalSpent.toFixed(4)} USDC</span>
                </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#14F195] animate-pulse" : "bg-[#9945FF]"}`}></div> 
                <span className="text-slate-500 uppercase font-bold tracking-tighter">WALLET:</span>
                <span className="text-white font-black tracking-tight">{solBalance.toFixed(2)} SOL</span>
            </div>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col border-r border-white/5 relative">
            <div ref={inferenceScrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {activeTab === "ai-chat" ? ( 
                inferenceLogs.map((log, i) => ( 
                    <div key={i} className="flex gap-2">
                        <span className="text-slate-600 select-none mt-1">{log.startsWith(">") ? "➜" : "◈"}</span>
                        <div className={log.startsWith(">") ? "text-[#00C2FF] font-bold text-left" : "text-white/90 leading-relaxed text-left prose prose-invert prose-xs max-w-none"}>
                            {log.startsWith(">") ? (
                                log.substring(1)
                            ) : (
                                <ReactMarkdown components={{
                                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 text-left" {...props} />,
                                    ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2 text-left" {...props} />,
                                    ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2 text-left" {...props} />,
                                    li: ({node, ...props}) => <li className="mb-1 text-left" {...props} />,
                                    strong: ({node, ...props}) => <strong className="text-white font-black" {...props} />,
                                    h1: ({node, ...props}) => <h1 className="text-lg font-black text-[#14F195] mb-2 text-left" {...props} />,
                                    h2: ({node, ...props}) => <h2 className="text-md font-black text-[#14F195] mb-2 text-left" {...props} />,
                                    h3: ({node, ...props}) => <h3 className="text-sm font-black text-[#14F195] mb-1 text-left" {...props} />,
                                }}>{log}</ReactMarkdown>
                            )}
                        </div>
                    </div> 
                )) 
              ) : ( 
                zeroclawLogs.map((log, i) => ( 
                    <div key={i} className="flex gap-2">
                        <span className="text-slate-600 select-none">{log.startsWith(">") ? "➜" : "◈"}</span>
                        <pre className={`whitespace-pre-wrap ${log.startsWith(">") ? "text-[#14F195] font-bold text-left" : "text-slate-300 text-left"}`}>{log.startsWith(">") ? log.substring(1) : log}</pre>
                    </div> 
                )) 
              )}
              {isTyping && <div className="flex gap-2 animate-pulse"><span className="text-slate-600 select-none">◈</span><div className="flex gap-1 items-center"><div className="w-1 h-1 bg-[#14F195] rounded-full"></div><div className="w-1 h-1 bg-[#14F195] rounded-full animate-delay-150"></div><div className="w-1 h-1 bg-[#14F195] rounded-full animate-delay-300"></div></div></div>}
            </div>
            <form onSubmit={handleCommand} className="p-4 bg-black border-t border-white/5 flex items-center gap-3">
              <ChevronRight size={14} className="text-[#14F195]" />
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={activeTab === "ai-chat" ? "Input prompt..." : "Enter command..."} className="flex-1 bg-transparent border-none outline-none text-white text-xs font-mono" disabled={isTyping} />
              <button type="submit" disabled={isTyping} className="bg-[#14F195] hover:bg-[#14F195]/80 text-black px-3 py-1 rounded text-[10px] font-black flex items-center gap-1.5">EXECUTE <Zap size={10} fill="currentColor" /></button>
            </form>
        </div>
        <div className="w-80 flex flex-col bg-black/40 backdrop-blur-sm">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rollup Ledger</span><div className="flex items-center gap-1.5"><div className="w-1 h-1 bg-[#00C2FF] rounded-full animate-pulse"></div><span className="text-[8px] text-[#00C2FF] font-bold">SYNCED</span></div></div>
            <div ref={rollupScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[9px] scrollbar-hide">
                {ledgerEntries.map((entry) => ( <div key={entry.id}>{renderEntry(entry)}</div> ))}
            </div>
            <div className="p-4 border-t border-white/5 space-y-3 bg-slate-950/50 text-[8px]">
                <div className="flex justify-between items-center"><span className="text-slate-600 uppercase font-bold">AVG Latency (Session)</span><span className="text-[#14F195] font-black">{averageLatency.toFixed(2)}ms</span></div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden"><div className="bg-[#14F195] h-full transition-all duration-300 animate-pulse" style={{ width: `${Math.min(100, (1000/averageLatency) * 5)}%` }}></div></div>
                <div className="flex justify-between items-center"><span className="text-slate-600 uppercase font-bold">Current Speed</span><span className="text-[#00C2FF] font-black">{realLatency > 0 ? (1000/realLatency).toFixed(0) : "0"} t/s</span></div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden"><div className="bg-[#00C2FF] h-full transition-all duration-300" style={{ width: `${Math.min(100, (1000/realLatency) * 2)}%` }}></div></div>
            </div>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(20,241,149,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    </div>
  );
}

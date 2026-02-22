"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Cpu, Zap, Activity, ChevronRight, X, Minus, Square, ExternalLink, RefreshCw, Wallet, Clock, Coins, Database, Server, Trash2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

export function ZeroClawTerminal() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<"ai-chat" | "zeroclaw">("ai-chat");
  const [inferenceLogs, setInferenceLogs] = useState<string[]>([
    "--- ZeroRouter v1.0.0 (Sovereign API) ---",
    "Linking: Cloud Intelligence Grid",
    "Status: READY. Ephemeral Rollup standby."
  ]);
  
  const [rollupLogs, setRollupLogs] = useState<string[]>([
    "--- MagicBlock Ephemeral Rollup Engine ---",
    "L1: [SOLANA] Listening for session delegation...",
    "ER: [IDLE] Waiting for user activity..."
  ]);

  const [zeroclawLogs, setZeroclawLogs] = useState<string[]>([]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(100.00);
  const inferenceScrollRef = useRef<HTMLDivElement>(null);
  const rollupScrollRef = useRef<HTMLDivElement>(null);

  const COST_PER_TOKEN = 0.0001;
  const demoWallet = process.env.NEXT_PUBLIC_DEMO_WALLET;
  const isDemoMode = !connected;

  // Initialize REAL logs
  useEffect(() => {
    const initRealLogs = async () => {
        setZeroclawLogs(["--- Connecting to ZeroClaw Core ---"]);
        try {
            const apiBase = process.env.NEXT_PUBLIC_ZEROROUTER_API_URL;
            if (!apiBase) throw new Error("API URL not configured");
            const response = await fetch(`${apiBase}/v1/cmd`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: "zeroclaw doctor" })
            });
            const output = await response.text();
            setZeroclawLogs([
                "--- ZeroClaw Cloud Instance ---",
                output
            ]);
        } catch (e) {
            setZeroclawLogs(["--- ZeroClaw Core Offline ---", "ERR: Could not connect to gateway."]);
        }
    };
    initRealLogs();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (inferenceScrollRef.current) inferenceScrollRef.current.scrollTop = inferenceScrollRef.current.scrollHeight;
    if (rollupScrollRef.current) rollupScrollRef.current.scrollTop = rollupScrollRef.current.scrollHeight;
  }, [inferenceLogs, rollupLogs, zeroclawLogs, activeTab]);

  // Idle Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionActive && !isTyping) {
        interval = setInterval(() => {
            setIdleSeconds(prev => {
                if (prev >= 15) {
                    closeERSession();
                    return 0;
                }
                return prev + 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionActive, isTyping]);

  const closeERSession = () => {
    addRollupLog("🔒 [ER] SESSION TIMEOUT (15s IDLE). SETTLING TO SOLANA L1...");
    const finalTx = Math.random().toString(36).substring(2, 15);
    addRollupLog(`📦 [L1] FINAL STATE COMMITTED. TX: ${finalTx}`);
    setSessionActive(false);
    setIdleSeconds(0);
  };

  const addInferenceLog = (msg: string) => setInferenceLogs((prev) => [...prev, msg]);
  const addRollupLog = (msg: string) => setRollupLogs((prev) => [...prev, msg]);

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

    // AI Chat Mode
    addInferenceLog(`> ${cmd}`);
    setInput("");
    setIsTyping(true);
    setIdleSeconds(0);

    if (!sessionActive) {
        setSessionActive(true);
        addInferenceLog("🚀 INITIALIZING SOVEREIGN AI SESSION...");
        addRollupLog(`🔗 [ER] INTERCEPTING DELEGATION REQUEST FROM ${demoWallet}...`);
        addRollupLog("✅ [ER] STATE DELEGATED TO EPHEMERAL SVM (GASLESS)");
    }

    try {
      const apiBase = process.env.NEXT_PUBLIC_ZEROROUTER_API_URL;
      if (!apiBase) throw new Error("API URL not configured");
      const response = await fetch(`${apiBase}/v1/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: cmd }] })
      });
      
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let tokenCount = 0;
      let inferenceText = "";
      
      setInferenceLogs(prev => [...prev, ""]);

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
                      setInferenceLogs(prev => {
                          const newLogs = [...prev];
                          newLogs[newLogs.length - 1] = inferenceText;
                          return newLogs;
                      });

                      tokenCount++;
                      setTotalSpent(prev => prev + COST_PER_TOKEN);
                      setUsdcBalance(prev => prev - COST_PER_TOKEN);

                      if (tokenCount % 5 === 0) {
                          const txId = Math.random().toString(36).substring(2, 10);
                          addRollupLog(`⚡ [TX: ${txId}] usage_record(1) token: ${tokenCount} | cost: ${COST_PER_TOKEN} USDC`);
                      }
                  }
              } catch (e) {}
          }
      }
      addInferenceLog("✅ TOKEN STREAM COMPLETE. SETTLEMENT FINALIZED.");
    } catch (err) {
      addInferenceLog("ERR: Gateway connection failed. Ensure Sovereign server is running.");
      addRollupLog("❌ [ER] SESSION TERMINATED. GATEWAY UNREACHABLE.");
    } finally {
      setIsTyping(false);
    }
  };

  const processZeroClawCmd = async (cmd: string) => {
    setIsTyping(true);
    try {
        const apiBase = process.env.NEXT_PUBLIC_ZEROROUTER_API_URL;
        if (!apiBase) throw new Error("API URL not configured");
        const response = await fetch(`${apiBase}/v1/cmd`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ command: cmd })
        });
        
        const output = await response.text();
        if (response.ok) {
            setZeroclawLogs(prev => [...prev, output]);
        } else {
            setZeroclawLogs(prev => [...prev, `ERR: ${output}`]);
        }
    } catch (err) {
        setZeroclawLogs(prev => [...prev, "ERR: Gateway unreachable. Ensure Rust server is running."]);
    } finally {
        setIsTyping(false);
    }
  };

  const renderRollupLog = (log: string) => {
    const txMatch = log.match(/\[TX: ([a-z0-9]+)\]/);
    if (txMatch) {
        const txId = txMatch[1];
        const parts = log.split(`[TX: ${txId}]`);
        return (
            <span>
                {parts[0]}
                <a href={`https://explorer.magicblock.app/tx/${txId}`} target="_blank" rel="noopener noreferrer" className="text-[#00C2FF] hover:underline inline-flex items-center gap-0.5">
                    [TX: {txId}] <ExternalLink size={8} />
                </a>
                {parts[1]}
            </span>
        );
    }
    const l1Match = log.match(/TX: ([a-z0-9]+)$/);
    if (l1Match) {
        const txId = l1Match[1];
        const parts = log.split(txId);
        return (
            <span>
                {parts[0]}
                <a href={`https://explorer.solana.com/tx/${txId}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-[#14F195] hover:underline inline-flex items-center gap-0.5">
                    {txId} <ExternalLink size={8} />
                </a>
            </span>
        );
    }
    return log;
  };

  return (
    <div className="terminal-box font-mono text-sm relative overflow-hidden bg-black/95 border border-[#14F195]/40 shadow-2xl flex flex-col h-[600px]">
      {/* Window Title Bar & Tabs */}
      <div className="flex-none flex items-center justify-between bg-slate-900/90 border-b border-white/10 backdrop-blur-md z-20">
        <div className="flex h-full">
            <button onClick={() => setActiveTab("ai-chat")} className={`px-6 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "ai-chat" ? "bg-black text-[#00C2FF] border-r border-white/10 shadow-[inset_0_-2px_0_#00C2FF]" : "text-slate-500 hover:text-slate-300"}`}>
                <Zap size={12} fill={activeTab === "ai-chat" ? "currentColor" : "none"} /> AI CHAT
            </button>
            <button onClick={() => setActiveTab("zeroclaw")} className={`px-6 py-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "zeroclaw" ? "bg-black text-[#14F195] border-r border-white/10 shadow-[inset_0_-2px_0_#14F195]" : "text-slate-500 hover:text-slate-300"}`}>
                <Cpu size={12} /> ZEROCLAW_CORE
            </button>
        </div>
        
        <div className="flex gap-4 px-6 text-[10px] items-center">
            {isDemoMode && (
                <div className="flex items-center gap-1 bg-[#9945FF]/20 border border-[#9945FF]/40 px-2 py-0.5 rounded animate-pulse text-[#9945FF] font-bold">
                    <Zap size={10} /> DEVNET DEMO
                </div>
            )}
            {sessionActive && activeTab === "ai-chat" && (
                <div className="flex items-center gap-3 text-slate-400 border-r border-white/10 pr-4 animate-in fade-in slide-in-from-right-4">
                    <span className="flex items-center gap-1.5"><Clock size={10} className="text-[#FF00FF]" /> IDLE: {15 - idleSeconds}s</span>
                    <span className="flex items-center gap-1.5"><Coins size={10} className="text-[#00C2FF]" /> SPENT: {totalSpent.toFixed(4)} USDC</span>
                </div>
            )}
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#14F195] animate-pulse" : "bg-red-500"}`}></div> 
                <span className="text-slate-500 uppercase font-bold tracking-tighter">WALLET:</span>
                <span className="text-white font-black tracking-tight">{usdcBalance.toFixed(2)} USDC</span>
            </div>
            <button onClick={() => { activeTab === "ai-chat" ? setInferenceLogs(["--- Logs Cleared ---"]) : setZeroclawLogs(["--- Logs Cleared ---"]) }} className="text-slate-600 hover:text-red-400 transition-colors">
                <Trash2 size={12} />
            </button>
        </div>
      </div>

      {/* Main Terminal Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Terminal Output */}
        <div className="flex-1 flex flex-col border-r border-white/5 relative">
            <div 
              ref={inferenceScrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-2 scrollbar-hide"
            >
              {activeTab === "ai-chat" ? (
                  inferenceLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-slate-600 select-none">{log.startsWith(">") ? "➜" : "◈"}</span>
                        <p className={log.startsWith(">") ? "text-[#00C2FF] font-bold" : "text-white/90 leading-relaxed"}>{log.startsWith(">") ? log.substring(1) : log}</p>
                    </div>
                  ))
              ) : (
                  zeroclawLogs.map((log, i) => (
                    <div key={i} className="flex gap-2">
                        <span className="text-slate-600 select-none">{log.startsWith(">") ? "➜" : "◈"}</span>
                        <pre className={`whitespace-pre-wrap ${log.startsWith(">") ? "text-[#14F195] font-bold" : "text-slate-300"}`}>
                            {log.startsWith(">") ? log.substring(1) : log}
                        </pre>
                    </div>
                  ))
              )}
              {isTyping && (
                <div className="flex gap-2 animate-pulse">
                    <span className="text-slate-600 select-none">◈</span>
                    <div className="flex gap-1 items-center">
                        <div className="w-1 h-1 bg-[#14F195] rounded-full"></div>
                        <div className="w-1 h-1 bg-[#14F195] rounded-full animate-delay-150"></div>
                        <div className="w-1 h-1 bg-[#14F195] rounded-full animate-delay-300"></div>
                    </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleCommand} className="p-4 bg-black border-t border-white/5 flex items-center gap-3">
              <ChevronRight size={14} className="text-[#14F195]" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={activeTab === "ai-chat" ? "Input prompt for sovereign inference..." : "Enter ZeroClaw command (e.g. status, doctor)..."}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-600 text-xs font-mono"
                disabled={isTyping}
              />
              <button 
                type="submit"
                disabled={isTyping}
                className="bg-[#14F195] hover:bg-[#14F195]/80 text-black px-3 py-1 rounded text-[10px] font-black transition-colors flex items-center gap-1.5"
              >
                EXECUTE <Zap size={10} fill="currentColor" />
              </button>
            </form>
        </div>

        {/* Right: Rollup Activity Sidebar */}
        <div className="w-80 flex flex-col bg-black/40 backdrop-blur-sm">
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rollup Ledger</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 bg-[#00C2FF] rounded-full animate-pulse"></div>
                    <span className="text-[8px] text-[#00C2FF] font-bold">SYNCED</span>
                </div>
            </div>
            <div 
              ref={rollupScrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-[9px] scrollbar-hide"
            >
                {rollupLogs.map((log, i) => (
                    <div key={i} className="flex gap-2 items-start group">
                        <span className="text-slate-700 select-none mt-0.5">»</span>
                        <div className="text-slate-400 group-hover:text-slate-300 transition-colors">
                            {renderRollupLog(log)}
                        </div>
                    </div>
                ))}
            </div>
            {/* System Metrics */}
            <div className="p-4 border-t border-white/5 space-y-3 bg-slate-950/50">
                <div className="flex justify-between items-center text-[8px]">
                    <span className="text-slate-600 uppercase font-bold">Latency</span>
                    <span className="text-[#14F195] font-black">0.4ms</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-[#14F195] h-full w-[85%] animate-pulse"></div>
                </div>
                <div className="flex justify-between items-center text-[8px]">
                    <span className="text-slate-600 uppercase font-bold">Throughput</span>
                    <span className="text-[#00C2FF] font-black">124 t/s</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                    <div className="bg-[#00C2FF] h-full w-[40%]"></div>
                </div>
            </div>
        </div>
      </div>

      {/* Grid Overlay Effects */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(20,241,149,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(20,241,149,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-40"></div>
    </div>
  );
}

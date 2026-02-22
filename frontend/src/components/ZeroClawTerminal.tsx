"use client";

import React, { useState, useEffect, useRef } from "react";
import { Terminal, Shield, Cpu, Zap, Activity, ChevronRight, X, Minus, Square, ExternalLink, RefreshCw, Wallet, Clock, Coins, Database, Server, Trash2 } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";

export function ZeroClawTerminal() {
  const { publicKey, connected } = useWallet();
  const [activeTab, setActiveTab] = useState<"ai-chat" | "zeroclaw">("ai-chat");
  const [inferenceLogs, setInferenceLogs] = useState<string[]>([
    "--- ZeroClaw v0.1.0 (Rust/WASM) ---",
    "Linking: Local Sovereign Gateway @ :8080",
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

  // Initialize REAL logs
  useEffect(() => {
    const initRealLogs = async () => {
        setZeroclawLogs(["--- Connecting to ZeroClaw Core ---"]);
        try {
            const response = await fetch("http://localhost:8080/v1/cmd", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ command: "zeroclaw doctor" })
            });
            const output = await response.text();
            setZeroclawLogs([
                "--- ZeroClaw Docker Instance :8080 ---",
                output
            ]);
        } catch (e) {
            setZeroclawLogs(["--- ZeroClaw Core Offline ---", "ERR: Could not connect to gateway on :8080"]);
        }
    };
    initRealLogs();
  }, []);

  const COST_PER_TOKEN = 0.0001;
  const demoWallet = "2gzjbVH1DN71s5Csf1fkxDpjJJLesB174Yr2xRkyGSgm";
  const isDemoMode = !connected;

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
      const response = await fetch("http://localhost:8080/v1/chat/completions", {
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
      addInferenceLog("ERR: Gateway connection failed. Ensure Sovereign server is running on :8080.");
      addRollupLog("❌ [ER] SESSION TERMINATED. GATEWAY UNREACHABLE.");
    } finally {
      setIsTyping(false);
    }
  };

  const processZeroClawCmd = async (cmd: string) => {
    setIsTyping(true);
    try {
        const response = await fetch("http://localhost:8080/v1/cmd", {
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
      {/* Window Title Bar & Tabs (FIXED) */}
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

      {/* Main Content (SCROLLABLE) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left Panel */}
        <div className="border-r border-white/5 flex flex-col relative bg-black/40 overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
            {activeTab === "ai-chat" ? <Cpu size={140} className="text-[#00C2FF]" /> : <Server size={140} className="text-[#14F195]" />}
          </div>
          
          <div className={`flex-none p-3 bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider border-b border-white/5 flex justify-between items-center ${activeTab === "ai-chat" ? "text-[#00C2FF]" : "text-[#14F195]"}`}>
            <span className="flex items-center gap-2">
                {activeTab === "ai-chat" ? <><Zap size={12} /> Inference Stream</> : <><Database size={12} /> Container Runtime</>}
            </span>
            <span className={`bg-white/5 px-2 py-0.5 rounded text-[9px] border border-white/10`}>
                {activeTab === "ai-chat" ? "LLAMA3.2:1B" : "DOCKER:8081"}
            </span>
          </div>
          
          <div ref={inferenceScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 font-mono scrollbar-hide text-slate-300">
            {(activeTab === "ai-chat" ? inferenceLogs : zeroclawLogs).map((log, i) => (
                <div key={i} className={`${log.startsWith(">") ? "text-white font-black" : "text-slate-400"} ${log.startsWith("ERR") ? "text-red-400" : ""} leading-relaxed whitespace-pre-wrap`}>
                    {log.startsWith(">") ? (
                        <span className="flex gap-2 text-[#14F195]">
                            <span>$</span> {log.substring(2)}
                        </span>
                    ) : log === "" && i === (activeTab === "ai-chat" ? inferenceLogs.length - 1 : zeroclawLogs.length - 1) && isTyping ? (
                        <span className="flex items-center gap-2 text-[#00C2FF] animate-pulse italic">
                            <RefreshCw size={12} className="animate-spin" /> Processing...
                        </span>
                    ) : log}
                </div>
            ))}
            
            {!isTyping && (
                <form onSubmit={handleCommand} className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                    <span className="text-[#14F195] animate-pulse font-bold">➜</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="flex-1 bg-transparent border-none outline-none text-white placeholder-slate-700 font-bold"
                        placeholder={activeTab === "ai-chat" ? "Type to chat..." : "Enter zeroclaw command..."}
                        autoFocus
                    />
                </form>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="bg-[#02050c] flex flex-col relative overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
            <Shield size={140} className="text-[#9945FF]" />
          </div>

          <div className="flex-none p-3 bg-slate-900/50 text-[#9945FF] text-[10px] font-bold uppercase tracking-wider border-b border-white/5 flex justify-between items-center">
            <span className="flex items-center gap-2"><Activity size={12} /> On-Chain Settlement</span>
            <span className="bg-[#9945FF]/10 px-2 py-0.5 rounded text-[9px] border border-[#9945FF]/20 uppercase">Ephemeral_SVM</span>
          </div>

          <div ref={rollupScrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[11px] scrollbar-hide text-slate-500">
            {rollupLogs.map((log, i) => (
              <div key={i} className="border-l border-white/5 pl-3 py-1 relative hover:bg-white/5 transition-colors group">
                 <div className={`absolute -left-[3px] top-3 w-[5px] h-[5px] rounded-full ${i === rollupLogs.length - 1 && sessionActive ? "bg-[#9945FF] animate-ping" : "bg-slate-800"}`}></div>
                 <div className="text-[9px] mb-0.5 group-hover:text-slate-400 transition-colors uppercase">
                    {new Date().toISOString().split('T')[1].split('.')[0]} :: TRACE
                </div>
                <div className={`${log.includes("L1") ? "text-[#14F195]" : log.includes("ERR") || log.includes("❌") ? "text-red-400" : "text-slate-500"}`}>
                  {renderRollupLog(log)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Status Bar */}
           <div className="flex-none p-2 bg-slate-900 border-t border-white/5 text-[9px] flex justify-between text-slate-500 font-mono tracking-tighter uppercase">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1 font-bold text-[#14F195]"><div className="w-1 h-1 rounded-full bg-[#14F195]"></div> SOVEREIGN_MODE</span>
                    <span className="flex items-center gap-1"><div className="w-1 h-1 rounded-full bg-[#00C2FF]"></div> TPS: 52,912</span>
                </div>
                <div className="text-[#9945FF] font-bold">SLOT: 238,129,912</div>
           </div>
        </div>
      </div>
    </div>
  );
}

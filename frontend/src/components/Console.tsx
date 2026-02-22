"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Activity, DollarSign, Cpu, Share2, Zap, TrendingUp, ShieldCheck, Github } from "lucide-react";
import { useState, useEffect } from "react";
import { DepositModal } from "./DepositModal";

export function Console() {
  const { publicKey } = useWallet();
  const [revenue, setRevenue] = useState(0.0);
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    if (publicKey) {
      const interval = setInterval(() => {
        setRevenue(prev => prev + 0.0001);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [publicKey]);

  if (!publicKey) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-10">
      {showDeposit ? (
        <div className="max-w-md mx-auto py-24 relative">
            <div className="absolute inset-0 bg-[#00C2FF]/5 blur-3xl rounded-full"></div>
            <div className="relative z-10">
                <DepositModal />
                <button onClick={() => setShowDeposit(false)} className="w-full text-center text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-8 hover:text-[#00C2FF] transition-colors">
                    Cancel and return
                </button>
            </div>
        </div>
      ) : (
        <div className="space-y-10">
            {/* Real-time Ticker Bar */}
            <div className="bg-black/80 backdrop-blur-md border border-[#14F195]/20 rounded-none p-2 px-6 flex justify-between items-center overflow-hidden shadow-[0_0_15px_-5px_rgba(20,241,149,0.1)]">
                <div className="flex items-center gap-6 overflow-hidden whitespace-nowrap text-left font-mono">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-[#00C2FF] uppercase tracking-widest">
                        <Activity size={12} /> Network: ER-Active
                    </span>
                    <span className="h-3 w-[1px] bg-white/10"></span>
                    <span className="flex items-center gap-2 text-[10px] font-bold text-[#14F195] uppercase tracking-widest animate-pulse">
                        <TrendingUp size={12} /> Current Yield: 8.42% APY (Kamino)
                    </span>
                    <span className="h-3 w-[1px] bg-white/10"></span>
                    <span className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <ShieldCheck size={12} /> L1 Buffer: 125.40 USDC
                    </span>
                </div>
                <button 
                    onClick={() => setShowDeposit(true)}
                    className="bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 px-4 py-1.5 rounded-none text-[9px] font-black uppercase tracking-widest hover:bg-[#00C2FF] hover:text-black transition-all active:scale-95"
                >
                    Refill Credits
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
                {/* Live Revenue Card */}
                <div className="glass-card p-8 group hover:border-[#00C2FF]/40 transition-all duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} className="text-[#00C2FF]" />
                    </div>
                    <div className="flex items-center gap-2 text-[#00C2FF] mb-4">
                        <Zap size={16} fill="currentColor" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">Live Revenue</span>
                    </div>
                    <div className="text-4xl font-black text-white tracking-tight mb-2 font-mono">
                        {revenue.toFixed(4)} <span className="text-lg text-slate-500 font-bold tracking-normal">USDC</span>
                    </div>
                    <div className="text-[9px] text-[#00C2FF]/60 font-bold uppercase tracking-widest">
                        10% Infrastructure Markup
                    </div>
                </div>

                {/* Compute Load Card */}
                <div className="glass-card p-8 group hover:border-[#9945FF]/40 transition-all">
                    <div className="flex items-center gap-2 text-[#9945FF] mb-4 font-black text-xs uppercase tracking-widest text-left">
                        <Cpu size={16} />
                        Compute Load
                    </div>
                    <div className="text-4xl font-black text-white tracking-tight mb-4 font-mono">84.2%</div>
                    <div className="w-full bg-slate-800 h-1.5 overflow-hidden">
                        <div className="bg-[#9945FF] h-full w-[84%] animate-pulse" />
                    </div>
                </div>

                {/* Throughput Card */}
                <div className="glass-card p-8 group hover:border-[#14F195]/40 transition-all">
                    <div className="flex items-center gap-2 text-[#14F195] mb-4 font-black text-xs uppercase tracking-widest">
                        <Activity size={16} />
                        Throughput
                    </div>
                    <div className="text-4xl font-black text-white tracking-tight mb-2 font-mono">1,240 <span className="text-sm text-slate-500">t/s</span></div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Across 14 Sovereign agents</div>
                </div>

                {/* Sovereign Bridges Card */}
                <div className="glass-card p-8 group hover:border-[#FF00FF]/40 transition-all">
                    <div className="flex items-center gap-2 text-[#FF00FF] mb-4 font-black text-xs uppercase tracking-widest">
                        <Share2 size={16} />
                        Sovereign Bridges
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="flex -space-x-3">
                            {[1,2,3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border border-black flex items-center justify-center text-[10px] text-white font-bold">
                                    A{i}
                                </div>
                            ))}
                         </div>
                         <span className="text-xs font-bold text-slate-400">+11 Active</span>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

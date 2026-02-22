"use client";

import { useState } from "react";
import { Wallet, Info, ArrowUpRight, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";

export function DepositModal() {
  const [amount, setAmount] = useState("10");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleDeposit = async () => {
    setLoading(true);
    // Simulate L1 Lock + Rollup Delegation
    await new Promise(r => setTimeout(r, 2500));
    setLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="bg-black/90 backdrop-blur-xl border border-[#14F195]/50 p-8 rounded-none text-center space-y-6 animate-in fade-in zoom-in duration-300 shadow-[0_0_50px_-10px_rgba(20,241,149,0.3)]">
        <div className="w-20 h-20 bg-[#14F195]/20 rounded-full flex items-center justify-center mx-auto border border-[#14F195] animate-pulse">
            <CheckCircle2 size={40} className="text-[#14F195]" />
        </div>
        <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Session Initialized</h2>
            <div className="h-1 w-20 bg-[#14F195] mx-auto my-3"></div>
            <p className="text-slate-400 text-sm font-mono leading-relaxed">
                Your <span className="text-white font-bold">{amount} USDC</span> is now locked on L1 and delegated to the <span className="text-[#9945FF] font-bold">Ephemeral Rollup SVM</span>. 
                <br/><br/>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">:: Real-time per-token billing enabled ::</span>
            </p>
        </div>
        <button onClick={() => setSuccess(false)} className="bg-white text-black px-6 py-3 rounded-none font-black w-full uppercase tracking-widest hover:bg-[#14F195] transition-colors">
            Access Terminal
        </button>
      </div>
    );
  }

  return (
    <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-8 rounded-none shadow-2xl max-w-md mx-auto space-y-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00C2FF]/20 blur-3xl rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      
      <div className="flex items-center justify-between relative z-10 border-b border-white/5 pb-6">
        <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Start AI Session</h2>
            <p className="text-[10px] text-[#00C2FF] font-mono mt-1 flex items-center gap-1">
                <ShieldCheck size={10} /> PROTECTED_STATE_DELEGATION
            </p>
        </div>
        <div className="bg-[#00C2FF]/10 text-[#00C2FF] border border-[#00C2FF]/30 p-2 rounded-none">
            <Wallet size={20} />
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Deposit Amount (USDC)</label>
            <div className="relative group mt-2">
                <input 
                    type="number" 
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-none py-4 px-6 text-2xl font-mono font-bold text-white focus:outline-none focus:border-[#00C2FF] focus:ring-1 focus:ring-[#00C2FF] transition-all placeholder-slate-700"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-500 text-sm tracking-widest uppercase">USDC</div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
             <div className="bg-white/5 p-3 rounded-none border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Fee Rate</div>
                <div className="text-xs font-mono text-white">0.0001 USDC / Token</div>
             </div>
             <div className="bg-white/5 p-3 rounded-none border border-white/5">
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Est. Capacity</div>
                <div className="text-xs font-mono text-white">~100,000 Tokens</div>
             </div>
        </div>
      </div>

      <div className="bg-[#9945FF]/5 border border-[#9945FF]/20 p-4 flex gap-3 items-start relative z-10">
        <Info size={16} className="text-[#9945FF] mt-0.5 shrink-0" />
        <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
            Funds are locked on Solana L1 and earn <span className="text-[#9945FF] font-bold">3.5% APY</span> while delegated to the high-frequency settlement layer.
        </p>
      </div>

      <button 
        onClick={handleDeposit}
        disabled={loading}
        className="w-full bg-[#00C2FF] text-black py-4 rounded-none font-black text-sm uppercase tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] active:translate-x-[2px] active:translate-y-[2px] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <><Loader2 className="animate-spin" size={16} /> Delegating State...</> : "Authorize & Start"}
      </button>
      
      <p className="text-[9px] text-center text-slate-600 font-mono uppercase tracking-widest">
        Powered by MagicBlock Ephemeral Rollups
      </p>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Coins, ArrowUpRight, ShieldCheck } from "lucide-react";

export function WalletStatus() {
  const [solBalance, setSolBalance] = useState(1.25);
  const [usdcBalance, setUsdcBalance] = useState(100.0);
  const address = "7xKWR8j5XpQ2z9n...M4uN";

  return (
    <div className="flex items-center gap-4 bg-black/40 border border-white/5 px-4 py-2 rounded-lg backdrop-blur-sm shadow-inner group transition-all hover:border-[#00C2FF]/20">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400 transition-colors">{address}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#14F195] animate-pulse"></div>
        </div>
        <div className="flex gap-3 mt-1">
            <div className="flex items-center gap-1">
                <span className="text-[11px] font-black text-white">{solBalance.toFixed(2)}</span>
                <span className="text-[9px] font-bold text-[#14F195] uppercase tracking-tighter">SOL</span>
            </div>
            <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                <span className="text-[11px] font-black text-white">{usdcBalance.toFixed(2)}</span>
                <span className="text-[9px] font-bold text-[#00C2FF] uppercase tracking-tighter">USDC</span>
            </div>
        </div>
      </div>
      
      <div className="bg-[#00C2FF]/10 p-2 rounded border border-[#00C2FF]/20 text-[#00C2FF] group-hover:bg-[#00C2FF] group-hover:text-black transition-all">
        <Wallet size={16} />
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Coins, ArrowUpRight, ShieldCheck, ExternalLink } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

export function WalletStatus() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [solBalance, setSolBalance] = useState(0);
  const [usdcBalance, setUsdcBalance] = useState(0);
  
  const DEMO_WALLET = process.env.NEXT_PUBLIC_DEMO_WALLET;
  const displayAddress = connected ? publicKey?.toBase58() : DEMO_WALLET;
  const shortAddress = displayAddress ? `${displayAddress.substring(0, 8)}...${displayAddress.substring(displayAddress.length - 4)}` : "None";

  useEffect(() => {
    const fetchBalances = async () => {
        if (!displayAddress) return;
        try {
            const pubkey = new PublicKey(displayAddress);
            
            // 1. Fetch SOL
            const balance = await connection.getBalance(pubkey);
            setSolBalance(balance / LAMPORTS_PER_SOL);
            
            // 2. Fetch USDC (Devnet Mint)
            const USDC_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, { mint: USDC_MINT });
            
            if (tokenAccounts.value.length > 0) {
                const amount = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount;
                setUsdcBalance(amount || 0);
            } else {
                setUsdcBalance(0);
            }
        } catch (e) {
            // Silently fail for 429s/network noise
        }
    };

    fetchBalances();
    const id = setInterval(fetchBalances, 10000);
    return () => clearInterval(id);
  }, [displayAddress, connection]);

  return (
    <div className="flex items-center gap-4 bg-black/40 border border-white/5 px-4 py-2 rounded-lg backdrop-blur-sm shadow-inner group transition-all hover:border-[#00C2FF]/20">
      <div className="flex flex-col items-end">
        <div className="flex items-center gap-2">
            <a 
              href={`https://explorer.solana.com/address/${displayAddress}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-slate-500 group-hover:text-[#14F195] transition-colors flex items-center gap-1"
            >
                {shortAddress} <ExternalLink size={8} />
            </a>
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#14F195]" : "bg-[#9945FF]"} animate-pulse`}></div>
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

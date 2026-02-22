"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

export function LaunchButton() {
  const { connected } = useWallet();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (connected) {
    return (
      <button className="bg-[#00C2FF] text-black px-6 py-2 rounded-none font-black hover:bg-white transition-all shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center gap-2 uppercase text-xs tracking-widest border border-transparent">
        Launch Console
        <ArrowRight size={14} />
      </button>
    );
  }

  return (
    <WalletMultiButton className="!bg-black !text-[#14F195] !border !border-[#14F195]/50 !rounded-none !py-2 !px-6 !h-auto !leading-tight !font-black !text-xs !tracking-widest !uppercase !transition-all hover:!bg-[#14F195] hover:!text-black !shadow-[2px_2px_0px_0px_rgba(20,241,149,0.2)] hover:!shadow-[2px_2px_0px_0px_rgba(20,241,149,0.5)]" />
  );
}

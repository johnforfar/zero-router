"use client";

import React from "react";
import { X, Book, Trophy, Target, Cpu, Zap, Shield, Rocket } from "lucide-react";

export function DocsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl max-h-[80vh] bg-slate-950 border border-[#00C2FF]/30 rounded-xl shadow-2xl flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-3">
            <Book className="text-[#00C2FF]" size={24} />
            <h2 className="text-xl font-black text-white tracking-tighter uppercase">Protocol Documentation</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-12 scrollbar-hide text-slate-300 font-mono text-sm leading-relaxed">
          
          {/* Why ZeroRouter */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#14F195]">
              <Trophy size={18} />
              <h3 className="text-lg font-bold uppercase tracking-tight">Why ZeroRouter Wins</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white font-bold block mb-1">Centralized vs Decentralized</span>
                <p className="text-xs text-slate-400">OpenRouter and ChatGPT require monthly subscriptions and centralized credits. ZeroRouter settles per-token, on-chain, with zero middlemen.</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                <span className="text-white font-bold block mb-1">ER Performance</span>
                <p className="text-xs text-slate-400">We leverage MagicBlock Ephemeral Rollups for real-time accounting. Every single token is settled 1:1 gaslessly, providing sub-millisecond finality.</p>
              </div>
            </div>
          </section>

          {/* Architecture */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#00C2FF]">
              <Cpu size={18} />
              <h3 className="text-lg font-bold uppercase tracking-tight">System Architecture</h3>
            </div>
            <div className="bg-black/60 p-6 rounded-lg border border-white/5 font-mono text-[10px] leading-tight text-[#14F195]/80 overflow-x-auto whitespace-pre">
{`   [ USER / AGENT ]
         |
    ( NEXT.JS DASHBOARD ) ----> [ MAGICBLOCK ER ]
         |                         |
    ( CLOUD GATEWAY: RUST ) <---- [ 1:1 SETTLEMENT ]
         |
    ( INFERENCE NODE: GCE )`}
            </div>
            <p className="text-xs text-slate-400">Our distributed grid moves beyond "Ollama-on-a-laptop". We separate inference, routing, and accounting into a scalable cloud intelligence grid.</p>
          </section>

          {/* Devnet Demo */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#9945FF]">
              <Rocket size={18} />
              <h3 className="text-lg font-bold uppercase tracking-tight">Devnet Demo Handshake</h3>
            </div>
            <div className="p-4 bg-[#9945FF]/5 border border-[#9945FF]/20 rounded-lg space-y-2">
              <p className="text-xs">The system is pre-funded for a zero-friction demo. If no wallet is connected, the dashboard defaults to our Devnet Master Identity:</p>
              <code className="block bg-black p-2 rounded text-[10px] text-[#00C2FF] break-all">2gzjbVH1DN71s5Csf1fkxDpjJJLesB174Yr2xRkyGSgm</code>
            </div>
          </section>

          {/* Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <Shield size={18} />
              <h3 className="text-lg font-bold uppercase tracking-tight">Security & DevOps</h3>
            </div>
            <p className="text-xs text-slate-400">ZeroRouter follows a "Zero-Trust" model. The gateway runs in a scratch-based container with an immutable filesystem and no shell access. All builds are automated via GitHub Actions directly to GCP Artifact Registry.</p>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase">
          <span>© 2026 ZeroRouter Protocol</span>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-[#14F195] rounded-full animate-pulse"></div>
            <span>Devnet Active</span>
          </div>
        </div>

        {/* Background Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C2FF]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#14F195]/5 rounded-full blur-[100px] pointer-events-none"></div>
      </div>
    </div>
  );
}

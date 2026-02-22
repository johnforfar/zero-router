"use client";

import React, { useState } from "react";
import { Zap, Shield, Cpu, Github, ArrowRight, Globe, Lock, Layers, HardDrive, RefreshCw, Terminal as TerminalIcon, Book } from "lucide-react";
import { LaunchButton } from "@/components/LaunchButton";
import { Console } from "@/components/Console";
import { ZeroClawTerminal } from "@/components/ZeroClawTerminal";
import { WalletStatus } from "@/components/WalletStatus";
import { DocsModal } from "@/components/DocsModal";

export default function LandingPage() {
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-[#00C2FF]/30 overflow-x-hidden relative">
      <DocsModal isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
      
      {/* Scanlines Overlay */}
      <div className="scanlines"></div>
      
      {/* Background Grid */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20 retro-grid"></div>

      {/* Header */}
      <header className="fixed w-full z-50 top-0 border-b border-white/5 bg-black/50 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-[#00C2FF] blur-md opacity-20 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-black border border-[#00C2FF]/50 rounded-lg p-2 text-[#00C2FF] group-hover:text-white group-hover:bg-[#00C2FF] transition-colors">
                <Zap size={24} fill="currentColor" className="group-hover:fill-white" />
              </div>
            </div>
            <span className="font-black text-2xl tracking-tighter text-white uppercase font-mono glitch" data-text="ZEROROUTER">
              ZeroRouter
            </span>
          </div>
          
          <div className="hidden lg:flex items-center gap-12">
            <nav className="flex gap-8 items-center text-xs font-bold uppercase tracking-widest text-slate-400">
                <a href="#skills" className="hover:text-[#00C2FF] transition-all">Skills</a>
                <a href="#ethos" className="hover:text-[#00C2FF] transition-all">Ethos</a>
                <button onClick={() => setIsDocsOpen(true)} className="hover:text-[#00C2FF] flex items-center gap-1.5 transition-all uppercase">
                    <Book size={12} /> Protocol Docs
                </button>
            </nav>
            
            <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
            
            <div className="flex items-center gap-6">
                <WalletStatus />
                <LaunchButton />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="relative px-6 pb-32 pt-20 text-center max-w-7xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#9945FF]/10 border border-[#9945FF]/50 text-[#9945FF] px-4 py-2 rounded-full text-[10px] font-black tracking-[0.2em] mb-12 uppercase animate-pulse-slow shadow-[0_0_20px_-5px_rgba(153,69,255,0.4)] hover:shadow-[0_0_30px_-5px_rgba(153,69,255,0.6)] transition-all cursor-default">
            <div className="w-2 h-2 rounded-full bg-[#9945FF] animate-ping"></div>
            Solana Blitz v0.1
          </div>
          
          {/* Title */}
          <h1 className="hero-title text-white mb-8 mx-auto max-w-5xl text-6xl md:text-8xl lg:text-[120px] font-black uppercase tracking-tighter leading-[0.85]">
            AI Inference <br/> 
            <span className="text-slate-500 text-4xl md:text-6xl block my-4 lowercase italic font-light tracking-normal">at the</span>
            <span className="text-gradient-solana block mt-2 tracking-widest">Speed of Light</span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto font-medium leading-relaxed">
            True per-token settlement on <span className="text-white font-bold border-b-2 border-[#14F195]">Solana Ephemeral Rollups</span>. <br/>
            High-frequency AI utility for the sovereign agent.
          </p>

          {/* Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center items-center mb-32">
            <button onClick={() => setIsDocsOpen(true)} className="btn-primary group px-8 py-4 bg-[#14F195] text-black font-black uppercase tracking-widest rounded-lg flex items-center gap-2 hover:shadow-[0_0_30px_rgba(20,241,149,0.4)] transition-all">
              Start Building 
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="https://github.com/johnforfar/zero-router" target="_blank" rel="noopener noreferrer" className="btn-secondary group px-8 py-4 border border-white/10 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-all">
              <Github size={18} /> 
              View Source
            </a>
          </div>

          {/* Terminal */}
          <div className="mx-auto max-w-5xl relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00C2FF] via-[#9945FF] to-[#14F195] opacity-30 blur-xl group-hover:opacity-50 transition-all duration-1000"></div>
            <ZeroClawTerminal />
          </div>
        </section>

        {/* Console / Feature Strip */}
        <div className="border-y border-white/10 bg-black/50 backdrop-blur-sm overflow-hidden py-12">
            <div className="max-w-7xl mx-auto px-6">
                 <Console />
            </div>
        </div>

        {/* 1-Click Skills */}
        <section id="skills" className="py-32 px-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#9945FF]/5 to-transparent pointer-events-none"></div>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div>
                <h2 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase leading-none">
                  Install <span className="text-[#14F195]">Solana Skills</span>
                </h2>
                <p className="text-slate-400 text-lg max-w-2xl font-mono">
                  $ pick_tools --sync soul_config
                </p>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-1 bg-gradient-to-r from-[#14F195] to-transparent"></div>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "Jupiter Swap", desc: "Real-time swaps via Jupiter.", icon: "🪐", color: "text-[#14F195]", border: "hover:border-[#14F195]/50" },
                { title: "Orca LP", desc: "Manage liquidity pools.", icon: "🐳", color: "text-[#00C2FF]", border: "hover:border-[#00C2FF]/50" },
                { title: "Pyth Oracle", desc: "Stream price feeds.", icon: "🔮", color: "text-[#9945FF]", border: "hover:border-[#9945FF]/50" },
                { title: "Metaplex NFT", desc: "Mint and manage NFTs.", icon: "🖼️", color: "text-[#FF00FF]", border: "hover:border-[#FF00FF]/50" }
              ].map((skill, i) => (
                <div key={skill.title} className={`p-8 glass-card group cursor-pointer bg-slate-900/10 border border-white/5 relative ${skill.border}`}>
                  <div className="absolute top-4 right-4 text-[10px] font-mono opacity-30 group-hover:opacity-100 transition-opacity">
                    0{i+1}
                  </div>
                  <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-300">{skill.icon}</div>
                  <h3 className={`text-xl font-black mb-3 uppercase tracking-tight ${skill.color}`}>{skill.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-mono">{skill.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ethos */}
        <section id="ethos" className="py-32 px-6 border-t border-white/5 bg-black relative overflow-hidden">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-24">
              <h2 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter uppercase glitch" data-text="ZEROCLAW ETHOS">
                ZeroClaw Ethos
              </h2>
              <p className="text-slate-400 text-xl font-medium font-mono text-[#00C2FF]">
                Lightweight infrastructure for modern AI.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Blazing Fast", desc: "Cold start < 10ms. No containers. Just WASM.", icon: <Zap size={32} />, color: "text-[#14F195]" },
                { title: "Ultra Light", desc: "3.4MB binary. Runs anywhere. Edge compatible.", icon: <HardDrive size={32} />, color: "text-[#00C2FF]" },
                { title: "Pluggable", desc: "Trait-based system. Hot-swappable modules.", icon: <Layers size={32} />, color: "text-[#9945FF]" },
              ].map((item, i) => (
                <div key={item.title} className="bg-slate-900/20 border border-white/5 p-10 hover:bg-slate-900/40 transition-colors relative group overflow-hidden rounded-xl">
                  <div className={`mb-6 ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                    {item.icon}
                  </div>
                  <h3 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{item.title}</h3>
                  <p className="text-slate-400 leading-relaxed font-mono text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="py-12 border-t border-white/10 bg-black text-center">
            <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">
                © 2026 ZeroRouter Protocol. All systems operational.
            </p>
        </footer>
      </main>
    </div>
  );
}

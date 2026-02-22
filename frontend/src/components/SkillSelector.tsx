"use client";

import { useState } from "react";
import { Github, HardDrive, Check, Code2 } from "lucide-react";

const SKILLS = [
  { id: "jupiter", name: "Jupiter Swap", icon: "🪐", desc: "Execute real-time swaps via Jupiter aggregator." },
  { id: "orca", name: "Orca LP", icon: "🐳", desc: "Monitor and manage Orca liquidity pools." },
  { id: "pyth", name: "Pyth Oracle", icon: "🔮", desc: "Stream real-time price feeds to your agent." },
  { id: "metaplex", name: "Metaplex NFT", icon: "🖼️", desc: "Mint and manage NFTs via Metaplex protocol." },
];

export function SkillSelector() {
  const [selected, setSelected] = useState<string[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleSync = async () => {
    setSyncing(true);
    // Simulate GitHub/Radicle sync
    await new Promise(r => setTimeout(r, 2000));
    setSyncing(false);
    setSynced(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-12 py-24">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Install Solana Skills</h2>
        <p className="text-slate-500">Pick your tools. We'll sync the SOUL config to your repo.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {SKILLS.map((skill) => (
          <div 
            key={skill.id} 
            onClick={() => toggle(skill.id)}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${
              selected.includes(skill.id) ? "border-primary bg-primary/5 shadow-md" : "border-slate-100 bg-white hover:border-slate-200"
            }`}
          >
            <div className="text-4xl mb-4">{skill.icon}</div>
            <h3 className="font-bold text-slate-900 mb-2">{skill.name}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{skill.desc}</p>
            {selected.includes(skill.id) && (
              <div className="absolute top-4 right-4 bg-primary text-white rounded-full p-1">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm">
                    <Github size={20} className="text-slate-600" />
                </div>
                <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center shadow-sm">
                    <HardDrive size={20} className="text-primary" />
                </div>
            </div>
            <div>
                <h4 className="font-bold text-slate-900">Push to Radicle or GitHub</h4>
                <p className="text-sm text-slate-500">ZeroRouter never stores your code. It's pushed directly to your sovereign slice.</p>
            </div>
        </div>

        <button 
          disabled={selected.length === 0 || syncing}
          onClick={handleSync}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-all flex items-center gap-3"
        >
          {syncing ? "Syncing..." : synced ? "Synced to Repo!" : "Sync Skills to GitHub"}
          {!syncing && !synced && <ArrowRight size={18} />}
          {synced && <Check size={18} />}
        </button>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
      </svg>
    )
  }

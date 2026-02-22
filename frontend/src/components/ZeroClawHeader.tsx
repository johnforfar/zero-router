import React from "react";
import { Terminal, Activity, Coins, ChevronDown, Sun, Moon, RotateCcw } from "lucide-react";

interface ZeroClawHeaderProps {
  theme: any;
  isDarkMode: boolean;
  setIsDarkMode: (v: boolean) => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  connected: boolean;
  publicKey: any;
  demoWallet: string;
  solBalance: number;
  usdcBalance: number;
  sessionActive: boolean;
  handleReset: () => void;
}

export function ZeroClawHeader({
  theme, isDarkMode, setIsDarkMode, selectedModel, setSelectedModel,
  connected, publicKey, demoWallet, solBalance, usdcBalance, sessionActive, handleReset
}: ZeroClawHeaderProps) {
  return (
    <div className={`flex justify-between items-center p-3 border-b ${theme.headerBorder} ${theme.headerBg} shadow-sm z-10`}>
        <div className="flex items-center space-x-2">
            <Terminal size={16} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
            <span className={`font-bold text-lg tracking-tight ${theme.headerText}`}>ZEROCLAW_TERMINAL_V1</span>
        </div>
        <div className="flex items-center space-x-6 text-sm font-medium">
            <div className="flex items-center gap-2 mr-2">
                <div className="relative">
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className={`appearance-none bg-slate-900/50 border ${theme.statBorder} ${theme.statText} text-[10px] font-bold px-3 py-1 rounded-full outline-none hover:border-blue-500 transition-all cursor-pointer pr-6`}
                    >
                        <option value="gemini-2.0-flash">Gemini 2 Flash</option>
                        <option value="ollama-llama3.2" disabled>Ollama Llama3.2 (coming soon)</option>
                    </select>
                    <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500" />
                </div>
            </div>
            <a
                href={`https://explorer.solana.com/address/${connected && publicKey ? publicKey.toBase58() : demoWallet}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center space-x-4 hover:bg-blue-50/10 p-2 rounded-md transition-colors cursor-pointer group`}
                title="View Wallet on Explorer"
            >
                <div className="flex items-center space-x-2">
                    <Coins size={14} className="text-yellow-500 group-hover:scale-110 transition-transform" />
                    <span className={isDarkMode ? "text-blue-200" : "text-slate-700"}>{solBalance.toFixed(4)} SOL</span>
                </div>
                 <div className="flex items-center space-x-1">
                    <span className="text-blue-500 font-bold">$</span>
                    <span className={isDarkMode ? "text-blue-200" : "text-slate-700"}>{usdcBalance.toFixed(2)} USDC</span>
                </div>
            </a>
            <div className="flex items-center space-x-2">
                <Activity size={14} className={sessionActive ? "text-green-500 animate-pulse" : "text-gray-400"} />
                <span className={sessionActive ? "text-green-500 font-bold" : "text-gray-400"}>{sessionActive ? "UPLINK_ACTIVE" : "STANDBY"}</span>
            </div>
             <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`hover:${theme.text} transition-colors p-1 rounded-full hover:bg-blue-500/10`}
                title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {isDarkMode ? <Sun size={14}/> : <Moon size={14}/>}
             </button>
             <button onClick={handleReset} className={`hover:${theme.text} transition-colors p-1`} title="Reset Protocol State"><RotateCcw size={14}/></button>
        </div>
    </div>
  );
}

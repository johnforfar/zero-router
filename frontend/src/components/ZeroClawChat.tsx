import React from "react";
import ReactMarkdown from "react-markdown";
import { ChevronRight, Loader2, Cpu } from "lucide-react";
import { ChatMessage } from "@/hooks/useZeroClaw";

interface ZeroClawChatProps {
  theme: any;
  activeTab: string;
  setActiveTab: (v: "ai-chat" | "zeroclaw") => void;
  inferenceLogs: ChatMessage[];
  isDarkMode: boolean;
  isTyping: boolean;
  input: string;
  setInput: (v: string) => void;
  handleCommand: (e: React.FormEvent) => void;
  inferenceScrollRef: React.RefObject<HTMLDivElement>;
}

export function ZeroClawChat({
  theme, activeTab, setActiveTab, inferenceLogs, isDarkMode, isTyping, input, setInput, handleCommand, inferenceScrollRef
}: ZeroClawChatProps) {
  return (
    <div className={`flex-1 flex flex-col border-r ${theme.panelBorder} ${theme.panelBg} backdrop-blur-sm`}>
         {/* Tabs */}
        <div className={`flex border-b ${theme.tabBorder}`}>
            <button 
                onClick={() => setActiveTab("ai-chat")}
                className={`flex-1 p-3 text-center font-medium transition-all ${activeTab === "ai-chat" ? theme.tabActive : theme.tabInactive}`}
            >
                AI_INFERENCE_STREAM
            </button>
            <button
                 onClick={() => setActiveTab("zeroclaw")}
                 className={`flex-1 p-3 text-center font-medium transition-all ${activeTab === "zeroclaw" ? theme.tabActive : theme.tabInactive} relative group`}
            >
                ZEROCLAW_AGENT
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                </span>
            </button>
        </div>

        {/* Output Area */}
        <div ref={inferenceScrollRef} className={`flex-1 overflow-y-auto p-6 space-y-2 text-sm leading-relaxed ${theme.outputText}`}>
            {activeTab === "ai-chat" ? (
                <div className="flex flex-col space-y-4">
                    {inferenceLogs.map((log, i) => (
                        <div key={i} className={`flex ${log.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {log.type === 'status' ? (
                                <div className="w-full text-center text-[10px] text-blue-500/60 font-bold tracking-widest uppercase py-2 border-y border-blue-900/20 my-2">
                                    {log.content}
                                </div>
                            ) : (
                                <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                                    log.type === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none border border-blue-500' 
                                        : 'bg-slate-900 text-blue-50 rounded-tl-none border border-blue-800/50'
                                }`}>
                                    <div className={`prose prose-sm ${log.type === 'user' ? 'prose-invert' : (isDarkMode ? "prose-invert prose-p:text-blue-100 prose-strong:text-blue-300" : "prose-blue")} max-w-none`}>
                                        <ReactMarkdown>{log.content}</ReactMarkdown>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                    <Cpu size={48} className="text-blue-500 animate-pulse" />
                    <div className="text-xl font-bold tracking-widest text-blue-400">COMING SOON</div>
                    <div className="text-xs text-blue-300/60 max-w-xs text-center leading-relaxed italic">
                        Sovereign AI agent execution and system command orchestration is currently under development.
                    </div>
                </div>
            )}
        </div>

        {/* Input Area */}
        <form onSubmit={handleCommand} className={`p-4 border-t ${theme.inputBorder} flex items-center ${theme.inputBg} shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20`}>
            <ChevronRight size={18} className="mr-3 text-blue-500 animate-pulse" />
            <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                className={`flex-1 bg-transparent outline-none border-none ${theme.inputText} ${theme.inputPlaceholder} text-base h-10 font-medium`}
                placeholder={activeTab === "ai-chat" ? "Enter query for sovereign intelligence..." : "Enter agent command..."}
                autoFocus
            />
            {isTyping && <Loader2 size={18} className="animate-spin text-blue-500 ml-3" />}
        </form>
    </div>
  );
}

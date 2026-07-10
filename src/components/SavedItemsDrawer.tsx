import React from "react";
import { X, Star, MessageSquare, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Message, User } from "../types";
import { Theme } from "../contexts/SettingsContext";

interface SavedItemsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  currentUser: User | null;
  theme: Theme;
  onUnstar: (messageId: string) => void;
}

export function SavedItemsDrawer({ isOpen, onClose, messages, currentUser, theme: t, onUnstar }: SavedItemsDrawerProps) {
  const savedMessages = messages.filter(m => m.bookmarkedBy?.includes(currentUser?.id || ""));

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 bottom-0 w-full max-w-md z-[71] shadow-2xl flex flex-col ${t.isLight ? "bg-white" : "bg-slate-950"}`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between ${t.border}`}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                </div>
                <h2 className={`font-black uppercase tracking-widest text-sm ${t.isLight ? "text-slate-900" : "text-white"}`}>Saved Items</h2>
              </div>
              <button onClick={onClose} className={`p-2 rounded-xl hover:bg-slate-800 transition-colors ${t.isLight ? "hover:bg-slate-100" : "hover:bg-slate-800"}`}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {savedMessages.length > 0 ? (
                savedMessages.map((msg) => (
                  <div key={msg.id} className={`p-4 rounded-2xl border ${t.border} ${t.isLight ? "bg-slate-50" : "bg-slate-900/40"} group relative`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${t.isLight ? "text-slate-900" : "text-white"}`}>{msg.sender}</span>
                        <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <button 
                        onClick={() => onUnstar(msg.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className={`text-xs leading-relaxed ${t.isLight ? "text-slate-600" : "text-slate-300"}`}>{msg.text}</p>
                    <div className={`mt-2 pt-2 border-t flex items-center gap-2 text-[9px] font-bold uppercase tracking-tight ${t.isLight ? "border-slate-200 text-slate-400" : "border-slate-800 text-slate-500"}`}>
                       <MessageSquare className="w-3 h-3" /> Channel: {msg.room}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 py-20 text-center">
                  <Star className="w-12 h-12 mb-4" />
                  <p className="text-sm font-medium">No saved items yet</p>
                  <p className="text-[10px] mt-1 max-w-[200px]">Star messages to keep track of important information.</p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

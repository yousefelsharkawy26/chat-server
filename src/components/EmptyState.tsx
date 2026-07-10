import React from "react";
import { motion } from "motion/react";
import { MessageCircle, Sparkles } from "lucide-react";

interface EmptyStateProps {
  channelName: string;
  channelEmoji?: string;
  theme: any;
}

export function EmptyState({ channelName, channelEmoji, theme }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 select-none">
      {/* Animated chat bubble illustration */}
      <motion.div
        className="relative mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
      >
        {/* Floating background orbs */}
        <motion.div
          className={`absolute -inset-8 rounded-full ${theme.accentBg}/5 blur-2xl`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute -inset-4 rounded-full ${theme.accentBg}/10 blur-xl`}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.2, 0.4] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", delay: 0.5 }}
        />

        {/* Main icon container */}
        <motion.div
          className={`relative w-24 h-24 rounded-3xl ${theme.accentBg}/15 border ${theme.accentBorder} flex items-center justify-center backdrop-blur-sm`}
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        >
          <span className="text-4xl">{channelEmoji || "💬"}</span>
          <motion.div
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 300 }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </motion.div>
        </motion.div>

        {/* Decorative mini bubbles */}
        <motion.div
          className={`absolute -bottom-3 -left-6 w-8 h-8 rounded-2xl ${theme.accentBg}/20 border ${theme.accentBorder} flex items-center justify-center backdrop-blur-sm`}
          animate={{ y: [0, -4, 0], rotate: [0, 5, 0] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 0.8 }}
        >
          <MessageCircle className={`w-3.5 h-3.5 ${theme.accentText}`} />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <motion.div
        className="text-center max-w-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className={`text-lg font-bold ${theme.isLight ? "text-slate-800" : "text-white"} mb-2`}>
          Welcome to #{channelName}
        </h3>
        <p className={`text-sm ${theme.textMuted} leading-relaxed`}>
          This is the very beginning of this channel. Start the conversation by sending a message below.
        </p>
      </motion.div>

      {/* Keyboard hint */}
      <motion.div
        className={`mt-8 px-4 py-2 rounded-xl ${theme.cardBg} border ${theme.border} flex items-center gap-3 text-xs ${theme.textMuted}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <kbd className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-mono text-[10px]">Enter</kbd>
        <span>to send a message</span>
        <span className="mx-1 opacity-30">|</span>
        <kbd className="px-2 py-0.5 rounded-md bg-white/10 border border-white/10 font-mono text-[10px]">@</kbd>
        <span>to mention someone</span>
      </motion.div>
    </div>
  );
}
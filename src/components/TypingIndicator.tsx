import React from "react";
import { motion, AnimatePresence } from "motion/react";

interface TypingIndicatorProps {
  usernames: string[];
  theme: any;
}

export function TypingIndicator({ usernames, theme }: TypingIndicatorProps) {
  const displayText = usernames.length === 0 ? "" :
    usernames.length === 1 ? `${usernames[0]} is typing` :
    usernames.length === 2 ? `${usernames[0]} and ${usernames[1]} are typing` :
    `${usernames[0]} and ${usernames.length - 1} others are typing`;

  return (
    <AnimatePresence mode="wait">
      {usernames.length > 0 && (
        <motion.div
          key="typing-indicator"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 5 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-2.5 px-4 py-2 ${theme.isLight ? "text-slate-500" : "text-slate-400"}`}
        >
          {/* Animated dots */}
          <div className="flex items-center gap-0.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-current opacity-60"
                animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-xs font-medium">{displayText}</span>
          <span className="text-[10px] opacity-40">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
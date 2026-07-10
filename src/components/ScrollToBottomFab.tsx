import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

interface ScrollToBottomFabProps {
  visible: boolean;
  onClick: () => void;
  unreadCount?: number;
  theme: any;
}

export function ScrollToBottomFab({ visible, onClick, unreadCount, theme }: ScrollToBottomFabProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20"
        >
          <button
            onClick={onClick}
            className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-full ${theme.cardBg} border ${theme.border} backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all cursor-pointer ${theme.accentShadow}`}
          >
            {/* Unread badge */}
            {unreadCount && unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full ${theme.accentBg} text-white text-[10px] font-bold flex items-center justify-center shadow-lg`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
            <ChevronDown className={`w-4 h-4 ${theme.accentText} group-hover:translate-y-0.5 transition-transform`} />
            <span className={`text-xs font-medium ${theme.accentText} hidden sm:inline`}>
              New messages
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
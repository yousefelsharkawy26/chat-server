import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CornerDownRight, Pin, Bookmark, Smile, Star, MoreHorizontal } from "lucide-react";

interface MessageHoverActionsProps {
  onReply: () => void;
  onPin: () => void;
  onBookmark: () => void;
  onReact: (emoji: string) => void;
  isPinned: boolean;
  isBookmarked: boolean;
  theme: any;
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "😮", "🔥", "👎"];

export function MessageHoverActions({
  onReply,
  onPin,
  onBookmark,
  onReact,
  isPinned,
  isBookmarked,
  theme,
}: MessageHoverActionsProps) {
  const [showReactions, setShowReactions] = useState(false);

  return (
    <div className="absolute -top-9 right-2 z-30 flex items-center gap-0.5">
      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 4 }}
            className="flex items-center gap-0.5 mr-1 p-1 rounded-xl bg-slate-900/95 border border-slate-700/50 backdrop-blur-xl shadow-xl"
          >
            {QUICK_REACTIONS.map((emoji) => (
              <motion.button
                key={emoji}
                whileHover={{ scale: 1.3 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(emoji);
                  setShowReactions(false);
                }}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-sm cursor-pointer transition-colors"
              >
                {emoji}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <motion.div
        initial={false}
        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-xl ${theme.cardBg} border ${theme.border} backdrop-blur-xl shadow-lg`}
      >
        <ActionButton icon={<CornerDownRight className="w-3.5 h-3.5" />} onClick={onReply} title="Reply" theme={theme} />
        <ActionButton icon={<Smile className="w-3.5 h-3.5" />} onClick={() => setShowReactions(!showReactions)} title="React" theme={theme} />
        <ActionButton
          icon={<Pin className={`w-3.5 h-3.5 ${isPinned ? theme.accentText : ""}`} />}
          onClick={onPin}
          title={isPinned ? "Unpin" : "Pin"}
          theme={theme}
          active={isPinned}
        />
        <ActionButton
          icon={<Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? theme.accentText : ""}`} />}
          onClick={onBookmark}
          title={isBookmarked ? "Unsave" : "Save"}
          theme={theme}
          active={isBookmarked}
        />
      </motion.div>
    </div>
  );
}

function ActionButton({
  icon,
  onClick,
  title,
  theme,
  active,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  theme: any;
  active?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
        active
          ? `${theme.accentBg}/20 ${theme.accentText}`
          : `${theme.textMuted} hover:bg-white/10 hover:${theme.isLight ? "text-slate-700" : "text-white"}`
      }`}
    >
      {icon}
    </motion.button>
  );
}
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X } from "lucide-react";

interface EnhancedEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  theme: any;
  customEmojis?: { id: string; name: string; url: string }[];
}

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    icon: "😊",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "😊", "😇", "🥰", "😍", "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶", "🫥", "😏", "😒", "🙄", "😬", "🤥", "😌", "😔", "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸", "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "😮", "😯", "😲", "😳", "🥺", "🥹", "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬", "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺", "👻", "👽", "👾", "🤖"],
  },
  {
    name: "Gestures",
    icon: "👋",
    emojis: ["👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄"],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❤️‍🔥", "❤️‍🩹", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "🫶", "🤝", "👍", "💯", "🔥", "⭐", "🌟", "✨", "🎉", "🎊", "🏆", "🥇", "👑", "💎", "🚀", "💎"],
  },
  {
    name: "Objects",
    icon: "💡",
    emojis: ["💡", "🔑", "🔒", "🔓", "🔗", "📌", "📎", "📐", "📏", "🧲", "🔧", "🔨", "🛠️", "⚙️", "🧰", "📱", "💻", "🖥️", "🖨️", "⌨️", "🖱️", "🕹️", "💾", "💿", "📷", "📸", "📹", "🎬", "🎙️", "📢", "📣", "🔔", "🔕", "🎵", "🎶", "🎼", "🎤", "🎧", "📻"],
  },
  {
    name: "Nature",
    icon: "🌿",
    emojis: ["🌿", "☘️", "🍀", "🌱", "🌲", "🌳", "🌴", "🌵", "🌾", "🌻", "🌸", "🌺", "🌷", "🌹", "🪷", "🌶️", "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝", "🍔", "🍕", "🌮", "🍜", "🍣", "🍦", "🧁", "🍰", "☕", "🍵", "🧃", "🍺", "🥂"],
  },
];

export function EnhancedEmojiPicker({ onSelect, onClose, theme, customEmojis }: EnhancedEmojiPickerProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState(0);
  const [hoveredEmoji, setHoveredEmoji] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const allEmojis = useMemo(() => {
    const flat: { emoji: string; name: string; category: string }[] = [];
    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((e) => flat.push({ emoji: e, name: cat.name, category: cat.name }));
    });
    // Add custom emojis
    if (customEmojis) {
      customEmojis.forEach((e) =>
        flat.push({ emoji: `:${e.name}:`, name: e.name, category: "Custom" })
      );
    }
    return flat;
  }, [customEmojis]);

  const filteredEmojis = useMemo(() => {
    if (!search) return allEmojis.filter((e) => e.category === EMOJI_CATEGORIES[activeCategory]?.name);
    return allEmojis.filter((e) => e.emoji.includes(search) || e.name.toLowerCase().includes(search.toLowerCase()));
  }, [search, activeCategory, allEmojis]);

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.95, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 8 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`absolute bottom-full right-0 mb-2 w-80 sm:w-96 rounded-2xl ${theme.cardBg} border ${theme.border} backdrop-blur-2xl shadow-2xl overflow-hidden z-50`}
    >
      {/* Search bar */}
      <div className={`p-3 border-b ${theme.border}`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${theme.inputBg} border ${theme.border}`}>
          <Search className={`w-4 h-4 ${theme.textMuted}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emojis..."
            className={`flex-1 bg-transparent text-sm outline-none ${theme.isLight ? "text-slate-800" : "text-white"} placeholder:text-slate-500`}
            autoFocus
          />
          {search && (
            <button onClick={() => setSearch("")} className={`${theme.textMuted} hover:text-white transition-colors cursor-pointer`}>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!search && (
        <div className={`flex gap-0.5 px-2 py-2 border-b ${theme.border} overflow-x-auto scrollbar-none`}>
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === idx
                  ? `${theme.accentBg} text-white shadow-md`
                  : `${theme.textMuted} hover:bg-white/5`
              }`}
            >
              <span>{cat.icon}</span>
              <span className="hidden sm:inline">{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji grid */}
      <div className="h-56 overflow-y-auto p-2 grid grid-cols-8 gap-0.5 auto-rows-min content-start">
        <AnimatePresence mode="popLayout">
          {filteredEmojis.map((item, idx) => (
            <motion.button
              key={item.emoji}
              layout
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ delay: Math.min(idx * 0.01, 0.3) }}
              onClick={() => {
                onSelect(item.emoji);
                onClose();
              }}
              onMouseEnter={() => setHoveredEmoji(item.emoji)}
              onMouseLeave={() => setHoveredEmoji(null)}
              className={`relative p-1.5 rounded-xl text-xl sm:text-2xl hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center ${
                item.emoji.startsWith(":") ? "text-base" : ""
              }`}
              title={item.emoji.startsWith(":") ? item.name : undefined}
            >
              {item.emoji.startsWith(":") ? (
                <img
                  src={customEmojis?.find((e) => `:${e.name}:` === item.emoji)?.url}
                  alt={item.name}
                  className="w-6 h-6 object-contain"
                />
              ) : (
                item.emoji
              )}
              {/* Tooltip on hover */}
              {hoveredEmoji === item.emoji && !item.emoji.startsWith(":") && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md bg-slate-800 text-white text-[10px] font-mono whitespace-nowrap pointer-events-none shadow-lg z-10">
                  {item.emoji}
                </div>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
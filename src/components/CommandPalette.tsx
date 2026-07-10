import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Hash, 
  User as UserIcon, 
  Palette, 
  Zap, 
  MessageSquare, 
  PenTool, 
  CheckCircle2,
  Command as CommandIcon,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User, Channel, ChannelFolder } from "../types";
import { Theme, THEMES } from "../contexts/SettingsContext";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  channels: Channel[];
  folders: ChannelFolder[];
  users: User[];
  onSwitchChannel: (channelId: string) => void;
  onSwitchTheme: (themeKey: string) => void;
  onOpenWhiteboard: () => void;
  onOpenTasks: () => void;
  theme: Theme;
}

export function CommandPalette({ 
  isOpen, 
  onClose, 
  channels, 
  folders,
  users, 
  onSwitchChannel, 
  onSwitchTheme, 
  onOpenWhiteboard, 
  onOpenTasks,
  theme: t 
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    { id: 'whiteboard', name: 'Open Whiteboard', icon: <PenTool className="w-4 h-4" />, section: 'Tools', perform: onOpenWhiteboard },
    { id: 'tasks', name: 'Open Task Board', icon: <CheckCircle2 className="w-4 h-4" />, section: 'Tools', perform: onOpenTasks },
    ...channels.map(c => {
      const folder = folders.find(f => f.channelIds.includes(c.id));
      return { 
        id: `chan-${c.id}`, 
        name: c.name, 
        icon: <Hash className="w-4 h-4" />, 
        section: folder ? `Channels • ${folder.name}` : 'Channels', 
        perform: () => onSwitchChannel(c.id) 
      };
    }),
    ...users.map(u => ({ id: `user-${u.id}`, name: u.username, icon: <UserIcon className="w-4 h-4" />, section: 'Users', perform: () => {} })),
    ...Object.entries(THEMES).map(([key, theme]) => ({ id: `theme-${key}`, name: `Switch to ${theme.name}`, icon: <Palette className="w-4 h-4" />, section: 'Themes', perform: () => onSwitchTheme(key) }))
  ];

  const filteredItems = actions.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase()) || 
    item.section.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 10);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].perform();
          onClose();
        }
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`fixed left-1/2 top-[15%] -translate-x-1/2 w-full max-w-xl z-[101] p-4`}
          >
            <div className={`rounded-2xl border shadow-2xl overflow-hidden ${t.isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}>
              {/* Search Bar */}
              <div className={`flex items-center gap-3 px-4 py-4 border-b ${t.border}`}>
                <Search className={`w-5 h-5 ${t.isLight ? "text-slate-400" : "text-slate-500"}`} />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Type a command or search..."
                  className={`flex-1 bg-transparent border-none outline-none text-base ${t.isLight ? "text-slate-900" : "text-white"} placeholder:text-slate-500`}
                />
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${t.isLight ? "bg-slate-50 border-slate-200 text-slate-400" : "bg-slate-800 border-slate-700 text-slate-500"} text-[10px] font-bold`}>
                  <CommandIcon className="w-2.5 h-2.5" /> K
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[400px] overflow-y-auto py-2">
                {filteredItems.length > 0 ? (
                  <div>
                    {filteredItems.map((item, index) => {
                      const isSelected = index === selectedIndex;
                      const showSection = index === 0 || filteredItems[index - 1].section !== item.section;

                      return (
                        <div key={item.id}>
                          {showSection && (
                            <div className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${t.isLight ? "text-slate-400" : "text-slate-500"}`}>
                              {item.section}
                            </div>
                          )}
                          <button
                            onClick={() => {
                              item.perform();
                              onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                              isSelected 
                                ? `${t.accentBg} text-white` 
                                : `${t.isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-800 text-slate-300"}`
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-1.5 rounded-lg ${isSelected ? "bg-white/20" : t.isLight ? "bg-slate-100" : "bg-slate-800"}`}>
                                {item.icon}
                              </div>
                              <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            {isSelected && (
                              <Zap className="w-3.5 h-3.5 animate-pulse" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center opacity-40">
                    <Search className="w-12 h-12 mb-4" />
                    <p className="text-sm font-medium">No results found for "{query}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`px-4 py-3 border-t flex items-center gap-6 ${t.isLight ? "bg-slate-50 border-slate-100" : "bg-slate-900/50 border-slate-800"}`}>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  <span className="px-1.5 py-0.5 rounded border border-slate-700">Enter</span>
                  <span>to select</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  <span className="px-1.5 py-0.5 rounded border border-slate-700">↑↓</span>
                  <span>to navigate</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                  <span className="px-1.5 py-0.5 rounded border border-slate-700">Esc</span>
                  <span>to close</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

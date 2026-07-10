import React, { createContext, useContext, useState, useEffect } from "react";

export interface Theme {
  id: string;
  name: string;
  bg: string;
  sidebarBg: string;
  headerBg: string;
  cardBg: string;
  border: string;
  accentText: string;
  accentBg: string;
  accentHoverBg: string;
  accentFocusRing: string;
  accentBorder: string;
  accentShadow: string;
  accentToGradient: string;
  accentLightBg: string;
  accentLightBorder: string;
  bubbleMe: string;
  bubbleOther: string;
  textMuted: string;
  inputBg: string;
  emoji: string;
  isLight?: boolean;
}

export const THEMES: Record<string, Theme> = {
  midnight: {
    id: "midnight",
    name: "Midnight",
    bg: "bg-slate-900",
    sidebarBg: "bg-slate-950/40 border-slate-800",
    headerBg: "bg-slate-950/80 border-slate-800",
    cardBg: "bg-slate-950/40 border-slate-800/80",
    border: "border-slate-800",
    accentText: "text-indigo-400",
    accentBg: "bg-indigo-600",
    accentHoverBg: "hover:bg-indigo-500",
    accentFocusRing: "focus:ring-indigo-500/20 focus:border-indigo-500",
    accentBorder: "border-indigo-500/30",
    accentShadow: "shadow-indigo-600/10 hover:shadow-indigo-600/20",
    accentToGradient: "from-indigo-600 to-blue-600",
    accentLightBg: "bg-indigo-600/10",
    accentLightBorder: "border-indigo-500/20",
    bubbleMe: "bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-indigo-600/10",
    bubbleOther: "bg-slate-800/80 text-slate-100 border-slate-700/50",
    textMuted: "text-slate-400",
    inputBg: "bg-slate-900 border-slate-700",
    emoji: "🌙"
  },
  sunset: {
    id: "sunset",
    name: "Sunset Orange",
    bg: "bg-stone-900",
    sidebarBg: "bg-stone-950/40 border-stone-800",
    headerBg: "bg-stone-950/80 border-stone-800",
    cardBg: "bg-stone-950/40 border-stone-800/80",
    border: "border-stone-800",
    accentText: "text-amber-400",
    accentBg: "bg-amber-600",
    accentHoverBg: "hover:bg-amber-500",
    accentFocusRing: "focus:ring-amber-500/20 focus:border-amber-500",
    accentBorder: "border-amber-500/30",
    accentShadow: "shadow-amber-600/10 hover:shadow-amber-600/20",
    accentToGradient: "from-amber-600 to-rose-600",
    accentLightBg: "bg-amber-600/10",
    accentLightBorder: "border-amber-500/20",
    bubbleMe: "bg-gradient-to-br from-amber-600 to-rose-600 text-white shadow-amber-600/10",
    bubbleOther: "bg-stone-800/80 text-stone-100 border-stone-700/50",
    textMuted: "text-stone-400",
    inputBg: "bg-stone-900 border-stone-700",
    emoji: "🌇"
  },
  forest: {
    id: "forest",
    name: "Forest Moss",
    bg: "bg-zinc-900",
    sidebarBg: "bg-zinc-950/40 border-zinc-800",
    headerBg: "bg-zinc-950/80 border-zinc-800",
    cardBg: "bg-zinc-950/40 border-zinc-800/80",
    border: "border-zinc-800",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-600",
    accentHoverBg: "hover:bg-emerald-500",
    accentFocusRing: "focus:ring-emerald-500/20 focus:border-emerald-500",
    accentBorder: "border-emerald-500/30",
    accentShadow: "shadow-emerald-600/10 hover:shadow-emerald-600/20",
    accentToGradient: "from-emerald-600 to-teal-600",
    accentLightBg: "bg-emerald-600/10",
    accentLightBorder: "border-emerald-500/20",
    bubbleMe: "bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-emerald-600/10",
    bubbleOther: "bg-zinc-800/80 text-zinc-100 border-zinc-700/50",
    textMuted: "text-zinc-400",
    inputBg: "bg-zinc-900 border-zinc-700",
    emoji: "🌲"
  },
  daylight: {
    id: "daylight",
    name: "Daylight",
    bg: "bg-slate-50",
    sidebarBg: "bg-white/90 border-slate-200",
    headerBg: "bg-white/95 border-slate-200",
    cardBg: "bg-white/85 border-slate-200/80",
    border: "border-slate-200",
    accentText: "text-indigo-600",
    accentBg: "bg-indigo-600",
    accentHoverBg: "hover:bg-indigo-700",
    accentFocusRing: "focus:ring-indigo-500/20 focus:border-indigo-500",
    accentBorder: "border-indigo-200",
    accentShadow: "shadow-indigo-600/5 hover:shadow-indigo-600/10",
    accentToGradient: "from-indigo-600 to-blue-600",
    accentLightBg: "bg-indigo-50",
    accentLightBorder: "border-indigo-100",
    bubbleMe: "bg-gradient-to-br from-indigo-600 to-blue-600 text-white",
    bubbleOther: "bg-slate-100 text-slate-800 border-slate-200/60",
    textMuted: "text-slate-500",
    inputBg: "bg-white border-slate-300",
    emoji: "☀️",
    isLight: true
  },
  liquidglass: {
    id: "liquidglass",
    name: "Liquid Glass",
    bg: "bg-gradient-to-br from-indigo-200 via-fuchsia-100 to-teal-100",
    sidebarBg: "bg-white/30 backdrop-blur-2xl border-white/40 shadow-2xl",
    headerBg: "bg-white/40 backdrop-blur-2xl border-white/40",
    cardBg: "bg-white/30 backdrop-blur-xl border-white/40 shadow-lg",
    border: "border-white/40",
    accentText: "text-indigo-600",
    accentBg: "bg-indigo-500/80 backdrop-blur-md",
    accentHoverBg: "hover:bg-indigo-600/80",
    accentFocusRing: "focus:ring-indigo-500/30 focus:border-indigo-400",
    accentBorder: "border-white/50",
    accentShadow: "shadow-lg shadow-indigo-500/20",
    accentToGradient: "from-indigo-500/80 to-purple-500/80",
    accentLightBg: "bg-white/40 backdrop-blur-sm",
    accentLightBorder: "border-white/50",
    bubbleMe: "bg-indigo-500/80 backdrop-blur-md text-white border border-white/20 shadow-md shadow-indigo-500/10",
    bubbleOther: "bg-white/40 backdrop-blur-md text-slate-800 border border-white/40 shadow-sm",
    textMuted: "text-slate-600",
    inputBg: "bg-white/40 backdrop-blur-xl border-white/50 shadow-inner",
    emoji: "💧",
    isLight: true
  }
};

interface SettingsContextType {
  themeId: string;
  setThemeId: (id: string) => void;
  systemIsDark: boolean;
  themes: Record<string, Theme>;
  addTheme: (theme: Theme) => void;
  t: Theme;
  customBg: string | null;
  setCustomBg: (bg: string | null) => void;
  bgOpacity: number;
  handleBgOpacityChange: (val: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem("chat_theme_id") || "system";
  });
  
  const [themes, setThemes] = useState<Record<string, Theme>>(THEMES);

  const [systemIsDark, setSystemIsDark] = useState(true);

  // System theme preference watcher
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemIsDark(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  const [customBg, setCustomBg] = useState<string | null>(() => {
    return localStorage.getItem("chat_custom_bg") || null;
  });

  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const saved = localStorage.getItem("chat_bg_opacity");
    return saved !== null ? Number(saved) : 0.4;
  });

  const [soundEnabled, setSoundEnabledState] = useState(() => {
    return localStorage.getItem("chat_sound_enabled") !== "false";
  });

  const handleBgOpacityChange = (val: number) => {
    setBgOpacity(val);
    localStorage.setItem("chat_bg_opacity", String(val));
  };

  const setSoundEnabled = (val: boolean) => {
    setSoundEnabledState(val);
    localStorage.setItem("chat_sound_enabled", String(val));
  };

  useEffect(() => {
    if (customBg !== null) {
      localStorage.setItem("chat_custom_bg", customBg);
    } else {
      localStorage.removeItem("chat_custom_bg");
    }
  }, [customBg]);

  const resolvedThemeId = themeId === "system" ? (systemIsDark ? "midnight" : "daylight") : themeId;
  const t = themes[resolvedThemeId] || themes.midnight;

  const addTheme = (theme: Theme) => {
    setThemes(prev => ({ ...prev, [theme.id]: theme }));
  };

  return (
    <SettingsContext.Provider value={{ 
      themeId, setThemeId, systemIsDark, themes, addTheme, t,
      customBg, setCustomBg, bgOpacity, handleBgOpacityChange,
      soundEnabled, setSoundEnabled
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

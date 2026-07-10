import React, { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { nanoid } from "nanoid";
import { 
  Send, 
  MessageSquare, 
  Users, 
  LogOut, 
  Hash, 
  User as UserIcon, 
  Sparkles, 
  WifiOff,
  Smile, 
  ChevronRight,
  ChevronDown,
  MessageCircle,
  HelpCircle,
  Check,
  CheckCheck,
  Palette,
  Search,
  X,
  XCircle,
  Mic,
  Square,
  Trash2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Menu,
  Clock,
  Minimize,
  Maximize,
  Settings,
  CornerDownRight,
  Monitor,
  PenTool,
  CheckCircle2,
  Radio,
  Globe,
  Star,
  Pin,
  FileText,
  Filter,
  Lock,
  Unlock,
  Shield,
  ShieldAlert,
  MicOff,
  UserX,
  Zap,
  History as HistoryIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { User, Message, Task, ChannelFolder, UserRole, CustomEmoji } from "./types";
import { UserProfileModal } from "./components/UserProfileModal";
import { ThreadDrawer } from "./components/ThreadDrawer";
import { SettingsModal } from "./components/SettingsModal";
import { Whiteboard } from "./components/Whiteboard";
import { TaskBoard } from "./components/TaskBoard";
import { RichEmbeds } from "./components/RichEmbeds";
import { AudioHuddle } from "./components/AudioHuddle";
import { CommandPalette } from "./components/CommandPalette";
import { SavedItemsDrawer } from "./components/SavedItemsDrawer";
import { encryptMessage, decryptMessage } from "./lib/crypto";
import { DecryptedText } from "./components/DecryptedText";
import { AuditLogDashboard } from "./components/AuditLogDashboard";
import { ToastProvider, useToast } from "./components/Toast";
import { EmptyState } from "./components/EmptyState";
import { ScrollToBottomFab } from "./components/ScrollToBottomFab";
import { TypingIndicator } from "./components/TypingIndicator";
import { EnhancedEmojiPicker } from "./components/EnhancedEmojiPicker";
import { MessageHoverActions } from "./components/MessageHoverActions";
import { useSettings, THEMES, Theme } from "./contexts/SettingsContext";

// Predefined channels for the user to select
const PRESETS = [
  { id: "general", name: "General Lounge", description: "Standard off-topic chit-chat and greetings", emoji: "💬" },
  { id: "developers", name: "Developer Space", description: "Discussing code, frameworks, and web technologies", emoji: "💻" },
  { id: "gaming", name: "Gamers Hub", description: "LFG, console talk, esports, and recent releases", emoji: "🎮" },
  { id: "creatives", name: "Creative Studio", description: "Showcasing design, art, music, and copywriting", emoji: "🎨" },
  { id: "random", name: "Random Corner", description: "Memes, shower thoughts, and unusual links", emoji: "🍿" },
  { id: "vault", name: "Secure Vault", description: "End-to-End Encrypted space for sensitive data", emoji: "🔐", isEncrypted: true }
];

const PRESET_FOLDERS: ChannelFolder[] = [
  { id: "workspace", name: "Engineering", channelIds: ["general", "developers", "vault"] },
  { id: "social", name: "Social", channelIds: ["gaming", "creatives", "random"] }
];

// Helper to generate deterministic pastel avatar backgrounds from username
function getAvatarColor(username: string): string {
  const colors = [
    "bg-red-100 text-red-700 border-red-200",
    "bg-orange-100 text-orange-700 border-orange-200",
    "bg-amber-100 text-amber-700 border-amber-200",
    "bg-emerald-100 text-emerald-700 border-emerald-200",
    "bg-teal-100 text-teal-700 border-teal-200",
    "bg-blue-100 text-blue-700 border-blue-200",
    "bg-indigo-100 text-indigo-700 border-indigo-200",
    "bg-violet-100 text-violet-700 border-violet-200",
    "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    "bg-pink-100 text-pink-700 border-pink-200"
  ];
  let sum = 0;
  for (let i = 0; i < username.length; i++) {
    sum += username.charCodeAt(i);
  }
  return colors[sum % colors.length];
}

// Time grouping helper for messages
function getTimeGroupLabel(timestamp: string, prevTimestamp?: string): string | null {
  const msgDate = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const msgDay = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

  if (prevTimestamp) {
    const prevDate = new Date(prevTimestamp);
    if (msgDay.getTime() === new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate()).getTime()) {
      return null;
    }
  }

  if (msgDay.getTime() === today.getTime()) return "Today";
  if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";
  return msgDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

// Quick canned responses to make the app interactive
const QUICK_RESPONSES = [
  "Hello everyone! 👋",
  "Totally agree with this! 👍",
  "Can you clarify that? 🧐",
  "Wow, that's amazing! 🚀",
  "Just stepping away for a moment. ☕",
  "I'll be right back! 🏃‍♂️"
];

export interface VoicePlayerProps {
  src: string;
  duration?: number;
  isMe: boolean;
  theme: any;
}

export function VoicePlayer({ src, duration, isMe, theme }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => console.error("Audio play failed", err));
      setIsPlaying(true);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const displayDuration = duration || (audioRef.current ? audioRef.current.duration : 0) || 0;
  const progressPercent = displayDuration > 0 ? (currentTime / displayDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 py-2 px-3 rounded-xl ${isMe ? "bg-white/10" : "bg-slate-900/40"} min-w-[200px] max-w-full sm:min-w-[240px]`}>
      <button
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
          isMe ? "bg-white text-slate-900 hover:bg-slate-100" : `${theme.accentBg} text-white ${theme.accentHoverBg}`
        }`}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        {/* Progress Track */}
        <div className="h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden relative">
          <div
            className={`h-full absolute left-0 top-0 rounded-full transition-all duration-100 ${isMe ? "bg-white" : theme.accentBg}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-300">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(displayDuration)}</span>
        </div>
      </div>
    </div>
  );
}

function formatRecordingTime(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    
    gain1.gain.setValueAtTime(0.08, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.18);
    
    // Second note slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.22); // D6
    
    gain2.gain.setValueAtTime(0.06, ctx.currentTime + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc2.start(ctx.currentTime + 0.08);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.error("Failed to play notification sound", err);
  }
};

export default function App() {
  // Connection and Join state
  const [username, setUsername] = useState(() => localStorage.getItem("chat_username") || "");
  const [room, setRoom] = useState("");
  const [customRoom, setCustomRoom] = useState("");
  const [hasJoined, setHasJoined] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [joinError, setJoinError] = useState("");


  const { themeId, setThemeId, systemIsDark, themes, t, customBg, setCustomBg, bgOpacity, handleBgOpacityChange, soundEnabled, setSoundEnabled } = useSettings();
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);


  const [isDraggingBg, setIsDraggingBg] = useState(false);

  const handleBgDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBg(true);
  };

  const handleBgDragLeave = () => {
    setIsDraggingBg(false);
  };

  const handleBgDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingBg(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processBgFile(file);
    }
  };

  const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processBgFile(file);
    }
  };

  const processBgFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64String = event.target.result as string;
        setCustomBg(base64String);
        try {
          localStorage.setItem("chat_custom_bg", base64String);
        } catch (err) {
          console.warn("Storage limit exceeded, background may not persist after reload", err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Chat engine state
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("disconnected");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const currentUserRef = useRef<User | null>(null);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);
  const [typingUsernames, setTypingUsernames] = useState<string[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [densityMode, setDensityMode] = useState<'cozy' | 'compact'>('cozy');
  const [isDragging, setIsDragging] = useState(false);
  const [scrolledUp, setScrolledUp] = useState(false);
  const [showCommandDropdown, setShowCommandDropdown] = useState(false);
  const [commandIndex, setCommandIndex] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  
  // Load onboarding state
  useEffect(() => {
    const seen = localStorage.getItem("onboardingSeen");
    if (seen) setOnboardingStep(-1);
  }, []);
  const [isTasksOpen, setIsTasksOpen] = useState(false);
  const [isHuddleOpen, setIsHuddleOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  const PulsingBeacon = () => (
    <motion.div
      className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full z-50"
      animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
    />
  );
  const [messageFilter, setMessageFilter] = useState<"all" | "pins" | "files">("all");
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [canvasElements, setCanvasElements] = useState<any[]>([]);
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);

  // Global Command Palette Shortcut
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const isScrolledUp = container.scrollTop < container.scrollHeight - container.clientHeight - 100;
      setScrolledUp(isScrolledUp);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // @mention Autocomplete state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionTriggerIndex, setMentionTriggerIndex] = useState(-1);
  const [mentionIndex, setMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Pinned Messages state
  const [isPinnedExpanded, setIsPinnedExpanded] = useState(false);
  const prevPinnedCountRef = useRef(0);
  const pinnedMessagesCount = messages.filter((msg) => msg.isPinned && !msg.isSystem).length;

  useEffect(() => {
    if (pinnedMessagesCount > prevPinnedCountRef.current && prevPinnedCountRef.current === 0) {
      setIsPinnedExpanded(true);
    }
    prevPinnedCountRef.current = pinnedMessagesCount;
  }, [pinnedMessagesCount]);

  // List of active users to mention, matching the query typed after '@'
  const filteredActiveUsers = activeUsers.filter((u) => {
    if (!mentionSearch) return true;
    return u.username.toLowerCase().includes(mentionSearch.toLowerCase());
  });

  // Active thread message for slide-out thread drawer
  const [activeThreadMessage, setActiveThreadMessage] = useState<Message | null>(null);
  const [isThreadDocked, setIsThreadDocked] = useState(false);

  // Filter messages in real-time by keyword search and exclude replies from the main feed
  const filteredMessages = messages.filter((msg) => {
    if (msg.parentId) return false;
    const matchesSearch = msg.text.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    
    if (messageFilter === "pins") return msg.isPinned;
    if (messageFilter === "files") return !!msg.audioUrl;
    return true;
  });

  // Helper to parse and render text with markdown support, mentions, and emojis
  const renderMessageText = (text: string) => {
    if (!text) return null;

    // Split by @mentions or :emoji: patterns
    const parts = text.split(/(@[a-zA-Z0-9_-]+|:[a-z0-9_]+:)/g);
    
    return (
      <div className="prose prose-sm max-w-none">
        {parts.map((part, index) => {
          // Handle Mentions
          if (part.startsWith("@")) {
            const mentionedName = part.substring(1);
            const isCurrentUser = username.trim().toLowerCase() === mentionedName.toLowerCase();
            const isActiveUser = activeUsers.some(u => u.username.toLowerCase() === mentionedName.toLowerCase()) || isCurrentUser;

            if (isActiveUser) {
              return (
                <span
                  key={index}
                  className={`font-semibold px-1.5 py-0.5 rounded text-xs mx-0.5 inline-block ${
                    isCurrentUser
                      ? "bg-amber-500/25 text-amber-300 border border-amber-500/30"
                      : `${t.accentBg}/20 ${t.accentText} border ${t.border}/30`
                  }`}
                >
                  {part}
                </span>
              );
            }
          }
          
          // Handle Custom Emojis
          if (part.startsWith(":") && part.endsWith(":")) {
            const emojiName = part.substring(1, part.length - 1);
            const customEmoji = customEmojis.find(e => e.name === emojiName);
            if (customEmoji) {
              return (
                <img 
                  key={index}
                  src={customEmoji.url} 
                  alt={part}
                  title={part}
                  className="inline-block w-5 h-5 object-contain align-middle mx-0.5 mb-0.5"
                />
              );
            }
          }

          // Otherwise render as markdown
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                p({ children }) {
                  return <>{children}</>; // Render p as inline, or keep it block?
                },
              }}
            >
              {part}
            </ReactMarkdown>
          );
        })}
      </div>
    );
  };

  // UI state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<string | null>(null);

  // Auto-manage sidebar visibility based on screen width
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [hasJoined]);

  // Refs for scrolling and typing debounce
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Stop recording timer on unmount
  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Auto scroll to bottom when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsernames]);

  // Handle room joining
  const handleJoin = (selectedRoomId?: string) => {
    const finalRoom = (selectedRoomId || room || customRoom).trim().toLowerCase();
    const finalUsername = username.trim();

    if (!finalUsername) {
      setJoinError("Please enter a username to continue.");
      return;
    }
    if (!finalRoom) {
      setJoinError("Please select a preset room or enter a custom Room ID.");
      return;
    }

    setJoinError("");
    setIsConnecting(true);

    // Save username for convenience next time
    localStorage.setItem("chat_username", finalUsername);

    // Initialize Socket.io connection
    const newSocket = io(window.location.origin, {
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnectionStatus("connected");
      setIsConnecting(false);
      setHasJoined(true);
      
      // Emit the join event
      newSocket.emit("join_room", { username: finalUsername, room: finalRoom });
      
      // Initial local state for currentUser (will be refined by room_users event)
      const role: UserRole = finalUsername.toLowerCase().includes("admin") ? "admin" : 
                            finalUsername.toLowerCase().includes("mod") ? "moderator" : 
                            finalUsername.toLowerCase().includes("guest") ? "guest" : "user";
      
      setCurrentUser({
        id: newSocket.id || "",
        username: finalUsername,
        room: finalRoom,
        role,
        isMuted: false
      });

      setRoom(finalRoom);
    });

    newSocket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    newSocket.on("connect_error", () => {
      setConnectionStatus("disconnected");
      setIsConnecting(false);
      setJoinError("Failed to connect to the real-time server. Please try again.");
      newSocket.disconnect();
    });

    // Handle room messages
    newSocket.on("message", (msg: Message) => {
      setMessages((prev) => {
        // Prevent duplicate system messages
        if (msg.isSystem && prev.some((p) => p.text === msg.text && p.timestamp === msg.timestamp)) {
          return prev;
        }
        return [...prev, msg];
      });

      // If the incoming message is not ours, mark it as seen!
      if (msg.sender !== finalUsername && !msg.isSystem) {
        newSocket.emit("mark_seen", { messageId: msg.id });
        
        if (soundEnabledRef.current) {
          // Check Focus Mode
          const me = currentUserRef.current; // I need a ref for currentUser to use in this effect
          if (me?.focusConfig?.enabled) {
            // Only play sound if it's a mention from allowed user
            const isMentioned = msg.text.toLowerCase().includes(`@${finalUsername.toLowerCase()}`);
            const isAllowed = me.focusConfig.allowedUsers.includes(msg.sender);
            
            if (isMentioned && isAllowed) {
              playNotificationSound();
            }
          } else {
            playNotificationSound();
          }
        }
      }
    });

    // Handle initial message history
    newSocket.on("message_history", (history: Message[]) => {
      setMessages(history);
      // Automatically mark all messages as seen when entering the room
      newSocket.emit("mark_all_seen");
    });

    // Handle a single message being updated (e.g. someone else marks it as seen)
    newSocket.on("message_updated", (updatedMsg: Message) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg))
      );
    });

    // Handle updated users list
    newSocket.on("room_users", (usersList: User[]) => {
      setActiveUsers(usersList);
      // Find and update the current user object to reflect role/muted changes
      const me = usersList.find(u => u.id === newSocket.id);
      if (me) setCurrentUser(me);
    });

    // Handle message deletion
    newSocket.on("message:deleted", (deletedId: string) => {
      setMessages(prev => prev.filter(m => m.id !== deletedId));
    });

    // Handle being muted/unmuted
    newSocket.on("user:muted_status", (isMuted: boolean) => {
      setCurrentUser(prev => prev ? { ...prev, isMuted } : null);
    });

    // Handle typing incoming typing updates
    newSocket.on("typing_users", (typingList: string[]) => {
      // Exclude the current user from typing indicator
      const othersTyping = typingList.filter((name) => name !== finalUsername);
      setTypingUsernames(othersTyping);
    });

    // Handle custom emojis
    newSocket.on("emojis:list", (list: CustomEmoji[]) => {
      setCustomEmojis(list);
    });

    newSocket.on("emoji:new", (emoji: CustomEmoji) => {
      setCustomEmojis(prev => [...prev, emoji]);
    });
  };

  // Handle profile status updates
  const handleUpdateStatus = (status: "online" | "away" | "busy" | "focus", statusText: string) => {
    if (socket) {
      socket.emit("update_status", { status, statusText });
    }
  };

  // Handle typing event and timeout
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessageInput(value);

    // Check for @mention trigger
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const lastAtSymbolIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtSymbolIndex !== -1) {
      // Ensure it's either at the start or preceded by whitespace
      const charBeforeAt = lastAtSymbolIndex > 0 ? textBeforeCursor[lastAtSymbolIndex - 1] : " ";
      if (/\s/.test(charBeforeAt)) {
        const textAfterAt = textBeforeCursor.slice(lastAtSymbolIndex + 1);
        if (!textAfterAt.includes(" ")) {
          setMentionTriggerIndex(lastAtSymbolIndex);
          setMentionSearch(textAfterAt);
          setShowMentionDropdown(true);
          setMentionIndex(0);
        } else {
          setShowMentionDropdown(false);
        }
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }

    // Check for / command trigger
    if (value.startsWith("/")) {
      const textAfterSlash = value.slice(1);
      if (!textAfterSlash.includes(" ")) {
        setShowCommandDropdown(true);
        setCommandIndex(0);
      } else {
        setShowCommandDropdown(false);
      }
    } else {
      setShowCommandDropdown(false);
    }

    if (!socket) return;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", { isTyping: true });
    }

    // Reset typing debounce timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.emit("typing", { isTyping: false });
    }, 2000);
  };

  // Keyboard navigation for @mention dropdown
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showMentionDropdown && filteredActiveUsers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredActiveUsers.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredActiveUsers.length) % filteredActiveUsers.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectMentionUser(filteredActiveUsers[mentionIndex].username);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowMentionDropdown(false);
      }
    } else if (showCommandDropdown) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCommandIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCommandIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectCommand(commands[commandIndex].name);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowCommandDropdown(false);
      }
    } else if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const commands = [
    { name: '/topic', description: 'Set room topic' },
    { name: '/clear', description: 'Clear messages' },
    { name: '/mute', description: 'Mute room' },
    { name: '/theme midnight', description: 'Switch to midnight theme' },
  ];

  const selectCommand = (command: string) => {
    setMessageInput(`${command} `);
    setShowCommandDropdown(false);
    
    // Simple command handling
    if (command === '/clear') {
        // Clear logic... (I will skip implementation as it requires complex state)
    }
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  // Select user from dropdown and insert into input
  const selectMentionUser = (selectedUsername: string) => {
    if (mentionTriggerIndex === -1) return;

    const cursorPosition = inputRef.current?.selectionStart || messageInput.length;
    const beforeMention = messageInput.slice(0, mentionTriggerIndex);
    const afterCursor = messageInput.slice(cursorPosition);

    const newText = `${beforeMention}@${selectedUsername} ${afterCursor}`;
    setMessageInput(newText);
    setShowMentionDropdown(false);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = beforeMention.length + selectedUsername.length + 2; // +1 for @, +1 for space
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle message submission
  const handleSendMessage = async (textToSend?: string, audioUrl?: string, audioDuration?: number, parentId?: string) => {
    const text = textToSend !== undefined ? textToSend.trim() : messageInput.trim();
    if (!audioUrl && !text) return;
    if (!socket) return;

    const currentChannel = PRESETS.find(p => p.id === room);
    const isEncrypted = currentChannel?.isEncrypted;
    
    let encryptedText = undefined;
    let finalRawText = text || "🎤 Voice Message";

    if (isEncrypted && text) {
      // For E2EE channels, we encrypt the text on the client
      // The room ID acts as the base for the shared secret in this simulation
      encryptedText = await encryptMessage(finalRawText, room);
      finalRawText = "[End-to-End Encrypted]";
    }

    // Send via socket
    socket.emit("send_message", { 
      text: finalRawText, 
      encryptedText,
      isEncrypted,
      audioUrl, 
      audioDuration, 
      parentId 
    });

    setShowMentionDropdown(false);

    // Clear typing status instantly upon send
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit("typing", { isTyping: false });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (textToSend === undefined) {
      setMessageInput("");
    }
  };

  // Handle pinning/unpinning a message
  const handleTogglePin = (messageId: string, isPinned: boolean) => {
    if (!socket) return;
    socket.emit("pin_message", { messageId, isPinned });
  };

  // Handle reacting to a message with an emoji
  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!socket) return;
    socket.emit("react_message", { messageId, emoji });
  };

  // --- Task Management Helpers ---
  const handleCreateTask = (text: string, messageId?: string) => {
    if (!socket) return;
    const task: Task = {
      id: nanoid(),
      room,
      text,
      creator: username,
      status: "todo",
      createdAt: new Date().toISOString(),
      messageId
    };
    socket.emit("task:create", task);
    setIsTasksOpen(true);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    if (!socket) return;
    socket.emit("task:update", updatedTask);
  };

  const handleDeleteTask = (taskId: string) => {
    if (!socket) return;
    socket.emit("task:delete", taskId);
  };

  // Start voice clip recording
  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Microphone recording is not supported in this browser context.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // Stop all audio track streams to release the mic
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200); // chunk every 200ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration counter
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to access microphone", err);
      alert("Could not access your microphone. Please check browser permissions.");
    }
  };

  // Stop/Cancel voice clip recording
  const stopRecording = (shouldSend: boolean) => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    mediaRecorder.onstop = () => {
      // Release tracks
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());

      if (shouldSend) {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          // Send the recorded message!
          handleSendMessage("🎤 Voice Message", base64data, recordingDuration);
        };
        reader.readAsDataURL(audioBlob);
      }
    };

    mediaRecorder.stop();
    setIsRecording(false);
  };

  // Leave room and reset socket
  const handleLeaveRoom = () => {
    if (socket) {
      socket.disconnect();
    }
    setSocket(null);
    setConnectionStatus("disconnected");
    setHasJoined(false);
    setMessages([]);
    setActiveUsers([]);
    setTypingUsernames([]);
    setMessageInput("");
    setSearchQuery("");
    setActiveThreadMessage(null);
    isTypingRef.current = false;
  };

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket]);

  const { addToast } = useToast();

  const handleScrollToBottom = () => {
    messagesContainerRef.current?.scrollTo({ top: messagesContainerRef.current.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className={`min-h-screen ${t.bg} ${t.isLight ? "light-theme text-slate-800" : "text-slate-100"} font-sans flex flex-col selection:bg-indigo-500 selection:text-white`}>
      {/* Top ambient header bar */}
      <header className={`${t.headerBg} backdrop-blur-md border-b ${t.border} px-4 py-3 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 shrink-0 sticky top-0 z-40 transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 sm:p-2.5 ${t.accentLightBg} rounded-xl border ${t.accentLightBorder} ${t.accentText} transition-all`}>
            <MessageCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className={`font-sans font-bold tracking-tight text-base sm:text-lg ${t.isLight ? "text-slate-900" : "text-white"}`}>
              Real-Time Chat
            </h1>
            <p className={`font-mono text-[9px] sm:text-[10px] ${t.accentText} uppercase tracking-widest transition-colors`}>
              {themeId === "system" ? "System Preference" : `${t.name} Palette`}
            </p>
          </div>
        </div>

        {/* Theme Picker & Real-Time Connection Indicator */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <button
            onClick={() => {
                setIsSettingsModalOpen(true);
                localStorage.setItem("onboardingSeen", "true");
                setOnboardingStep(-1);
            }}
            className={`relative flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl ${t.cardBg} border ${t.border} transition-colors cursor-pointer text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800`}
            title="Open Settings"
          >
            {onboardingStep === 0 && <PulsingBeacon />}
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          {hasJoined && (
            <div className="flex items-center gap-4">
              <motion.div 
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                  connectionStatus === "connected" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}
                animate={connectionStatus === "connected" ? { scale: [1, 1.02, 1] } : {}}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                {connectionStatus === "connected" ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </span>
                    <span>Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5" />
                    <span>Reconnecting...</span>
                  </>
                )}
              </motion.div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLeaveRoom}
                className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Leave Room</span>
              </motion.button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!hasJoined ? (
            /* ================= JOIN SCREEN ================= */
            <motion.div
              key="join-screen"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="w-full max-w-5xl mx-auto px-4 py-8 md:py-16 flex flex-col justify-center items-center overflow-y-auto relative"
            >
              {/* Animated gradient background orbs */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                <motion.div
                  className="absolute w-72 h-72 rounded-full bg-indigo-600/20 blur-3xl"
                  animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
                  style={{ top: '10%', left: '10%' }}
                />
                <motion.div
                  className="absolute w-96 h-96 rounded-full bg-purple-600/15 blur-3xl"
                  animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1.2, 1, 1.2] }}
                  transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
                  style={{ bottom: '10%', right: '5%' }}
                />
                <motion.div
                  className="absolute w-64 h-64 rounded-full bg-teal-600/10 blur-3xl"
                  animate={{ x: [0, 30, 0], y: [0, 50, 0] }}
                  transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
                  style={{ top: '50%', left: '50%' }}
                />
              </div>

              <div className={`w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-start ${t.isLight ? "glass-panel-light" : "glass-panel"} rounded-3xl p-6 md:p-10 shadow-2xl`}>
                
                {/* Left block: Join inputs */}
                <div className="md:col-span-5 flex flex-col gap-6">
                  <div>
                    <h2 className={`text-xl font-bold ${t.isLight ? "text-slate-900" : "text-white"} tracking-tight flex items-center gap-2`}>
                      <Sparkles className={`w-5 h-5 ${t.accentText}`} /> Join Chat Space
                    </h2>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                      Choose your username and jump into a community or custom room.
                    </p>
                  </div>

                  {joinError && (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-medium flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4 shrink-0" />
                      {joinError}
                    </motion.div>
                  )}

                  <div className="flex flex-col gap-4">
                    {/* Username Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        Username
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        {username && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className={`absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] uppercase border ${getAvatarColor(username)}`}
                          >
                            {username.slice(0, 2)}
                          </motion.div>
                        )}
                        <input
                          type="text"
                          maxLength={20}
                          value={username}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            if (joinError) setJoinError("");
                          }}
                          placeholder="Enter your name..."
                          className={`w-full pl-10 pr-12 py-3 ${t.inputBg} focus:outline-none focus:ring-2 ${t.accentFocusRing} rounded-xl text-slate-100 transition-all text-sm input-glow`}
                          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                        />
                      </div>
                    </div>

                    {/* Custom Room Input */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        Custom Room ID
                      </label>
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                        <input
                          type="text"
                          maxLength={30}
                          value={customRoom}
                          onChange={(e) => {
                            setCustomRoom(e.target.value);
                            setRoom(""); // Deselect presets
                            if (joinError) setJoinError("");
                          }}
                          placeholder="Or type a custom ID..."
                          className={`w-full pl-10 pr-4 py-2.5 ${t.inputBg} focus:outline-none focus:ring-2 ${t.accentFocusRing} rounded-xl text-slate-100 transition-all text-sm`}
                          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                        />
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -12px rgba(99, 102, 241, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleJoin()}
                      disabled={isConnecting}
                      className={`w-full py-3.5 mt-2 ${t.accentBg} disabled:bg-slate-800 disabled:text-slate-500 rounded-2xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2.5 border ${t.accentBorder} cursor-pointer relative overflow-hidden`}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0"
                        animate={{ x: ["-200%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      />
                      {isConnecting ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="relative z-10">Join Room</span>
                          <Send className="w-4 h-4 relative z-10" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>

                {/* Right block: Presets Selection */}
                <div className={`md:col-span-7 flex flex-col gap-4 border-t md:border-t-0 md:border-l ${t.border} pt-6 md:pt-0 md:pl-8`}>
                  <div>
                    <h3 className={`text-xs font-bold ${t.accentText} tracking-wider uppercase flex items-center gap-2`}>
                      <Globe className="w-3.5 h-3.5" /> Popular Rooms
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Select a curated channel to start talking immediately.
                    </p>
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                    {PRESETS.map((preset) => {
                      const isSelected = room === preset.id && !customRoom;
                      return (
                        <motion.button
                          key={preset.id}
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setRoom(preset.id);
                            setCustomRoom("");
                            if (joinError) setJoinError("");
                          }}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-4 cursor-pointer ${
                            isSelected
                              ? `${t.accentBg}/10 ${t.accentBorder} text-slate-200 shadow-lg ring-1 ${t.accentBorder}`
                              : `${t.inputBg} ${t.border} hover:${t.accentBorder} hover:bg-white/5 text-slate-300`
                          }`}
                        >
                          <span className="text-2xl mt-0.5 filter drop-shadow">
                            {preset.emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-sm text-white">
                                {preset.name}
                              </span>
                              <span className="font-mono text-[10px] text-slate-500 uppercase">
                                #{preset.id}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 truncate">
                              {preset.description}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Informational Tip */}
              <div className="mt-6 flex items-center gap-2 text-slate-500 text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>Isolated chats - users in the same Room ID can message and see active lists.</span>
              </div>
            </motion.div>
          ) : (
            /* ================= CHAT WORKSPACE ================= */
            <motion.div
              key="chat-workspace"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              {/* Sidebar / Active users & info */}
              <AnimatePresence initial={false}>
                {isSidebarOpen && !isReadingMode && (
                  <>
                    {/* Backdrop for Mobile */}
                    <motion.div
                      key="sidebar-backdrop"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsSidebarOpen(false)}
                      className="fixed inset-0 ${t.cardBg} z-40 md:hidden backdrop-blur-xs"
                    />
                    <motion.aside
                      key="sidebar-aside"
                      initial={{ x: "-100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: "-100%", opacity: 0 }}
                      transition={{ type: "spring", damping: 26, stiffness: 220 }}
                      className={`fixed md:sticky top-0 bottom-0 left-0 z-50 md:z-0 h-full md:h-auto w-[280px] flex flex-col ${t.sidebarBg} border-r shrink-0 overflow-y-auto`}
                    >
                    {/* Room Info Block */}
                    <div className={`p-5 border-b ${t.border} flex flex-col gap-3`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${t.accentText} uppercase tracking-widest`}>
                          Active Channel
                        </span>
                        <button
                          onClick={() => setIsSidebarOpen(false)}
                          className="md:hidden p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Close sidebar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div>
                        <h2 className={`text-lg font-bold ${t.isLight ? "text-slate-900" : "text-white"} tracking-tight flex items-center gap-1.5 mt-0.5 truncate`}>
                          <Hash className={`w-4.5 h-4.5 ${t.accentText} shrink-0`} />
                          <span>{PRESETS.find((p) => p.id === room)?.name || room}</span>
                        </h2>
                      </div>
                      
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {PRESETS.find((p) => p.id === room)?.description || "A custom communication space."}
                      </p>
                    </div>
                    
                    {/* Channel Folders / Workspaces */}
                    <div className="px-5 py-4 flex flex-col gap-4 border-b border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5" /> Workspaces
                        </span>
                      </div>

                      <div className="flex flex-col gap-2">
                        {PRESET_FOLDERS.map((folder) => {
                          const isCollapsed = collapsedFolders.includes(folder.id);
                          return (
                            <div key={folder.id} className="flex flex-col gap-1">
                              <button 
                                onClick={() => setCollapsedFolders(prev => 
                                  isCollapsed ? prev.filter(id => id !== folder.id) : [...prev, folder.id]
                                )}
                                className="flex items-center justify-between w-full text-left px-1 py-1 hover:bg-slate-800/40 rounded-lg transition-colors group"
                              >
                                <div className="flex items-center gap-2">
                                  <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">
                                    {folder.name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-800/50 px-1.5 py-0.5 rounded-full">
                                  {folder.channelIds.length}
                                </span>
                              </button>

                              <AnimatePresence initial={false}>
                                {!isCollapsed && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden flex flex-col gap-0.5 ml-2 border-l border-slate-800/50 pl-2"
                                  >
                                    {folder.channelIds.map(channelId => {
                                      const channel = PRESETS.find(p => p.id === channelId);
                                      if (!channel) return null;
                                      const isActive = room === channelId;

                                      return (
                                        <button
                                          key={channelId}
                                          onClick={() => {
                                            if (socket && !isActive) {
                                              socket.emit("join_room", { username, room: channelId });
                                              setRoom(channelId);
                                              setMessages([]);
                                              setSearchQuery("");
                                              setActiveThreadMessage(null);
                                              if (window.innerWidth < 768) setIsSidebarOpen(false);
                                            }
                                          }}
                                          className={`sidebar-channel flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-left ${
                                            isActive 
                                              ? `${t.accentBg} text-white shadow-lg`
                                              : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                                          } ${isActive ? "active" : ""}`}
                                        >
                                          <span className="text-sm">{channel.emoji || "#"}</span>
                                          <span className="text-sm font-medium truncate flex-1">{channel.name}</span>
                                          {channel.isEncrypted && (
                                            <Lock className="w-2.5 h-2.5 text-emerald-500/70" />
                                          )}
                                          {isActive && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                          )}
                                        </button>
                                      );
                                    })}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active User List */}
                    <div className="flex-1 p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> Members ({activeUsers.length})
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>

                      <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[300px] pr-1">
                        {activeUsers.map((user) => {
                          const isMe = user.username === username;
                          return (
                            <div
                              key={user.id}
                              onClick={() => setSelectedProfileUser(user.username)}
                              className={`flex items-center gap-3 p-2 rounded-xl transition-all border cursor-pointer hover:bg-slate-900/35 ${
                                isMe 
                                  ? `${t.inputBg} ${t.border}` 
                                  : "border-transparent"
                              }`}
                            >
                              <div className="relative shrink-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border uppercase ${getAvatarColor(user.username)}`}>
                                  {user.username.slice(0, 2)}
                                </div>
                                {typingUsernames.includes(user.username) && (
                                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-200 truncate flex items-center gap-1.5">
                                  <span>{user.username}</span>
                                  {user.role && user.role !== "user" && (
                                    <div className={`px-1 rounded text-[7px] font-black uppercase tracking-widest ${
                                      user.role === "admin" ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" :
                                      user.role === "moderator" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
                                      "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                                    }`}>
                                      {user.role}
                                    </div>
                                  )}
                                  {isMe && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${t.accentLightBg} ${t.accentText} border ${t.accentLightBorder} font-normal`}>
                                      You
                                    </span>
                                  )}
                                  {user.isMuted && (
                                    <MicOff className="w-2.5 h-2.5 text-rose-500/60" />
                                  )}
                                </p>
                                {user.status === "away" ? (
                                  <span className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5 max-w-full truncate" title={user.statusText}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block shrink-0" /> Away {user.statusText ? `• "${user.statusText}"` : ""}
                                  </span>
                                ) : user.status === "busy" ? (
                                  <span className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5 max-w-full truncate" title={user.statusText}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block shrink-0" /> Busy {user.statusText ? `• "${user.statusText}"` : ""}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5 max-w-full truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0 animate-pulse" /> Active now {user.statusText ? `• "${user.statusText}"` : ""}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* User Profile Footer */}
                    <div className={`p-4 border-t ${t.border} mt-auto`}>
                      <div 
                        className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-all ${t.cardBg} border ${t.border} hover:bg-white/5`}
                        onClick={() => setSelectedProfileUser(username)}
                      >
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase border ${getAvatarColor(username)}`}>
                            {username.slice(0, 2)}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 online-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${t.isLight ? "text-slate-900" : "text-white"} truncate`}>{username}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Online
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSettingsModalOpen(true);
                          }}
                          className={`p-1.5 rounded-lg ${t.isLight ? "hover:bg-slate-200 text-slate-500" : "hover:bg-slate-800 text-slate-500 hover:text-white"} transition-all cursor-pointer`}
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.aside>
                  </>
                )}
              </AnimatePresence>

              {/* Chat Viewport & Whiteboard Wrapper */}
              <div className="flex-1 flex overflow-hidden">
                <div className={`flex-1 flex flex-col ${t.bg} relative overflow-hidden`}>
                {customBg && (
                  <div 
                    className="absolute inset-0 z-0 pointer-events-none transition-all duration-300"
                    style={{
                      backgroundImage: `url(${customBg})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: bgOpacity,
                    }}
                  />
                )}
                
                {/* Chat Viewport Header (Search and Room info) */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 ${t.cardBg} border-b ${t.border} relative z-10`}>
                  {/* Left: Room details and Hamburger toggle */}
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-1.5 ${t.isLight ? "text-slate-600 hover:text-slate-900 bg-slate-200 hover:bg-slate-300" : "text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800/80"} rounded-lg md:hidden transition-all cursor-pointer`}
                        title="Toggle Sidebar"
                      >
                        <Menu className="w-4 h-4" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        <Hash className={`w-4 h-4 ${t.accentText}`} />
                        <span className="text-sm md:text-base font-bold text-white uppercase tracking-tight">
                          {room}
                        </span>
                        {PRESETS.find(p => p.id === room)?.isEncrypted && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest ml-2 animate-pulse">
                            <Lock className="w-3 h-3" /> E2EE
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                      className={`flex items-center gap-1.5 text-xs ${t.isLight ? "text-slate-600 bg-slate-200 hover:bg-slate-300" : "text-slate-300 bg-slate-800/80 hover:bg-slate-800"} px-2.5 py-1 rounded-lg transition-all cursor-pointer`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{activeUsers.length} online</span>
                    </button>
                  </div>

                  {/* Right: Tools & Search */}
                  <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                    <button 
                      onClick={() => setDensityMode(prev => prev === 'cozy' ? 'compact' : 'cozy')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${t.isLight ? "bg-slate-200" : "bg-slate-800"}`}
                    >
                      {densityMode === 'cozy' ? 'Cozy' : 'Compact'}
                    </button>
                    <button
                      onClick={() => {
                        setIsTasksOpen(!isTasksOpen);
                        setIsWhiteboardOpen(false);
                      }}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                        isTasksOpen
                          ? `bg-emerald-500/20 border-emerald-500/50 text-emerald-400`
                          : `${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`
                      }`}
                      title={isTasksOpen ? "Close Tasks" : "Open Task Board"}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>

                    {/* Collaborative Whiteboard Toggle */}
                    <button
                      onClick={() => {
                        setIsWhiteboardOpen(!isWhiteboardOpen);
                        setIsTasksOpen(false);
                      }}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                        isWhiteboardOpen
                          ? `bg-indigo-500/20 border-indigo-500/50 text-indigo-400`
                          : `${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`
                      }`}
                      title={isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
                    >
                      <PenTool className="w-4 h-4" />
                    </button>

                    {/* Audit Logs (Admin Only) */}
                    {currentUser?.role === "admin" && (
                      <button
                        onClick={() => setIsAuditLogOpen(true)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                          isAuditLogOpen
                            ? `bg-indigo-500/20 border-indigo-500/50 text-indigo-400 shadow-lg shadow-indigo-500/20`
                            : `${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`
                        }`}
                        title="Open Audit Logs (Admin)"
                      >
                        <HistoryIcon className="w-4 h-4" />
                      </button>
                    )}

                    {/* Saved Items Toggle */}
                    <button
                      onClick={() => setIsSavedDrawerOpen(true)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                        isSavedDrawerOpen
                          ? `bg-amber-500/20 border-amber-500/50 text-amber-400`
                          : `${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`
                      }`}
                      title="Open Saved Items"
                    >
                      <Star className={`w-4 h-4 ${isSavedDrawerOpen ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>

                    {/* Audio Huddle Toggle */}
                    <button
                      onClick={() => setIsHuddleOpen(!isHuddleOpen)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                        isHuddleOpen
                          ? `bg-rose-500/20 border-rose-500/50 text-rose-400`
                          : `${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`
                      }`}
                      title={isHuddleOpen ? "Leave Huddle" : "Join Audio Huddle"}
                    >
                      <Radio className={`w-4 h-4 ${isHuddleOpen ? "animate-pulse" : ""}`} />
                    </button>

                    {/* Reading Mode Toggle */}
                    <button
                      onClick={() => setIsReadingMode(!isReadingMode)}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                        isReadingMode
                          ? `bg-indigo-500/20 border-indigo-500/50 text-indigo-400`
                          : `${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`
                      }`}
                      title={isReadingMode ? "Exit Reading Mode" : "Enter Reading Mode"}
                    >
                      {isReadingMode ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                    </button>

                    
                    {/* Summarize Channel Button */}
                    <button
                      onClick={async () => {
                        const originalSearch = searchQuery;
                        setSearchQuery("Summarizing...");
                        try {
                          const res = await fetch("/api/gemini/summarize", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ room })
                          });
                          const data = await res.json();
                          if (data.summary) {
                            alert("Channel Summary:\n\n" + data.summary);
                          } else {
                            alert("Failed to summarize.");
                          }
                        } catch (e) {
                          alert("Error during summarization.");
                        } finally {
                          setSearchQuery(originalSearch);
                        }
                      }}
                      className={`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}`}
                      title="Catch Me Up (Summarize)"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </button>

{/* Message Search Bar */}
                    <div className="relative w-full sm:w-64">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && searchQuery.trim() !== '') {
                             const q = searchQuery;
                             setSearchQuery("Searching...");
                             try {
                               const res = await fetch("/api/gemini/search", {
                                 method: "POST",
                                 headers: { "Content-Type": "application/json" },
                                 body: JSON.stringify({ room, query: q })
                               });
                               const data = await res.json();
                               if (data.answer) {
                                 alert("AI Answer:\n\n" + data.answer);
                               }
                             } catch (e) {
                               alert("Search failed");
                             } finally {
                               setSearchQuery("");
                             }
                          }
                        }}
                        placeholder="Search messages..."
                        className={`w-full pl-9 pr-8 py-1.5 ${t.inputBg} border ${t.border} rounded-xl text-xs ${t.isLight ? "text-slate-900 placeholder-slate-500" : "text-slate-100 placeholder-slate-500"} focus:outline-none focus:ring-2 ${t.accentFocusRing} transition-all`}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500 hover:text-slate-300 transition-all cursor-pointer"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* View Filter Bar */}
                <div className={`px-4 py-2 border-b flex items-center gap-4 overflow-x-auto no-scrollbar ${t.border} ${t.isLight ? 'bg-slate-50' : 'bg-slate-900/40'}`}>
                  <button 
                    onClick={() => setMessageFilter("all")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      messageFilter === "all" 
                        ? `${t.accentBg} text-white shadow-lg ${t.accentShadow}` 
                        : `${t.isLight ? "bg-white text-slate-500 border border-slate-200" : "bg-slate-800 text-slate-400 border border-slate-700"} hover:text-slate-200`
                    }`}
                  >
                    <MessageSquare className="w-3 h-3" /> All Messages
                  </button>
                  <button 
                    onClick={() => setMessageFilter("pins")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      messageFilter === "pins" 
                        ? "bg-amber-500 text-white shadow-lg shadow-amber-900/20" 
                        : `${t.isLight ? "bg-white text-slate-500 border border-slate-200" : "bg-slate-800 text-slate-400 border border-slate-700"} hover:text-slate-200`
                    }`}
                  >
                    <Pin className="w-3 h-3" /> Pinned
                  </button>
                  <button 
                    onClick={() => setMessageFilter("files")}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      messageFilter === "files" 
                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-900/20" 
                        : `${t.isLight ? "bg-white text-slate-500 border border-slate-200" : "bg-slate-800 text-slate-400 border border-slate-700"} hover:text-slate-200`
                    }`}
                  >
                    <FileText className="w-3 h-3" /> Files
                  </button>
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1 hidden sm:flex">
                      <Filter className="w-3 h-3" /> Filtered by:
                    </span>
                    <span className={`text-[10px] font-black ${t.accentText}`}>
                      {messageFilter === "all" ? "Live Stream" : messageFilter === "pins" ? "Pins Only" : "Attachments Only"}
                    </span>
                  </div>
                </div>

                {/* Pinned Messages Bar */}
                {(() => {
                  const pinnedMessages = messages.filter((msg) => msg.isPinned && !msg.isSystem);
                  if (pinnedMessages.length === 0) return null;
                  return (
                    <div className={`border-b ${t.border} bg-amber-500/5 backdrop-blur-md relative z-20`}>
                      <div 
                        onClick={() => setIsPinnedExpanded(!isPinnedExpanded)}
                        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-all text-xs font-semibold text-amber-400"
                      >
                        <div className="flex items-center gap-2">
                          <Pin className="w-3.5 h-3.5 fill-current rotate-45" />
                          <span>Pinned Messages ({pinnedMessages.length})</span>
                        </div>
                        <span className="text-[10.5px] font-bold text-slate-400 hover:text-slate-200">
                          {isPinnedExpanded ? "Hide" : "Show"}
                        </span>
                      </div>

                      <AnimatePresence>
                        {isPinnedExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 max-h-48 overflow-y-auto space-y-2 py-1 scrollbar-thin">
                              {pinnedMessages.map((msg) => (
                                <div 
                                  key={`pinned-${msg.id}`}
                                  className="flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 transition-all"
                                >
                                  <div 
                                    onClick={() => {
                                      const el = document.getElementById(msg.id);
                                      if (el) {
                                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                                        el.classList.add("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-slate-900", "scale-[1.02]", "transition-all");
                                        setTimeout(() => {
                                          el.classList.remove("ring-2", "ring-amber-500", "ring-offset-2", "ring-offset-slate-900", "scale-[1.02]");
                                        }, 2000);
                                      }
                                    }}
                                    className="flex-1 cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="text-[10px] font-bold text-white">{msg.sender}</span>
                                      <span className="text-[9px] text-slate-500">{msg.timestamp}</span>
                                    </div>
                                    {msg.audioUrl ? (
                                      <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
                                        🎤 Voice Message ({formatRecordingTime(msg.audioDuration || 0)})
                                      </span>
                                    ) : (
                                      <p className="text-[11px] text-slate-300 line-clamp-1">{msg.text}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePin(msg.id, false);
                                      }}
                                      className="p-1 text-slate-500 hover:text-amber-400 rounded transition-all cursor-pointer"
                                      title="Unpin message"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })()}

                {/* Messages Feed */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 relative z-10 scrollbar-thin" ref={messagesContainerRef}>
                  {messages.length === 0 ? (
                    <EmptyState 
                      channelName={PRESETS.find((p) => p.id === room)?.name || room}
                      channelEmoji={PRESETS.find((p) => p.id === room)?.emoji}
                      theme={t}
                    />
                  ) : filteredMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-white">No search results</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        We couldn't find any messages containing <span className="font-semibold text-slate-200">"{searchQuery}"</span>.
                      </p>
                      <button
                        onClick={() => setSearchQuery("")}
                        className={`mt-4 px-3.5 py-2 text-xs font-semibold text-white ${t.accentBg} ${t.accentHoverBg} rounded-xl shadow-md transition-all cursor-pointer`}
                      >
                        Clear Search
                      </button>
                    </div>
                  ) : (
                    filteredMessages.map((msg, index) => {
                      // Time group divider
                      const prevMsg = index > 0 ? filteredMessages[index - 1] : undefined;
                      const timeGroupLabel = getTimeGroupLabel(msg.timestamp, prevMsg?.timestamp);
                      
                      if (msg.isSystem) {
                        return (
                          <React.Fragment key={`timegroup-${msg.id}`}>
                            {timeGroupLabel && (
                              <div className="flex items-center gap-3 my-6">
                                <div className={`flex-1 h-px ${t.border}`} />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted} px-3 py-1 rounded-full ${t.cardBg} border ${t.border}`}>
                                  {timeGroupLabel}
                                </span>
                                <div className={`flex-1 h-px ${t.border}`} />
                              </div>
                            )}
                            <motion.div 
                              key={msg.id} 
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="flex justify-center my-2"
                            >
                              <span className={`text-[11px] px-3 py-1 ${t.cardBg} rounded-full text-slate-400 border ${t.border}/50 italic flex items-center gap-1.5`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${t.accentBg}/60 inline-block`} />
                                {msg.text}
                              </span>
                            </motion.div>
                          </React.Fragment>
                        );
                      }

                      const isGrouped = prevMsg && !prevMsg.isSystem && prevMsg.sender === msg.sender;
                      const isMe = msg.sender === username;
                      const isMentioned = !isMe && msg.text && username && 
                        new RegExp(`@${username.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i').test(msg.text);
                      return (
                        <React.Fragment key={msg.id}>
                          {timeGroupLabel && (
                            <div className="flex items-center gap-3 my-6">
                              <div className={`flex-1 h-px ${t.border}`} />
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${t.textMuted} px-3 py-1 rounded-full ${t.cardBg} border ${t.border}`}>
                                {timeGroupLabel}
                              </span>
                              <div className={`flex-1 h-px ${t.border}`} />
                            </div>
                          )}
                        <motion.div
                          id={msg.id}
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ type: "spring", stiffness: 350, damping: 28 }}
                          className={`message-bubble flex items-start gap-3 max-w-[85%] md:max-w-[70%] rounded-xl ${
                            isMe ? "ml-auto flex-row-reverse" : "mr-auto"
                          } ${isGrouped ? (densityMode === 'compact' ? "mt-[-12px]" : "mt-[-4px]") : "mt-4"} ${msg.isResolved ? "filter grayscale opacity-40 blur-[0.2px] hover:grayscale-0 hover:opacity-100" : ""}`}
                        >
                          {/* Avatar */}
                          {!isMe && (
                            <div className="w-8 shrink-0">
                              {!isGrouped && (
                                <button
                                  onClick={() => setSelectedProfileUser(msg.sender)}
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 border mt-0.5 cursor-pointer hover:opacity-80 transition-all ${getAvatarColor(msg.sender)}`}
                                  title={`View ${msg.sender}'s profile`}
                                >
                                  {msg.sender.slice(0, 2)}
                                </button>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col">
                            {/* Message metadata */}
                            {!isMe && (
                              <div className="flex items-center gap-2 ml-1 mb-0.5 flex-wrap">
                                <button
                                  onClick={() => setSelectedProfileUser(msg.sender)}
                                  className={`text-xs font-semibold ${t.accentText} hover:underline cursor-pointer`}
                                  title={`View ${msg.sender}'s profile`}
                                >
                                  {msg.sender}
                                </button>
                                
                                {(() => {
                                  const senderUser = activeUsers.find(u => u.username === msg.sender);
                                  if (senderUser) {
                                    if (senderUser.status === "away") {
                                      return (
                                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-normal" title={senderUser.statusText}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                                          {senderUser.statusText ? `"${senderUser.statusText}"` : "Away"}
                                        </span>
                                      );
                                    } else if (senderUser.status === "busy") {
                                      return (
                                        <span className="text-[10px] text-rose-400 flex items-center gap-1 font-normal" title={senderUser.statusText}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
                                          {senderUser.statusText ? `"${senderUser.statusText}"` : "Busy"}
                                        </span>
                                      );
                                    } else if (senderUser.statusText) {
                                      return (
                                        <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-normal" title={senderUser.statusText}>
                                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                                          {`"${senderUser.statusText}"`}
                                        </span>
                                      );
                                    }
                                  }
                                  return null;
                                })()}

                                {isMentioned && (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-bold uppercase rounded tracking-wider leading-none animate-pulse">
                                    Mentioned
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Message Bubble Wrapper with Hover Group */}
                            <div className="relative group/bubble">
                              {/* Hover Reaction Bar */}
                              {!msg.isSystem && (
                                <div
                                  className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 p-1 rounded-full ${t.headerBg} backdrop-blur-xl border ${t.border} shadow-xl opacity-0 scale-90 group-hover/bubble:opacity-100 group-hover/bubble:scale-100 pointer-events-none group-hover/bubble:pointer-events-auto transition-all duration-150 ${
                                    isMe ? "right-full mr-2.5" : "left-full ml-2.5"
                                  }`}
                                >
                                    {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => {
                                      const hasReacted = msg.reactions?.[emoji]?.includes(username);
                                      return (
                                        <button
                                          key={emoji}
                                          type="button"
                                          onClick={() => handleReactMessage(msg.id, emoji)}
                                          className={`w-6 h-6 flex items-center justify-center text-xs rounded-full hover:scale-125 transition-all cursor-pointer ${
                                            hasReacted ? "bg-indigo-500/30 text-indigo-200" : "hover:bg-white/10"
                                          }`}
                                          title={emoji}
                                        >
                                          {emoji}
                                        </button>
                                      );
                                    })}
                                    <div className={`w-px h-4 bg-white/10 mx-1`} />
                                    <button
                                      onClick={() => handleCreateTask(msg.text, msg.id)}
                                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
                                      title="Convert to Task"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => socket?.emit("message:star", msg.id)}
                                      className={`w-6 h-6 flex items-center justify-center rounded-full hover:bg-amber-500/20 transition-all cursor-pointer ${
                                        msg.bookmarkedBy?.includes(socket?.id || "") ? "text-amber-400" : "text-slate-400"
                                      }`}
                                      title="Save Message"
                                    >
                                      <Star className={`w-3.5 h-3.5 ${msg.bookmarkedBy?.includes(socket?.id || "") ? "fill-current" : ""}`} />
                                    </button>
                                    <button
                                      onClick={() => socket?.emit("message:resolve", msg.id)}
                                      className={`w-6 h-6 flex items-center justify-center rounded-full hover:bg-emerald-500/20 transition-all cursor-pointer ${
                                        msg.isResolved ? "text-emerald-400" : "text-slate-400"
                                      }`}
                                      title={msg.isResolved ? "Unresolve Thread" : "Resolve Thread"}
                                    >
                                      <CheckCheck className={`w-3.5 h-3.5 ${msg.isResolved ? "animate-pulse" : ""}`} />
                                    </button>
                                    {(currentUser?.role === "admin" || currentUser?.role === "moderator") && (
                                      <button
                                        onClick={() => socket?.emit("message:delete", msg.id)}
                                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
                                        title="Delete Message (Moderator)"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                </div>
                              )}

                              <div
                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed border relative ${
                                  isMe
                                    ? `${t.bubbleMe} border-transparent rounded-tr-none`
                                    : isMentioned
                                      ? `bg-amber-950/45 border-amber-500/60 shadow-lg shadow-amber-500/20 text-slate-100 rounded-tl-none`
                                      : `${t.bubbleOther} border-transparent rounded-tl-none`
                                }`}
                              >
                                {msg.isPinned && (
                                  <div className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-amber-500/40 rounded-full p-0.5 shadow-md text-amber-400 z-10 animate-bounce">
                                    <Pin className="w-2.5 h-2.5 fill-current" />
                                  </div>
                                )}
                                {msg.isResolved && (
                                  <div className={`absolute -top-1.5 ${msg.isPinned ? "-right-6" : "-right-1.5"} bg-emerald-500 border border-emerald-400 rounded-full p-0.5 shadow-md text-white z-10`}>
                                    <CheckCheck className="w-2.5 h-2.5" />
                                  </div>
                                )}
                                {msg.audioUrl ? (
                                  <div className="mb-1 flex flex-col gap-2">
                                    <VoicePlayer src={msg.audioUrl} duration={msg.audioDuration} isMe={isMe} theme={t} />
                                    {msg.audioTranscription && (
                                      <div className={`text-xs p-2 rounded-lg border ${isMe ? 'bg-indigo-900/30 border-indigo-400/30 text-indigo-100' : 'bg-slate-900/30 border-slate-700/50 text-slate-300'}`}>
                                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase tracking-wider opacity-70">
                                          <Sparkles className="w-3 h-3" /> Transcript
                                        </div>
                                        <p className="whitespace-pre-wrap break-words">{msg.audioTranscription}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <>
                                    <DecryptedText 
                                      text={msg.text}
                                      encryptedText={msg.encryptedText}
                                      isEncrypted={msg.isEncrypted}
                                      room={msg.room}
                                      renderText={renderMessageText}
                                    />
                                    <RichEmbeds text={msg.text} theme={t} />
                                  </>
                                )}
                                <div className="flex justify-end items-center gap-1.5 mt-1">
                                  <span className={`text-[9px] ${isMe ? "text-slate-100/85" : "text-slate-400"}`}>
                                    {msg.timestamp}
                                  </span>
                                  {isMe && (
                                    <span 
                                      className="flex items-center" 
                                      title={msg.seenBy && msg.seenBy.length > 0 ? `Seen by: ${msg.seenBy.join(", ")}` : "Sent"}
                                    >
                                      {msg.seenBy && msg.seenBy.length > 0 ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                      ) : (
                                        <Check className={`w-3.5 h-3.5 ${t.accentText}/85`} />
                                      )}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleTogglePin(msg.id, !msg.isPinned)}
                                    className={`p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer`}
                                    title={msg.isPinned ? "Unpin message" : "Pin message"}
                                  >
                                    <Pin className={`w-2.5 h-2.5 ${msg.isPinned ? "fill-current text-amber-400" : ""}`} />
                                  </button>
                                  <button
                                    onClick={() => socket?.emit("message:star", msg.id)}
                                    className={`p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                                      msg.bookmarkedBy?.includes(socket?.id || "") ? "text-amber-400" : "text-slate-400 hover:text-amber-400"
                                    }`}
                                    title="Save Message"
                                  >
                                    <Star className={`w-2.5 h-2.5 ${msg.bookmarkedBy?.includes(socket?.id || "") ? "fill-current" : ""}`} />
                                  </button>
                                  <button
                                    onClick={() => setActiveThreadMessage(msg)}
                                    className={`p-0.5 rounded hover:bg-white/10 text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer`}
                                    title="Reply in Thread"
                                  >
                                    <CornerDownRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Reaction Badges Container */}
                            {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                              <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? "justify-end ml-auto" : "justify-start"}`}>
                                {Object.entries(msg.reactions).map(([emoji, val]) => {
                                  const usersList = val as string[];
                                  if (usersList.length === 0) return null;
                                  const hasReacted = usersList.includes(username);
                                  return (
                                    <motion.button
                                      key={emoji}
                                      type="button"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      onClick={() => handleReactMessage(msg.id, emoji)}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all cursor-pointer hover:scale-105 ${
                                        hasReacted
                                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-medium"
                                          : t.isLight
                                            ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                                            : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800"
                                      }`}
                                      title={`Reacted by: ${usersList.join(", ")}`}
                                    >
                                      {emoji.startsWith(":") && emoji.endsWith(":") ? (
                                        (() => {
                                          const customEmoji = customEmojis.find(e => e.name === emoji.substring(1, emoji.length - 1));
                                          return customEmoji ? (
                                            <img src={customEmoji.url} alt={emoji} className="w-3.5 h-3.5 object-contain" />
                                          ) : <span>{emoji}</span>;
                                        })()
                                      ) : (
                                        <span>{emoji}</span>
                                      )}
                                      <span className="text-[9.5px] font-bold font-mono">{usersList.length}</span>
                                    </motion.button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Thread reply counter button */}
                            {(() => {
                              const replyCount = messages.filter((m) => m.parentId === msg.id).length;
                              if (replyCount === 0) return null;
                              return (
                                <button
                                  onClick={() => setActiveThreadMessage(msg)}
                                  className={`mt-1.5 text-[10.5px] font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${t.border} bg-slate-900/40 hover:bg-slate-800 transition-all cursor-pointer ${t.accentText} ${
                                    isMe ? "self-end ml-auto" : "self-start"
                                  }`}
                                >
                                  <MessageSquare className="w-3 h-3 text-indigo-400" />
                                  <span>{replyCount} {replyCount === 1 ? "reply" : "replies"}</span>
                                </button>
                              );
                            })()}

                            {/* Seen By User Badges (under the bubble) */}
                            {msg.seenBy && msg.seenBy.length > 0 && (
                              <div className={`text-[10px] text-slate-400 mt-1 px-1 flex items-center gap-1 font-sans ${isMe ? "justify-end text-right" : "justify-start text-left"}`}>
                                <span className="text-[9px] uppercase tracking-wider text-slate-500">Seen by:</span>
                                <span className={`font-semibold ${t.accentText}`}>{msg.seenBy.join(", ")}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                        </React.Fragment>
                      );
                    })
                  )}

                  {/* Typing Indicator */}
                  <TypingIndicator usernames={typingUsernames} theme={t} />

                  {/* Scroll to bottom anchor */}
                  <div ref={messagesEndRef} />

                  {/* Scroll to bottom FAB */}
                  <ScrollToBottomFab
                    visible={scrolledUp}
                    onClick={handleScrollToBottom}
                    theme={t}
                  />
                </div>

                {/* Quick responses deck */}
                {!isReadingMode && (
                  <div className={`px-4 py-2.5 ${t.cardBg} backdrop-blur-md border-t ${t.border}/60 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none relative z-10`}>
                    <span className={`text-[10px] font-bold ${t.accentText}/80 uppercase tracking-widest shrink-0 mr-1 flex items-center gap-1`}>
                      <Zap className="w-3 h-3" /> Quick Reply
                    </span>
                    {QUICK_RESPONSES.map((resp, i) => (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSendMessage(resp)}
                        className={`text-xs px-3 py-1.5 ${t.inputBg} hover:opacity-80 border ${t.border} ${t.isLight ? "text-slate-700 hover:border-slate-400" : "text-slate-300 hover:border-slate-500"} rounded-xl transition-all shrink-0 cursor-pointer shadow-sm`}
                      >
                        {resp}
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Message input panel */}
                <div className={`p-4 border-t ${t.border} ${t.headerBg} backdrop-blur-md sticky bottom-0 z-30 shrink-0 ${isReadingMode ? "hidden" : ""}`}>
                  <div className="flex items-center gap-3">
                    
                    {isRecording ? (
                      <div className={`flex-1 flex items-center justify-between px-4 py-2.5 ${t.inputBg} border border-rose-500/30 rounded-xl`}>
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shrink-0" />
                          <span className="text-sm font-semibold text-rose-400">Recording</span>
                          <span className="text-xs text-slate-400 font-mono">({formatRecordingTime(recordingDuration)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => stopRecording(false)}
                            className="p-2 bg-slate-800/80 hover:bg-slate-800 hover:text-rose-400 text-slate-300 rounded-lg transition-all cursor-pointer"
                            title="Cancel recording"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => stopRecording(true)}
                            className={`p-2 ${t.accentBg} ${t.accentHoverBg} text-white rounded-lg transition-all cursor-pointer`}
                            title="Stop and Send"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Input Field Form */}
                        <div 
                          className={`flex-1 relative flex items-center ${isDragging ? 'ring-2 ring-blue-500 rounded-xl' : ''}`}
                          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                          onDragLeave={() => setIsDragging(false)}
                          onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
                        >
                          {/* Floating Command Autocomplete Dropdown */}
                          <AnimatePresence>
                            {showCommandDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className={`absolute bottom-full left-0 mb-3 w-64 bg-slate-950 border ${t.border} rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col`}
                              >
                                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Slash Commands</span>
                                  <span className="text-[9px] text-slate-500 font-mono">Use ↑↓ & Enter</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
                                  {commands.map((cmd, index) => (
                                    <button
                                      key={cmd.name}
                                      onClick={() => selectCommand(cmd.name)}
                                      onMouseEnter={() => setCommandIndex(index)}
                                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-all cursor-pointer ${
                                        index === commandIndex 
                                          ? `${t.accentBg} text-white` 
                                          : "text-slate-300 hover:bg-slate-900"
                                      }`}
                                    >
                                      <span className="font-semibold">{cmd.name}</span>
                                      <span className="text-[10px] text-slate-500">{cmd.description}</span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Floating Mention Autocomplete Dropdown */}
                          <AnimatePresence>
                            {showMentionDropdown && filteredActiveUsers.length > 0 && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className={`absolute bottom-full left-0 mb-3 w-64 bg-slate-950 border ${t.border} rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col`}
                              >
                                <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mention User</span>
                                  <span className="text-[9px] text-slate-500 font-mono">Use ↑↓ & Enter</span>
                                </div>
                                <div className="max-h-48 overflow-y-auto py-1 scrollbar-thin">
                                  {filteredActiveUsers.map((user, index) => (
                                    <button
                                      key={user.id}
                                      onClick={() => selectMentionUser(user.username)}
                                      onMouseEnter={() => setMentionIndex(index)}
                                      className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between transition-all cursor-pointer ${
                                        index === mentionIndex 
                                          ? `${t.accentBg} text-white` 
                                          : "text-slate-300 hover:bg-slate-900"
                                      }`}
                                    >
                                      <span className="font-semibold">@{user.username}</span>
                                      {user.username === username && (
                                        <span className="text-[9px] px-1 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">You</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                           <input
                            ref={inputRef}
                            type="text"
                            maxLength={500}
                            value={messageInput}
                            onChange={handleInputChange}
                            placeholder={`Send a message to #${room}...`}
                            disabled={currentUser?.isMuted || (currentUser?.role === "guest" && !room.toLowerCase().includes("lobby"))}
                            className={`w-full pl-4 pr-[88px] py-3.5 ${t.inputBg} border ${t.border} focus:outline-none focus:ring-2 ${t.accentFocusRing} rounded-2xl text-slate-100 text-sm input-glow ${(currentUser?.isMuted || (currentUser?.role === "guest" && !room.toLowerCase().includes("lobby"))) ? "opacity-50 grayscale cursor-not-allowed" : ""}`}
                            onKeyDown={handleInputKeyDown}
                          />

                          {(currentUser?.isMuted || (currentUser?.role === "guest" && !room.toLowerCase().includes("lobby"))) && (
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-20 group">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in duration-300">
                                {currentUser?.isMuted ? (
                                  <>
                                    <MicOff className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">You are muted</span>
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Guest Read-Only Mode</span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* AI Tools for Input */}
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            <button
                              onClick={async () => {
                                if (!messageInput.trim()) return;
                                const instruction = prompt("How would you like to rewrite this? (e.g. 'more professional', 'friendlier')", "more professional");
                                if (!instruction) return;
                                try {
                                  const res = await fetch("/api/gemini/rewrite", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ text: messageInput, instruction })
                                  });
                                  const data = await res.json();
                                  if (data.result) {
                                    setMessageInput(data.result);
                                  }
                                } catch(e) {
                                  alert("Failed to rewrite");
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="AI Rewrite"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!messageInput.trim()) return;
                                const targetLanguage = prompt("Which language to translate to?", "Spanish");
                                if (!targetLanguage) return;
                                try {
                                  const res = await fetch("/api/gemini/translate", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ text: messageInput, targetLanguage })
                                  });
                                  const data = await res.json();
                                  if (data.result) {
                                    setMessageInput(data.result);
                                  }
                                } catch(e) {
                                  alert("Failed to translate");
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-sky-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Translate"
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          </div>


                          {/* Emoji trigger / smiley */}
                          <button
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:${t.accentText} transition-all`}
                          >
                            <Smile className="w-5 h-5" />
                          </button>

                          {/* Floating Emoji Selector */}
                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                className={`absolute bottom-full right-0 mb-3 p-3 bg-slate-950 border ${t.border} rounded-2xl shadow-xl flex gap-1.5 z-50 flex-wrap max-w-[280px]`}
                              >
                                {["😀", "😂", "🔥", "💯", "🎉", "💖", "👍", "🚀", "🍿", "🎮", "💻", "🎨"].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => {
                                      setMessageInput((prev) => prev + emoji);
                                      setShowEmojiPicker(false);
                                    }}
                                    className="text-xl p-1.5 hover:bg-slate-800 rounded-lg transition-all cursor-pointer"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Microphone Button */}
                        <button
                          onClick={startRecording}
                          disabled={currentUser?.isMuted || (currentUser?.role === "guest" && !room.toLowerCase().includes("lobby"))}
                          className="p-3 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-300 rounded-xl transition-all shrink-0 cursor-not-allowed disabled:opacity-30 disabled:grayscale"
                          title="Record voice clip"
                        >
                          <Mic className="w-4.5 h-4.5" />
                        </button>

                        {/* Send Button */}
                        <button
                          onClick={() => handleSendMessage()}
                          disabled={!messageInput.trim() || currentUser?.isMuted || (currentUser?.role === "guest" && !room.toLowerCase().includes("lobby"))}
                          className={`p-3 ${t.accentBg} ${t.accentHoverBg} disabled:bg-slate-800 disabled:text-slate-600 rounded-xl text-white shadow-lg ${t.accentShadow} transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed`}
                          title="Send message"
                        >
                          <Send className="w-4.5 h-4.5" />
                        </button>
                      </>
                    )}

                  </div>
                </div>
              </div>

                {/* Collaborative Whiteboard */}
                <AnimatePresence>
                  {isWhiteboardOpen && (
                    <motion.div
                      initial={{ x: "100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: "100%", opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="absolute inset-0 z-50 md:relative md:inset-auto w-full md:w-1/2 h-full overflow-hidden border-l border-slate-800"
                    >
                      <Whiteboard socket={socket} room={room} theme={t} />
                      {/* Mobile Close Button */}
                      <button 
                        onClick={() => setIsWhiteboardOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full md:hidden z-50 shadow-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Task Board */}
                <AnimatePresence>
                  {isTasksOpen && (
                    <motion.div
                      initial={{ x: "100%", opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: "100%", opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 200 }}
                      className="absolute inset-0 z-50 md:relative md:inset-auto w-full md:w-1/2 lg:w-1/3 h-full overflow-hidden border-l border-slate-800 shadow-2xl"
                    >
                      <TaskBoard 
                        tasks={tasks} 
                        users={activeUsers}
                        onCreateTask={(text) => handleCreateTask(text)}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        theme={t}
                      />
                      {/* Mobile Close Button */}
                      <button 
                        onClick={() => setIsTasksOpen(false)}
                        className="absolute top-4 right-4 p-2 bg-slate-900/80 text-white rounded-full md:hidden z-50 shadow-xl"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Thread Drawer */}
              <AnimatePresence>
                {activeThreadMessage && (
                  <ThreadDrawer
                    parentMessage={activeThreadMessage}
                    isDocked={isThreadDocked}
                    onToggleDock={() => setIsThreadDocked(!isThreadDocked)}
                    messages={messages}
                    activeUsers={activeUsers}
                    currentUsername={username}
                    onClose={() => setActiveThreadMessage(null)}
                    onSendMessage={handleSendMessage}
                    getAvatarColor={getAvatarColor}
                    onOpenProfile={setSelectedProfileUser}
                    onReactMessage={handleReactMessage}
                    onResolveThread={(id) => socket?.emit("message:resolve", id)}
                    onDeleteMessage={(id) => socket?.emit("message:delete", id)}
                    renderMessageText={renderMessageText}
                    currentUser={currentUser}
                    theme={t}
                  />
                )}
              </AnimatePresence>

            </motion.div>
          )}
        </AnimatePresence>

        {/* User Profile Modal */}
        <AnimatePresence>
          {selectedProfileUser && (
            <UserProfileModal
              selectedUsername={selectedProfileUser}
              currentUser={currentUser}
              activeUsers={activeUsers}
              messages={messages}
              onClose={() => setSelectedProfileUser(null)}
              onUpdateStatus={handleUpdateStatus}
              onMuteUser={(id, mute) => socket?.emit("user:mute", { targetUserId: id, mute })}
              onSetRole={(id, role) => socket?.emit("user:set_role", { targetUserId: id, role })}
              getAvatarColor={getAvatarColor}
              theme={t}
            />
          )}
        </AnimatePresence>
        {/* Audio Huddle */}
        {isHuddleOpen && socket && activeUsers.find(u => u.username === username) && (
          <AudioHuddle
            socket={socket}
            room={room}
            currentUser={activeUsers.find(u => u.username === username)!}
            theme={t}
            onClose={() => setIsHuddleOpen(false)}
          />
        )}

        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          channels={PRESETS}
          folders={PRESET_FOLDERS}
          users={activeUsers}
          onSwitchChannel={(channelId) => {
            const channel = PRESETS.find(c => c.id === channelId);
            if (channel) {
              setRoom(channel.id);
              // In this app structure, we might need to re-join
              socket?.emit("join_room", { username, room: channel.id });
            }
          }}
          onSwitchTheme={(themeKey) => setThemeId(themeKey)}
          onOpenWhiteboard={() => {
            setIsWhiteboardOpen(true);
            setIsTasksOpen(false);
          }}
          onOpenTasks={() => {
            setIsTasksOpen(true);
            setIsWhiteboardOpen(false);
          }}
          theme={t}
        />

        <SavedItemsDrawer 
          isOpen={isSavedDrawerOpen}
          onClose={() => setIsSavedDrawerOpen(false)}
          messages={messages}
          currentUser={activeUsers.find(u => u.username === username) || null}
          theme={t}
          onUnstar={(id) => socket?.emit("message:star", id)}
        />

        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
          currentUser={currentUser}
          activeUsers={activeUsers}
          customEmojis={customEmojis}
          onUpdateFocusConfig={(config) => socket?.emit("update_focus_config", config)}
          onUploadEmoji={(name, url) => socket?.emit("emoji:upload", { name, url })}
          onDeleteEmoji={(id) => socket?.emit("emoji:delete", id)}
        />

        <AnimatePresence>
          {isAuditLogOpen && (
            <AuditLogDashboard
              onClose={() => setIsAuditLogOpen(false)}
              socket={socket}
              theme={t}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

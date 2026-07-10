import React, { useState, useEffect } from "react";
import { X, Clock, MessageSquare, Activity, Check, Shield, ShieldAlert, MicOff, UserX, UserPlus, UserCheck } from "lucide-react";
import { motion } from "motion/react";
import { User, Message, UserRole } from "../types";

interface UserProfileModalProps {
  selectedUsername: string;
  currentUser: User | null;
  activeUsers: User[];
  messages: Message[];
  onClose: () => void;
  onUpdateStatus: (status: "online" | "away" | "busy" | "focus", statusText: string) => void;
  onMuteUser: (targetUserId: string, mute: boolean) => void;
  onSetRole: (targetUserId: string, role: UserRole) => void;
  getAvatarColor: (username: string) => string;
  theme: any;
}

export function UserProfileModal({
  selectedUsername,
  currentUser,
  activeUsers,
  messages,
  onClose,
  onUpdateStatus,
  onMuteUser,
  onSetRole,
  getAvatarColor,
  theme: t,
}: UserProfileModalProps) {
  const currentUsername = currentUser?.username;
  const isMe = selectedUsername === currentUsername;
  
  // Find user in active users list
  const userObj = activeUsers.find((u) => u.username === selectedUsername);
  const isOnline = !!userObj;

  // Calculate local messages count in current history
  const localMessageCount = messages.filter(
    (m) => m.sender === selectedUsername && !m.isSystem
  ).length;

  // Use the server-side message count if available, or fall back to local count
  const serverMessageCount = userObj?.messageCount ?? 0;
  const totalMessages = Math.max(serverMessageCount, localMessageCount);

  // Status and status text
  const initialStatus = userObj?.status || "online";
  const initialStatusText = userObj?.statusText || "";

  const [status, setStatus] = useState<"online" | "away" | "busy" | "focus">(initialStatus);
  const [statusText, setStatusText] = useState(initialStatusText);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state if userObj changes (e.g. status updated via socket elsewhere)
  useEffect(() => {
    if (userObj) {
      setStatus(userObj.status || "online");
      setStatusText(userObj.statusText || "");
    }
  }, [userObj]);

  const handleSave = () => {
    setIsSaving(true);
    // Mimic real-time feel
    setTimeout(() => {
      onUpdateStatus(status, statusText);
      setIsSaving(false);
    }, 300);
  };

  // Format join time helper
  const getRelativeJoinTime = (isoString?: string) => {
    if (!isoString) return "Offline";
    const date = new Date(isoString);
    
    // Relative calculation
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    
    if (diffMins < 1) return `Joined just now (${timeStr})`;
    if (diffMins === 1) return `Joined 1 minute ago (${timeStr})`;
    if (diffMins < 60) return `Joined ${diffMins} minutes ago (${timeStr})`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return `Joined 1 hour ago (${timeStr})`;
    if (diffHours < 24) return `Joined ${diffHours} hours ago (${timeStr})`;
    
    return `Joined on ${date.toLocaleDateString()} at ${timeStr}`;
  };

  const currentStatus = isOnline ? (userObj?.status || "online") : "offline";

  const getStatusBadgeStyles = (st: string) => {
    switch (st) {
      case "online":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
      case "away":
        return "bg-amber-500/15 border-amber-500/30 text-amber-400";
      case "busy":
        return "bg-rose-500/15 border-rose-500/30 text-rose-400";
      case "focus":
        return "bg-indigo-500/15 border-indigo-500/30 text-indigo-400";
      default:
        return "bg-slate-500/15 border-slate-500/30 text-slate-400";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm"
        id="profile-modal-backdrop"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
        className={`relative w-full max-w-md overflow-hidden rounded-2xl border ${t.border} ${
          t.isLight ? "bg-white text-slate-800 shadow-xl" : "bg-slate-900 text-slate-100 shadow-2xl"
        } z-10`}
        id="profile-modal-card"
      >
        {/* Header Ambient Glow background based on Avatar Color */}
        <div className={`h-24 w-full opacity-15 absolute top-0 left-0 filter blur-xl ${getAvatarColor(selectedUsername)}`} />

        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-lg border ${t.border} transition-colors cursor-pointer hover:bg-slate-500/10 text-slate-400 hover:text-slate-200 z-20`}
          title="Close Modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 relative pt-10">
          {/* Avatar and Basic details */}
          <div className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-3xl border uppercase shadow-inner mb-4 relative ${getAvatarColor(selectedUsername)}`}>
              {selectedUsername.slice(0, 2)}
              {/* Online Indicator Status Ring */}
              <span className={`absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full border-2 ${t.isLight ? "border-white" : "border-slate-900"} flex items-center justify-center ${
                currentStatus === "online" ? "bg-emerald-500 animate-pulse" :
                currentStatus === "away" ? "bg-amber-500" :
                currentStatus === "busy" ? "bg-rose-500" : "bg-slate-500"
              }`} />
            </div>

            <h3 className="text-xl font-bold tracking-tight mb-1 flex items-center gap-2">
              <span>{selectedUsername}</span>
              {userObj?.role && (
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-black ${
                  userObj.role === "admin" ? "bg-rose-500/20 text-rose-500 border border-rose-500/30" :
                  userObj.role === "moderator" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" :
                  userObj.role === "guest" ? "bg-slate-500/20 text-slate-400 border border-slate-500/30" :
                  "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
                }`}>
                  {userObj.role === "admin" && <ShieldAlert className="w-2.5 h-2.5" />}
                  {userObj.role === "moderator" && <Shield className="w-2.5 h-2.5" />}
                  {userObj.role}
                </div>
              )}
              {isMe && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${t.accentLightBg} ${t.accentText} border ${t.accentLightBorder}`}>
                  You
                </span>
              )}
            </h3>

            {/* Custom Status Tag if offline or set */}
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-mono uppercase tracking-wider font-semibold ${getStatusBadgeStyles(currentStatus)}`}>
                  {currentStatus === "online" ? "Active Now" :
                  currentStatus === "away" ? "Away" :
                  currentStatus === "busy" ? "Do Not Disturb" : 
                  currentStatus === "focus" ? "Focus Mode" : "Offline"}
                </span>
                {userObj?.isMuted && (
                  <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-black uppercase tracking-widest">
                    <MicOff className="w-3 h-3" /> Muted
                  </span>
                )}
              </div>

              {userObj?.statusText && (
                <p className={`text-sm italic mt-1.5 px-4 text-center ${t.isLight ? "text-slate-500" : "text-slate-300"}`}>
                  "{userObj.statusText}"
                </p>
              )}
            </div>
          </div>

          {/* Moderation Controls Section */}
          {!isMe && userObj && (currentUser?.role === "admin" || currentUser?.role === "moderator") && (
            <div className={`mb-6 p-4 rounded-xl border border-rose-500/30 ${t.isLight ? "bg-rose-50/30" : "bg-rose-950/10"} flex flex-col gap-3`}>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500/80 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Moderation Tools
              </h4>
              
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onMuteUser(userObj.id, !userObj.isMuted)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    userObj.isMuted 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                      : "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20"
                  }`}
                >
                  {userObj.isMuted ? <UserPlus className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  {userObj.isMuted ? "Unmute User" : "Mute User"}
                </button>

                {currentUser?.role === "admin" && (
                  <div className="flex gap-1">
                    {(["admin", "moderator", "user", "guest"] as UserRole[]).map((r) => {
                      const isSelected = userObj.role === r;
                      if (isSelected) return null;
                      return (
                        <button
                          key={r}
                          onClick={() => onSetRole(userObj.id, r)}
                          className={`px-2 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg border transition-all cursor-pointer ${
                            t.isLight 
                              ? "bg-white border-slate-200 text-slate-500 hover:border-slate-400" 
                              : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600"
                          }`}
                          title={`Set as ${r}`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Stats grid */}
          <div className={`grid grid-cols-2 gap-3 mb-6 p-4 rounded-xl border ${t.border} ${t.isLight ? "bg-slate-50" : "bg-slate-950/40"}`}>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Join Time
              </span>
              <span className="text-xs font-semibold mt-1 text-slate-300 break-words">
                {isOnline ? getRelativeJoinTime(userObj.joinTime) : "Not in this session"}
              </span>
            </div>

            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Room Activity
              </span>
              <span className="text-base font-bold mt-0.5 text-slate-200">
                {totalMessages} {totalMessages === 1 ? "message" : "messages"}
              </span>
            </div>
          </div>

          {/* Edit Custom Status Section (Only for Current User) */}
          {isMe && isOnline ? (
            <div className={`p-4 rounded-xl border ${t.border} ${t.isLight ? "bg-slate-50" : "bg-slate-950/45"} flex flex-col gap-3.5`}>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Activity className="w-3.5 h-3.5" /> Update Your Status
                </h4>
                
                {/* Status selector circles */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(["online", "away", "busy", "focus"] as const).map((s) => {
                    const isSelected = status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={`flex items-center justify-center gap-1.5 py-1.5 text-[10px] rounded-lg border font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          isSelected
                            ? s === "online" ? "bg-emerald-500/20 border-emerald-500/80 text-emerald-400 shadow-sm" :
                              s === "away" ? "bg-amber-500/20 border-amber-500/80 text-amber-400 shadow-sm" :
                              s === "busy" ? "bg-rose-500/20 border-rose-500/80 text-rose-400 shadow-sm" :
                              "bg-indigo-500/20 border-indigo-500/80 text-indigo-400 shadow-sm"
                            : `${t.isLight ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60"}`
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          s === "online" ? "bg-emerald-400" :
                          s === "away" ? "bg-amber-400" :
                          s === "busy" ? "bg-rose-400" : "bg-indigo-400"
                        }`} />
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Message input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                  Custom status text
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={50}
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder={
                      status === "away" ? "e.g. Grabbing coffee..." :
                      status === "busy" ? "e.g. In deep work..." : "What's on your mind?"
                    }
                    className={`flex-1 text-xs px-3 py-2 rounded-lg border focus:outline-hidden ${
                      t.isLight
                        ? "bg-white border-slate-200 text-slate-800 focus:border-slate-400"
                        : "bg-slate-900 border-slate-800 text-slate-100 focus:border-slate-600"
                    }`}
                  />
                  
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-3 py-2 text-xs rounded-lg font-semibold text-white transition-all cursor-pointer flex items-center gap-1 ${t.accentBg} ${t.accentHoverBg} disabled:opacity-50`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? "Saving..." : "Save"}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : isMe && !isOnline ? (
            <p className="text-xs text-center text-slate-500 italic mt-4">
              Connect to chat to update your live status.
            </p>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

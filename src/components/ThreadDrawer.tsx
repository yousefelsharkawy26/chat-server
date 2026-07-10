import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { X, Send, MessageSquare, Check, CheckCheck, Lock, Unlock, Trash2 } from "lucide-react";
import { Message, User } from "../types";
import { VoicePlayer } from "../App";
import { RichEmbeds } from "./RichEmbeds";
import { DecryptedText } from "./DecryptedText";

interface ThreadDrawerProps {
  parentMessage: Message;
  isDocked?: boolean;
  onToggleDock?: () => void;
  messages: Message[];
  activeUsers: User[];
  currentUsername: string;
  onClose: () => void;
  onSendMessage: (textToSend: string, audioUrl?: string, audioDuration?: number, parentId?: string) => void;
  getAvatarColor: (username: string) => string;
  onOpenProfile: (username: string) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onResolveThread: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  renderMessageText: (text: string) => React.ReactNode;
  currentUser: User | null;
  theme: any;
}

export function ThreadDrawer({
  parentMessage,
  isDocked,
  onToggleDock,
  messages,
  activeUsers,
  currentUsername,
  onClose,
  onSendMessage,
  getAvatarColor,
  onOpenProfile,
  onReactMessage,
  onResolveThread,
  onDeleteMessage,
  renderMessageText,
  currentUser,
  theme: t,
}: ThreadDrawerProps) {
  const [replyInput, setReplyInput] = useState("");
  const repliesEndRef = useRef<HTMLDivElement>(null);

  // Filter replies belonging to this parent message
  const replies = messages.filter((m) => m.parentId === parentMessage.id);

  // Retrieve up-to-date parent message to reflect real-time reaction states
  const currentParentMessage = messages.find((m) => m.id === parentMessage.id) || parentMessage;
  const isResolved = currentParentMessage.isResolved;

  // Auto-scroll to bottom of replies when a new one is received or thread changes
  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies.length, parentMessage.id]);

  const handleSendReply = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = replyInput.trim();
    if (!text) return;

    // Send message as a reply by passing parentId
    onSendMessage(text, undefined, undefined, parentMessage.id);
    setReplyInput("");
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-slate-950/60 z-40 lg:hidden backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Slide-out Panel */}
      <motion.div
        initial={isDocked ? { opacity: 1 } : { x: "100%", opacity: 0.9 }}
        animate={isDocked ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0.9 }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
        className={`z-50 lg:z-30 w-full sm:w-[440px] ${t.sidebarBg} border-l ${t.border} flex flex-col shadow-2xl h-full ${isResolved ? "filter grayscale-[0.4] opacity-95" : ""} ${isDocked ? "relative" : "fixed inset-y-0 right-0"}`}
      >
        {/* Thread Header */}
        <div className={`flex items-center justify-between px-4 py-4 border-b ${t.border} shrink-0`}>
          <div className="flex items-center gap-3">
            {/* Dock/Undock Button */}
            <button
                onClick={onToggleDock}
                className={`p-1.5 rounded-lg ${t.isLight ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-slate-800/80"} transition-all cursor-pointer`}
                title={isDocked ? "Undock Thread" : "Dock Thread"}
            >
                <div className={`w-3 h-3 border-2 rounded-sm ${isDocked ? "bg-indigo-500 border-indigo-500" : "border-slate-500"}`} />
            </button>
            <div className={`p-1.5 rounded-lg ${isResolved ? "bg-emerald-500/20 text-emerald-500" : "bg-indigo-500/20 text-indigo-400"}`}>
               <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${t.isLight ? "text-slate-800" : "text-white"} tracking-tight flex items-center gap-2`}>
                Thread Replies
                {isResolved && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[8px] uppercase tracking-widest font-black">
                    Resolved
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium tracking-tight">
                {replies.length} total messages
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onResolveThread(currentParentMessage.id)}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest border ${
                isResolved 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20" 
                  : `${t.isLight ? "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 border-slate-200" : "text-slate-400 hover:text-emerald-400 hover:bg-slate-800 border-slate-800"}`
              }`}
              title={isResolved ? "Unresolve Thread" : "Mark as Resolved"}
            >
              <CheckCheck className={`w-3.5 h-3.5 ${isResolved ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">{isResolved ? "Resolved" : "Resolve"}</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${t.isLight ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-slate-800/80"} transition-all cursor-pointer`}
              title="Close Thread"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5 scrollbar-thin">
          
          {/* Parent Message Card */}
          <div className={`p-3.5 rounded-xl ${t.cardBg} border ${t.border} space-y-2 relative group/parent`}>
            <div className={`absolute top-2.5 right-3 text-[9px] uppercase font-bold ${t.accentText} tracking-wider`}>
              Thread Starter
            </div>

            {/* Hover Reaction Bar for Parent Card */}
            <div
              className={`absolute top-2.5 right-12 z-20 flex items-center gap-1 p-1 rounded-full ${t.headerBg} backdrop-blur-md border ${t.border} shadow-xl opacity-0 scale-90 group-hover/parent:opacity-100 group-hover/parent:scale-100 pointer-events-none group-hover/parent:pointer-events-auto transition-all duration-150`}
            >
              {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => {
                const hasReacted = currentParentMessage.reactions?.[emoji]?.includes(currentUsername);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => onReactMessage(currentParentMessage.id, emoji)}
                    className={`w-5 h-5 flex items-center justify-center text-[10px] rounded-full hover:scale-125 transition-all cursor-pointer ${
                      hasReacted ? "bg-indigo-500/30 text-indigo-200" : "hover:bg-white/10"
                    }`}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onOpenProfile(currentParentMessage.sender)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] uppercase shrink-0 border cursor-pointer hover:opacity-80 transition-all ${getAvatarColor(currentParentMessage.sender)}`}
              >
                {currentParentMessage.sender.slice(0, 2)}
              </button>
              <div>
                <button
                  onClick={() => onOpenProfile(currentParentMessage.sender)}
                  className="text-xs font-bold text-slate-200 hover:underline cursor-pointer block"
                >
                  {currentParentMessage.sender}
                </button>
                <span className="text-[10px] text-slate-500">{currentParentMessage.timestamp}</span>
              </div>
              {(currentUser?.role === "admin" || currentUser?.role === "moderator") && (
                <button
                  onClick={() => onDeleteMessage(currentParentMessage.id)}
                  className="ml-auto w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all cursor-pointer"
                  title="Delete Thread (Moderator)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {currentParentMessage.audioUrl ? (
              <div className="mt-1 flex flex-col gap-2">
                <VoicePlayer
                  src={currentParentMessage.audioUrl}
                  duration={currentParentMessage.audioDuration}
                  isMe={currentParentMessage.sender === currentUsername}
                  theme={t}
                />
                {currentParentMessage.audioTranscription && (
                  <div className={`text-xs p-2 rounded-lg border ${currentParentMessage.sender === currentUsername ? 'bg-indigo-900/30 border-indigo-400/30 text-indigo-100' : 'bg-slate-900/30 border-slate-700/50 text-slate-300'}`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase tracking-wider opacity-70">
                      Transcript
                    </div>
                    <p className="whitespace-pre-wrap break-words">{currentParentMessage.audioTranscription}</p>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="text-xs text-slate-300 leading-relaxed pl-1">
                  <DecryptedText 
                    text={currentParentMessage.text}
                    encryptedText={currentParentMessage.encryptedText}
                    isEncrypted={currentParentMessage.isEncrypted}
                    room={currentParentMessage.room}
                    renderText={renderMessageText}
                  />
                </div>
                <div className="pl-1">
                  <RichEmbeds text={currentParentMessage.text} theme={t} />
                </div>
              </>
            )}

            {/* Parent Message Reactions */}
            {currentParentMessage.reactions && Object.keys(currentParentMessage.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800/40">
                {Object.entries(currentParentMessage.reactions).map(([emoji, usersList]) => {
                  if (usersList.length === 0) return null;
                  const hasReacted = usersList.includes(currentUsername);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => onReactMessage(currentParentMessage.id, emoji)}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all cursor-pointer hover:scale-105 ${
                        hasReacted
                          ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-medium"
                          : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800"
                      }`}
                      title={`Reacted by: ${usersList.join(", ")}`}
                    >
                      <span>{emoji}</span>
                      <span className="text-[9px] font-bold font-mono">{usersList.length}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-800/60" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
              {replies.length} {replies.length === 1 ? "Reply" : "Replies"}
            </span>
            <div className="flex-1 h-px bg-slate-800/60" />
          </div>

          {/* Replies list */}
          <div className="space-y-4">
            {replies.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-800/40 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto mb-3">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-300">No replies yet</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                  Be the first to reply to this message and start the thread conversation.
                </p>
              </div>
            ) : (
              replies.map((reply) => {
                const isMe = reply.sender === currentUsername;
                return (
                  <div key={reply.id} className="flex items-start gap-2.5">
                    <button
                      onClick={() => onOpenProfile(reply.sender)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[11px] uppercase shrink-0 border cursor-pointer hover:opacity-80 transition-all mt-0.5 ${getAvatarColor(reply.sender)}`}
                    >
                      {reply.sender.slice(0, 2)}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <button
                          onClick={() => onOpenProfile(reply.sender)}
                          className="text-xs font-semibold text-slate-200 hover:underline cursor-pointer"
                        >
                          {reply.sender}
                        </button>
                        <span className="text-[9px] text-slate-500">{reply.timestamp}</span>
                      </div>
                      
                      {/* Hover Reaction Bar for Reply */}
                      <div className="relative group/reply">
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 p-0.5 rounded-full ${t.headerBg} backdrop-blur-md border ${t.border} shadow-xl opacity-0 scale-90 group-hover/reply:opacity-100 group-hover/reply:scale-100 pointer-events-none group-hover/reply:pointer-events-auto transition-all duration-150 ${
                            isMe ? "right-full mr-1.5" : "left-full ml-1.5"
                          }`}
                        >
                          {["👍", "❤️", "😂", "😮", "😢", "🙏"].map((emoji) => {
                            const hasReacted = reply.reactions?.[emoji]?.includes(currentUsername);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => onReactMessage(reply.id, emoji)}
                                className={`w-5 h-5 flex items-center justify-center text-[10px] rounded-full hover:scale-125 transition-all cursor-pointer ${
                                  hasReacted ? "bg-indigo-500/30 text-indigo-200" : "hover:bg-white/10"
                                }`}
                                title={emoji}
                              >
                                {emoji}
                              </button>
                            );
                          })}
                        </div>

                        <div className={`p-2.5 rounded-xl border text-xs leading-relaxed group/msg relative ${
                          isMe 
                            ? `${t.bubbleMe} border-transparent` 
                            : `${t.bubbleOther} border-transparent`
                        }`}>
                          {(currentUser?.role === "admin" || currentUser?.role === "moderator") && (
                            <button
                              onClick={() => onDeleteMessage(reply.id)}
                              className={`absolute -top-2 ${isMe ? "-left-2" : "-right-2"} w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover/msg:opacity-100 transition-all hover:scale-110 shadow-lg cursor-pointer z-10`}
                              title="Delete Reply (Moderator)"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                          <DecryptedText 
                            text={reply.text}
                            encryptedText={reply.encryptedText}
                            isEncrypted={reply.isEncrypted}
                            room={reply.room}
                            renderText={renderMessageText}
                          />
                          <RichEmbeds text={reply.text} theme={t} />
                        </div>
                      </div>

                      {/* Reply Reactions Container */}
                      {reply.reactions && Object.keys(reply.reactions).length > 0 && (
                        <div className={`flex flex-wrap gap-1 mt-1.5 ${isMe ? "justify-end ml-auto" : "justify-start"}`}>
                          {Object.entries(reply.reactions).map(([emoji, usersList]) => {
                            if (usersList.length === 0) return null;
                            const hasReacted = usersList.includes(currentUsername);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => onReactMessage(reply.id, emoji)}
                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all cursor-pointer hover:scale-105 ${
                                  hasReacted
                                    ? "bg-indigo-500/15 border-indigo-500/40 text-indigo-300 font-medium"
                                    : t.isLight
                                      ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                                      : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-800"
                                }`}
                                title={`Reacted by: ${usersList.join(", ")}`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[9px] font-bold font-mono">{usersList.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={repliesEndRef} />
          </div>

        </div>

        {/* Reply Input Form */}
        <form
          onSubmit={handleSendReply}
          className={`p-4 border-t ${t.border} ${t.headerBg} shrink-0 flex items-center gap-2`}
        >
          <input
            type="text"
            value={replyInput}
            onChange={(e) => setReplyInput(e.target.value)}
            placeholder="Reply to thread..."
            className={`flex-1 px-3.5 py-2 ${t.inputBg} border ${t.border} rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 ${t.accentFocusRing} transition-all`}
          />
          <button
            type="submit"
            disabled={!replyInput.trim()}
            className={`p-2 rounded-xl text-white ${t.accentBg} ${t.accentHoverBg} disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer`}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </motion.div>
    </>
  );
}

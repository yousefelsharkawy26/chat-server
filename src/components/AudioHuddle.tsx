import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, PhoneOff, Users, Volume2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";
import { Theme } from "../contexts/SettingsContext";

interface AudioHuddleProps {
  socket: any;
  room: string;
  currentUser: User;
  theme: Theme;
  onClose: () => void;
}

export function AudioHuddle({ socket, room, currentUser, theme: t, onClose }: AudioHuddleProps) {
  const [participants, setParticipants] = useState<User[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakers, setActiveSpeakers] = useState<Set<string>>(new Set());
  
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const remoteAudiosRef = useRef<Record<string, HTMLAudioElement>>({});

  // Initialize Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (updatedParticipants: User[]) => {
      setParticipants(updatedParticipants);
    };

    const handleAudio = async (payload: { from: string; username: string; data: ArrayBuffer }) => {
      // Logic to play remote audio chunks
      // In a real app, you'd use a BufferQueue or WebRTC
      // For this simplified version, we'll use Blob URL playback
      const blob = new Blob([payload.data], { type: 'audio/webm; codecs=opus' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      
      // Update speaking state
      setActiveSpeakers(prev => {
        const next = new Set(prev);
        next.add(payload.from);
        return next;
      });

      audio.onended = () => {
        setActiveSpeakers(prev => {
          const next = new Set(prev);
          next.delete(payload.from);
          return next;
        });
        URL.revokeObjectURL(url);
      };

      audio.play().catch(e => console.error("Playback failed", e));
    };

    socket.on("huddle:update", handleUpdate);
    socket.on("huddle:audio", handleAudio);

    // Join huddle
    socket.emit("huddle:join");

    return () => {
      socket.off("huddle:update", handleUpdate);
      socket.off("huddle:audio", handleAudio);
      socket.emit("huddle:leave");
      stopRecording();
    };
  }, [socket, room]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm; codecs=opus' });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && socket) {
          e.data.arrayBuffer().then(buffer => {
            socket.emit("huddle:audio", buffer);
          });
        }
      };

      // Start recording with small chunks (200ms) for "live" feel
      recorder.start(200);
      setIsMuted(false);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert("Please allow microphone access to join the huddle.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsMuted(true);
  };

  const toggleMute = () => {
    if (isMuted) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  return (
    <div className={`fixed bottom-24 right-6 z-[60] w-72 flex flex-col gap-3 pointer-events-none`}>
      {/* Live Participants List */}
      <AnimatePresence>
        {participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`pointer-events-auto p-4 rounded-3xl border shadow-2xl backdrop-blur-xl ${
              t.isLight 
                ? "bg-white/90 border-slate-200" 
                : "bg-slate-950/90 border-slate-800"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {participants.slice(0, 3).map((p, i) => (
                    <div 
                      key={p.id}
                      className={`w-6 h-6 rounded-full border-2 ${t.isLight ? "border-white" : "border-slate-950"} flex items-center justify-center text-[8px] font-bold`}
                      style={{ backgroundColor: p.color }}
                    >
                      {p.username.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {participants.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-950 flex items-center justify-center text-[8px] text-white">
                      +{participants.length - 3}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${t.isLight ? "text-slate-400" : "text-slate-500"}`}>
                  Live Huddle
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">{participants.length}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {participants.map((p) => {
                const isSpeaking = activeSpeakers.has(p.id) || (p.username === currentUser.username && !isMuted);
                return (
                  <div key={p.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div 
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white shadow-lg transition-transform ${isSpeaking ? "scale-110" : ""}`}
                          style={{ backgroundColor: p.color }}
                        >
                          {p.username.charAt(0).toUpperCase()}
                        </div>
                        {isSpeaking && (
                          <motion.div 
                            layoutId={`wave-${p.id}`}
                            className="absolute inset-0 rounded-xl border-2 border-emerald-500"
                            animate={{ scale: [1, 1.3, 1], opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-xs font-bold ${t.isLight ? "text-slate-700" : "text-slate-200"}`}>
                          {p.username} {p.username === currentUser.username ? "(You)" : ""}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {isSpeaking ? "Speaking..." : "Listening"}
                        </span>
                      </div>
                    </div>
                    {isSpeaking && <Volume2 className="w-3 h-3 text-emerald-500" />}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 ${
                  isMuted 
                    ? "bg-slate-800 text-slate-400 hover:text-white" 
                    : "bg-emerald-600 text-white shadow-lg shadow-emerald-900/30"
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-bounce" />}
                {isMuted ? "Unmute" : "Muted"}
              </button>
              <button
                onClick={onClose}
                className={`p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 transition-all hover:text-white group`}
                title="Leave Huddle"
              >
                <PhoneOff className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

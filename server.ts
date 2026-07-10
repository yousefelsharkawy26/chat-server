import { GoogleGenAI } from "@google/genai";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

interface User {
  id: string;
  username: string;
  room: string;
  joinTime: string;
  messageCount: number;
  status: "online" | "away" | "busy" | "focus";
  statusText?: string;
  color?: string;
  role: "admin" | "moderator" | "user" | "guest";
  isMuted?: boolean;
  focusConfig?: {
    enabled: boolean;
    allowedUsers: string[];
  };
}

interface Message {
  id: string;
  sender: string;
  text: string;
  encryptedText?: string;
  isEncrypted?: boolean;
  timestamp: string;
  room: string;
  isSystem?: boolean;
  seenBy?: string[];
  audioUrl?: string;
  audioDuration?: number;
  audioTranscription?: string;
  isPinned?: boolean;
  isResolved?: boolean;
  bookmarkedBy?: string[];
  parentId?: string;
  reactions?: { [emoji: string]: string[] };
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(cors());
  app.use(express.json());

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Keep track of active users globally
  // key: socketId -> value: User
  const users: Record<string, User> = {};

  // Keep track of message history per room (up to 100 messages)
  const messageHistory: Record<string, Message[]> = {};

  // Collaborative Canvas State
  const canvasStates: Record<string, any[]> = {};

  // Task Management State
  const taskStates: Record<string, any[]> = {};

  // Audio Huddle State (room -> Set of socket IDs)
  const huddleParticipants: Record<string, Set<string>> = {};

  // Active typing status
  // key: room -> value: Set of typing usernames
  const typingUsers: Record<string, Set<string>> = {};

  // Audit Logs State
  const auditLogs: any[] = [];

  // Custom Emojis State
  const customEmojis: any[] = [];

  // Helper to add audit logs
  function addAuditLog(log: any) {
    const newLog = {
      id: `log-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    auditLogs.push(newLog);
    if (auditLogs.length > 500) auditLogs.shift(); // Keep last 500
    
    // Broadcast to admins
    Object.keys(users).forEach(id => {
      if (users[id].role === "admin") {
        io.to(id).emit("audit_log:new", newLog);
      }
    });
    
    return newLog;
  }

  // Helper for Gemini requests with retry logic
  async function geminiRequest(
    model: string,
    contents: any,
    retries = 3,
    delay = 1000
  ): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      throw new Error("Gemini API key is not configured.");
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    });

    for (let i = 0; i < retries; i++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
        });
        return response;
      } catch (err: any) {
        const isUnavailable = err.status === 503 || 
                             err.message?.includes("503") || 
                             err.message?.includes("high demand") ||
                             err.message?.includes("UNAVAILABLE");
        
        if (isUnavailable && i < retries - 1) {
          console.warn(`Gemini API busy (503), retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw err;
      }
    }
  }

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // User joins a room
    socket.on("join_room", ({ username, room }: { username: string; room: string }) => {
      // Clean up if user was previously connected in another room
      if (users[socket.id]) {
        const prevUser = users[socket.id];
        socket.leave(prevUser.room);
      }

      // Join the socket room
      socket.join(room);

      // Save user state
      const colors = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      users[socket.id] = { 
        id: socket.id, 
        username, 
        room, 
        joinTime: new Date().toISOString(), 
        messageCount: 0, 
        status: "online", 
        statusText: "",
        color: randomColor,
        role: username.toLowerCase().includes("admin") ? "admin" : 
              username.toLowerCase().includes("mod") ? "moderator" :
              username.toLowerCase().includes("guest") ? "guest" : "user",
        isMuted: false,
        focusConfig: {
          enabled: false,
          allowedUsers: []
        }
      };

      console.log(`${username} joined room: ${room}`);

      // Ensure room message history exists
      if (!messageHistory[room]) {
        messageHistory[room] = [];
      }

      // Send message history to the newly joined user
      socket.emit("message_history", messageHistory[room]);

      // Broadcast system join notification to the room
      const systemMessage: Message = {
        id: `sys-${Math.random().toString(36).substring(2, 9)}`,
        sender: "System",
        text: `${username} has joined the chat`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        room,
        isSystem: true,
      };

      messageHistory[room].push(systemMessage);
      if (messageHistory[room].length > 100) {
        messageHistory[room].shift();
      }

      socket.to(room).emit("message", systemMessage);

      // Update room users list
      const roomUsers = Object.values(users).filter((u) => u.room === room);
      io.to(room).emit("room_users", roomUsers);

      // Send initial canvas state if it exists
      if (canvasStates[room]) {
        socket.emit("canvas:init", canvasStates[room]);
      }

      // Send initial tasks if they exist
      if (taskStates[room]) {
        socket.emit("tasks:init", taskStates[room]);
      }

      // Send custom emojis
      socket.emit("emojis:list", customEmojis);
    });

    // --- Collaborative Canvas Handlers ---

    // Handle single element update or creation
    socket.on("canvas:draw", (element: any) => {
      const user = users[socket.id];
      if (!user) return;

      if (!canvasStates[user.room]) {
        canvasStates[user.room] = [];
      }

      // Update or add the element
      const index = canvasStates[user.room].findIndex((el) => el.id === element.id);
      if (index !== -1) {
        canvasStates[user.room][index] = element;
      } else {
        canvasStates[user.room].push(element);
      }

      // Broadcast to others in the room
      socket.to(user.room).emit("canvas:draw", element);
    });

    // Handle full canvas clear
    socket.on("canvas:clear", () => {
      const user = users[socket.id];
      if (!user) return;

      canvasStates[user.room] = [];
      io.to(user.room).emit("canvas:clear");
    });

    // Handle batch sync (e.g. on manual refresh or conflict resolution)
    socket.on("canvas:sync", (elements: any[]) => {
      const user = users[socket.id];
      if (!user) return;

      canvasStates[user.room] = elements;
      socket.to(user.room).emit("canvas:init", elements);
    });

    // --- Task Management Handlers ---

    socket.on("task:create", (task: any) => {
      const user = users[socket.id];
      if (!user) return;

      if (!taskStates[user.room]) {
        taskStates[user.room] = [];
      }

      taskStates[user.room].push(task);
      io.to(user.room).emit("task:create", task);
    });

    socket.on("task:update", (updatedTask: any) => {
      const user = users[socket.id];
      if (!user) return;

      if (!taskStates[user.room]) return;

      const index = taskStates[user.room].findIndex(t => t.id === updatedTask.id);
      if (index !== -1) {
        taskStates[user.room][index] = updatedTask;
        io.to(user.room).emit("task:update", updatedTask);
      }
    });

    socket.on("task:delete", (taskId: string) => {
      const user = users[socket.id];
      if (!user) return;

      if (!taskStates[user.room]) return;

      taskStates[user.room] = taskStates[user.room].filter(t => t.id !== taskId);
      io.to(user.room).emit("task:delete", taskId);
    });

    // --- Audio Huddle Handlers ---

    socket.on("huddle:join", () => {
      const user = users[socket.id];
      if (!user) return;

      if (!huddleParticipants[user.room]) {
        huddleParticipants[user.room] = new Set();
      }
      huddleParticipants[user.room].add(socket.id);
      
      const participantList = Array.from(huddleParticipants[user.room]).map(id => users[id]);
      io.to(user.room).emit("huddle:update", participantList);
    });

    socket.on("huddle:leave", () => {
      const user = users[socket.id];
      if (!user) return;

      if (huddleParticipants[user.room]) {
        huddleParticipants[user.room].delete(socket.id);
        const participantList = Array.from(huddleParticipants[user.room]).map(id => users[id]);
        io.to(user.room).emit("huddle:update", participantList);
      }
    });

    socket.on("huddle:audio", (audioData: ArrayBuffer) => {
      const user = users[socket.id];
      if (!user) return;
      
      // Broadcast audio to everyone else in the huddle
      socket.to(user.room).emit("huddle:audio", {
        from: socket.id,
        username: user.username,
        data: audioData
      });
    });

    socket.on("message:pin", (messageId: string) => {
      const user = users[socket.id];
      if (!user) return;
      const roomMsgs = messageHistory[user.room] || [];
      const msg = roomMsgs.find(m => m.id === messageId);
      if (msg) {
        msg.isPinned = !msg.isPinned;
        io.to(user.room).emit("message:update", msg);
      }
    });

    socket.on("message:star", (messageId: string) => {
      const user = users[socket.id];
      if (!user) return;
      const roomMsgs = messageHistory[user.room] || [];
      const msg = roomMsgs.find(m => m.id === messageId);
      if (msg) {
        if (!msg.bookmarkedBy) msg.bookmarkedBy = [];
        const index = msg.bookmarkedBy.indexOf(socket.id);
        if (index > -1) {
          msg.bookmarkedBy.splice(index, 1);
        } else {
          msg.bookmarkedBy.push(socket.id);
        }
        socket.emit("message:update", msg); // Star is personal, but we can emit to self
      }
    });

    socket.on("message:resolve", (messageId: string) => {
      const user = users[socket.id];
      if (!user) return;
      const roomMsgs = messageHistory[user.room] || [];
      const msg = roomMsgs.find(m => m.id === messageId);
      if (msg) {
        msg.isResolved = !msg.isResolved;
        io.to(user.room).emit("message:update", msg);
      }
    });

    // Handle new message
    socket.on("send_message", ({ text, encryptedText, isEncrypted, audioUrl, audioDuration, parentId }: { text: string; encryptedText?: string; isEncrypted?: boolean; audioUrl?: string; audioDuration?: number; parentId?: string }) => {
      const user = users[socket.id];
      if (!user) return;

      // Permission Check: Muted users or guests in non-guest channels
      if (user.isMuted) {
        socket.emit("error", { message: "You are muted and cannot send messages." });
        return;
      }

      if (user.role === "guest" && !user.room.toLowerCase().includes("lobby")) {
        socket.emit("error", { message: "Guests can only view messages in this channel." });
        return;
      }

      const message: Message = {
        id: `msg-${Math.random().toString(36).substring(2, 9)}`,
        sender: user.username,
        text,
        encryptedText,
        isEncrypted,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        room: user.room,
        seenBy: [],
        audioUrl,
        audioDuration,
        parentId,
      };

      // Add to room history
      if (!messageHistory[user.room]) {
        messageHistory[user.room] = [];
      }
      messageHistory[user.room].push(message);
      if (messageHistory[user.room].length > 100) {
        messageHistory[user.room].shift();
      }

      // Broadcast to everyone in the room
      io.to(user.room).emit("message", message);

      // Increment user's message count and broadcast updated user list
      user.messageCount = (user.messageCount || 0) + 1;
      const roomUsers = Object.values(users).filter((u) => u.room === user.room);
      io.to(user.room).emit("room_users", roomUsers);

      // Start async transcription if there is an audio message
      if (audioUrl && process.env.GEMINI_API_KEY) {
        const match = audioUrl.match(/^data:(audio\/[\w+-]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const data = match[2];
          (async () => {
            try {
              const response = await geminiRequest("gemini-3.5-flash", {
                parts: [
                  { inlineData: { mimeType, data } },
                  { text: "Transcribe the audio accurately. Reply with only the transcription, no quotes, no extra text." }
                ]
              });
              if (response.text) {
                message.audioTranscription = response.text;
                io.to(user.room).emit("message_updated", message);
              }
            } catch (e) {
              console.error("Transcription error:", e);
            }
          })();
        }
      }

    });

    // Handle status updates
    socket.on("update_status", ({ status, statusText }: { status: "online" | "away" | "busy" | "focus"; statusText?: string }) => {
      const user = users[socket.id];
      if (!user) return;

      user.status = status;
      user.statusText = statusText || "";
      
      // Auto-toggle focus config if status is explicitly set to focus
      if (status === "focus") {
        user.focusConfig = { ...user.focusConfig || { allowedUsers: [] }, enabled: true };
      } else {
        user.focusConfig = { ...user.focusConfig || { allowedUsers: [] }, enabled: false };
      }

      // Broadcast updated room users list
      const roomUsers = Object.values(users).filter((u) => u.room === user.room);
      io.to(user.room).emit("room_users", roomUsers);
    });

    // Handle focus mode configuration
    socket.on("update_focus_config", (config: { enabled: boolean; allowedUsers: string[] }) => {
      const user = users[socket.id];
      if (!user) return;

      user.focusConfig = config;
      
      // Also update status if enabled
      if (config.enabled) {
        user.status = "focus";
      } else if (user.status === "focus") {
        user.status = "online";
      }

      const roomUsers = Object.values(users).filter((u) => u.room === user.room);
      io.to(user.room).emit("room_users", roomUsers);
    });

    // Handle pinning/unpinning a message
    socket.on("pin_message", ({ messageId, isPinned }: { messageId: string; isPinned: boolean }) => {
      const user = users[socket.id];
      if (!user) return;

      const roomMsgs = messageHistory[user.room];
      if (!roomMsgs) return;

      const msg = roomMsgs.find((m) => m.id === messageId);
      if (msg && !msg.isSystem) {
        msg.isPinned = isPinned;
        io.to(user.room).emit("message_updated", msg);
      }
    });

    // Handle reacting to a message (toggle behavior)
    socket.on("react_message", ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const user = users[socket.id];
      if (!user) return;

      const roomMsgs = messageHistory[user.room];
      if (!roomMsgs) return;

      const msg = roomMsgs.find((m) => m.id === messageId);
      if (msg && !msg.isSystem) {
        if (!msg.reactions) {
          msg.reactions = {};
        }

        const username = user.username;
        const usernames = msg.reactions[emoji] || [];

        if (usernames.includes(username)) {
          // Remove reaction
          msg.reactions[emoji] = usernames.filter((name) => name !== username);
          if (msg.reactions[emoji].length === 0) {
            delete msg.reactions[emoji];
          }
        } else {
          // Add reaction
          msg.reactions[emoji] = [...usernames, username];
        }

        io.to(user.room).emit("message_updated", msg);
      }
    });

    // Handle custom emoji upload
    socket.on("emoji:upload", ({ name, url }: { name: string; url: string }) => {
      const user = users[socket.id];
      if (!user) return;

      const newEmoji = {
        id: `emoji-${Math.random().toString(36).substring(2, 9)}`,
        name: name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        url,
        creator: user.username,
        createdAt: new Date().toISOString()
      };

      customEmojis.push(newEmoji);
      io.emit("emoji:new", newEmoji);

      addAuditLog({
        action: "Emoji Uploaded",
        actor: user.username,
        details: `Uploaded custom emoji :${newEmoji.name}:`,
        type: "system"
      });
    });

    // Handle custom emoji deletion
    socket.on("emoji:delete", (emojiId: string) => {
      const user = users[socket.id];
      if (!user || user.role !== "admin") return;

      const index = customEmojis.findIndex(e => e.id === emojiId);
      if (index !== -1) {
        const emoji = customEmojis[index];
        customEmojis.splice(index, 1);
        io.emit("emojis:list", customEmojis);

        addAuditLog({
          action: "Emoji Deleted",
          actor: user.username,
          details: `Deleted custom emoji :${emoji.name}:`,
          type: "system"
        });
      }
    });

    // Handle marking a single message as seen
    socket.on("mark_seen", ({ messageId }: { messageId: string }) => {
      const user = users[socket.id];
      if (!user) return;

      const roomMsgs = messageHistory[user.room];
      if (!roomMsgs) return;

      const msg = roomMsgs.find((m) => m.id === messageId);
      if (msg && msg.sender !== user.username && !msg.isSystem) {
        if (!msg.seenBy) {
          msg.seenBy = [];
        }
        if (!msg.seenBy.includes(user.username)) {
          msg.seenBy.push(user.username);
          io.to(user.room).emit("message_updated", msg);
        }
      }
    });

    // Handle marking all messages in the room as seen by this user
    socket.on("mark_all_seen", () => {
      const user = users[socket.id];
      if (!user) return;

      const roomMsgs = messageHistory[user.room];
      if (!roomMsgs) return;

      let updated = false;
      roomMsgs.forEach((msg) => {
        if (msg.sender !== user.username && !msg.isSystem) {
          if (!msg.seenBy) {
            msg.seenBy = [];
          }
          if (!msg.seenBy.includes(user.username)) {
            msg.seenBy.push(user.username);
            updated = true;
          }
        }
      });

      if (updated) {
        io.to(user.room).emit("message_history", roomMsgs);
      }
    });

    // Moderation: Delete Message
    socket.on("message:delete", (messageId: string) => {
      const user = users[socket.id];
      if (!user) return;
      
      // Only admins and moderators can delete messages from others
      // In this simple implementation, we check if the user is admin/moderator
      if (user.role !== "admin" && user.role !== "moderator") {
        socket.emit("error", { message: "Permission denied. Only moderators can delete messages." });
        return;
      }

      // Find and remove message from history
      Object.keys(messageHistory).forEach(room => {
        const index = messageHistory[room].findIndex(m => m.id === messageId);
        if (index !== -1) {
          const msg = messageHistory[room][index];
          messageHistory[room].splice(index, 1);
          // Notify room about deletion
          io.to(room).emit("message:deleted", messageId);
          
          addAuditLog({
            action: "Message Deleted",
            actor: user.username,
            target: msg.sender,
            details: `Deleted message: "${msg.text.substring(0, 30)}${msg.text.length > 30 ? "..." : ""}"`,
            type: "moderation"
          });
        }
      });
    });

    // Moderation: Mute/Unmute User
    socket.on("user:mute", ({ targetUserId, mute }: { targetUserId: string; mute: boolean }) => {
      const user = users[socket.id];
      if (!user) return;

      if (user.role !== "admin" && user.role !== "moderator") {
        socket.emit("error", { message: "Permission denied. Only moderators can mute users." });
        return;
      }

      const targetUser = users[targetUserId];
      if (targetUser) {
        // Prevent moderators from muting admins
        if (targetUser.role === "admin" && user.role === "moderator") {
          socket.emit("error", { message: "Moderators cannot mute admins." });
          return;
        }

        targetUser.isMuted = mute;
        io.to(targetUser.room).emit("room_users", Object.values(users).filter(u => u.room === targetUser.room));
        
        // Notify the target user specifically
        io.to(targetUserId).emit("user:muted_status", mute);

        addAuditLog({
          action: mute ? "User Muted" : "User Unmuted",
          actor: user.username,
          target: targetUser.username,
          details: `${mute ? "Muted" : "Unmuted"} user in room ${targetUser.room}`,
          type: "moderation"
        });
      }
    });

    // Moderation: Set User Role
    socket.on("user:set_role", ({ targetUserId, role }: { targetUserId: string; role: string }) => {
      const user = users[socket.id];
      if (!user) return;

      // Only admins can change roles
      if (user.role !== "admin") {
        socket.emit("error", { message: "Permission denied. Only admins can change roles." });
        return;
      }

      const targetUser = users[targetUserId];
      if (targetUser) {
        const oldRole = targetUser.role;
        targetUser.role = role as any;
        io.to(targetUser.room).emit("room_users", Object.values(users).filter(u => u.room === targetUser.room));

        addAuditLog({
          action: "Role Changed",
          actor: user.username,
          target: targetUser.username,
          details: `Changed role from ${oldRole} to ${role}`,
          type: "security"
        });
      }
    });

    // Admin: Fetch Audit Logs
    socket.on("audit_logs:fetch", () => {
      const user = users[socket.id];
      if (user && user.role === "admin") {
        socket.emit("audit_logs:list", auditLogs);
      } else {
        socket.emit("error", { message: "Access denied." });
      }
    });

    // Handle typing status
    socket.on("typing", ({ isTyping }: { isTyping: boolean }) => {
      const user = users[socket.id];
      if (!user) return;

      if (!typingUsers[user.room]) {
        typingUsers[user.room] = new Set();
      }

      if (isTyping) {
        typingUsers[user.room].add(user.username);
      } else {
        typingUsers[user.room].delete(user.username);
      }

      // Emit array of currently typing users (excluding the user themselves is handled on client or server side)
      socket.to(user.room).emit("typing_users", Array.from(typingUsers[user.room]));
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      const user = users[socket.id];
      if (user) {
        const { username, room } = user;
 
        // Remove from huddle if present
        if (huddleParticipants[room]) {
          huddleParticipants[room].delete(socket.id);
          const participantList = Array.from(huddleParticipants[room]).map(id => users[id]);
          io.to(room).emit("huddle:update", participantList);
        }

        delete users[socket.id];

        console.log(`${username} left room: ${room}`);

        // Remove from typing set
        if (typingUsers[room]) {
          typingUsers[room].delete(username);
          socket.to(room).emit("typing_users", Array.from(typingUsers[room]));
        }

        // Broadcast system leave notification
        const systemMessage: Message = {
          id: `sys-${Math.random().toString(36).substring(2, 9)}`,
          sender: "System",
          text: `${username} has left the chat`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          room,
          isSystem: true,
        };

        if (messageHistory[room]) {
          messageHistory[room].push(systemMessage);
          if (messageHistory[room].length > 100) {
            messageHistory[room].shift();
          }
        }

        socket.to(room).emit("message", systemMessage);

        // Update room users list
        const roomUsers = Object.values(users).filter((u) => u.room === room);
        io.to(room).emit("room_users", roomUsers);
      }
    });
  });

  // Health check API
  
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { room } = req.body;
      const history = messageHistory[room] || [];
      const chatText = history.map(m => `[${m.timestamp}] ${m.sender}: ${m.text}`).join("\n");
      
      const response = await geminiRequest("gemini-3.5-flash", 
        `Summarize the following chat history in a concise, bulleted list. Catch the user up on what happened.\n\nChat history:\n${chatText}`
      );
      res.json({ summary: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to summarize" });
    }
  });

  app.post("/api/gemini/search", async (req, res) => {
    try {
      const { room, query } = req.body;
      const history = messageHistory[room] || [];
      const chatText = history.map(m => `[${m.timestamp}] ${m.sender}: ${m.text}`).join("\n");
      
      const response = await geminiRequest("gemini-3.5-flash", 
        `Answer the following query based on the chat history.\n\nQuery: ${query}\n\nChat history:\n${chatText}`
      );
      res.json({ answer: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  app.post("/api/gemini/rewrite", async (req, res) => {
    try {
      const { text, instruction } = req.body;
      const response = await geminiRequest("gemini-3.5-flash", 
        `Rewrite the following text based on the instruction. Return ONLY the rewritten text, no quotes or additional context.\n\nInstruction: ${instruction}\n\nText: ${text}`
      );
      res.json({ result: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to rewrite" });
    }
  });

  app.post("/api/gemini/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      const response = await geminiRequest("gemini-3.5-flash", 
        `Translate the following text to ${targetLanguage}. Return ONLY the translated text.\n\nText: ${text}`
      );
      res.json({ result: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to translate" });
    }
  });

app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", connections: Object.keys(users).length });
  });

  // Vite Integration for full-stack build
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

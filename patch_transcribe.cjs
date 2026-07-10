const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

if (!code.includes('@google/genai')) {
  code = `import { GoogleGenAI } from "@google/genai";\n` + code;
}

const emitLine = `io.to(user.room).emit("room_users", roomUsers);`;

const newCode = emitLine + `\n
      // Start async transcription if there is an audio message
      if (audioUrl && process.env.GEMINI_API_KEY) {
        const match = audioUrl.match(/^data:(audio\\/[\\w+-]+);base64,(.+)$/);
        if (match) {
          const mimeType = match[1];
          const data = match[2];
          (async () => {
            try {
              const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
              const response = await ai.models.generateContent({
                model: "gemini-3.5-flash",
                contents: {
                  parts: [
                    { inlineData: { mimeType, data } },
                    { text: "Transcribe the audio accurately. Reply with only the transcription, no quotes, no extra text." }
                  ]
                }
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
`;

code = code.replace(emitLine, newCode);
fs.writeFileSync('server.ts', code);

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const anchor = `app.get("/api/health", (req, res) => {`;
const newEndpoints = `
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { room } = req.body;
      const history = messageHistory[room] || [];
      const chatText = history.map(m => \`[\${m.timestamp}] \${m.sender}: \${m.text}\`).join("\\n");
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: \`Summarize the following chat history in a concise, bulleted list. Catch the user up on what happened.\\n\\nChat history:\\n\${chatText}\`
      });
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
      const chatText = history.map(m => \`[\${m.timestamp}] \${m.sender}: \${m.text}\`).join("\\n");
      
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: \`Answer the following query based on the chat history.\\n\\nQuery: \${query}\\n\\nChat history:\\n\${chatText}\`
      });
      res.json({ answer: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to search" });
    }
  });

  app.post("/api/gemini/rewrite", async (req, res) => {
    try {
      const { text, instruction } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: \`Rewrite the following text based on the instruction. Return ONLY the rewritten text, no quotes or additional context.\\n\\nInstruction: \${instruction}\\n\\nText: \${text}\`
      });
      res.json({ result: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to rewrite" });
    }
  });

  app.post("/api/gemini/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: \`Translate the following text to \${targetLanguage}. Return ONLY the translated text.\\n\\nText: \${text}\`
      });
      res.json({ result: response.text });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to translate" });
    }
  });

`;

code = code.replace(anchor, newEndpoints + anchor);
fs.writeFileSync('server.ts', code);

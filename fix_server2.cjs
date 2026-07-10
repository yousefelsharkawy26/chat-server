const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /socket\.on\("send_message", \(\{ text, audioUrl, audioDuration, parentId \}: \{ text: string; audioUrl\?: string; audioDuration\?: number; parentId\?: string \}\) => \{\r?\n\s*audioTranscription\?: string;\r?\n\s*const user = users\[socket\.id\];/g;

code = code.replace(regex, `socket.on("send_message", ({ text, audioUrl, audioDuration, parentId }: { text: string; audioUrl?: string; audioDuration?: number; parentId?: string }) => {\n      const user = users[socket.id];`);

fs.writeFileSync('server.ts', code);

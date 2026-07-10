const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /socket\.on\("send_message", \(\{ text, audioUrl, audioDuration, parentId \}: \{ text: string; audioUrl\?: string; audioDuration\?: number;\n  audioTranscription\?: string;\n parentId\?: string \}\) => \{/;

code = code.replace(regex, `socket.on("send_message", ({ text, audioUrl, audioDuration, parentId }: { text: string; audioUrl?: string; audioDuration?: number; parentId?: string }) => {`);

fs.writeFileSync('server.ts', code);

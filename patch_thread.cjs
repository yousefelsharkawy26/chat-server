const fs = require('fs');
let code = fs.readFileSync('src/components/ThreadDrawer.tsx', 'utf8');

const regex = /\{\s*currentParentMessage\.audioUrl\s*\?\s*\(\s*<div className="mt-1">\s*<VoicePlayer\s*src=\{currentParentMessage\.audioUrl\}\s*duration=\{currentParentMessage\.audioDuration\}\s*isMe=\{currentParentMessage\.sender === currentUsername\}\s*theme=\{t\}\s*\/>\s*<\/div>\s*\)\s*:\s*\(\s*<p className="text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed pl-1">\s*\{currentParentMessage\.text\}\s*<\/p>\s*\)\s*\}/m;

const replacement = `{currentParentMessage.audioUrl ? (
              <div className="mt-1 flex flex-col gap-2">
                <VoicePlayer
                  src={currentParentMessage.audioUrl}
                  duration={currentParentMessage.audioDuration}
                  isMe={currentParentMessage.sender === currentUsername}
                  theme={t}
                />
                {currentParentMessage.audioTranscription && (
                  <div className={\`text-xs p-2 rounded-lg border \${currentParentMessage.sender === currentUsername ? 'bg-indigo-900/30 border-indigo-400/30 text-indigo-100' : 'bg-slate-900/30 border-slate-700/50 text-slate-300'}\`}>
                    <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase tracking-wider opacity-70">
                      Transcript
                    </div>
                    <p className="whitespace-pre-wrap break-words">{currentParentMessage.audioTranscription}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-300 whitespace-pre-wrap break-words leading-relaxed pl-1">
                {currentParentMessage.text}
              </p>
            )}`;

if(code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/components/ThreadDrawer.tsx', code);
  console.log('patched');
} else {
  console.log('not found');
}

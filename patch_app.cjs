const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\s*msg\.audioUrl\s*\?\s*\(\s*<div className="mb-1">\s*<VoicePlayer src=\{msg\.audioUrl\} duration=\{msg\.audioDuration\} isMe=\{isMe\} theme=\{t\} \/>\s*<\/div>\s*\)\s*:\s*\(\s*<p className="whitespace-pre-wrap break-words">\{renderMessageText\(msg\.text\)\}<\/p>\s*\)\s*\}/m;

const replacement = `{msg.audioUrl ? (
                                  <div className="mb-1 flex flex-col gap-2">
                                    <VoicePlayer src={msg.audioUrl} duration={msg.audioDuration} isMe={isMe} theme={t} />
                                    {msg.audioTranscription && (
                                      <div className={\`text-xs p-2 rounded-lg border \${isMe ? 'bg-indigo-900/30 border-indigo-400/30 text-indigo-100' : 'bg-slate-900/30 border-slate-700/50 text-slate-300'}\`}>
                                        <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold uppercase tracking-wider opacity-70">
                                          <Sparkles className="w-3 h-3" /> Transcript
                                        </div>
                                        <p className="whitespace-pre-wrap break-words">{msg.audioTranscription}</p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="whitespace-pre-wrap break-words">{renderMessageText(msg.text)}</p>
                                )}`;

if(code.match(regex)) {
  code = code.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched');
} else {
  console.log('not found');
}

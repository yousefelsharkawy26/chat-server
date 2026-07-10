const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = `<input
                            ref={inputRef}
                            type="text"
                            maxLength={500}
                            value={messageInput}
                            onChange={handleInputChange}
                            placeholder={\`Send a message to #\${room}...\`}
                            className={\`w-full pl-4 pr-12 py-3 \${t.inputBg} border \${t.border} focus:outline-none focus:ring-2 \${t.accentFocusRing} rounded-xl text-slate-100 transition-all text-sm\`}
                            onKeyDown={handleInputKeyDown}
                          />`;

const replacement = `<input
                            ref={inputRef}
                            type="text"
                            maxLength={500}
                            value={messageInput}
                            onChange={handleInputChange}
                            placeholder={\`Send a message to #\${room}...\`}
                            className={\`w-full pl-4 pr-[88px] py-3 \${t.inputBg} border \${t.border} focus:outline-none focus:ring-2 \${t.accentFocusRing} rounded-xl text-slate-100 transition-all text-sm\`}
                            onKeyDown={handleInputKeyDown}
                          />
                          
                          {/* AI Tools for Input */}
                          <div className="absolute right-12 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            <button
                              onClick={async () => {
                                if (!messageInput.trim()) return;
                                const instruction = prompt("How would you like to rewrite this? (e.g. 'more professional', 'friendlier')", "more professional");
                                if (!instruction) return;
                                try {
                                  const res = await fetch("/api/gemini/rewrite", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ text: messageInput, instruction })
                                  });
                                  const data = await res.json();
                                  if (data.result) {
                                    setMessageInput(data.result);
                                  }
                                } catch(e) {
                                  alert("Failed to rewrite");
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="AI Rewrite"
                            >
                              <Sparkles className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!messageInput.trim()) return;
                                const targetLanguage = prompt("Which language to translate to?", "Spanish");
                                if (!targetLanguage) return;
                                try {
                                  const res = await fetch("/api/gemini/translate", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ text: messageInput, targetLanguage })
                                  });
                                  const data = await res.json();
                                  if (data.result) {
                                    setMessageInput(data.result);
                                  }
                                } catch(e) {
                                  alert("Failed to translate");
                                }
                              }}
                              className="p-1.5 text-slate-500 hover:text-sky-400 rounded-lg hover:bg-slate-800 transition-colors"
                              title="Translate"
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          </div>
`;

code = code.replace(anchor, replacement);

if(!code.includes('import { Globe')) {
  code = code.replace('from "lucide-react";', 'Globe, \n} from "lucide-react";');
}

fs.writeFileSync('src/App.tsx', code);

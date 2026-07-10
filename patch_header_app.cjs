const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = `{/* Message Search Bar */}`;
const summarizeBtn = `
                    {/* Summarize Channel Button */}
                    <button
                      onClick={async () => {
                        const originalSearch = searchQuery;
                        setSearchQuery("Summarizing...");
                        try {
                          const res = await fetch("/api/gemini/summarize", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ room })
                          });
                          const data = await res.json();
                          if (data.summary) {
                            alert("Channel Summary:\\n\\n" + data.summary);
                          } else {
                            alert("Failed to summarize.");
                          }
                        } catch (e) {
                          alert("Error during summarization.");
                        } finally {
                          setSearchQuery(originalSearch);
                        }
                      }}
                      className={\`p-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 \${t.isLight ? "bg-slate-200 border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-300" : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"}\`}
                      title="Catch Me Up (Summarize)"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    </button>

`;

code = code.replace(anchor, summarizeBtn + anchor);

// Semantic Search
const searchAnchor = `<input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}`;

const newSearchInput = `<input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && searchQuery.trim() !== '') {
                             const q = searchQuery;
                             setSearchQuery("Searching...");
                             try {
                               const res = await fetch("/api/gemini/search", {
                                 method: "POST",
                                 headers: { "Content-Type": "application/json" },
                                 body: JSON.stringify({ room, query: q })
                               });
                               const data = await res.json();
                               if (data.answer) {
                                 alert("AI Answer:\\n\\n" + data.answer);
                               }
                             } catch (e) {
                               alert("Search failed");
                             } finally {
                               setSearchQuery("");
                             }
                          }
                        }}`;
                        
code = code.replace(searchAnchor, newSearchInput);

fs.writeFileSync('src/App.tsx', code);

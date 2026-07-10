const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">[\s\S]*?<button\s+onClick=\{\(\) => \{\s+const nextVal = !soundEnabled;[\s\S]*?<\/button>\s*\{hasJoined/m;

const replacement = `<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className={\`flex items-center gap-1.5 p-1.5 sm:p-2 rounded-xl \${t.cardBg} border \${t.border} transition-colors cursor-pointer text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800\`}
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
          {hasJoined`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', code);

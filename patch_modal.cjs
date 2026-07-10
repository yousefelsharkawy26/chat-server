const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `<SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
      </main>`;

code = code.replace("</main>", replacement);
fs.writeFileSync('src/App.tsx', code);

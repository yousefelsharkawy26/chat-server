const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/\} Globe, \n\} from "lucide-react";/g, ', Globe\n} from "lucide-react";');
fs.writeFileSync('src/App.tsx', code);

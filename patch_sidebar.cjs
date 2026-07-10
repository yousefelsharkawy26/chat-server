const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\s*{\/\* Custom Chat Background Section \*\/}[\s\S]*?\{\/\* Switch room quickly footer \*\/\}/;
code = code.replace(regex, `                    {/* Switch room quickly footer */}`);

fs.writeFileSync('src/App.tsx', code);

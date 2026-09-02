const fs = require('fs');
const filePath = 'd:/avo-maitrise/front/src/app/home/home.html';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/\bspace-x-([0-9]+)\b/g, 'gap-$1');
content = content.replace(/\bleft-/g, 'start-');
content = content.replace(/\bright-/g, 'end-');
content = content.replace(/\bpl-/g, 'ps-');
content = content.replace(/\bpr-/g, 'pe-');
content = content.replace(/\bml-/g, 'ms-');
content = content.replace(/\bmr-/g, 'me-');

// Fix the RTL override bug by forcing translate-x-0 on desktop
content = content.replace('lg:translate-x-0', 'lg:!translate-x-0');

fs.writeFileSync(filePath, content);
console.log('Fixed spacing, physical properties, and RTL override in home.html');

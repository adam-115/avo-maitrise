const fs = require('fs');
const path = require('path');

function replaceRtl(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  content = content.replace(/\bleft-/g, 'start-');
  content = content.replace(/\bright-/g, 'end-');
  content = content.replace(/\bpl-/g, 'ps-');
  content = content.replace(/\bpr-/g, 'pe-');
  content = content.replace(/\bml-/g, 'ms-');
  content = content.replace(/\bmr-/g, 'me-');
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Updated RTL for', filePath);
  }
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.html')) {
      replaceRtl(fullPath);
    }
  }
}

processDirectory('d:/avo-maitrise/front/src/app/administration');

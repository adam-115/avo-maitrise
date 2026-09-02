const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      if (content.includes("import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';")) {
        content = content.replace(
          "import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';",
          "import { TranslateModule } from '@ngx-translate/core';"
        );
        changed = true;
      }

      if (content.includes('TranslatePipe, TranslateDirective')) {
        content = content.replace(/TranslatePipe,\s*TranslateDirective/g, 'TranslateModule');
        changed = true;
      }

      if (content.includes('TranslatePipe,TranslateDirective')) {
        content = content.replace(/TranslatePipe,TranslateDirective/g, 'TranslateModule');
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log('Fixed', fullPath);
      }
    }
  }
}

processDir('d:/avo-maitrise/front/src/app/due-diligence');
processDir('d:/avo-maitrise/front/src/app/dossier');

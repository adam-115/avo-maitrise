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

      // Fix the import statement
      if (content.includes("import { TranslateModule } from '@ngx-translate/core';")) {
        content = content.replace(
          "import { TranslateModule } from '@ngx-translate/core';",
          "import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';"
        );
        changed = true;
      }
      if (!content.includes("import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';") && 
          !content.includes("import { TranslateModule } from '@ngx-translate/core';") &&
          content.includes('TranslatePipe')) {
          // just in case
      }

      // Fix the imports array
      const importsRegex = /imports:\s*\[([^\]]+)\]/;
      const match = content.match(importsRegex);
      if (match) {
        let importsStr = match[1];
        let newImportsStr = importsStr;
        
        // Remove TranslateModule if present
        newImportsStr = newImportsStr.replace(/,\s*TranslateModule/g, '');
        newImportsStr = newImportsStr.replace(/TranslateModule\s*,/g, '');
        newImportsStr = newImportsStr.replace(/TranslateModule/g, '');

        // Add TranslatePipe, TranslateDirective if not present
        if (!newImportsStr.includes('TranslatePipe')) {
          newImportsStr += ', TranslatePipe, TranslateDirective';
          changed = true;
        }

        if (importsStr !== newImportsStr) {
          content = content.replace(importsRegex, `imports: [${newImportsStr}]`);
          changed = true;
        }
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

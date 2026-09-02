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

      // Ensure TranslatePipe is in imports array
      const importsRegex = /imports:\s*\[([^\]]+)\]/;
      const match = content.match(importsRegex);
      if (match) {
        let importsStr = match[1];
        if (!importsStr.includes('TranslatePipe')) {
          importsStr += ', TranslatePipe, TranslateDirective';
          content = content.replace(importsRegex, `imports: [${importsStr}]`);
          changed = true;
        }

        // Check if top import exists
        if (!content.includes("from '@ngx-translate/core'") && !content.includes('from "@ngx-translate/core"')) {
          // Add it after the last import
          const lastImportIndex = content.lastIndexOf('import ');
          const endOfLastImport = content.indexOf('\n', lastImportIndex);
          content = content.substring(0, endOfLastImport + 1) + 
                    "import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';\n" + 
                    content.substring(endOfLastImport + 1);
          changed = true;
        } else {
            // It has an import from ngx-translate. Ensure TranslatePipe and TranslateDirective are there.
            const ngxRegex = /import\s+{([^}]+)}\s+from\s+['"]@ngx-translate\/core['"]/;
            const ngxMatch = content.match(ngxRegex);
            if (ngxMatch) {
                let namedImports = ngxMatch[1];
                let ngxChanged = false;
                if (!namedImports.includes('TranslatePipe')) {
                    namedImports += ', TranslatePipe';
                    ngxChanged = true;
                }
                if (!namedImports.includes('TranslateDirective')) {
                    namedImports += ', TranslateDirective';
                    ngxChanged = true;
                }
                if (ngxChanged) {
                    content = content.replace(ngxRegex, `import {${namedImports}} from '@ngx-translate/core'`);
                    changed = true;
                }
            }
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

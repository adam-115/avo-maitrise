const fs = require('fs');
let code = fs.readFileSync('src/app/app.routes.ts', 'utf8');

// match standard single-line imports
const importRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]([^'"]+)['"]\s*;/g;
let match;
let importsMap = {};

while ((match = importRegex.exec(code)) !== null) {
    const compNamesStr = match[1];
    const compNames = compNamesStr.split(',').map(n => n.trim());
    const path = match[2];
    for (const comp of compNames) {
        importsMap[comp] = path;
    }
}

// Some manually added ones or multiline ones if any:
// just to be thorough we can match component: ComponentName and look for its import
let replacedComps = new Set();
let modified = code.replace(/component:\s*([A-Za-z0-9_]+)/g, (fullMatch, compName) => {
    if (importsMap[compName]) {
        replacedComps.add(compName);
        return `loadComponent: () => import('${importsMap[compName]}').then(m => m.${compName})`;
    }
    return fullMatch;
});

// Now remove the import statements for the ones we replaced.
// Since they might be the only ones on that line, we can just remove the whole import line.
for (const comp of replacedComps) {
    const escapedComp = comp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const importToRemove = new RegExp(`import\\s*\\{\\s*${escapedComp}\\s*\\}\\s*from\\s*['"]${importsMap[comp]}['"]\\s*;\\r?\\n?`, 'g');
    modified = modified.replace(importToRemove, '');
}

fs.writeFileSync('src/app/app.routes.ts', modified);
console.log("Replaced component with loadComponent for: " + Array.from(replacedComps).join(', '));

const fs = require('fs');

let content = fs.readFileSync('d:/avo-maitrise/front/src/app/home/home.html', 'utf8');

// Add Arabic option
content = content.replace(
  `<option value="it" class="bg-slate-800 text-white">{{ 'LANGUAGE.IT' | translate }}</option>`,
  `<option value="it" class="bg-slate-800 text-white">{{ 'LANGUAGE.IT' | translate }}</option>\n                    <option value="ar" class="bg-slate-800 text-white">{{ 'LANGUAGE.AR' | translate }}</option>`
);

// Sidebar RTL adjustments
content = content.replace(`class="fixed inset-y-0 left-0`, `class="fixed inset-y-0 start-0`);
content = content.replace(`'-translate-x-full ease-in'`, `'-translate-x-full rtl:translate-x-full ease-in'`);

// Language selector RTL adjustments
content = content.replace(`pl-3 pr-8`, `ps-3 pe-8`);
content = content.replace(`right-0 flex items-center pr-4`, `end-0 flex items-center pe-4`);

// Mobile close button RTL adjustments
content = content.replace(`right-4 top-4`, `end-4 top-4`);

// Mobile header adjustments
content = content.replace(`-ml-2 text-gray-400`, `-ms-2 text-gray-400`);

fs.writeFileSync('d:/avo-maitrise/front/src/app/home/home.html', content);
console.log('home.html updated with RTL support');

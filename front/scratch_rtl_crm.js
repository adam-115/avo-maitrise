const fs = require('fs');

function replaceRtl(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\bleft-/g, 'start-');
  content = content.replace(/\bright-/g, 'end-');
  content = content.replace(/\bpl-/g, 'ps-');
  content = content.replace(/\bpr-/g, 'pe-');
  content = content.replace(/\bml-/g, 'ms-');
  content = content.replace(/\bmr-/g, 'me-');
  fs.writeFileSync(filePath, content);
  console.log('Updated RTL for', filePath);
}

replaceRtl('d:/avo-maitrise/front/src/app/Crm/client-form/client-form.component.html');
replaceRtl('d:/avo-maitrise/front/src/app/Crm/client-details/client-details.component.html');
replaceRtl('d:/avo-maitrise/front/src/app/Crm/crm/crm.html');


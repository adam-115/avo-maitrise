const fs = require('fs');

function replaceRtl(filePath) {
  if (!fs.existsSync(filePath)) return;
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

const basePath = 'd:/avo-maitrise/front/src/app/features/billing/components/';
replaceRtl(basePath + 'invoice-preview/invoice-preview.component.html');
replaceRtl(basePath + 'invoice-list/invoice-list.component.html');
replaceRtl(basePath + 'invoice-frm/invoice-frm.component.html');
replaceRtl(basePath + 'invoice-editor/invoice-editor.component.html');
replaceRtl(basePath + 'billing-dashboard/billing-dashboard.component.html');


const fs = require('fs');
const path = require('path');

const workerPath = path.join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.js');
const destPath = path.join(__dirname, '../public/pdf.worker.min.js');

fs.copyFileSync(workerPath, destPath);
console.log('PDF.js worker file copied to public folder'); 
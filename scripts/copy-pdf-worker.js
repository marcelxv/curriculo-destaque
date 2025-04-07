import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const workerUrl = 'https://unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js';
const destPath = join(__dirname, '../public/pdf.worker.min.js');

// Create public directory if it doesn't exist
const publicDir = join(__dirname, '../public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Download worker file
https.get(workerUrl, (response) => {
  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    writeFileSync(destPath, data);
    console.log('PDF.js worker file downloaded and saved to public folder');
  });
}).on('error', (error) => {
  console.error('Error downloading PDF.js worker file:', error);
  process.exit(1);
}); 
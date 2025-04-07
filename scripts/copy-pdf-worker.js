import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Match the version in package.json (5.1.91)
const workerUrl = 'https://unpkg.com/pdfjs-dist@5.1.91/build/pdf.worker.min.js';
const destPath = join(__dirname, '../public/pdf.worker.min.js');

// Create public directory if it doesn't exist
const publicDir = join(__dirname, '../public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

// Download worker file with proper error handling
https.get(workerUrl, (response) => {
  if (response.statusCode !== 200) {
    console.error(`Failed to download worker file: ${response.statusCode} ${response.statusMessage}`);
    process.exit(1);
  }

  let data = '';
  
  response.on('data', (chunk) => {
    data += chunk;
  });
  
  response.on('end', () => {
    try {
      writeFileSync(destPath, data);
      console.log('✅ PDF.js worker file downloaded and saved to public folder');
    } catch (error) {
      console.error('Failed to write worker file:', error);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('Error downloading PDF.js worker file:', error);
  process.exit(1);
}); 
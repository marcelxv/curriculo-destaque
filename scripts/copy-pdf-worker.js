import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Updated path for pdfjs-dist v5.x ESM build
const workerSrc = join(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.min.mjs');
const destPath = join(__dirname, '../public/pdf.worker.min.mjs');

// Create public directory if it doesn't exist
const publicDir = join(__dirname, '../public');
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

try {
  // Ensure source file exists
  if (!existsSync(workerSrc)) {
    console.error(`PDF.js worker file not found at: ${workerSrc}\nPlease ensure pdfjs-dist is installed correctly.`);
    process.exit(1);
  }

  // Copy the file
  copyFileSync(workerSrc, destPath);
  console.log('✅ PDF.js worker file copied to public folder');
} catch (error) {
  console.error('Failed to copy PDF.js worker file:', error);
  process.exit(1);
} 
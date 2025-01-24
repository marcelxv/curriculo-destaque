"use client";

import * as PDFJS from 'pdfjs-dist/webpack.mjs';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

// Increase timeout for larger files
const TIMEOUTS = {
  pdfLoading: 60000,    // 1 minute for initial PDF loading
  pageLoading: 30000,   // 30 seconds per page
  bufferLoading: 20000  // 20 seconds for buffer loading
};

if (typeof window !== 'undefined') {
  PDFJS.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  console.log('🔧 PDF.js worker initialized');
}

async function timeoutPromise<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout: ${operation} took longer than ${ms/1000} segundos`));
    }, ms);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

export async function parseFile(file: File) {
  const buffer = await file.arrayBuffer();
  
  if (file.type === 'application/pdf') {
    const data = await PDFJS.getDocument({ data: buffer }).promise;
    let text = '';
    for (let i = 1; i <= data.numPages; i++) {
      const page = await data.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => 'str' in item ? item.str : '').join(' ') + '\n';
    }
    return text.trim();
  }
  
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    throw new Error('Por favor, converta o arquivo DOCX para PDF antes de enviar.');
  }

  throw new Error('Formato não suportado');
}

interface PDFTextContent {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

export async function parseResume(file: File): Promise<string> {
  try {
    if (file.type === 'application/pdf') {
      console.log('📄 Processing PDF:', {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)}KB`
      });

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFJS.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${PDFJS.version}/standard_fonts/`,
      }).promise;

      console.log('📑 PDF loaded:', {
        pages: pdf.numPages,
        fingerprint: pdf.fingerprint
      });

      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        
        // Group text items by their vertical position
        const lineMap = new Map<number, PDFTextContent[]>();
        
        content.items.forEach((item: any) => {
          if (!item.str.trim()) return;
          
          const y = Math.round(item.transform[5]); // Vertical position
          const line = lineMap.get(y) || [];
          line.push(item);
          lineMap.set(y, line);
        });

        // Sort lines from top to bottom and items from left to right
        const sortedLines = Array.from(lineMap.entries())
          .sort(([y1], [y2]) => y2 - y1) // Sort lines by vertical position
          .map(([_, items]) => 
            items
              .sort((a, b) => a.transform[4] - b.transform[4]) // Sort items by horizontal position
              .map(item => item.str)
              .join(' ')
          );

        const pageText = sortedLines.join('\n');
        
        console.log(`📃 Page ${i}/${pdf.numPages}:`, {
          lines: sortedLines.length,
          characters: pageText.length,
        });
        
        fullText += pageText + '\n\n';
      }

      // Clean and normalize text
      const cleanText = fullText
        .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
        .replace(/\n{3,}/g, '\n\n')   // Reduce multiple line breaks
        .replace(/[^\S\r\n]+/g, ' ')  // Replace horizontal whitespace with single space
        .trim();

      console.log('📊 Text extracted:', {
        originalLength: fullText.length,
        cleanLength: cleanText.length,
        words: cleanText.split(/\s+/).length,
        reduction: `${((fullText.length - cleanText.length) / fullText.length * 100).toFixed(1)}%`
      });

      return cleanText;
    }
    
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      throw new Error('Por favor, converta o arquivo DOCX para PDF antes de enviar.');
    }
    
    // For plain text files
    const content = await file.text();
    return content.replace(/\s+/g, ' ').trim();
      
  } catch (error) {
    console.error('❌ Error processing file:', {
      error,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });
    
    if (error instanceof Error) {
      if (error.message.includes('Password')) {
        throw new Error('Este PDF está protegido. Por favor, remova a senha e tente novamente.');
      }
      if (error.message.includes('Invalid')) {
        throw new Error('O arquivo PDF está corrompido. Por favor, tente outro arquivo.');
      }
      throw new Error('Erro ao processar o arquivo. Por favor, verifique se é um PDF válido.');
    }
    
    throw new Error('Erro ao ler o arquivo.');
  }
}

async function processPage(pdfDoc: any, pageNum: number): Promise<string> {
  try {
    const page = await pdfDoc.getPage(pageNum);
    const content = await page.getTextContent();
    
    return content.items
      .filter((item): item is TextItem => 'str' in item)
      .map(item => item.str)
      .join(' ');
  } catch (error) {
    console.warn(`⚠️ Error on page ${pageNum}:`, error);
    return ''; // Skip problematic pages
  }
}
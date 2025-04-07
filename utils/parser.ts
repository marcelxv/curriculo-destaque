"use client";

import * as PDFJS from 'pdfjs-dist/webpack.mjs';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Increase timeout for larger files
const TIMEOUT = 30000; // 30 seconds

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
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFJS.getDocument(arrayBuffer).promise;

    console.log('📑 PDF loaded:', {
      pages: pdf.numPages,
      fingerprints: pdf.fingerprints
    });

    let fullText = '';
    
    // Process all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      // @ts-expect-error - PDF.js types are not fully accurate
      const pageText = textContent.items.map(item => item.str || '').join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file');
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
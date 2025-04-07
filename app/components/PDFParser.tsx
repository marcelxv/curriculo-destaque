'use client';

import { useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist/build/pdf.min.mjs';

export interface PDFParserProps {
  file: File;
  onParse: (text: string) => Promise<void>;
  onError?: (error: Error) => void;
}

export default function PDFParser({ file, onParse, onError }: PDFParserProps) {
  const workerInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || workerInitialized.current) return;

    const initWorker = async () => {
      try {
        console.log('🔄 Initializing PDF.js worker...');
        
        // Check if worker is already set
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          // Fetch worker to ensure it exists
          const response = await fetch('/pdf.worker.min.mjs');
          if (!response.ok) {
            throw new Error(`Failed to load PDF.js worker: ${response.status} ${response.statusText}`);
          }
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        }
        
        workerInitialized.current = true;
        console.log('✅ PDF.js worker initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize PDF.js worker:', error);
        onError?.(new Error('Falha ao inicializar o processador de PDF. Por favor, recarregue a página e tente novamente.'));
      }
    };

    initWorker();
  }, [onError]);

  useEffect(() => {
    if (!workerInitialized.current) {
      console.warn('⚠️ Worker not initialized yet, skipping file parsing');
      return;
    }

    const parseFile = async () => {
      try {
        console.log('🔄 Starting PDF parsing...');
        console.log('📄 File details:', {
          name: file.name,
          size: file.size,
          type: file.type
        });

        const arrayBuffer = await file.arrayBuffer();
        console.log('✅ File converted to ArrayBuffer');

        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        console.log(`📑 PDF loaded. Pages: ${pdf.numPages}, Fingerprint: ${pdf.fingerprints}`);
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          console.log(`📝 Processing page ${i}/${pdf.numPages}`);
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .filter((item): item is { str: string } => 'str' in item)
            .map(item => item.str)
            .join(' ');
          fullText += pageText + ' ';
        }
        
        const trimmedText = fullText.trim();
        console.log('✅ PDF parsing completed successfully');
        console.log('📊 Extracted text length:', trimmedText.length);
        
        await onParse(trimmedText);
      } catch (error) {
        console.error('❌ Error parsing PDF:', error);
        onError?.(new Error('Falha ao processar o arquivo PDF. Por favor, tente novamente.'));
      }
    };

    parseFile();
  }, [file, onParse, onError]);

  return null;
} 
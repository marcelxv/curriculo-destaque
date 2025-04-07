'use client';

import { useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

export interface PDFParserProps {
  file: File;
  onParse: (text: string) => Promise<void>;
}

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item;
}

export default function PDFParser({ file, onParse }: PDFParserProps) {
  const workerInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || workerInitialized.current) return;

    const initWorker = async () => {
      try {
        // Check if worker is already set
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          // Fetch worker to ensure it exists
          const response = await fetch('/pdf.worker.min.js');
          if (!response.ok) {
            throw new Error(`Failed to load PDF.js worker: ${response.status} ${response.statusText}`);
          }
          pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
        }
        workerInitialized.current = true;
        console.log('✅ PDF.js worker initialized successfully');
      } catch (error) {
        console.error('Failed to initialize PDF.js worker:', error);
        throw new Error('Falha ao inicializar o processador de PDF. Por favor, recarregue a página e tente novamente.');
      }
    };

    initWorker();
  }, []);

  useEffect(() => {
    if (!workerInitialized.current) return;

    const parseFile = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        console.log(`📄 PDF loaded. Pages: ${pdf.numPages}, Fingerprint: ${pdf.fingerprints}`);
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const pageText = content.items
            .filter(isTextItem)
            .map(item => item.str)
            .join(' ');
          fullText += pageText + ' ';
        }
        
        await onParse(fullText.trim());
      } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Falha ao processar o arquivo PDF. Por favor, tente novamente.');
      }
    };

    parseFile();
  }, [file, onParse]);

  return null;
} 
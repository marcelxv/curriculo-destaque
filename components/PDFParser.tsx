'use client';

import { useEffect } from 'react';
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
  useEffect(() => {
    if (typeof window !== 'undefined') {
      pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
    }
  }, []);

  useEffect(() => {
    const parseFile = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        
        console.log(`PDF loaded. Pages: ${pdf.numPages}, Fingerprint: ${pdf.fingerprints}`);
        
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
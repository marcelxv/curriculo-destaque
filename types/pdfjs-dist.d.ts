declare module 'pdfjs-dist/webpack.mjs' {
  export * from 'pdfjs-dist';
}

declare module 'pdfjs-dist/build/pdf.worker.min.js' {
  const content: any;
  export default content;
} 
declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    version?: string;
    numpages?: number;
    numrender?: number;
    info?: Record<string, any>;
    metadata?: Record<string, any>;
    images?: any[];
    links?: any[];
    outlines?: any[];
  }

  interface PDFParseOptions {
    data?: Buffer | Uint8Array | ArrayBuffer;
    url?: string | URL;
    password?: string;
  }

  interface PDFParse {
    getText(): Promise<{ text: string; pages: any[] }>;
    getInfo(): Promise<any>;
    destroy(): Promise<void>;
  }

  const pdf: (data: Buffer | Uint8Array | ArrayBuffer) => Promise<PDFData>;
  const PDFParse: new (options: PDFParseOptions) => PDFParse;

  export { pdf, PDFParse };
  export default pdf;
}
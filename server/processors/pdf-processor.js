import { readFileSync } from "node:fs";

export async function extractTextFromPdf(filePath) {
  const { PDFParse } = await import("pdf-parse");
  const dataBuffer = readFileSync(filePath);
  const data = await PDFParse(dataBuffer);
  return {
    text: data.text,
    pages: data.numpages,
    metadata: data.metadata || {},
    info: data.info || {},
  };
}

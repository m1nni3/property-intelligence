import { readFileSync } from "node:fs";
import { extractTextFromPdf } from "./pdf-processor.js";
import { extractTextFromImage } from "./ocr-processor.js";
import { parseStatementText, parseStatementFromJson } from "./statement-parser.js";

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/tiff"];
const PDF_TYPE = "application/pdf";
const JSON_TYPE = "application/json";
const TEXT_TYPES = ["text/plain", "text/csv", "text/html", "text/xml"];

export async function processDocument(filePath, contentType, filename) {
  let extractedText = "";
  let extractionMethod = "none";

  if (contentType === PDF_TYPE || filename.endsWith(".pdf")) {
    const result = await extractTextFromPdf(filePath);
    extractedText = result.text;
    extractionMethod = "pdf";
  } else if (IMAGE_TYPES.includes(contentType) || /\.(png|jpe?g|gif|webp|tiff?)$/i.test(filename)) {
    const result = await extractTextFromImage(filePath);
    extractedText = result.text;
    extractionMethod = "ocr";
  } else if (contentType === JSON_TYPE || filename.endsWith(".json")) {
    extractionMethod = "json";
  } else if (TEXT_TYPES.includes(contentType) || /\.(txt|csv|html?|xml)$/i.test(filename)) {
    extractedText = readFileSync(filePath, "utf-8");
    extractionMethod = "text";
  }

  return { extractedText, extractionMethod };
}

export function analyzeDocument(text, contentType, filename) {
  if (contentType === JSON_TYPE || filename.endsWith(".json")) {
    try {
      const jsonData = JSON.parse(text);
      return parseStatementFromJson(jsonData);
    } catch {
      return null;
    }
  }

  if (text && text.trim().length > 20) {
    return parseStatementText(text, filename);
  }

  return null;
}

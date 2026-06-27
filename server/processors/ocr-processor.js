import { readFileSync } from "node:fs";
import Tesseract from "tesseract.js";

export async function extractTextFromImage(filePath, lang = "eng") {
  const image = readFileSync(filePath);
  const result = await Tesseract.recognize(image, lang, {
    logger: () => {},
  });
  return {
    text: result.data.text,
    confidence: result.data.confidence,
    blocks: result.data.blocks,
  };
}

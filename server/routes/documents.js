import { readFileSync, writeFileSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { prepare, id, json, error } from "../lib/db.js";
import { parseBody } from "../lib/parse-body.js";
import { processDocument, analyzeDocument } from "../processors/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = join(__dirname, "..", "..", "uploads");

export function registerDocumentRoutes(router) {
  router["GET /api/documents"] = () => {
    const rows = prepare(
      "SELECT id, property_id, filename, content_type, size_bytes, status, category, processed_at, created_at FROM documents ORDER BY created_at DESC"
    ).all();
    return json(rows);
  };

  router["POST /api/documents/upload"] = async (req) => {
    const body = await parseBody(req);
    if (!body.filename || !body.data) return error("filename and base64 data are required");

    const buf = Buffer.from(body.data, "base64");
    const uid = id();
    const safeName = `${uid}${extname(body.filename) || ""}`;
    const filePath = join(UPLOAD_DIR, safeName);
    writeFileSync(filePath, buf);

    const contentType = body.content_type || "application/octet-stream";
    prepare(
      "INSERT INTO documents (id, property_id, filename, content_type, size_bytes, file_path, status, category) VALUES (?, ?, ?, ?, ?, ?, 'uploaded', ?)",
      uid, body.property_id || null, body.filename, contentType, buf.length, filePath, body.category || null,
    ).run();

    return json(prepare("SELECT * FROM documents WHERE id = ?", uid).first(), 201);
  };

  router["POST /api/documents/:id/process"] = async (req, id) => {
    const doc = prepare("SELECT * FROM documents WHERE id = ?", id).first();
    if (!doc) return error("Document not found", 404);

    prepare("UPDATE documents SET status = 'processing' WHERE id = ?", id).run();
    try {
      const { extractedText, extractionMethod } = await processDocument(doc.file_path, doc.content_type, doc.filename);
      prepare("UPDATE documents SET status = 'processed', extracted_text = ? WHERE id = ?", extractedText, id).run();

      if (extractionMethod === "json" || (extractedText && extractedText.trim().length > 20)) {
        const analysis = analyzeDocument(extractedText, doc.content_type, doc.filename);
        if (analysis) {
          const stmtId = id();
          prepare(
            "INSERT INTO statements (id, document_id, property_id, statement_type, reference_number, period_start, period_end, total_amount, currency, raw_text, parsed_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            stmtId, id, doc.property_id, analysis.statement_type, analysis.reference_number,
            analysis.period_start, analysis.period_end, analysis.total_amount, "ZAR",
            extractedText.substring(0, 5000), JSON.stringify(analysis),
          ).run();

          for (const item of (analysis.line_items || [])) {
            prepare(
              "INSERT INTO statement_line_items (id, statement_id, description, amount, category, quantity, unit_price, date, is_debit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
              item.id || id(), stmtId, item.description, item.amount, item.category || null,
              item.quantity || null, item.unit_price || null, item.date || null,
              item.is_debit !== undefined ? item.is_debit : 1,
            ).run();
          }
        }
      }

      return json(prepare("SELECT * FROM documents WHERE id = ?", id).first());
    } catch (e) {
      prepare("UPDATE documents SET status = 'failed' WHERE id = ?", id).run();
      return error(`Processing failed: ${e instanceof Error ? e.message : "Unknown error"}`, 500);
    }
  };

  router["GET /api/documents/:id"] = (req, id) => {
    const row = prepare("SELECT * FROM documents WHERE id = ?", id).first();
    if (!row) return error("Document not found", 404);
    return json(row);
  };

  router["GET /api/properties/:id/documents"] = (req, id) => {
    const rows = prepare(
      "SELECT id, property_id, filename, content_type, size_bytes, status, category, processed_at, created_at FROM documents WHERE property_id = ? ORDER BY created_at DESC",
      id,
    ).all();
    return json(rows);
  };

  router["GET /api/statements"] = () => {
    return json(prepare("SELECT * FROM statements ORDER BY created_at DESC").all());
  };

  router["GET /api/statements/:id"] = (req, id) => {
    const row = prepare("SELECT * FROM statements WHERE id = ?", id).first();
    if (!row) return error("Statement not found", 404);
    const items = prepare("SELECT * FROM statement_line_items WHERE statement_id = ? ORDER BY created_at", id).all();
    return json({ ...row, line_items: items });
  };

  router["GET /api/properties/:id/statements"] = (req, id) => {
    const rows = prepare("SELECT * FROM statements WHERE property_id = ? ORDER BY created_at DESC", id).all();
    return json(rows);
  };
}

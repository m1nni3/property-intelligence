import { randomUUID } from "node:crypto";

const TYPE_PATTERNS = [
  { type: "municipal", patterns: [/municipal/i, /rates/i, /utility/i, /water/i, /electricity/i, /property tax/i] },
  { type: "bank", patterns: [/bank/i, /account statement/i, /transaction/i, /deposit/i, /withdrawal/i] },
  { type: "owner", patterns: [/owner statement/i, /rent roll/i, /income statement/i, /property statement/i] },
  { type: "tenant", patterns: [/tenant/i, /lease/i, /rental/i, /occupant/i] },
  { type: "insurance", patterns: [/insurance/i, /policy/i, /premium/i, /cover/i] },
];

function detectStatementType(text) {
  for (const { type, patterns } of TYPE_PATTERNS) {
    if (patterns.some((p) => p.test(text))) return type;
  }
  return "other";
}

function extractAmounts(text) {
  const amounts = [];
  const regex = /[RZ$]?\s?[\d,]+\.\d{2}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const cleaned = parseFloat(match[0].replace(/[RZ$\s,]/g, ""));
    if (!isNaN(cleaned)) amounts.push(cleaned);
  }
  return amounts;
}

function extractDates(text) {
  const dates = [];
  const regex = /\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    dates.push(match[0]);
  }
  return dates;
}

function extractReferenceNumber(text) {
  const refPatterns = [
    /(?:ref(?:erence)?[:\s]+)([A-Z0-9\-/]+)/i,
    /(?:account\s*(?:no|number|#)[:\s]+)([A-Z0-9\-/]+)/i,
    /(?:invoice\s*(?:no|number|#)[:\s]+)([A-Z0-9\-/]+)/i,
    /(?:statement\s*(?:no|number|#)[:\s]+)([A-Z0-9\-/]+)/i,
  ];
  for (const pattern of refPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

function parseLineItems(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  const items = [];
  const amountRegex = /[RZ$]?\s?[\d,]+\.\d{2}/;

  for (const line of lines) {
    if (amountRegex.test(line)) {
      const amounts = line.match(amountRegex);
      if (amounts) {
        const amount = parseFloat(amounts[0].replace(/[RZ$\s,]/g, ""));
        const description = line.replace(amounts[0], "").trim();
        if (description && !isNaN(amount)) {
          items.push({
            id: randomUUID(),
            description: description.substring(0, 255),
            amount,
            is_debit: 1,
          });
        }
      }
    }
  }
  return items;
}

function extractPeriod(text) {
  const periodMatch = text.match(/(?:period|from|for)\s*(?::)?\s*(.+?)(?:\n|$)/i);
  const dates = extractDates(text);
  return {
    start: dates[0] || null,
    end: dates[1] || dates[0] || null,
  };
}

export function parseStatementText(text, filename) {
  const type = detectStatementType(text);
  const refNumber = extractReferenceNumber(text);
  const amounts = extractAmounts(text);
  const period = extractPeriod(text);
  const lineItems = parseLineItems(text);

  const totalAmount = lineItems.length > 0
    ? lineItems.reduce((sum, item) => sum + item.amount, 0)
    : (amounts[0] || null);

  return {
    statement_type: type,
    reference_number: refNumber,
    period_start: period.start,
    period_end: period.end,
    total_amount: totalAmount,
    line_items: lineItems,
  };
}

export function parseStatementFromJson(jsonData) {
  const { type, reference, period, items, total, currency } = jsonData;
  return {
    statement_type: type || "other",
    reference_number: reference || null,
    period_start: period?.start || null,
    period_end: period?.end || null,
    total_amount: total || null,
    currency: currency || "ZAR",
    line_items: (items || []).map((item) => ({
      id: randomUUID(),
      description: item.description || "",
      amount: item.amount || 0,
      category: item.category || null,
      quantity: item.quantity || null,
      unit_price: item.unit_price || null,
      date: item.date || null,
      is_debit: item.is_debit !== undefined ? item.is_debit : 1,
    })),
  };
}

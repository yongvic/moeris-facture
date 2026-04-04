const normalizeLineBreaks = (text: string) => text.replace(/\r\n/g, "\n");

export function parseNullableString(value: unknown) {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

export function parseBoolean(value: unknown, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const text = String(value).trim().toLowerCase();
  return ["true", "1", "oui", "yes", "y"].includes(text);
}

function parseCsvText(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if (char === "\n" && !inQuotes) {
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows.filter((item) => item.some((value) => value.trim().length > 0));
}

export async function parseCsvFile(file: File) {
  const text = normalizeLineBreaks(await file.text());
  const lines = parseCsvText(text);
  if (lines.length === 0) return [];

  const [headerRow, ...dataRows] = lines;
  const headers = headerRow.map((header) => header.trim());
  return dataRows.map((row) =>
    headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = (row[index] ?? "").trim();
      return acc;
    }, {})
  );
}

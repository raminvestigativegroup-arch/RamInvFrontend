/** CSV cell: quote everything, double embedded quotes, and defuse spreadsheet formulas. */
export const csvCell = (value: unknown): string => {
  let text = String(value ?? "");
  if (/^[=+@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

export const toCsv = (rows: unknown[][]): string => rows.map((r) => r.map(csvCell).join(",")).join("\r\n");

/** Downloads rows as a CSV file. A BOM keeps Excel reading UTF-8 correctly. */
export const downloadCsv = (filename: string, rows: unknown[][]): void => {
  const blob = new Blob(["﻿", toCsv(rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

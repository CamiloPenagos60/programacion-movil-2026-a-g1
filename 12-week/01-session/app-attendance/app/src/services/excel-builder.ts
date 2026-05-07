import * as XLSX from "xlsx";

export type ReportRow = (string | number)[];

/** Returns today formatted as "DD-MM-YYYY" using the es-CO locale. */
export function todayStr(): string {
  return new Date()
    .toLocaleDateString("es-CO", { year: "numeric", month: "2-digit", day: "2-digit" })
    .replace(/\//g, "-");
}

/**
 * Merges the title row (row 0) across columns 0 → lastCol in-place.
 * @param ws   Worksheet to mutate.
 * @param lastCol  0-based index of the last column to include in the merge.
 */
export function mergeTitleRow(ws: XLSX.WorkSheet, lastCol: number): void {
  ws["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }];
}

/**
 * Packages a worksheet into a workbook and writes it to disk.
 * @param ws        Worksheet to publish.
 * @param filename  Target filename (e.g. "asistencia_SENA_01-01-2026.xlsx").
 */
export function writeWorkbook(ws: XLSX.WorkSheet, filename: string): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Asistencia");
  XLSX.writeFile(wb, filename);
}

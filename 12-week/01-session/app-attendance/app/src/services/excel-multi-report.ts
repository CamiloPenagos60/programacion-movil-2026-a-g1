import * as XLSX from "xlsx";
import type { AttendanceRecord, AttendanceSession, Institution, Person } from "../types/domain";
import { mergeTitleRow, todayStr, writeWorkbook, type ReportRow } from "./excel-builder";

export type SessionData = {
  session: AttendanceSession;
  present: AttendanceRecord[];
  absent: Person[];
};

/**
 * Genera un reporte de asistencia consolidado para N sesiones de una misma unidad.
 *
 * Formato de la planilla:
 *   Fila 1-3 : Encabezado institucional
 *   Fila 4   : Títulos de columna  (Documento | Nombre | Matrícula | Ses.1 | Ses.2 | ... | % Asistencia)
 *   Fila 5+  : Una fila por persona inscrita
 *   Fila n+1 : Totales por sesión
 */
export function exportMultiSessionReport(params: {
  institution: Institution;
  unitName: string;
  unitCode: string;
  people: Person[];
  sessions: SessionData[];
}): void {
  const { institution, unitName, unitCode, people, sessions } = params;

  if (sessions.length === 0 || people.length === 0) return;

  // --- Ordenar sesiones por fecha ascendente ---
  const sorted = [...sessions].sort((a, b) => {
    const da = a.session.createdAt ? new Date(a.session.createdAt).getTime() : 0;
    const db = b.session.createdAt ? new Date(b.session.createdAt).getTime() : 0;
    return da - db;
  });

  const dateStr = todayStr();

  // --- Construir mapa: sessionId → Set de documentos presentes ---
  const presentMap = new Map<string, Set<string>>();
  for (const sd of sorted) {
    const docs = new Set(sd.present.map((r) => r.documento));
    presentMap.set(sd.session.id, docs);
  }

  // --- Encabezado de sesiones ---
  const sessionHeaders = sorted.map((sd, i) => {
    const fecha = sd.session.createdAt
      ? new Date(sd.session.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "2-digit" })
      : `S${i + 1}`;
    return `S${i + 1}\n${fecha}`;
  });

  const rows: ReportRow[] = [
    [`REPORTE DE ASISTENCIA — ${institution.name.toUpperCase()}`],
    [`Unidad: ${unitName}`, "", `Exportado: ${dateStr}`],
    [`Sesiones: ${sorted.length}`, `Inscritos: ${people.length}`],
    [],
    ["Documento", "Nombre", "Matrícula", ...sessionHeaders, "% Asistencia"],
  ];

  // --- Fila por persona ---
  const sessionTotals = new Array<number>(sorted.length).fill(0);

  for (const person of people) {
    let presenceCount = 0;
    const sessionCells: string[] = sorted.map((sd, idx) => {
      const docs = presentMap.get(sd.session.id);
      const isPresent = docs?.has(person.documento) ?? false;
      if (isPresent) {
        presenceCount++;
        sessionTotals[idx]++;
      }
      return isPresent ? "P" : "A";
    });

    const pct =
      sorted.length > 0 ? Math.round((presenceCount / sorted.length) * 100) : 0;

    rows.push([
      person.documento,
      person.nombre,
      person.matricula,
      ...sessionCells,
      `${pct}%`,
    ]);
  }

  // --- Fila de totales ---
  rows.push([]);
  rows.push([
    "TOTAL PRESENTES",
    "",
    "",
    ...sessionTotals.map(String),
    "",
  ]);

  // --- Construir worksheet ---
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Anchos de columna
  ws["!cols"] = [
    { wch: 16 }, // Documento
    { wch: 36 }, // Nombre
    { wch: 14 }, // Matrícula
    ...sorted.map(() => ({ wch: 8 })), // Una por sesión
    { wch: 14 }, // % Asistencia
  ];

  // Merge título principal
  const lastCol = 3 + sorted.length;
  mergeTitleRow(ws, lastCol);

  // Aplicar wrap text a la fila de encabezados de sesión (row 4, índice 4)
  const headerRowIdx = 4;
  for (let c = 3; c < 3 + sorted.length; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c });
    if (ws[cellRef]) {
      ws[cellRef].s = { alignment: { wrapText: true, horizontal: "center" } };
    }
  }

  const safeCode = unitCode.replace(/\s+/g, "_").replace(/[^\w-]/g, "");
  writeWorkbook(ws, `asistencia_consolidado_${safeCode}_${dateStr}.xlsx`);
}

import * as XLSX from "xlsx";
import type { AttendanceRecord, AttendanceSession, Institution, Person } from "../types/domain";
import { mergeTitleRow, todayStr, writeWorkbook, type ReportRow } from "./excel-builder";

export function exportAttendanceReport(params: {
  institution: Institution;
  session: AttendanceSession;
  present: AttendanceRecord[];
  absent: Person[];
  rejections: AttendanceRecord[];
}): void {
  const { institution, session, present, absent, rejections } = params;

  const unitName = session.unit?.name ?? session.unitId;
  const unitCode = (session.unit?.code ?? session.unitId).replace(/\s+/g, "_");
  const dateStr = todayStr();

  const rows: ReportRow[] = [
    [`REPORTE DE ASISTENCIA - ${institution.name.toUpperCase()}`],
    [`Unidad: ${unitName}`, "", `Fecha: ${dateStr}`],
    [
      `Total inscritos: ${present.length + absent.length}`,
      `Presentes: ${present.length}`,
      `Ausentes: ${absent.length}`,
      `Rechazados: ${rejections.length}`,
    ],
    [],
    ["Documento", "Nombre", "Matrícula", "Estado", "Hora Registro", "Motivo Rechazo"],
  ];

  for (const record of present) {
    const p = record.person;
    rows.push([
      p?.documento ?? record.documento,
      p?.nombre ?? "",
      p?.matricula ?? "",
      "PRESENTE",
      record.createdAt ? new Date(record.createdAt).toLocaleTimeString("es-CO") : "",
      "",
    ]);
  }

  for (const person of absent) {
    rows.push([person.documento, person.nombre, person.matricula, "AUSENTE", "", ""]);
  }

  for (const record of rejections) {
    const p = record.person;
    rows.push([
      p?.documento ?? record.documento,
      p?.nombre ?? "",
      p?.matricula ?? "",
      "RECHAZADO",
      record.createdAt ? new Date(record.createdAt).toLocaleTimeString("es-CO") : "",
      record.rejectReason ?? "",
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws["!cols"] = [
    { wch: 16 }, // Documento
    { wch: 36 }, // Nombre
    { wch: 14 }, // Matrícula
    { wch: 12 }, // Estado
    { wch: 15 }, // Hora
    { wch: 28 }, // Motivo
  ];

  mergeTitleRow(ws, 5);
  writeWorkbook(ws, `asistencia_${unitCode}_${dateStr}.xlsx`);
}

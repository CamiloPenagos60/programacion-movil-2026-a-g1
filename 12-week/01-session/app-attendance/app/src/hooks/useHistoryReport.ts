import { useState } from "react";
import type { ApiClient } from "../services/api";
import type { AcademicUnit, AttendanceSession, Institution, Person } from "../types/domain";
import { exportMultiSessionReport } from "../services/excel-multi-report";

type Args = {
  api: ApiClient | null;
  institution: Institution | null;
  selectedUnit: AcademicUnit | null;
  people: Person[];
  runTask: <T>(label: string, task: () => Promise<T>) => Promise<T | null>;
  setToast: (msg: string) => void;
};

/**
 * Owns session history state and the consolidated Excel export operation.
 */
export function useHistoryReport({ api, institution, selectedUnit, people, runTask, setToast }: Args) {
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [exportingReport, setExportingReport] = useState(false);

  function resetHistory() {
    setHistory([]);
  }

  async function loadHistory() {
    if (!api) return;
    const data = await runTask("Cargando historial", () =>
      api.sessions({ institutionId: institution?.id, unitId: selectedUnit?.id })
    );
    if (data) setHistory(data);
  }

  async function exportConsolidatedReport() {
    if (!api || !institution || history.length === 0) return;
    setExportingReport(true);
    try {
      const sessionData = await Promise.all(
        history.map(async (s) => {
          const [presentRecords, absentPeople] = await Promise.all([
            api.present(s.id),
            api.absent(s.id),
          ]);
          return { session: s, present: presentRecords, absent: absentPeople };
        })
      );
      exportMultiSessionReport({
        institution,
        unitName: selectedUnit?.name ?? history[0]?.unit?.name ?? "Unidad",
        unitCode: selectedUnit?.code ?? history[0]?.unit?.code ?? "unidad",
        people,
        sessions: sessionData,
      });
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Error al generar el reporte.");
    } finally {
      setExportingReport(false);
    }
  }

  return {
    history,
    exportingReport,
    resetHistory,
    loadHistory,
    exportConsolidatedReport,
  };
}

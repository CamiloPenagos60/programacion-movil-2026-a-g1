import type { Request, Response } from "express";
import { getAttendanceFormState, registerAttendanceByToken, scanQrToken } from "../services/attendance.service";
import { escapeHtml } from "../utils/http";
import { registerAttendanceSchema } from "../validators/public-attendance.validators";

function page(title: string, body: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { color-scheme: light; font-family: Arial, sans-serif; }
    body { margin: 0; background: #f6f7f9; color: #18202a; }
    main { width: min(92vw, 430px); margin: 32px auto; background: #fff; border: 1px solid #dde2e8; border-radius: 8px; padding: 24px; box-shadow: 0 10px 30px rgba(18, 28, 45, .08); }
    h1 { font-size: 24px; margin: 0 0 8px; }
    p { line-height: 1.45; }
    label { display: block; font-weight: 700; margin: 18px 0 8px; }
    input { width: 100%; box-sizing: border-box; border: 1px solid #b8c2cc; border-radius: 6px; padding: 12px; font-size: 18px; }
    button { width: 100%; margin-top: 16px; border: 0; border-radius: 6px; padding: 13px; background: #1864ab; color: #fff; font-weight: 700; font-size: 16px; }
    .muted { color: #5b6775; }
    .ok { color: #2b8a3e; font-weight: 700; }
    .error { color: #c92a2a; font-weight: 700; }
  </style>
</head>
<body><main>${body}</main></body>
</html>`;
}

export async function showAttendanceForm(req: Request, res: Response): Promise<void> {
  const token = String(req.params.token);
  const state = await getAttendanceFormState(token);

  if (!state.session) {
    res.status(404).send(
      page(
        "QR no valido",
        `<h1>QR no valido</h1><p class="error">${escapeHtml(state.message)}</p>`
      )
    );
    return;
  }

  const session = state.session as Record<string, unknown>;
  const institution = session.institution as Record<string, unknown> | undefined;
  const unit = session.unit as Record<string, unknown> | undefined;
  const labels = institution?.labels as Record<string, string> | undefined;

  if (!state.canRegister) {
    res.status(409).send(
      page(
        "Sesion no disponible",
        `<h1>Sesion no disponible</h1><p class="error">${escapeHtml(state.message)}</p>`
      )
    );
    return;
  }

  res.send(
    page(
      "Registrar asistencia",
      `<h1>Registrar asistencia</h1>
      <p class="muted">${escapeHtml(String(institution?.name ?? "Institucion"))}</p>
      <p><strong>${escapeHtml(labels?.unit ?? "Unidad")}:</strong> ${escapeHtml(String(unit?.name ?? ""))}</p>
      <form method="post" action="/public/attendance/${escapeHtml(token)}/register">
        <label for="documento">Documento</label>
        <input id="documento" name="documento" inputmode="numeric" autocomplete="off" required minlength="4" maxlength="30">
        <button type="submit">Registrar asistencia</button>
      </form>`
    )
  );
}

export async function registerAttendance(req: Request, res: Response): Promise<void> {
  const token = String(req.params.token);
  const input = registerAttendanceSchema.parse(req.body);
  const result = await registerAttendanceByToken(token, input.documento);
  const wantsJson = req.accepts(["html", "json"]) === "json" || req.is("application/json");

  if (wantsJson) {
    res.status(result.accepted ? 201 : 409).json({ data: result });
    return;
  }

  res.status(result.accepted ? 201 : 409).send(
    page(
      result.accepted ? "Asistencia registrada" : "Registro rechazado",
      `<h1>${result.accepted ? "Asistencia registrada" : "Registro rechazado"}</h1>
      <p class="${result.accepted ? "ok" : "error"}">${escapeHtml(result.message)}</p>
      <p class="muted">Ya puedes cerrar esta pagina.</p>`
    )
  );
}

/**
 * Public endpoint: validate an ephemeral QR token and return session info.
 * Does NOT register attendance. Returns 410 if expired.
 */
export async function scanAttendanceQr(req: Request, res: Response): Promise<void> {
  const plainToken = String(req.params.qrToken);
  const result = await scanQrToken(plainToken);

  if (!result.valid) {
    const status = result.code === "TOKEN_EXPIRED" || result.code === "SESSION_CLOSED" ? 410 : 404;
    res.status(status).json({ error: { code: result.code, message: result.message } });
    return;
  }

  res.json({ data: result });
}

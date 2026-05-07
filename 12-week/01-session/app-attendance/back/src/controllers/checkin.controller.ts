import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { selfCheckin, selfCheckinWithQrToken } from "../services/attendance.service";
import { z } from "zod";

const checkinSchema = z.union([
  z.object({
    qrToken: z.string().min(1),
    roomCode: z.string().min(1).max(20)
  }),
  z.object({
    sessionId: z.string().min(1),
    roomCode: z.string().min(1).max(20)
  })
]);

export async function postCheckin(req: AuthRequest, res: Response): Promise<void> {
  const parsed = checkinSchema.parse(req.body);
  const user = req.user!;
  const roles = user.roles;

  // Only APRENDIZ and ESTUDIANTE can register attendance via checkin
  if (!roles.some((r) => r === "APRENDIZ" || r === "ESTUDIANTE")) {
    res.status(403).json({
      error: { code: "FORBIDDEN_ROLE", message: "Solo aprendices y estudiantes pueden registrar asistencia por este endpoint." }
    });
    return;
  }

  let data: Awaited<ReturnType<typeof selfCheckin>>;

  if ("qrToken" in parsed) {
    data = await selfCheckinWithQrToken({
      ephemeralQrToken: parsed.qrToken,
      roomCode: parsed.roomCode,
      personId: user.id,
      institutionId: user.institutionId
    });
  } else {
    data = await selfCheckin({
      sessionId: parsed.sessionId,
      roomCode: parsed.roomCode,
      personId: user.id,
      institutionId: user.institutionId
    });
  }

  res.status(data.accepted ? 201 : 409).json({ data });
}

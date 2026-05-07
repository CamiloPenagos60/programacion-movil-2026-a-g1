import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import {
  activateSession,
  closeSession,
  createSession,
  generateEphemeralQrToken,
  getSession,
  getRoomCodeForSession,
  listAbsent,
  listPresent,
  listRejections,
  listSessions
} from "../services/attendance.service";
import { requestBaseUrl } from "../utils/http";
import { createSessionSchema, listSessionsSchema } from "../validators/session.validators";

export async function postSession(req: AuthRequest, res: Response): Promise<void> {
  const input = createSessionSchema.parse(req.body);
  const data = await createSession(input);
  res.status(201).json({ data });
}

export async function postActivateSession(req: AuthRequest, res: Response): Promise<void> {
  const data = await activateSession(String(req.params.sessionId), requestBaseUrl(req));
  res.json({ data });
}

export async function postCloseSession(req: AuthRequest, res: Response): Promise<void> {
  const data = await closeSession(String(req.params.sessionId));
  res.json({ data });
}

export async function getSessionStatus(req: AuthRequest, res: Response): Promise<void> {
  const data = await getSession(String(req.params.sessionId), requestBaseUrl(req), req.user);
  res.json({ data });
}

export async function getSessions(req: AuthRequest, res: Response): Promise<void> {
  const filters = listSessionsSchema.parse(req.query);
  const data = await listSessions(filters, req.user);
  res.json({ data });
}

export async function getPresent(req: Request, res: Response): Promise<void> {
  const data = await listPresent(String(req.params.sessionId));
  res.json({ data });
}

export async function getAbsent(req: Request, res: Response): Promise<void> {
  const data = await listAbsent(String(req.params.sessionId));
  res.json({ data });
}

export async function getRejections(req: Request, res: Response): Promise<void> {
  const data = await listRejections(String(req.params.sessionId));
  res.json({ data });
}

export async function getSessionRoomCode(req: Request, res: Response): Promise<void> {
  const data = await getRoomCodeForSession(String(req.params.sessionId));
  res.json({ data });
}

export async function getSessionEphemeralQrToken(req: AuthRequest, res: Response): Promise<void> {
  const data = await generateEphemeralQrToken(String(req.params.sessionId), requestBaseUrl(req));
  res.json({ data });
}

import { Router } from "express";
import {
  getAbsent,
  getPresent,
  getRejections,
  getSessionRoomCode,
  getSessionStatus,
  getSessions,
  postActivateSession,
  postCloseSession,
  postSession,
  getSessionEphemeralQrToken
} from "../controllers/session.controller";
import { asyncHandler } from "../utils/async-handler";
import { authorizePermission } from "../middleware/auth.middleware";

export const sessionRouter = Router();

sessionRouter.get("/sessions", authorizePermission("session", "list"), asyncHandler(getSessions));
sessionRouter.post("/sessions", authorizePermission("session", "create"), asyncHandler(postSession));
sessionRouter.post(
  "/sessions/:sessionId/activate",
  authorizePermission("session", "activate"),
  asyncHandler(postActivateSession)
);
sessionRouter.get("/sessions/:sessionId", authorizePermission("session", "view"), asyncHandler(getSessionStatus));
sessionRouter.post(
  "/sessions/:sessionId/close",
  authorizePermission("session", "close"),
  asyncHandler(postCloseSession)
);
sessionRouter.get(
  "/sessions/:sessionId/present",
  authorizePermission("session", "present"),
  asyncHandler(getPresent)
);
sessionRouter.get(
  "/sessions/:sessionId/absent",
  authorizePermission("session", "absent"),
  asyncHandler(getAbsent)
);
sessionRouter.get(
  "/sessions/:sessionId/rejections",
  authorizePermission("session", "rejections"),
  asyncHandler(getRejections)
);
sessionRouter.get(
  "/sessions/:sessionId/room-code",
  authorizePermission("session", "room-code"),
  asyncHandler(getSessionRoomCode)
);
sessionRouter.get(
  "/sessions/:sessionId/qr-token",
  authorizePermission("session", "activate"),
  asyncHandler(getSessionEphemeralQrToken)
);


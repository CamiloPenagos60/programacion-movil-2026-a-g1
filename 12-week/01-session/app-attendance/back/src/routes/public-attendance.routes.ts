import { Router } from "express";
import { registerAttendance, showAttendanceForm, scanAttendanceQr } from "../controllers/public-attendance.controller";
import { asyncHandler } from "../utils/async-handler";
import { authenticate } from "../middleware/auth.middleware";

export const publicAttendanceRouter = Router();

// Public: validate ephemeral QR token and return session info (no attendance registered)
publicAttendanceRouter.get("/attendance/scan/:qrToken", asyncHandler(scanAttendanceQr));

// Legacy HTML form flow
publicAttendanceRouter.get("/attendance/:token", asyncHandler(showAttendanceForm));
publicAttendanceRouter.post(
  "/public/attendance/:token/register",
  authenticate,
  asyncHandler(registerAttendance)
);


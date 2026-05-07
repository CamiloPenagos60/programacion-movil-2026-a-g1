import { Router } from "express";
import { postCheckin } from "../controllers/checkin.controller";
import { asyncHandler } from "../utils/async-handler";
import { authorizePermission } from "../middleware/auth.middleware";

export const checkinRouter = Router();

checkinRouter.post(
  "/attendance/checkin",
  authorizePermission("attendance", "checkin"),
  asyncHandler(postCheckin as Parameters<typeof asyncHandler>[0])
);

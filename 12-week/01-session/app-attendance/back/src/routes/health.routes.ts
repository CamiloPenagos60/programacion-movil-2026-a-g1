import { Router } from "express";
import { health, ready } from "../controllers/health.controller";
import { asyncHandler } from "../utils/async-handler";

export const healthRouter = Router();

healthRouter.get("/health", asyncHandler(health));
healthRouter.get("/ready", asyncHandler(ready));


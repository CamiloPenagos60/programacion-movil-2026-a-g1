import { Router } from "express";
import { getInstitutions, getPeople, getUnits } from "../controllers/catalog.controller";
import { asyncHandler } from "../utils/async-handler";
import { authorizePermission } from "../middleware/auth.middleware";

export const catalogRouter = Router();

catalogRouter.get("/institutions", authorizePermission("institution", "list"), asyncHandler(getInstitutions));
catalogRouter.get("/institutions/:institutionId/units", authorizePermission("unit", "list"), asyncHandler(getUnits));
catalogRouter.get(
  "/units/:unitId/people",
  authorizePermission("people", "list"),
  asyncHandler(getPeople)
);


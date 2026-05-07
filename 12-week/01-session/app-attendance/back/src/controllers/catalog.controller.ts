import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import { listInstitutions, listPeopleByUnit, listUnitsByInstitution } from "../services/catalog.service";

export async function getInstitutions(req: AuthRequest, res: Response): Promise<void> {
  const data = await listInstitutions(req.user);
  res.json({ data });
}

export async function getUnits(req: AuthRequest, res: Response): Promise<void> {
  const data = await listUnitsByInstitution(String(req.params.institutionId), req.user);
  res.json({ data });
}

export async function getPeople(req: Request, res: Response): Promise<void> {
  const result = await listPeopleByUnit(String(req.params.unitId));
  res.json(result);
}

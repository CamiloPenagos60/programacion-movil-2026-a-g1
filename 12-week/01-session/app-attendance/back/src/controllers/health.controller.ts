import type { Request, Response } from "express";
import { isMongoReady } from "../db/mongoose";
import { InstitutionModel } from "../models/institution.model";

export async function health(_req: Request, res: Response): Promise<void> {
  res.json({
    status: "ok",
    service: "app-attendance-api",
    timestamp: new Date().toISOString()
  });
}

export async function ready(_req: Request, res: Response): Promise<void> {
  if (!isMongoReady()) {
    res.status(503).json({
      status: "error",
      mongo: "disconnected",
      timestamp: new Date().toISOString()
    });
    return;
  }

  const institutions = await InstitutionModel.countDocuments({ active: true });
  res.json({
    status: "ready",
    mongo: "connected",
    institutions,
    timestamp: new Date().toISOString()
  });
}


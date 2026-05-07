import { z } from "zod";
import { objectIdSchema } from "./common";

export const createSessionSchema = z.object({
  institutionId: objectIdSchema,
  unitId: objectIdSchema,
  qrTtlMinutes: z.number().int().min(1).max(120).optional()
});

export const listSessionsSchema = z.object({
  institutionId: objectIdSchema.optional(),
  unitId: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});


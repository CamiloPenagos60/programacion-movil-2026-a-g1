import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "ObjectId invalido");

export const documentoSchema = z
  .string()
  .trim()
  .min(4, "El documento debe tener al menos 4 caracteres")
  .max(30, "El documento no debe superar 30 caracteres")
  .regex(/^[A-Za-z0-9.-]+$/, "El documento contiene caracteres no permitidos");


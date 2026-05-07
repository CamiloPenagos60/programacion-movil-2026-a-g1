import dotenv from "dotenv";
import path from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";

const rootEnvPath = path.resolve(process.cwd(), "../.env");
if (existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z
    .string()
    .min(1)
    .default("mongodb://attendance:attendance_dev_password@localhost:27017/app_attendance?authSource=admin"),
  API_CORS_ORIGIN: z.string().default("*"),
  QR_DEFAULT_TTL_MINUTES: z.coerce.number().int().min(1).max(120).default(10),
  QR_TOKEN_TTL_SECONDS: z.coerce.number().int().min(10).max(120).default(20),
  ROOM_CODE_TTL_SECONDS: z.coerce.number().int().min(30).max(300).default(90),
  JWT_SECRET: z.string().min(1).default("super-secret-key-for-dev-only"),
  PUBLIC_BASE_URL: z.string().url().optional().or(z.literal(""))
});

export const env = envSchema.parse(process.env);


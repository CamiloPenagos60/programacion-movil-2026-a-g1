import cors from "cors";
import express, { type RequestHandler } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { authenticate } from "./middleware/auth.middleware";
import { authRouter } from "./routes/auth.routes";
import { catalogRouter } from "./routes/catalog.routes";
import { checkinRouter } from "./routes/checkin.routes";
import { healthRouter } from "./routes/health.routes";
import { publicAttendanceRouter } from "./routes/public-attendance.routes";
import { sessionRouter } from "./routes/session.routes";
import { notFound } from "./utils/app-error";

export function createApp() {
  const app = express();

  app.set("trust proxy", true);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: env.API_CORS_ORIGIN === "*" ? true : env.API_CORS_ORIGIN }));
  app.use(express.json({ limit: "256kb" }));
  app.use(express.urlencoded({ extended: false, limit: "64kb" }));

  // Public routes — no auth required
  app.use(healthRouter);
  app.use(publicAttendanceRouter);
  app.use("/api/auth", authRouter);

  // Protected routes — Bearer JWT required
  app.use("/api", authenticate as RequestHandler, catalogRouter);
  app.use("/api", authenticate as RequestHandler, sessionRouter);
  app.use("/api", authenticate as RequestHandler, checkinRouter);

  app.use((_req, _res, next) => next(notFound("Ruta no encontrada", "ROUTE_NOT_FOUND")));
  app.use(errorHandler);

  return app;
}


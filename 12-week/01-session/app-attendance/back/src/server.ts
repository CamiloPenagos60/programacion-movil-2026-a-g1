import { env } from "./config/env";
import { connectMongo, disconnectMongo } from "./db/mongoose";
import { createApp } from "./app";
import { ensureDefaultRolePermissions } from "./services/permission.service";

async function bootstrap() {
  await connectMongo();
  await ensureDefaultRolePermissions();
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`app-attendance-api escuchando en puerto ${env.PORT}`);
  });

  const shutdown = async () => {
    console.log("Cerrando app-attendance-api...");
    server.close(async () => {
      await disconnectMongo();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error("No se pudo iniciar la API", error);
  process.exit(1);
});


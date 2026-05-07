import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectMongo(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}


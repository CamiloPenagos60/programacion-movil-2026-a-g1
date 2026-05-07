import { z } from "zod";
import { documentoSchema } from "./common";

export const registerAttendanceSchema = z.object({
  documento: documentoSchema
});


import { z } from "zod";

export const referralCodeParamSchema = z.object({
  code: z.string().min(1),
});

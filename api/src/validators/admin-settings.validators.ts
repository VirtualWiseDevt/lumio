import { z } from "zod";

export const updateSettingsSchema = z.object({
  settings: z.record(z.string(), z.unknown()),
});

export const settingKeysSchema = z.object({
  keys: z.array(z.string()).optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type SettingKeysInput = z.infer<typeof settingKeysSchema>;

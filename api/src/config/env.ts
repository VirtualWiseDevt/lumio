import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  CORS_ORIGINS: z
    .string()
    .transform((s) => s.split(","))
    .default("http://localhost:3000,http://localhost:3001"),
  REDIS_HOST: z.string().default("localhost"),
  REDIS_PORT: z.coerce.number().default(6379),
  R2_ACCOUNT_ID: z.string().min(1, "R2_ACCOUNT_ID is required"),
  R2_ACCESS_KEY_ID: z.string().min(1, "R2_ACCESS_KEY_ID is required"),
  R2_SECRET_ACCESS_KEY: z.string().min(1, "R2_SECRET_ACCESS_KEY is required"),
  R2_BUCKET_NAME: z.string().min(1, "R2_BUCKET_NAME is required"),

  // M-Pesa / Daraja
  MPESA_ENVIRONMENT: z.enum(["mock", "sandbox", "production"]).default("mock"),
  MPESA_CONSUMER_KEY: z.string().default(""),
  MPESA_CONSUMER_SECRET: z.string().default(""),
  MPESA_SHORTCODE: z.string().default("174379"),
  MPESA_PASSKEY: z.string().default(""),
  MPESA_CALLBACK_URL: z.string().default("http://localhost:5000/api/mpesa/callback"),

  // Email / SMTP
  EMAIL_TRANSPORT: z.enum(["console", "smtp"]).default("console"),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  SMTP_PORT: z.coerce.number().default(465),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  SMTP_FROM: z.string().default("noreply@lumio.tv"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment variables:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

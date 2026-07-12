import dotenv from "dotenv";
import { z } from "zod";

// Load environmental variables
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string"),
  JWT_SECRET: z
    .string()
    .min(8, "JWT_SECRET must be a secure key of at least 8 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  FRONTEND_URL: z
    .string()
    .url("FRONTEND_URL must be a valid URL")
    .default("http://localhost:3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error("CRITICAL: Invalid environment configuration on startup:");
  parseResult.error.errors.forEach((err) => {
    console.error(`   - [${err.path.join(".")}] ${err.message}`);
  });
  process.exit(1);
}

export const env = Object.freeze(parseResult.data);
export type EnvType = z.infer<typeof envSchema>;

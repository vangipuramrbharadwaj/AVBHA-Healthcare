import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  JWT_ACCESS_SECRET: z
    .string()
    .min(32, "8nfkE8clufm8C0RlBadrE6KTUunVp7xvDJk2LP2XByaBVy9l1odSNWx06ruIrUgZK6TrAqa6+fEh1AGNbgq+Bw=="),

  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "VWvcF4kr900CvKxucnzl3k36n+NnD8QqZZBjdxs3KtZ2GsjzJeDFuxWp5SEgHKny9DMWnDdSXhIkh/wl949Cxg=="),

  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),

  JWT_REFRESH_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(7),

  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),

  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),

  ACCOUNT_LOCK_MINUTES: z.coerce.number().int().positive().default(30),

  SESSION_IDLE_TIMEOUT_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(30),

  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
  console.error("Environment configuration is invalid:");

  for (const issue of parsedEnvironment.error.issues) {
    console.error(`- ${issue.path.join(".")}: ${issue.message}`);
  }

  process.exit(1);
}

export const env = parsedEnvironment.data;
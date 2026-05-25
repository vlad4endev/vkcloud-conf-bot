import 'dotenv/config';
import { z } from 'zod';

const emptyToUndefined = (value: unknown) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const envSchema = z.object({
  BOT_TOKEN: z.string().min(1, 'BOT_TOKEN is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, 'ADMIN_JWT_SECRET must be at least 32 characters'),
  ADMIN_CODE_WORD: z.string().min(1, 'ADMIN_CODE_WORD is required'),
  ADMIN_CORS_ORIGIN: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
  PORT: z.coerce.number().int().positive().default(3000),
  ADMIN_PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  WEBHOOK_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  MINI_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().optional(),
  ),
}).superRefine((data, ctx) => {
  if (data.NODE_ENV !== 'production') {
    return;
  }
  if (!data.WEBHOOK_URL) {
    ctx.addIssue({
      code: 'custom',
      path: ['WEBHOOK_URL'],
      message: 'WEBHOOK_URL is required in production',
    });
  }
  if (!data.MINI_APP_URL) {
    ctx.addIssue({
      code: 'custom',
      path: ['MINI_APP_URL'],
      message: 'MINI_APP_URL is required in production',
    });
  }
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${message}`);
  }
  return parsed.data;
}

export const env = loadEnv();

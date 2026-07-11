import { z } from "zod";

const optionalUrl = z.string().url().optional();
const optionalSecret = z.string().min(20).optional();

const browserEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalSecret,
});

const serverEnvSchema = browserEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: optionalSecret,
});

export class MissingSupabaseConfigError extends Error {
  constructor() {
    super(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
}

export function getValidatedEnv() {
  return serverEnvSchema.parse(process.env);
}

export function isSupabaseConfigured() {
  const env = browserEnvSchema.safeParse(process.env);

  return Boolean(
    env.success &&
      env.data.NEXT_PUBLIC_SUPABASE_URL &&
      env.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseBrowserEnv() {
  const env = browserEnvSchema.parse(process.env);

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new MissingSupabaseConfigError();
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function getSupabaseServiceRoleEnv() {
  const env = serverEnvSchema.parse(process.env);

  if (
    !env.NEXT_PUBLIC_SUPABASE_URL ||
    !env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new MissingSupabaseConfigError();
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

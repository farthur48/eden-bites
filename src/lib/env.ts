export type PublicEnv = {
  url: string;
  anonKey: string;
};

export class EnvironmentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnvironmentConfigurationError";
  }
}

export function getPublicEnv(): PublicEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function hasPublicEnv(): boolean {
  return getPublicEnv() !== null;
}

export function requirePublicEnv(): PublicEnv {
  const env = getPublicEnv();

  if (!env) {
    throw new EnvironmentConfigurationError(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return env;
}

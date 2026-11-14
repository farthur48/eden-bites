import "server-only";

import { EnvironmentConfigurationError } from "./env";

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!key) {
    throw new EnvironmentConfigurationError(
      "SUPABASE_SERVICE_ROLE_KEY is not configured. This key must only be used on the server.",
    );
  }

  return key;
}

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

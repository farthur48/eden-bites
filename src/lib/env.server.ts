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

export type SmsServerConfig = {
  provider: "termii";
  apiKey: string;
  senderId: string;
  businessTo: string;
  baseUrl: string;
  channel: "generic" | "dnd";
  enabled: boolean;
};

export function getSmsServerConfig(): SmsServerConfig | null {
  const enabled = process.env.SMS_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === "true";
  const apiKey = process.env.SMS_API_KEY?.trim() ?? "";
  const senderId = (process.env.SMS_SENDER_ID?.trim() || "EdenBites").slice(0, 11);
  const rawTo = process.env.SMS_BUSINESS_TO?.trim() || process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "";
  const businessTo = normalizePhone(rawTo);
  if (!enabled || !apiKey || !businessTo) return null;
  const channel = process.env.SMS_CHANNEL?.trim().toLowerCase() === "dnd" ? "dnd" : "generic";
  return {
    provider: "termii",
    apiKey,
    senderId,
    businessTo,
    baseUrl: (process.env.SMS_API_BASE_URL?.trim() || "https://api.ng.termii.com").replace(/\/$/, ""),
    channel,
    enabled,
  };
}

export function getNotificationRetrySecret(): string | null {
  return process.env.NOTIFICATION_RETRY_SECRET?.trim() || null;
}

export function normalizePhone(value: string): string {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.startsWith("233") && digits.length === 12) return digits;
  if (digits.startsWith("0") && digits.length === 10) return `233${digits.slice(1)}`;
  if (digits.length === 9) return `233${digits}`;
  return digits;
}

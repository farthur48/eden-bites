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
  provider: "hubtel";
  clientId: string;
  clientSecret: string;
  senderId: string;
  businessTo: string;
  baseUrl: string;
  enabled: boolean;
};

export function getSmsServerConfig(): SmsServerConfig | null {
  const enabled = process.env.SMS_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === "true";
  const clientId = process.env.HUBTEL_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.HUBTEL_CLIENT_SECRET?.trim() ?? "";
  const senderId = (process.env.SMS_SENDER_ID?.trim() || "EdenBites").slice(0, 11);
  const rawTo = process.env.SMS_BUSINESS_TO?.trim() || process.env.NEXT_PUBLIC_CONTACT_PHONE?.trim() || "";
  const businessTo = normalizePhone(rawTo);
  if (!enabled || !clientId || !clientSecret || !businessTo) return null;
  return {
    provider: "hubtel",
    clientId,
    clientSecret,
    senderId,
    businessTo,
    baseUrl: (process.env.HUBTEL_SMS_BASE_URL?.trim() || "https://smsc.hubtel.com/v1/messages/send").replace(/\/$/, ""),
    enabled,
  };
}

export type EmailServerConfig = {
  provider: "smtp";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
  businessTo: string;
  enabled: boolean;
};

export function getEmailServerConfig(): EmailServerConfig | null {
  const enabled = process.env.EMAIL_NOTIFICATIONS_ENABLED?.trim().toLowerCase() === "true";
  const user = process.env.SMTP_USER?.trim() || process.env.GMAIL_USER?.trim() || "";
  const pass = process.env.SMTP_PASSWORD?.trim() || process.env.GMAIL_APP_PASSWORD?.trim() || "";
  const from = process.env.EMAIL_FROM?.trim() || user;
  const businessTo = process.env.EMAIL_BUSINESS_TO?.trim() || user;
  const host = process.env.SMTP_HOST?.trim() || (process.env.GMAIL_USER ? "smtp.gmail.com" : "");
  const port = Number(process.env.SMTP_PORT?.trim() || (host === "smtp.gmail.com" ? "465" : "587")) || 587;
  const secureRaw = process.env.SMTP_SECURE?.trim().toLowerCase();
  const secure = secureRaw ? secureRaw === "true" : port === 465;
  if (!enabled || !host || !user || !pass || !businessTo) return null;
  return { provider: "smtp", host, port, secure, user, pass, from, businessTo, enabled };
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

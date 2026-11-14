"use client";

import { useActionState, useState } from "react";
import Image from "next/image";

import { buttonStyles } from "@/components/ui/button";
import { isAllowedImageUrl } from "@/lib/images";
import type { StoreSettings } from "@/types/database";

import {
  saveSettingsAction,
  type SettingsFormState,
} from "@/app/admin/(dashboard)/settings/actions";

const initialState: SettingsFormState = { status: "idle" };

export function SettingsForm({ settings }: { settings: StoreSettings | null }) {
  const [state, formAction, isPending] = useActionState(
    saveSettingsAction,
    initialState,
  );
  const [logoUrl, setLogoUrl] = useState(settings?.logo_url ?? "");
  const [logoFileName, setLogoFileName] = useState<string | null>(null);

  return (
    <form action={formAction} className="space-y-6">
      {state.status === "error" ? (
        <p
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="space-y-5">
          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-brand-green">
              Business details
            </h2>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Field
                label="Business name"
                name="storeName"
                defaultValue={settings?.store_name ?? "Eden Bites"}
                required
                className="sm:col-span-2"
              />
              <Field
                label="SMS / contact number"
                name="whatsappNumber"
                defaultValue={settings?.whatsapp_number ?? ""}
                placeholder="0594528883"
                className="sm:col-span-2"
              />
              <Field
                label="Contact phone"
                name="contactPhone"
                defaultValue={settings?.contact_phone ?? ""}
                placeholder="+233 24 000 0000"
              />
              <Field
                label="Contact email"
                name="contactEmail"
                type="email"
                defaultValue={settings?.contact_email ?? ""}
                placeholder="hello@edenbites.com"
              />
              <Field
                label="Contact address"
                name="contactAddress"
                defaultValue={settings?.contact_address ?? ""}
                placeholder="Area, city"
                className="sm:col-span-2"
              />
              <Field
                label="Instagram (handle or URL)"
                name="instagramUrl"
                defaultValue={settings?.instagram_url ?? ""}
                placeholder="@edenbites"
                className="sm:col-span-2"
              />
            </div>
          </section>

          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-brand-green">
              Pickup information
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Shown at checkout and on the order confirmation for pickup orders.
            </p>
            <div className="mt-4">
              <Field
                label="Pickup instructions"
                name="pickupInstructions"
                defaultValue={settings?.pickup_instructions ?? ""}
                textarea
                placeholder="Collect from... We will send the exact location after confirming your order."
              />
            </div>
          </section>

          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold text-brand-green">
                  Store availability
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Controls whether customers can place orders.
                </p>
              </div>
              <label className="inline-flex items-center gap-3 rounded-full border border-brand-green/15 bg-brand-sand/70 px-4 py-2 text-sm font-semibold text-brand-green-deep shadow-sm">
                <span className="text-xs uppercase tracking-[0.14em] text-brand-green/60">Orders</span>
                <input
                  type="checkbox"
                  name="isOpen"
                  defaultChecked={settings?.is_open ?? true}
                  className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-brand-green/20 transition before:ml-0.5 before:block before:size-4 before:rounded-full before:bg-white before:transition checked:bg-brand-green checked:before:translate-x-4"
                  aria-label="Store open for orders"
                />
                <span>ON / OFF</span>
              </label>
            </div>

            <div className="mt-4">
              <Field
                label="Opening note / closed-store message"
                name="openingNote"
                defaultValue={settings?.opening_note ?? ""}
                textarea
                placeholder="Shown on the menu/checkout. When closed, this is the unavailable message."
              />
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-brand-green">
              Business logo
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Upload the official logo. It is used in your business settings and
              can be wired into the storefront without redesigning it.
            </p>

            <div className="mt-4 flex min-h-28 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-brand-green/20 bg-brand-cream p-4">
              {isAllowedImageUrl(logoUrl) ? (
                <Image
                  src={logoUrl}
                  alt="Business logo preview"
                  width={180}
                  height={80}
                  className="h-auto w-auto max-h-20 object-contain"
                />
              ) : (
                <span className="px-3 text-center text-xs text-brand-green/50">
                  {logoUrl
                    ? "Use a Supabase Storage URL, or upload the logo file."
                    : "No logo uploaded"}
                </span>
              )}
            </div>

            <label className="mt-4 block">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green/60">
                Upload logo
              </span>
              <input
                type="file"
                name="logo"
                accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setLogoFileName(file ? file.name : null);
                }}
                className="mt-2 block w-full text-xs text-muted file:mr-3 file:rounded-full file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-xs file:font-semibold file:text-brand-white"
              />
            </label>
            {logoFileName ? (
              <p className="mt-1 text-xs text-muted">{logoFileName} selected</p>
            ) : null}

            <div className="mt-4">
              <Field
                label="Logo URL"
                name="logoUrl"
                defaultValue={logoUrl}
                placeholder="/brand/logo.png or Supabase storage URL"
                onChange={setLogoUrl}
              />
              <p className="mt-1 text-[0.65rem] leading-relaxed text-muted">
                Remote logos must come from Supabase Storage. Uploading is
                recommended.
              </p>
            </div>
          </section>

          <section className="rounded-brand border border-brand-green/10 bg-brand-white p-5 sm:p-6">
            <h2 className="font-display text-xl font-semibold text-brand-green">
              Notifications
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              New orders always show a dashboard indicator. Automated SMS alerts can notify the kitchen number when configured.
            </p>

            <div className="mt-4 space-y-3">
              <label className="flex items-start gap-3 rounded-xl bg-brand-cream/60 p-3">
                <input
                  type="checkbox"
                  name="notifyDashboard"
                  defaultChecked={settings?.notify_dashboard ?? true}
                  className="mt-0.5 size-4 accent-[#174b20]"
                />
                <span>
                  <span className="block text-sm font-semibold text-brand-green">
                    Dashboard notifications
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    Show new order indicators in the admin dashboard.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl bg-brand-cream/60 p-3">
                <input
                  type="checkbox"
                  name="notifyWhatsapp"
                  defaultChecked={settings?.notify_whatsapp ?? false}
                  className="mt-0.5 size-4 accent-[#174b20]"
                />
                <span>
                  <span className="block text-sm font-semibold text-brand-green">
                    SMS quick-contact alerts
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                    Enable one-tap SMS contact actions from order details.
                  </span>
                </span>
              </label>
            </div>
          </section>

          <button
            type="submit"
            disabled={isPending}
            className={buttonStyles({ size: "lg", className: "w-full" })}
          >
            {isPending ? "Saving..." : "Save settings"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  type = "text",
  textarea = false,
  required = false,
  className,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  type?: string;
  textarea?: boolean;
  required?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}) {
  const shared =
    "mt-1.5 w-full rounded-xl border border-brand-green/15 bg-brand-white px-3 text-sm text-brand-green placeholder:text-brand-green/30 focus:border-brand-green focus:outline-none focus:ring-2 focus:ring-brand-green/15";

  return (
    <label className={`block ${className ?? ""}`}>
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-green/60">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={`${shared} min-h-24 py-2.5`}
        />
      ) : onChange ? (
        <input
          type={type}
          name={name}
          value={defaultValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          required={required}
          className={`${shared} h-11`}
        />
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          required={required}
          className={`${shared} h-11`}
        />
      )}
    </label>
  );
}

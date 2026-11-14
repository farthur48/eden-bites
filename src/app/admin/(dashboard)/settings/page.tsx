import type { Metadata } from "next";

import { SettingsForm } from "@/components/admin/settings-form";
import { EmptyState } from "@/components/ui/empty-state";
import { getBusinessSettings } from "@/lib/data/settings";
import { hasPublicEnv } from "@/lib/env";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const [params, settings] = await Promise.all([searchParams, getBusinessSettings()]);

  if (!hasPublicEnv()) {
    return (
      <EmptyState
        eyebrow="Database"
        title="Connect Supabase to manage settings"
        description="Add Supabase credentials and apply migrations first."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage business details, contact information, pickup, and notifications.
        </p>
      </div>

      {params.saved === "1" ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Settings saved successfully.
        </p>
      ) : null}

      <SettingsForm settings={settings} />
    </div>
  );
}

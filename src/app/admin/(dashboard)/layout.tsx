import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/layout/admin-shell";
import { getNewOrderCount } from "@/lib/data/orders";
import { getBusinessSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAdmin();
  const [newOrderCount, settings] = await Promise.all([
    getNewOrderCount(),
    getBusinessSettings(),
  ]);
  const showNewOrders = settings?.notify_dashboard !== false;

  return (
    <AdminShell
      email={user.email ?? "Signed in"}
      newOrderCount={showNewOrders ? newOrderCount : 0}
      logoUrl={settings?.logo_url}
    >
      {children}
    </AdminShell>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BellRing, X } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type Notice = { id: string; reference: string; createdAt: string };

const POLL_MS = 25000;
const STORAGE_KEY = "eden-bites-seen-order-notices";

export function AdminOrderNotifier({ initialNewCount }: { initialNewCount: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const [newCount, setNewCount] = useState(initialNewCount);
  const [notice, setNotice] = useState<Notice | null>(null);
  const seenRef = useRef<Set<string>>(loadSeen());

  const displayNewCount = Math.max(newCount, initialNewCount);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function refreshCount() {
      try {
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "new");
        if (!cancelled && typeof count === "number") setNewCount(count);
      } catch {
        // ignore fallback failure
      }
    }

    function handleIncoming(order: { id?: string; reference?: string; created_at?: string; status?: string } | null) {
      if (!order?.id || order.status !== "new") return;
      if (seenRef.current.has(order.id)) return;
      seenRef.current.add(order.id);
      persistSeen(seenRef.current);
      setNewCount((c) => c + 1);
      setNotice({ id: order.id, reference: order.reference ?? "New order", createdAt: order.created_at ?? new Date().toISOString() });
      router.refresh();
    }

    const channel = supabase
      .channel("admin-order-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        handleIncoming(payload.new as { id?: string; reference?: string; created_at?: string; status?: string } | null);
      })
      .subscribe();

    const interval = window.setInterval(refreshCount, POLL_MS);
    void refreshCount();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  const badge = useMemo(() => (displayNewCount > 99 ? "99+" : String(displayNewCount)), [displayNewCount]);

  return (
    <>
      <Link
        href="/admin/orders?status=new"
        aria-label={displayNewCount > 0 ? `${displayNewCount} new orders` : "Notifications"}
        className="relative inline-flex size-10 items-center justify-center rounded-xl text-brand-green-deep transition-colors hover:bg-brand-cream"
        title={displayNewCount > 0 ? `${displayNewCount} new order${displayNewCount === 1 ? "" : "s"}` : "No new orders"}
      >
        <BellRing className="size-5" strokeWidth={1.8} />
        {displayNewCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-brand-lime px-1 py-0.5 text-[0.6rem] font-bold text-brand-black ring-2 ring-white">
            {badge}
          </span>
        ) : null}
      </Link>

      {notice && pathname !== `/admin/orders/${notice.id}` ? (
        <div className="pointer-events-none fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))] sm:right-6">
          <div className="pointer-events-auto rounded-2xl border border-brand-green/15 bg-white p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.35)]">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-lime text-brand-green-deep">
                <BellRing className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-brand-green-deep">New order received</p>
                <p className="mt-0.5 truncate text-xs text-muted">{notice.reference}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/orders/${notice.id}`}
                    onClick={() => setNotice(null)}
                    className="inline-flex rounded-lg bg-brand-green-deep px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Open order
                  </Link>
                  <Link href="/admin/orders?status=new" onClick={() => setNotice(null)} className="inline-flex rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-brand-green-deep">
                    View all new
                  </Link>
                </div>
              </div>
              <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification" className="rounded-md p-1 text-muted hover:bg-brand-cream hover:text-brand-green-deep">
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const arr = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(arr.slice(-100));
  } catch {
    return new Set();
  }
}

function persistSeen(set: Set<string>) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-100)));
  } catch {
    // ignore
  }
}

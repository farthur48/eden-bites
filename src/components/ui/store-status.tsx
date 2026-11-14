import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import type { StoreSettings } from "@/types/database";

export function StoreStatus({
  store,
  className,
}: {
  store: StoreSettings | null;
  className?: string;
}) {
  if (!store) {
    return (
      <Badge variant="muted" className={className}>
        Store status unavailable
      </Badge>
    );
  }

  return (
    <Badge
      variant={store.is_open ? "success" : "danger"}
      className={className}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          store.is_open ? "bg-emerald-600" : "bg-red-600",
        )}
      />
      {store.is_open ? "Open now" : "Closed"}
    </Badge>
  );
}

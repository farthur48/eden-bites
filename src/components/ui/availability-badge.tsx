import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { StoreAvailability } from "@/lib/store/availability";

export function AvailabilityBadge({
  store,
  className,
}: {
  store: StoreAvailability;
  className?: string;
}) {
  return (
    <Badge
      variant={store.isOpen ? "success" : "danger"}
      className={className}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          store.isOpen ? "bg-emerald-600" : "bg-red-600",
        )}
        aria-hidden="true"
      />
      {store.label}
    </Badge>
  );
}

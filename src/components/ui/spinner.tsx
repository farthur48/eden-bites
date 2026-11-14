import { cn } from "@/lib/utils";

export function Spinner({
  className,
  label = "Loading",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <svg
        className={cn("size-4 animate-spin motion-reduce:animate-none", className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray="40 20"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}

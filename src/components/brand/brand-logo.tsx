import Image from "next/image";
import Link from "next/link";

import { isAllowedImageUrl } from "@/lib/images";
import { cn } from "@/lib/utils";

export function BrandLogo({
  variant = "dark",
  compact = false,
  href = "/",
  logoUrl,
}: {
  variant?: "dark" | "light";
  compact?: boolean;
  href?: string;
  logoUrl?: string | null;
}) {
  const isLight = variant === "light";
  const logoSrc = isAllowedImageUrl(logoUrl) ? logoUrl : null;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2.5 leading-none"
      aria-label="Eden Bites home"
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt="Eden Bites"
          width={148}
          height={52}
          className={cn(
            "w-auto object-contain",
            compact ? "h-10 max-w-36" : "h-12 max-w-40",
          )}
        />
      ) : (
        <span className="inline-flex flex-col">
          <span
            className={cn(
              "font-display font-semibold tracking-tight",
              compact ? "text-xl" : "text-2xl sm:text-[1.7rem]",
              isLight ? "text-brand-cream" : "text-brand-green",
            )}
          >
            Eden Bites
          </span>
          {compact ? null : (
            <span
              className={cn(
                "mt-1.5 text-[0.58rem] font-semibold uppercase tracking-[0.3em]",
                isLight ? "text-brand-lime" : "text-brand-green/55",
              )}
            >
              Life In Every Bite.
            </span>
          )}
        </span>
      )}
    </Link>
  );
}

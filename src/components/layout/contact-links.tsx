import {
  instagramHref,
  mapsHref,
  phoneHref,
  smsHref,
  type ContactDetails,
} from "@/lib/site-config";
import { cn } from "@/lib/utils";

type ContactItem = {
  label: string;
  value: string;
  href: string;
  external?: boolean;
};

export function ContactLinks({
  details,
  tone = "dark",
  className,
}: {
  details: ContactDetails;
  tone?: "dark" | "light";
  className?: string;
}) {
  const items: ContactItem[] = [];

  if (details.phone) {
    items.push({
      label: "Call",
      value: details.phone,
      href: phoneHref(details.phone),
    });
  }

  if (details.sms) {
    items.push({
      label: "SMS",
      value: details.sms,
      href: smsHref(details.sms),
    });
  }

  if (details.email) {
    items.push({
      label: "Email",
      value: details.email,
      href: `mailto:${details.email}`,
    });
  }

  if (details.address) {
    items.push({
      label: "Find us",
      value: details.address,
      href: mapsHref(details.address),
      external: true,
    });
  }

  if (details.instagram) {
    items.push({
      label: "Instagram",
      value: details.instagram,
      href: instagramHref(details.instagram),
      external: true,
    });
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <ul className={cn("grid gap-3 text-sm", className)}>
      {items.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[5.25rem_1fr] items-baseline gap-3"
        >
          <span
            className={cn(
              "text-[0.62rem] font-semibold uppercase tracking-[0.18em]",
              tone === "light" ? "text-brand-lime/80" : "text-brand-green/50",
            )}
          >
            {item.label}
          </span>
          <a
            href={item.href}
            {...(item.external
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
            className={cn(
              "break-words font-semibold transition-colors",
              tone === "light"
                ? "text-brand-cream hover:text-brand-lime"
                : "text-brand-green hover:text-brand-green-soft",
            )}
          >
            {item.value}
          </a>
        </li>
      ))}
    </ul>
  );
}

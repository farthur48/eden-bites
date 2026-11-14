"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/#story", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav
      className="hidden items-center gap-8 lg:flex"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : link.href === "/menu"
              ? pathname.startsWith("/menu")
              : false;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative py-1 text-[0.95rem] font-medium transition-colors",
              active
                ? "text-brand-green-deep"
                : "text-foreground/70 hover:text-brand-green-deep",
            )}
          >
            {link.label}
            <span
              className={cn(
                "absolute -bottom-1 left-0 h-0.5 rounded-full bg-brand-lime transition-all duration-200",
                active ? "w-full opacity-100" : "w-0 opacity-0",
              )}
              aria-hidden="true"
            />
          </Link>
        );
      })}
    </nav>
  );
}

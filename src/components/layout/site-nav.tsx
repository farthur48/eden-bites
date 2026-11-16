"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home", id: null },
  { href: "/menu", label: "Menu", id: null },
  { href: "/#story", label: "About", id: "story" },
  { href: "/#contact", label: "Contact", id: "contact" },
] as const;

export function SiteNav() {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const activeHash = pathname === "/" ? hash : "";

  useEffect(() => {
    if (pathname !== "/") return;

    const update = () => setHash(window.location.hash.replace("#", ""));
    update();
    window.addEventListener("hashchange", update);

    const sections = links
      .map((l) => l.id)
      .filter((id): id is "story" | "contact" => id !== null)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (sections.length === 0) {
      return () => window.removeEventListener("hashchange", update);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setHash(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.2, 0.4, 0.7] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => {
      window.removeEventListener("hashchange", update);
      observer.disconnect();
    };
  }, [pathname]);

  return (
    <nav className="hidden items-center gap-8 lg:flex" aria-label="Main navigation">
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/" && !activeHash
            : link.href === "/menu"
              ? pathname.startsWith("/menu")
              : pathname === "/" && activeHash === link.id;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "relative py-1 text-[0.95rem] font-medium transition-colors",
              active ? "text-brand-green-deep" : "text-foreground/70 hover:text-brand-green-deep",
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

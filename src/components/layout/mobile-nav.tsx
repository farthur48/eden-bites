"use client";

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { buttonStyles } from "@/components/ui/button";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/#story", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export function MobileNav() {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const open = openPathname === pathname;

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPathname(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpenPathname(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="inline-flex size-11 items-center justify-center rounded-xl border border-brand-green/15 text-brand-green-deep transition-colors hover:bg-brand-cream"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpenPathname(null)}
            className="fixed inset-0 top-[4.5rem] z-40 bg-brand-black/20 backdrop-blur-[2px]"
          />
          <div
            id="mobile-nav"
            className="fixed inset-x-0 top-[4.5rem] z-50 border-b border-border bg-white px-5 py-5 shadow-lg sm:px-8"
          >
            <nav className="mx-auto flex max-w-7xl flex-col">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-3.5 text-base font-medium text-brand-green-deep/85 transition-colors hover:bg-brand-cream hover:text-brand-green-deep"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/menu"
                className={buttonStyles({
                  variant: "accent",
                  size: "lg",
                  className: "mt-4 w-full",
                })}
              >
                Order Now
              </Link>
            </nav>
          </div>
        </>
      ) : null}
    </div>
  );
}

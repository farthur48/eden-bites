import Link from "next/link";
import { Camera, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { Container } from "@/components/layout/container";
import { getPublicBusinessProfile } from "@/lib/data/settings";
import {
  instagramHref,
  mapsHref,
  phoneHref,
  whatsappHref,
} from "@/lib/site-config";

const year = new Date().getFullYear();

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/#story", label: "About" },
  { href: "/#contact", label: "Contact" },
];

export async function SiteFooter() {
  const profile = await getPublicBusinessProfile();
  const businessName = profile.settings?.store_name?.trim() || "Eden Bites";
  const { contact } = profile;

  const socials = [
    contact.instagram
      ? { label: "Instagram", href: instagramHref(contact.instagram), icon: Camera }
      : null,
    contact.whatsapp
      ? { label: "WhatsApp", href: whatsappHref(contact.whatsapp), icon: MessageCircle }
      : null,
    contact.phone
      ? { label: "Call", href: phoneHref(contact.phone), icon: Phone }
      : null,
    contact.email
      ? { label: "Email", href: `mailto:${contact.email}`, icon: Mail }
      : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null);

  return (
    <footer className="mt-auto bg-[#0b2711] text-brand-cream">
      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.7fr_1fr] lg:gap-12 lg:py-16">
        <div className="max-w-sm">
          <BrandLogo variant="light" logoUrl={profile.settings?.logo_url} />
          <p className="mt-5 text-sm leading-7 text-brand-cream/70">
            {businessName} serves freshly made Ghanaian meals for delivery and
            pickup. Good food, prepared with care, for everyday moments worth
            enjoying.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {socials.length > 0 ? (
              socials.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith("http") ? "_blank" : undefined}
                    rel={social.href.startsWith("http") ? "noreferrer" : undefined}
                    aria-label={social.label}
                    className="inline-flex size-10 items-center justify-center rounded-full border border-white/15 text-brand-cream/80 transition-colors hover:border-brand-lime/50 hover:text-brand-lime"
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </a>
                );
              })
            ) : (
              <p className="text-xs text-brand-cream/45">
                Social links will appear here once configured.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-brand-lime">
            Navigation
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-brand-cream/70">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/cart" className="transition-colors hover:text-white">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-brand-lime">
            Service
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-brand-cream/70">
            <li>Delivery</li>
            <li>Pickup</li>
            <li>Pay on delivery or pickup</li>
            <li>
              <Link href="/admin/login" className="transition-colors hover:text-white">
                Staff sign in
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.22em] text-brand-lime">
            Contact
          </h2>
          <ul className="mt-5 space-y-3 text-sm text-brand-cream/70">
            {contact.phone ? (
              <li>
                <a href={phoneHref(contact.phone)} className="flex items-start gap-2.5 transition-colors hover:text-white">
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand-lime/70" />
                  {contact.phone}
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-start gap-2.5 break-all transition-colors hover:text-white">
                  <Mail className="mt-0.5 size-4 shrink-0 text-brand-lime/70" />
                  {contact.email}
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li>
                <a href={mapsHref(contact.address)} target="_blank" rel="noreferrer" className="flex items-start gap-2.5 transition-colors hover:text-white">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-lime/70" />
                  {contact.address}
                </a>
              </li>
            ) : null}
            {!contact.phone && !contact.email && !contact.address ? (
              <li className="text-xs text-brand-cream/45">
                Contact details will appear here once configured.
              </li>
            ) : null}
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-2 py-5 text-xs text-brand-cream/45 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {year} {businessName}. All rights reserved.</p>
          <p>Freshly made, made with care.</p>
        </Container>
      </div>
    </footer>
  );
}

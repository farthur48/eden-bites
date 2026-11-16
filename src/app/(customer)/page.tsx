import Image from "next/image";
import Link from "next/link";
import { ArrowRight, UtensilsCrossed, Clock3, MapPin, Wallet, MessageCircle, Phone, ArrowUp } from "lucide-react";

import { Container } from "@/components/layout/container";
import { MenuExperience } from "@/components/menu/menu-experience";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicBusinessProfile } from "@/lib/data/settings";
import { formatGhs } from "@/lib/format";
import { getMenuProducts } from "@/lib/menu/catalog";
import { getStoreAvailability } from "@/lib/store/availability";
import { mapsHref, phoneHref, smsHref } from "@/lib/site-config";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [menu, store, profile] = await Promise.all([
    getMenuProducts(),
    getStoreAvailability(),
    getPublicBusinessProfile(),
  ]);
  const products = menu.products;
  const heroProduct = products.find((p) => p.isFeatured) ?? products[0];
  const featured = products.slice(0, 2);
  const introProduct =
    products.find((p) => p.id !== heroProduct?.id) ?? heroProduct;
  const contactHref = profile.contact.sms
    ? smsHref(profile.contact.sms)
    : profile.contact.phone
      ? phoneHref(profile.contact.phone)
      : "/#contact";
  const contactExternal = contactHref.startsWith("sms:") || contactHref.startsWith("tel:");

  return (
    <>
      <section className="bg-white">
        <Container className="grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:py-20">
          <div className="max-w-xl">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-brand-green/60">
              Freshly made, made with care
            </p>
            <h1 className="mt-5 text-balance font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] text-brand-green-deep sm:text-6xl lg:text-[4.1rem]">
              Good Food. Great Moments. Every Bite.
            </h1>
            <p className="mt-6 max-w-lg text-pretty text-base leading-7 text-muted sm:text-lg">
              Enjoy freshly prepared Ghanaian meals made with care. Order for
              delivery or pickup and savour every moment at the table.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/menu" className={buttonStyles({ variant: "accent", size: "lg" })}>
                View Our Menu
              </Link>
              <Link
                href={contactHref}
                className={buttonStyles({ variant: "outline", size: "lg" })}
                {...(contactExternal ? {} : {})}
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                Contact us
              </Link>
            </div>
            {!store.isOpen ? (
              <p className="mt-6 inline-flex rounded-full bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800">
                {store.message || "Orders are currently paused. You can still explore the menu."}
              </p>
            ) : null}
          </div>

          <div className="relative">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-brand-sand sm:aspect-[5/4] lg:aspect-[4/5]">
              {heroProduct ? (
                <Image
                  src={heroProduct.imageUrl}
                  alt={heroProduct.imageAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 45vw, 92vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-cream to-brand-sand text-brand-green-deep">
                  <UtensilsCrossed className="size-8 opacity-50" />
                  <p className="text-sm font-medium">Fresh meals coming up</p>
                </div>
              )}
            </div>
            {heroProduct ? (
              <Link
                href="/menu"
                className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/60 bg-white/90 p-3 backdrop-blur transition-colors hover:bg-white sm:left-auto sm:right-4 sm:w-[15rem]"
              >
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-brand-green/55">Featured today</p>
                <p className="mt-1 truncate font-display text-sm font-bold text-brand-green-deep">{heroProduct.name}</p>
                <p className="mt-0.5 text-xs text-muted">From {formatGhs(heroProduct.pricePesewas)} · Browse to customize & order</p>
              </Link>
            ) : null}
          </div>
        </Container>
      </section>

      <section className="border-y border-border/70 bg-white">
        <Container className="grid gap-4 py-5 sm:grid-cols-2 sm:py-6 lg:grid-cols-4">
          <div className="flex items-start gap-3 rounded-2xl bg-brand-cream/40 px-4 py-3">
            <Clock3 className="mt-0.5 size-4 text-brand-green" />
            <div><p className="text-sm font-semibold text-brand-green-deep">Freshly prepared</p><p className="text-xs text-muted">Cooked to order with care</p></div>
          </div>
          {profile.contact.address ? (
            <a
              href={mapsHref(profile.contact.address)}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-3 rounded-2xl bg-brand-cream/40 px-4 py-3 transition-colors hover:bg-brand-cream/70"
            >
              <MapPin className="mt-0.5 size-4 text-brand-green" />
              <div className="min-w-0"><p className="text-sm font-semibold text-brand-green-deep">Delivery & pickup</p><p className="truncate text-xs text-muted underline decoration-brand-green/20 underline-offset-2">{profile.contact.address}</p></div>
            </a>
          ) : (
            <Link href="/#contact" className="flex items-start gap-3 rounded-2xl bg-brand-cream/40 px-4 py-3 transition-colors hover:bg-brand-cream/70">
              <MapPin className="mt-0.5 size-4 text-brand-green" />
              <div><p className="text-sm font-semibold text-brand-green-deep">Delivery & pickup</p><p className="text-xs text-muted">Contact us for service area details</p></div>
            </Link>
          )}
          <div className="flex items-start gap-3 rounded-2xl bg-brand-cream/40 px-4 py-3">
            <Wallet className="mt-0.5 size-4 text-brand-green" />
            <div><p className="text-sm font-semibold text-brand-green-deep">Pay on arrival</p><p className="text-xs text-muted">Cash or MoMo on delivery/pickup</p></div>
          </div>
          <Link href={contactHref} className="flex items-start gap-3 rounded-2xl bg-brand-cream/40 px-4 py-3 transition-colors hover:bg-brand-cream/70">
            {profile.contact.phone ? <Phone className="mt-0.5 size-4 text-brand-green" /> : <MessageCircle className="mt-0.5 size-4 text-brand-green" />}
            <div><p className="text-sm font-semibold text-brand-green-deep">Order updates</p><p className="text-xs text-muted">We’ll confirm by phone or SMS</p></div>
          </Link>
        </Container>
      </section>

      <section id="featured" className="scroll-mt-24 bg-brand-cream/50 py-12 sm:py-16 lg:py-20">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Menu"
            title="A Taste of Eden"
            description="Explore some of the meals waiting for you."
          />
          {featured.length > 0 ? (
            <div className="mt-8">
              <p className="mb-5 text-center text-xs font-medium text-muted">Choose a meal to customize options before adding to cart.</p>
              <div className={featured.length === 1 ? "mx-auto max-w-xl" : ""}>
                <MenuExperience
                  products={featured}
                  store={store}
                  ctaLabel="Order Now"
                  showControls={false}
                />
              </div>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/menu" className={buttonStyles({ variant: "outline" })}>
                  View full menu <ArrowRight className="size-4" />
                </Link>
                <Link href="/#contact" className="text-sm font-semibold text-brand-green-deep underline decoration-brand-green/20 underline-offset-4 hover:decoration-brand-lime">
                  Need help? Contact us
                </Link>
              </div>
            </div>
          ) : (
            <EmptyState
              className="mt-10"
              eyebrow="Menu"
              title="Our menu is being prepared"
              description="Fresh meals will appear here soon."
              action={<Link href="/menu" className={buttonStyles()}>Visit the menu</Link>}
            />
          )}
        </Container>
      </section>

      <section id="story" className="scroll-mt-24 bg-white py-12 sm:py-16 lg:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem] bg-brand-sand">
            {introProduct ? (
              <Image
                src={introProduct.imageUrl}
                alt={introProduct.imageAlt}
                fill
                sizes="(min-width: 1024px) 46vw, 92vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-brand-cream to-brand-sand text-brand-green-deep">
                <UtensilsCrossed className="size-10 opacity-45" />
                <p className="text-sm font-medium">Freshly made, made with care</p>
              </div>
            )}
          </div>
          <div className="max-w-xl">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-brand-green/60">
              About Eden Bites
            </p>
            <h2 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.035em] text-brand-green-deep sm:text-4xl lg:text-[2.6rem]">
              A Little More Than Just a Meal.
            </h2>
            <p className="mt-5 text-base leading-7 text-muted">
              Eden Bites is about more than satisfying hunger. It is about meals
              prepared with care, moments shared around good food, and flavours
              that feel familiar and comforting. Every order is made to bring
              warmth to your day.
            </p>
            <div className="mt-6 h-1 w-14 rounded-full bg-brand-lime" aria-hidden="true" />
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/menu" className={buttonStyles({ variant: "outline" })}>
                Explore Our Menu
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href={contactHref} className={buttonStyles({ variant: "ghost" })}>
                Contact us
              </Link>
            </div>
          </div>
        </Container>
      </section>

      <div className="bg-white pb-10 pt-2 text-center sm:pb-12">
        <Container>
          <a href="#main-content" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-green/55 transition-colors hover:text-brand-green-deep">
            <ArrowUp className="size-3.5" aria-hidden="true" /> Back to top
          </a>
        </Container>
      </div>
    </>
  );
}

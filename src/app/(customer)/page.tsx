import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag, UtensilsCrossed, MousePointerClick } from "lucide-react";

import { Container } from "@/components/layout/container";
import { MenuExperience } from "@/components/menu/menu-experience";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublicBusinessProfile } from "@/lib/data/settings";
import { getMenuProducts } from "@/lib/menu/catalog";
import { getStoreAvailability } from "@/lib/store/availability";

export const dynamic = "force-dynamic";

const steps = [
  {
    number: "01",
    title: "Explore the Menu",
    description: "Browse our meals and see what is freshly available today.",
    icon: UtensilsCrossed,
  },
  {
    number: "02",
    title: "Choose Your Meal",
    description: "Customise your plate with your preferred options and quantity.",
    icon: MousePointerClick,
  },
  {
    number: "03",
    title: "Place Your Order",
    description: "Select delivery or pickup and pay when your meal arrives.",
    icon: ShoppingBag,
  },
];

export default async function HomePage() {
  const [menu, store] = await Promise.all([
    getMenuProducts(),
    getStoreAvailability(),
    getPublicBusinessProfile(),
  ]);
  const products = menu.products;
  const heroProduct = products.find((p) => p.isFeatured) ?? products[0];
  const featured = products.slice(0, 2);
  const introProduct =
    products.find((p) => p.id !== heroProduct?.id) ?? heroProduct;

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
                href="/menu"
                className="inline-flex h-12 items-center justify-center rounded-xl px-2 text-sm font-semibold text-brand-green-deep underline decoration-brand-green/20 underline-offset-4 transition-colors hover:decoration-brand-lime sm:px-4"
              >
                Explore Our Meals
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
                <div className="flex h-full items-center justify-center text-sm text-muted">
                  Meal photo placeholder
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section id="featured" className="scroll-mt-24 bg-brand-cream/50 py-16 sm:py-20 lg:py-24">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Menu"
            title="A Taste of Eden"
            description="Explore some of the meals waiting for you."
          />
          {featured.length > 0 ? (
            <div className="mt-10">
              <MenuExperience
                products={featured}
                store={store}
                ctaLabel="Order Now"
              />
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

      <section id="story" className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24">
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
            ) : null}
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
            <Link
              href="/menu"
              className={buttonStyles({ variant: "outline", className: "mt-7" })}
            >
              Explore Our Menu
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </Container>
      </section>

      <section id="how-it-works" className="scroll-mt-24 bg-brand-cream/40 py-16 sm:py-20 lg:py-24">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title="Ordering made simple"
            description="A few easy steps from menu to meal."
          />
          <div className="relative mt-12 grid gap-8 md:grid-cols-3">
            <div
              className="pointer-events-none absolute left-[16%] right-[16%] top-8 hidden h-px bg-brand-green/15 md:block"
              aria-hidden="true"
            />
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-brand-green/10 bg-white text-brand-green-deep shadow-sm">
                    <Icon className="size-6" strokeWidth={1.8} aria-hidden="true" />
                  </div>
                  <p className="mt-4 text-xs font-bold tracking-[0.2em] text-brand-green/50">
                    {step.number}
                  </p>
                  <h3 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-brand-green-deep">
                    {step.title}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      <section className="bg-brand-green-deep py-16 text-white sm:py-20">
        <Container className="text-center">
          <h2 className="mx-auto max-w-3xl text-balance font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-4xl lg:text-5xl">
            Your Next Favourite Meal Is Waiting.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-brand-cream/75">
            Freshly prepared, easy to order, and ready when you are.
          </p>
          <Link
            href="/menu"
            className={buttonStyles({
              variant: "accent",
              size: "lg",
              className: "mt-8",
            })}
          >
            Order Now
          </Link>
        </Container>
      </section>
    </>
  );
}

import { Container } from "@/components/layout/container";

export default function MenuLoading() {
  return (
    <div aria-busy="true" aria-live="polite">
      <section className="border-b border-border/70 bg-brand-cream/40 py-14 sm:py-18 lg:py-20">
        <Container className="flex flex-col items-center gap-4">
          <div className="h-3 w-20 animate-pulse rounded-full bg-brand-green/10" />
          <div className="h-10 w-72 max-w-full animate-pulse rounded-xl bg-brand-green/10" />
          <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-brand-green/10" />
        </Container>
      </section>
      <section className="py-12 sm:py-16 lg:py-20">
        <Container>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-white">
                <div className="aspect-[4/3] animate-pulse bg-brand-sand" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded-full bg-brand-green/10" />
                  <div className="h-4 w-full animate-pulse rounded-full bg-brand-green/10" />
                  <div className="h-10 w-full animate-pulse rounded-xl bg-brand-green/10" />
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
      <span className="sr-only">Loading menu</span>
    </div>
  );
}

import { Container } from "@/components/layout/container";

export default function CustomerLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="bg-background">
      <section className="py-14 sm:py-18 lg:py-20">
        <Container className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-5">
            <div className="h-3 w-40 animate-pulse rounded-full bg-brand-green/10" />
            <div className="h-14 w-4/5 animate-pulse rounded-2xl bg-brand-green/10" />
            <div className="h-14 w-3/5 animate-pulse rounded-2xl bg-brand-green/10" />
            <div className="h-4 w-full max-w-md animate-pulse rounded-full bg-brand-green/10" />
            <div className="h-12 w-44 animate-pulse rounded-xl bg-brand-green/10" />
          </div>
          <div className="aspect-[4/5] w-full animate-pulse rounded-[1.75rem] bg-brand-sand sm:aspect-[5/4] lg:aspect-[4/5]" />
        </Container>
      </section>
      <section className="bg-brand-cream/40 py-14 sm:py-18">
        <Container>
          <div className="mx-auto h-8 w-56 animate-pulse rounded-xl bg-brand-green/10" />
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[0, 1].map((item) => (
              <div key={item} className="h-96 animate-pulse rounded-[1.25rem] bg-white" />
            ))}
          </div>
        </Container>
      </section>
      <span className="sr-only">Loading</span>
    </div>
  );
}

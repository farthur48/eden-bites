import { Container } from "@/components/layout/container";

export default function MenuLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="bg-white">
      <section className="pb-2 pt-3">
        <Container>
          <div className="h-11 w-full animate-pulse rounded-full bg-gray-100" />
          <div className="mt-4 grid grid-cols-4 gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[5.25rem] animate-pulse rounded-2xl border border-[#14532D]/10 bg-[#F4F6EE]" />
            ))}
          </div>
          <div className="mt-4 flex gap-2.5 overflow-hidden">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 w-20 shrink-0 animate-pulse rounded-full bg-gray-100" />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-2.5">
                <div className="aspect-[4/3] animate-pulse rounded-xl bg-brand-sand" />
                <div className="mt-2 space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    <div className="h-8 w-8 animate-pulse rounded-xl bg-gray-100" />
                  </div>
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

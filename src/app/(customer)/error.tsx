"use client";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="bg-background py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-lg rounded-[1.5rem] border border-border/80 bg-white p-8 text-center sm:p-10">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-brand-green/60">
            Something went wrong
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-brand-green-deep">
            We couldn&apos;t load this page
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Please try again. If the problem continues, refresh the page or check back shortly.
          </p>
          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-muted">Reference: {error.digest}</p>
          ) : null}
          <Button onClick={reset} variant="accent" className="mt-7">
            Try again
          </Button>
        </div>
      </Container>
    </section>
  );
}

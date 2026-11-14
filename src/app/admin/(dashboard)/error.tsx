"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-[1.25rem] border border-red-200 bg-white p-8">
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-red-700">
        Dashboard error
      </p>
      <h1 className="mt-3 font-display text-2xl font-extrabold text-brand-green-deep">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">
        This view could not be loaded. Try again, and if the problem continues check your Supabase connection and logs.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted">Reference: {error.digest}</p>
      ) : null}
      <Button onClick={reset} variant="accent" className="mt-6">
        Try again
      </Button>
    </div>
  );
}

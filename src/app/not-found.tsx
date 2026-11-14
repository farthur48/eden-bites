import Link from "next/link";

import { Container } from "@/components/layout/container";
import { buttonStyles } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center bg-background py-16">
      <Container>
        <div className="mx-auto max-w-lg rounded-[1.5rem] border border-border/80 bg-white p-8 text-center sm:p-12">
          <p className="font-display text-6xl font-extrabold tracking-tight text-brand-lime">404</p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.03em] text-brand-green-deep">
            Page not found
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
            The page you&apos;re looking for doesn&apos;t exist or may have been moved.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/menu" className={buttonStyles({ variant: "accent" })}>
              Browse the menu
            </Link>
            <Link href="/" className={buttonStyles({ variant: "outline" })}>
              Go home
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}

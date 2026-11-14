import type { Metadata } from "next";
import Image from "next/image";

import { Container } from "@/components/layout/container";

export const metadata: Metadata = {
  title: "Photo credits",
  description: "Attribution for the food photography used on the Eden Bites menu.",
};

const photos = [
  {
    name: "Banku & Tilapia",
    image: "/menu/banku-tilapia.jpg",
    alt: "Banku and charcoal-grilled tilapia with onion and pepper relish",
    title: "Grilled tilapia with banku",
    author: "sshreeves",
    source:
      "https://commons.wikimedia.org/wiki/File:Grilled_tilapia_with_banku.jpg",
    license: "CC BY 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by/2.0/",
    changes: "Cropped, resized and colour-adjusted.",
  },
  {
    name: "Acheke & Tilapia",
    image: "/menu/acheke-tilapia.jpg",
    alt: "Charcoal-grilled tilapia topped with onion and tomato relish",
    title: "Sole braisé et attiéké",
    author: "Likikouet Raïssa",
    source:
      "https://commons.wikimedia.org/wiki/File:Sole_brais%C3%A9_et_atti%C3%A9k%C3%A9.jpg",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    changes:
      "Cropped, resized and colour-adjusted. The adapted image remains available under CC BY-SA 4.0.",
  },
];

export default function CreditsPage() {
  return (
    <section className="bg-background py-12 sm:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-brand-green/60">
            Photography
          </p>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-[-0.035em] text-brand-green-deep sm:text-4xl">
            Photo credits
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
            Menu images are sourced from Wikimedia Commons under the licences below and are
            representative of the meals offered.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {photos.map((photo) => (
            <article
              key={photo.name}
              className="overflow-hidden rounded-[1.25rem] border border-border/80 bg-white"
            >
              <div className="relative aspect-[4/3] bg-brand-sand">
                <Image
                  src={photo.image}
                  alt={photo.alt}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="p-6 sm:p-7">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-brand-green/55">
                  {photo.name}
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold text-brand-green-deep">
                  {photo.title}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  By{" "}
                  <a
                    href={photo.source}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4"
                  >
                    {photo.author}
                  </a>{" "}
                  via Wikimedia Commons. Licensed under{" "}
                  <a
                    href={photo.licenseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-brand-green-deep underline decoration-brand-lime decoration-2 underline-offset-4"
                  >
                    {photo.license}
                  </a>
                  .
                </p>
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  Changes: {photo.changes}
                </p>
              </div>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}

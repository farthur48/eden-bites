import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "default",
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "default" | "light";
  className?: string;
}) {
  const light = tone === "light";

  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "mb-4 text-[0.7rem] font-bold uppercase tracking-[0.22em]",
            light ? "text-brand-lime" : "text-brand-green/60",
            align === "center" && "text-center",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "text-balance font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.035em] sm:text-4xl lg:text-[2.6rem]",
          light ? "text-white" : "text-brand-green-deep",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 max-w-xl text-pretty text-[0.98rem] leading-7",
            light ? "text-brand-cream/75" : "text-muted",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

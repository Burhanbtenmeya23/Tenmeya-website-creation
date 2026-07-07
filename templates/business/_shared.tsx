import type { ComponentProps } from "react";
import { Circle, type LucideProps } from "lucide-react";
import * as LucideIcons from "lucide-react";

import { cn } from "@/lib/utils";

import type { HeroContent } from "@/lib/validations/content.schema";

const iconMap = LucideIcons as unknown as Record<
  string,
  React.ComponentType<LucideProps>
>;

export function TplIcon({ name, className }: { name: string; className?: string }) {
  const Icon = iconMap[name] ?? Circle;
  return <Icon className={className} aria-hidden />;
}

export function TplContainer({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  );
}

export function TplSection({ className, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("py-10 sm:py-14", className)} {...props} />
  );
}

export function TplHeading({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-2xl font-bold tracking-tight text-[var(--tpl-foreground)] sm:text-3xl",
        className,
      )}
      style={{ fontFamily: "var(--tpl-font-heading)" }}
      {...props}
    />
  );
}

export function TplCtaLink({
  cta,
  className,
}: {
  cta: { label: string; href: string };
  className?: string;
}) {
  return (
    <a
      href={cta.href}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[var(--tpl-price-bg)] px-6 py-3 text-sm font-bold text-[var(--tpl-price-foreground)] transition-opacity hover:opacity-90",
        className,
      )}
    >
      {cta.label}
    </a>
  );
}

export function isVideoUrl(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

export function formatPrice(currency: string | undefined, price: number) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency ?? "USD"} ${price}`;
  }
}

export function highlightHeadline(headline: string, highlight?: string) {
  if (!highlight) return <>{headline}</>;
  const index = headline.indexOf(highlight);
  if (index === -1) return <>{headline}</>;

  return (
    <>
      {headline.slice(0, index)}
      <span className="text-[var(--tpl-accent)]">{highlight}</span>
      {headline.slice(index + highlight.length)}
    </>
  );
}

export type { HeroContent };

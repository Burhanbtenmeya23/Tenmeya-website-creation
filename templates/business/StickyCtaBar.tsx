"use client";

import { useEffect, useState } from "react";

import type { HeroContent } from "@/lib/validations/content.schema";

import { TplCtaLink, formatPrice } from "./_shared";

/**
 * Reads pricing straight from hero.pricing rather than its own content —
 * see ARCHITECTURE.md §4: this isn't a manifest section, so there's only
 * ever one place a creator can set the price.
 */
export function StickyCtaBar({ hero }: { hero: HeroContent | null }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!hero) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 border-t border-[var(--tpl-border)] bg-[var(--tpl-background)] px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-200 lg:hidden"
      style={{ transform: visible ? "translateY(0)" : "translateY(100%)" }}
    >
      <div className="flex items-baseline gap-2">
        {hero.pricing.originalPrice ? (
          <span className="text-xs text-[var(--tpl-muted)] line-through">
            {formatPrice(hero.pricing.currency, hero.pricing.originalPrice)}
          </span>
        ) : null}
        <span className="text-lg font-extrabold text-[var(--tpl-foreground)]">
          {formatPrice(hero.pricing.currency, hero.pricing.price)}
        </span>
      </div>
      <TplCtaLink cta={hero.pricing.cta} />
    </div>
  );
}

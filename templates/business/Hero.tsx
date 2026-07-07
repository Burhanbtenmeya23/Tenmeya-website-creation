import type { HeroContent } from "@/lib/validations/content.schema";

import { CountdownTimer, HeroMedia } from "./_client";
import {
  TplContainer,
  TplCtaLink,
  TplIcon,
  formatPrice,
  highlightHeadline,
} from "./_shared";

export function Hero({ data }: { data: HeroContent | null }) {
  if (!data) return null;

  return (
    <section className="py-10 sm:py-14">
      <TplContainer>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="order-2 flex flex-col items-start gap-5 lg:order-1">
            {data.countdown?.enabled && data.countdown.endsAt ? (
              <CountdownTimer
                endsAt={data.countdown.endsAt}
                labels={{
                  days: "أيام",
                  hours: "ساعات",
                  minutes: "دقائق",
                  seconds: "ثواني",
                }}
              />
            ) : null}

            {data.eyebrow ? (
              <p className="text-sm font-semibold text-[var(--tpl-accent)]">
                {data.eyebrow}
              </p>
            ) : null}

            <h1
              className="text-3xl font-extrabold leading-tight text-[var(--tpl-foreground)] sm:text-4xl lg:text-5xl"
              style={{ fontFamily: "var(--tpl-font-heading)" }}
            >
              {highlightHeadline(data.headline, data.headlineHighlight)}
            </h1>

            {data.subheadline ? (
              <p className="max-w-xl text-lg text-[var(--tpl-muted)]">
                {data.subheadline}
              </p>
            ) : null}

            {data.stats.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--tpl-foreground)]">
                {data.stats.map((stat) => (
                  <span
                    key={`${stat.icon}-${stat.label}`}
                    className="inline-flex items-center gap-2"
                  >
                    <TplIcon name={stat.icon} className="size-4 text-[var(--tpl-muted)]" />
                    {stat.label}
                  </span>
                ))}
              </div>
            ) : null}

            <div
              className="flex items-center gap-4 rounded-2xl p-2 ps-5"
              style={{ background: "var(--tpl-price-bg)" }}
            >
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  {data.pricing.originalPrice ? (
                    <span className="text-sm text-[var(--tpl-price-foreground)]/50 line-through">
                      {formatPrice(data.pricing.currency, data.pricing.originalPrice)}
                    </span>
                  ) : null}
                  <span className="text-2xl font-extrabold text-[var(--tpl-price-foreground)]">
                    {formatPrice(data.pricing.currency, data.pricing.price)}
                  </span>
                </div>
                {data.pricing.discountLabel ? (
                  <span className="text-xs font-semibold text-[var(--tpl-accent)]">
                    {data.pricing.discountLabel}
                  </span>
                ) : null}
              </div>
              <TplCtaLink
                cta={data.pricing.cta}
                className="bg-white text-[var(--tpl-foreground)] hover:opacity-90"
              />
            </div>
          </div>

          {data.media ? (
            <div className="order-1 lg:order-2">
              <div className="overflow-hidden rounded-[var(--tpl-radius)] border-4 border-white shadow-xl">
                <div className="aspect-[4/5] sm:aspect-square">
                  <HeroMedia url={data.media.url} alt={data.media.alt} />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </TplContainer>
    </section>
  );
}

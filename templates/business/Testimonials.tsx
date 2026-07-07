import { Star } from "lucide-react";

import type { TestimonialsContent } from "@/lib/validations/content.schema";

import { TplContainer, TplHeading, TplSection } from "./_shared";

export function Testimonials({ data }: { data: TestimonialsContent | null }) {
  if (!data || data.items.length === 0) return null;

  return (
    <TplSection>
      <TplContainer>
        {data.heading ? (
          <TplHeading className="mb-8 text-center">{data.heading}</TplHeading>
        ) : null}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div
              key={item.authorName}
              className="flex flex-col gap-3 rounded-[var(--tpl-radius)] border border-[var(--tpl-border)] p-5"
            >
              {item.rating ? (
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className="size-4"
                      fill={i < item.rating! ? "#FBBF24" : "none"}
                      stroke={i < item.rating! ? "#FBBF24" : "currentColor"}
                    />
                  ))}
                </div>
              ) : null}
              <p className="text-sm text-[var(--tpl-foreground)]">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="mt-auto flex items-center gap-2">
                {item.authorAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.authorAvatar.url}
                    alt={item.authorAvatar.alt ?? item.authorName}
                    className="size-8 rounded-full object-cover"
                  />
                ) : null}
                <div>
                  <p className="text-sm font-semibold text-[var(--tpl-foreground)]">
                    {item.authorName}
                  </p>
                  {item.authorTitle ? (
                    <p className="text-xs text-[var(--tpl-muted)]">
                      {item.authorTitle}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </TplContainer>
    </TplSection>
  );
}

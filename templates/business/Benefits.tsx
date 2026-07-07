import type { BenefitsContent } from "@/lib/validations/content.schema";

import { TplContainer, TplHeading, TplIcon, TplSection } from "./_shared";

export function Benefits({ data }: { data: BenefitsContent | null }) {
  if (!data || data.items.length === 0) return null;

  return (
    <TplSection>
      <TplContainer>
        {data.heading ? (
          <TplHeading className="mb-8 text-center">{data.heading}</TplHeading>
        ) : null}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--tpl-accent-soft)" }}
              >
                <TplIcon name={item.icon} className="size-5 text-[var(--tpl-accent)]" />
              </span>
              <div>
                <p className="font-semibold text-[var(--tpl-foreground)]">
                  {item.title}
                </p>
                {item.description ? (
                  <p className="mt-1 text-sm text-[var(--tpl-muted)]">
                    {item.description}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </TplContainer>
    </TplSection>
  );
}

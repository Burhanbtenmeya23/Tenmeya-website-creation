import { Check } from "lucide-react";

import type { AudienceContent } from "@/lib/validations/content.schema";

import { TplContainer, TplHeading, TplIcon, TplSection } from "./_shared";

export function Audience({ data }: { data: AudienceContent | null }) {
  if (!data || data.items.length === 0) return null;

  return (
    <TplSection>
      <TplContainer>
        {data.heading ? (
          <TplHeading className="mb-8 text-center">{data.heading}</TplHeading>
        ) : null}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full"
                style={{ background: "var(--tpl-accent-soft)" }}
              >
                {item.icon ? (
                  <TplIcon name={item.icon} className="size-4 text-[var(--tpl-accent)]" />
                ) : (
                  <Check className="size-4 text-[var(--tpl-accent)]" aria-hidden />
                )}
              </span>
              <p className="text-[var(--tpl-foreground)]">{item.label}</p>
            </div>
          ))}
        </div>
      </TplContainer>
    </TplSection>
  );
}

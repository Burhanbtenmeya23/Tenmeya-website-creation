import type { CurriculumContent } from "@/lib/validations/content.schema";

import { TplAccordion } from "./_client";
import { TplContainer, TplHeading, TplSection } from "./_shared";

export function Curriculum({ data }: { data: CurriculumContent | null }) {
  if (!data || data.items.length === 0) return null;

  return (
    <TplSection>
      <TplContainer>
        {data.heading ? (
          <TplHeading className="mb-6 text-center">{data.heading}</TplHeading>
        ) : null}
        <TplAccordion
          items={data.items.map((item, index) => ({
            key: `${index}-${item.title}`,
            trigger: (
              <span className="flex items-center gap-3">
                <span className="text-sm text-[var(--tpl-muted)] tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {item.title}
                {item.durationLabel ? (
                  <span className="text-sm font-normal text-[var(--tpl-muted)]">
                    {item.durationLabel}
                  </span>
                ) : null}
              </span>
            ),
            content: item.description ?? null,
          }))}
        />
      </TplContainer>
    </TplSection>
  );
}

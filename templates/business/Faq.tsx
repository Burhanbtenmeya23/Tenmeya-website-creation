import type { FaqContent } from "@/lib/validations/content.schema";

import { TplAccordion } from "./_client";
import { TplContainer, TplHeading, TplSection } from "./_shared";

export function Faq({ data }: { data: FaqContent | null }) {
  if (!data || data.items.length === 0) return null;

  return (
    <TplSection>
      <TplContainer className="max-w-3xl">
        {data.heading ? (
          <TplHeading className="mb-6 text-center">{data.heading}</TplHeading>
        ) : null}
        <TplAccordion
          items={data.items.map((item, index) => ({
            key: `${index}-${item.question}`,
            trigger: item.question,
            content: item.answer,
          }))}
        />
      </TplContainer>
    </TplSection>
  );
}

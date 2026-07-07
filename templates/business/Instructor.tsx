import Image from "next/image";

import type { InstructorContent } from "@/lib/validations/content.schema";

import { TplContainer, TplHeading, TplSection } from "./_shared";

export function Instructor({ data }: { data: InstructorContent | null }) {
  if (!data) return null;

  return (
    <TplSection>
      <TplContainer className="flex flex-col items-center gap-4 text-center">
        {data.heading ? <TplHeading>{data.heading}</TplHeading> : null}
        {data.avatar ? (
          <div className="relative size-24 overflow-hidden rounded-full">
            <Image
              src={data.avatar.url}
              alt={data.avatar.alt ?? data.name}
              fill
              sizes="96px"
              className="object-cover"
            />
          </div>
        ) : null}
        <p className="text-lg font-bold text-[var(--tpl-foreground)]">
          {data.name}
        </p>
        {data.title ? (
          <p className="text-sm text-[var(--tpl-accent)]">{data.title}</p>
        ) : null}
        {data.bio ? (
          <p className="max-w-xl text-sm text-[var(--tpl-muted)]">{data.bio}</p>
        ) : null}
      </TplContainer>
    </TplSection>
  );
}

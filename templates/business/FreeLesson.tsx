import type { FreeLessonContent } from "@/lib/validations/content.schema";

import { HeroMedia } from "./_client";
import { TplContainer, TplHeading, TplSection } from "./_shared";

export function FreeLesson({ data }: { data: FreeLessonContent | null }) {
  if (!data) return null;

  return (
    <TplSection>
      <TplContainer className="flex flex-col items-center gap-6 text-center">
        {data.heading ? <TplHeading>{data.heading}</TplHeading> : null}
        <div className="w-full max-w-2xl overflow-hidden rounded-[var(--tpl-radius)] shadow-lg">
          <div className="aspect-video">
            <HeroMedia
              url={data.videoUrl}
              alt={data.posterImage?.alt}
            />
          </div>
        </div>
      </TplContainer>
    </TplSection>
  );
}

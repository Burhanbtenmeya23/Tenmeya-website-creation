import type { ComponentProps, ElementType } from "react";

import { cn } from "@/lib/utils";

const sizeByLevel = {
  h1: "text-4xl sm:text-5xl",
  h2: "text-3xl sm:text-4xl",
  h3: "text-2xl sm:text-3xl",
  h4: "text-xl sm:text-2xl",
} as const;

type HeadingLevel = keyof typeof sizeByLevel;

interface HeadingProps extends ComponentProps<"h2"> {
  as?: HeadingLevel;
}

function Heading({ as = "h2", className, ...props }: HeadingProps) {
  const Tag = as as ElementType;
  return (
    <Tag
      className={cn(
        "font-semibold tracking-tight text-foreground",
        sizeByLevel[as],
        className,
      )}
      {...props}
    />
  );
}

export { Heading };

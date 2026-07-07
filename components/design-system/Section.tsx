import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

function Section({ className, ...props }: ComponentProps<"section">) {
  return (
    <section className={cn("py-12 sm:py-16 lg:py-24", className)} {...props} />
  );
}

export { Section };

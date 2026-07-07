import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/dal";

/**
 * Deliberately chrome-less (no dashboard header) — the builder's
 * split-screen UI wants the full viewport, not a route-group sketch
 * detail carried over unquestioned from ARCHITECTURE.md's folder layout.
 */
export default async function BuilderLayout({ children }: { children: ReactNode }) {
  await requireUser();
  return <div className="h-screen overflow-hidden">{children}</div>;
}

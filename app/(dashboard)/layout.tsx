import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system/Container";
import { requireUser } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/dashboard" className="font-semibold">
            Tenmeya
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <form action={logout}>
              <Button type="submit" variant="outline" size="sm">
                Log out
              </Button>
            </form>
          </div>
        </Container>
      </header>
      <main className="flex-1">
        <Container className="py-10">{children}</Container>
      </main>
    </div>
  );
}

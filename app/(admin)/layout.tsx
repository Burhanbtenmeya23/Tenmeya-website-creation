import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system/Container";
import { requireAdmin } from "@/lib/auth/dal";
import { logout } from "@/lib/auth/actions";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-secondary">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/admin" className="font-semibold">
            Tenmeya Admin
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {profile.full_name ?? profile.id}
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

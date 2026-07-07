import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/design-system/Heading";
import { getCurrentUser } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();

  const { data: landingPages } = await supabase
    .from("landing_pages")
    .select("id, name, handle, status, updated_at")
    .eq("creator_id", user!.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading as="h1">Your landing pages</Heading>
        <Button asChild>
          <Link href="/dashboard/new">+ New landing page</Link>
        </Button>
      </div>

      {!landingPages || landingPages.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            You don&apos;t have any landing pages yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {landingPages.map((page) => (
            <Link key={page.id} href={`/builder/${page.id}`}>
              <Card className="transition-colors hover:border-foreground/30">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <CardTitle>{page.name}</CardTitle>
                  <Badge variant={page.status === "published" ? "accent" : "secondary"}>
                    {page.status}
                  </Badge>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  /{page.handle}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/design-system/Heading";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const [{ count: landingPageCount }, { count: creatorCount }] =
    await Promise.all([
      supabase
        .from("landing_pages")
        .select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Heading as="h1">Admin</Heading>
        <Button asChild>
          <Link href="/admin/pages">View all landing pages</Link>
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Landing pages
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {landingPageCount ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">
              Creators
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">
            {creatorCount ?? 0}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

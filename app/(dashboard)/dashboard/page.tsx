import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/design-system/Heading";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { getCurrentUser } from "@/lib/auth/dal";
import { deleteLandingPageForm, duplicateLandingPageForm } from "@/lib/landing-pages/actions";
import { publishLandingPageForm, unpublishLandingPageForm } from "@/lib/publishing/actions";
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
            <Card key={page.id} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <Link href={`/builder/${page.id}`} className="hover:underline">
                  <CardTitle>{page.name}</CardTitle>
                </Link>
                <Badge variant={page.status === "published" ? "accent" : "secondary"}>
                  {page.status}
                </Badge>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <p className="text-sm text-muted-foreground">/{page.handle}</p>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/preview/${page.handle}`} target="_blank">
                      Preview
                    </Link>
                  </Button>
                  {page.status === "published" ? (
                    <form action={unpublishLandingPageForm.bind(null, page.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Unpublish
                      </Button>
                    </form>
                  ) : (
                    <form action={publishLandingPageForm.bind(null, page.id)}>
                      <Button type="submit" variant="outline" size="sm">
                        Publish
                      </Button>
                    </form>
                  )}
                  <form action={duplicateLandingPageForm.bind(null, page.id)}>
                    <Button type="submit" variant="outline" size="sm">
                      Duplicate
                    </Button>
                  </form>
                  <ConfirmForm
                    action={deleteLandingPageForm.bind(null, page.id)}
                    confirmMessage={`Delete "${page.name}"? This can't be undone.`}
                  >
                    <Button type="submit" variant="destructive" size="sm">
                      Delete
                    </Button>
                  </ConfirmForm>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

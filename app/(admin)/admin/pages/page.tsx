import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Heading } from "@/components/design-system/Heading";
import { ConfirmForm } from "@/components/admin/ConfirmForm";
import { deleteLandingPageForm, duplicateLandingPageForm } from "@/lib/landing-pages/actions";
import { publishLandingPageForm, unpublishLandingPageForm } from "@/lib/publishing/actions";
import { createClient } from "@/lib/supabase/server";
import type { LandingPageStatus } from "@/types/database";

const STATUS_OPTIONS: (LandingPageStatus | "all")[] = [
  "all",
  "draft",
  "published",
  "unpublished",
];

export default async function AdminPagesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "all" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("landing_pages")
    .select("id, name, handle, status, creator_id, updated_at")
    .order("updated_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,handle.ilike.%${q}%`);
  }
  if (status !== "all") {
    query = query.eq("status", status as LandingPageStatus);
  }

  const { data: landingPages } = await query;

  const creatorIds = [...new Set((landingPages ?? []).map((p) => p.creator_id))];
  const { data: creators } =
    creatorIds.length > 0
      ? await supabase.from("profiles").select("id, email, full_name").in("id", creatorIds)
      : { data: [] };

  const creatorById = new Map((creators ?? []).map((c) => [c.id, c]));

  return (
    <div className="flex flex-col gap-6">
      <Heading as="h1">All landing pages</Heading>

      <form className="flex gap-3" method="get">
        <Input name="q" placeholder="Search by name or handle" defaultValue={q} className="max-w-xs" />
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "all" ? "All statuses" : option}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Filter
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {!landingPages || landingPages.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              No landing pages match.
            </CardContent>
          </Card>
        ) : (
          landingPages.map((page) => {
            const creator = creatorById.get(page.creator_id);
            return (
              <Card key={page.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{page.name}</p>
                      <Badge variant={page.status === "published" ? "accent" : "secondary"}>
                        {page.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      /{page.handle} · {creator?.full_name || creator?.email || "Unknown creator"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/preview/${page.handle}`} target="_blank">
                        Preview
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/builder/${page.id}`}>Edit</Link>
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
            );
          })
        )}
      </div>
    </div>
  );
}

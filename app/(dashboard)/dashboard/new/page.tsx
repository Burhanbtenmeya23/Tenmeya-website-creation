"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLandingPage } from "@/lib/builder/actions";

export default function NewLandingPagePage() {
  const [state, formAction, pending] = useActionState(createLandingPage, undefined);

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>New landing page</CardTitle>
        <CardDescription>
          Using the Business template — the only one available in this MVP.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="My course launch" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="handle">Handle</Label>
            <Input id="handle" name="handle" placeholder="my-course" required />
            <p className="text-xs text-muted-foreground">
              Used in your page&apos;s URL. Lowercase letters, numbers, and
              hyphens only.
            </p>
          </div>
          {state?.error ? (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create and start editing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

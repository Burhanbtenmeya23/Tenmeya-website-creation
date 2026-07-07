import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/design-system/Container";
import { Heading } from "@/components/design-system/Heading";

export default function Home() {
  return (
    <div className="flex flex-1 items-center">
      <Container className="flex flex-col items-start gap-6 py-24">
        <Heading as="h1">Tenmeya Landing Page Builder</Heading>
        <p className="max-w-xl text-lg text-muted-foreground">
          Pick a template, fill in your content, and publish a live landing
          page — no code required.
        </p>
        <div className="flex gap-3">
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/login">Log in</Link>
          </Button>
        </div>
      </Container>
    </div>
  );
}

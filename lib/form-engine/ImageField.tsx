"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadMedia } from "@/lib/media/actions";

export function ImageField({
  name,
  label,
  landingPageId,
}: {
  name: string;
  label: string;
  landingPageId: string;
}) {
  const { setValue, watch } = useFormContext();
  const value = watch(name) as { url?: string; alt?: string } | undefined;
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await uploadMedia(landingPageId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setValue(
        name,
        { url: result.url, alt: value?.alt ?? "" },
        { shouldDirty: true },
      );
    });

    event.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {value?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.url}
          alt={value.alt ?? ""}
          className="h-32 w-auto rounded-md border border-input object-cover"
        />
      ) : null}
      <Input
        type="file"
        accept="image/*,video/*"
        onChange={onFileChange}
        disabled={isPending}
      />
      {isPending ? (
        <p className="text-xs text-muted-foreground">Uploading…</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

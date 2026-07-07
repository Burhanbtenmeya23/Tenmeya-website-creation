"use client";

import { useEffect, useRef, useState } from "react";
import type { UseFormWatch, FieldValues } from "react-hook-form";

import { saveDraft } from "@/lib/builder/actions";
import type { LandingPageContent } from "@/lib/validations/content.schema";

export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 800;

export function useAutosave(landingPageId: string, watch: UseFormWatch<FieldValues>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const subscription = watch((values) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setStatus("saving");
        saveDraft(landingPageId, values as LandingPageContent).then((result) => {
          setStatus(result.error ? "error" : "saved");
        });
      }, DEBOUNCE_MS);
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [watch, landingPageId]);

  return status;
}

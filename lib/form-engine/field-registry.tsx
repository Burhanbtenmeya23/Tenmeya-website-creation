"use client";

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FieldDef } from "@/lib/template-engine/manifest.schema";

import { ImageField } from "./ImageField";

function FieldShell({
  label,
  helpText,
  htmlFor,
  children,
}: {
  label: string;
  helpText?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {helpText ? (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      ) : null}
    </div>
  );
}

function TextInputField({
  field,
  name,
  type = "text",
}: {
  field: FieldDef;
  name: string;
  type?: string;
}) {
  const { register } = useFormContext();
  return (
    <FieldShell label={field.label} helpText={field.helpText} htmlFor={name}>
      <Input
        id={name}
        type={type}
        placeholder={field.placeholder}
        required={field.required}
        {...register(name)}
      />
    </FieldShell>
  );
}

function NumberInputField({ field, name }: { field: FieldDef; name: string }) {
  const { register } = useFormContext();
  return (
    <FieldShell label={field.label} helpText={field.helpText} htmlFor={name}>
      <Input
        id={name}
        type="number"
        placeholder={field.placeholder}
        required={field.required}
        {...register(name, { valueAsNumber: true })}
      />
    </FieldShell>
  );
}

function TextareaInputField({ field, name }: { field: FieldDef; name: string }) {
  const { register } = useFormContext();
  return (
    <FieldShell label={field.label} helpText={field.helpText} htmlFor={name}>
      <Textarea
        id={name}
        placeholder={field.placeholder}
        required={field.required}
        {...register(name)}
      />
    </FieldShell>
  );
}

function BooleanInputField({ field, name }: { field: FieldDef; name: string }) {
  const { register } = useFormContext();
  return (
    <label className="flex items-center gap-2 text-sm text-foreground">
      <input type="checkbox" className="size-4 rounded border-input" {...register(name)} />
      {field.label}
    </label>
  );
}

/**
 * Dispatches a single FieldDef to the right input, bound to `name` — the
 * fully-qualified react-hook-form path (e.g. "sections.hero.pricing.price").
 * `field.key` itself is only the manifest-relative segment used to build
 * that path (see SectionForm/RepeaterField) — it is NOT the RHF path, so
 * every field here binds to `name`, never `field.key`.
 */
export function FieldRenderer({
  field,
  name,
  landingPageId,
}: {
  field: FieldDef;
  name: string;
  landingPageId: string;
}) {
  if (typeof field.type === "object") {
    // Repeater fields are handled by RepeaterField, not here.
    return null;
  }

  switch (field.type) {
    case "text":
    case "url":
    case "email":
      return (
        <TextInputField
          field={field}
          name={name}
          type={field.type === "text" ? "text" : field.type}
        />
      );
    case "video":
      return <TextInputField field={field} name={name} type="url" />;
    case "datetime":
      return <TextInputField field={field} name={name} type="datetime-local" />;
    case "color":
      return <TextInputField field={field} name={name} type="color" />;
    case "number":
      return <NumberInputField field={field} name={name} />;
    case "textarea":
    case "richtext":
      return <TextareaInputField field={field} name={name} />;
    case "boolean":
      return <BooleanInputField field={field} name={name} />;
    case "image":
      return <ImageField name={name} label={field.label} landingPageId={landingPageId} />;
    case "select":
      return <TextInputField field={field} name={name} />;
    default:
      return null;
  }
}

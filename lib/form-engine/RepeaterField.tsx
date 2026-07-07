"use client";

import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import type { FieldDef } from "@/lib/template-engine/manifest.schema";

import { buildFieldDefaults } from "./defaults";
import { FieldRenderer } from "./field-registry";

interface RepeaterFieldDef extends FieldDef {
  type: { type: "repeater"; fields: FieldDef[]; min?: number; max?: number };
}

export function RepeaterField({
  field,
  name,
  landingPageId,
}: {
  field: RepeaterFieldDef;
  name: string;
  landingPageId: string;
}) {
  const { control } = useFormContext();
  const { fields: items, append, remove } = useFieldArray({
    control,
    name,
  });

  const subFields = field.type.fields;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-foreground">{field.label}</p>
      {items.map((item, index) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-md border border-input p-3"
        >
          {subFields.map((subField) => (
            <FieldRenderer
              key={subField.key}
              field={subField}
              name={`${name}.${index}.${subField.key}`}
              landingPageId={landingPageId}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => remove(index)}
            className="self-end"
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(buildFieldDefaults(subFields))}
        className="self-start"
      >
        <Plus className="size-4" />
        Add {field.label}
      </Button>
    </div>
  );
}

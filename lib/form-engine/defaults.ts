import type { FieldDef } from "@/lib/template-engine/manifest.schema";

function defaultScalar(type: FieldDef["type"]): unknown {
  if (typeof type === "object") return [];
  switch (type) {
    case "number":
      return 0;
    case "boolean":
      return false;
    case "image":
      return undefined;
    default:
      return "";
  }
}

function setPath(obj: Record<string, unknown>, path: string[], value: unknown) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    if (typeof cur[key] !== "object" || cur[key] === null) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[path[path.length - 1]] = value;
}

/**
 * Builds a default value object for a flat list of (possibly dot-path)
 * FieldDefs — used both to initialize an optional section the creator just
 * enabled, and to seed a new repeater item.
 */
export function buildFieldDefaults(fields: FieldDef[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const path = field.key.split(".");
    const value =
      typeof field.type === "object" && field.type.type === "repeater"
        ? []
        : defaultScalar(field.type);
    setPath(result, path, value);
  }
  return result;
}

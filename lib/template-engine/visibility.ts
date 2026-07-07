function isEmptyValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") {
    return Object.values(value).every(isEmptyValue);
  }
  return false;
}

/**
 * A section is visible when its content object exists and has at least one
 * non-empty value anywhere in its shape. This is generic across section
 * shapes (arrays-of-items, or plain objects like Hero/Instructor) rather
 * than special-casing each one — see ARCHITECTURE.md's Visibility Engine.
 */
export function isSectionVisible(data: unknown): boolean {
  if (data == null) return false;
  return !isEmptyValue(data);
}

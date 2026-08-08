export type ClassValue = string | false | null | undefined;

/**
 * Join class names. Falsy entries drop out; the caller's own className is
 * passed last so it lands last in the attribute.
 */
export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

/**
 * Substitutes `{key}` placeholders in a copy template.
 * @param template - The dictionary string, e.g. `Pass the phone to {name}`.
 * @param values - Placeholder name mapped to the text to drop in.
 * @returns The filled string.
 */
export function fillTemplate(
  template: string,
  values: Record<string, string>,
): string {
  // One pass with a function replacement: `$$` in a name stays literal and a
  // filled value is never scanned for further placeholders.
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? values[key] : placeholder,
  );
}

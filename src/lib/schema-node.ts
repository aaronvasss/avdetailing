/** JSON-LD @type may be a string or array. */
export function schemaHasType(node: unknown, type: string): boolean {
  if (!node || typeof node !== "object") return false;
  const value = (node as Record<string, unknown>)["@type"];
  return Array.isArray(value) ? value.includes(type) : value === type;
}
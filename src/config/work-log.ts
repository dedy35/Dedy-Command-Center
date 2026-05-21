export const workLogCategories = [
  "coding",
  "analysis",
  "meeting",
  "testing",
  "documentation",
  "support",
  "planning",
] as const;

export function isWorkLogCategory(value: string): value is (typeof workLogCategories)[number] {
  return workLogCategories.includes(value as (typeof workLogCategories)[number]);
}

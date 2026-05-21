export const ticketStatuses = ["new", "analyzing", "waiting", "implemented", "released"] as const;

export const riskLevels = ["low", "medium", "high", "critical"] as const;

export const ticketNoteTypes = [
  "analysis",
  "test",
  "senior_feedback",
  "redmine_comment",
  "internal_note",
] as const;

export const ticketModules = ["work"] as const;

export function isTicketStatus(value: string): value is (typeof ticketStatuses)[number] {
  return ticketStatuses.includes(value as (typeof ticketStatuses)[number]);
}

export function isRiskLevel(value: string): value is (typeof riskLevels)[number] {
  return riskLevels.includes(value as (typeof riskLevels)[number]);
}

export function isTicketNoteType(value: string): value is (typeof ticketNoteTypes)[number] {
  return ticketNoteTypes.includes(value as (typeof ticketNoteTypes)[number]);
}

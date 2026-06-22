import { AuditEntry } from "@/models/audit-entry";

type AuditInput = {
  actorId: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId: string;
  before?: unknown;
  after?: unknown;
  metadata?: Record<string, unknown>;
};

export async function recordAudit(input: AuditInput) {
  return AuditEntry.create({
    ...input,
    timestamp: new Date(),
  });
}

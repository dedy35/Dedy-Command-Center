import { Prisma } from "@prisma/client";

import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatJson(value: Prisma.JsonValue | null) {
  if (value === null) {
    return "-";
  }

  return JSON.stringify(value, null, 2);
}

export default async function AdminAuditLogsPage() {
  const logs = await db.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Admin Audit Logs</h2>
        <p className="text-sm text-slate-600">
          Latest 100 events. This page is protected by single-user authentication middleware.
        </p>
      </section>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Before</th>
                <th className="px-4 py-3">After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white align-top">
              {logs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No audit logs yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {log.createdAt.toISOString()}
                    </td>
                    <td className="px-4 py-3 text-slate-800">{log.actor}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{log.action}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {log.entityTable}
                      {log.entityId ? ` (${log.entityId})` : ""}
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                        {formatJson(log.beforeJson)}
                      </pre>
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-700">
                        {formatJson(log.afterJson)}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

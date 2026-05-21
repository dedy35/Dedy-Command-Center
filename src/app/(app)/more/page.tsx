import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function MorePage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <CardTitle>More</CardTitle>
        <CardDescription>
          Additional modules (career, life admin, media, decisions) will appear here progressively.
        </CardDescription>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Admin Tools</CardTitle>
        <CardDescription>
          Authentication and audit controls are active. Use the admin page to inspect action logs.
        </CardDescription>
        <Link
          href="/admin/audit-logs"
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Open Audit Logs
        </Link>
      </Card>
    </div>
  );
}

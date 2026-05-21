import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function WorkPage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <CardTitle>Work</CardTitle>
        <CardDescription>
          Ticket workspace and daily log evidence system are active.
        </CardDescription>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Ticket Workspace</CardTitle>
        <CardDescription>
          Create and track Redmine ticket records with structured notes and AI draft panel.
        </CardDescription>
        <Link
          href="/work/tickets"
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Open Tickets
        </Link>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Daily Log Workspace</CardTitle>
        <CardDescription>
          Fast daily logging and STAR/CV bullet generation with explicit impact questions when
          metrics are missing.
        </CardDescription>
        <Link
          href="/work/daily-log"
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Open Daily Log
        </Link>
      </Card>
    </div>
  );
}

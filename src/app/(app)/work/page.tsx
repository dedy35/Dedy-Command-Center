import Link from "next/link";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function WorkPage() {
  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <CardTitle>Work</CardTitle>
        <CardDescription>
          Ticket workspace is active. Manage Redmine items, notes, screenshots, risk level, and
          linked life events.
        </CardDescription>
      </Card>

      <Card className="space-y-2">
        <CardTitle>Ticket Workspace</CardTitle>
        <CardDescription>
          Open the ticket module to create and track ticket records with structured notes.
        </CardDescription>
        <Link
          href="/work/tickets"
          className="inline-flex h-10 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Open Tickets
        </Link>
      </Card>
    </div>
  );
}

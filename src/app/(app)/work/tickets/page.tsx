import Link from "next/link";

import { TicketCreateForm } from "@/components/work/ticket-create-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function WorkTicketsPage() {
  const tickets = await db.ticket.findMany({
    include: {
      _count: {
        select: {
          notes: true,
          lifeEvents: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Work Tickets</h2>
        <p className="text-sm text-slate-600">
          Manage Redmine tickets, analysis notes, screenshots, risk level, and linked life events.
        </p>
      </section>

      <Card className="space-y-4">
        <div>
          <CardTitle>Create Ticket</CardTitle>
          <CardDescription>
            Supports pasted Redmine text. Creation will save source records and initial linked life
            event.
          </CardDescription>
        </div>
        <TicketCreateForm />
      </Card>

      <Card className="space-y-3">
        <div>
          <CardTitle>Ticket List</CardTitle>
          <CardDescription>
            Latest tickets with status, risk, notes, and linked event counts.
          </CardDescription>
        </div>

        {tickets.length === 0 ? (
          <p className="text-sm text-slate-500">No tickets yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs tracking-[0.08em] text-slate-500 uppercase">
                <tr>
                  <th className="px-2 py-2">Ticket</th>
                  <th className="px-2 py-2">Title</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Risk</th>
                  <th className="px-2 py-2">Notes</th>
                  <th className="px-2 py-2">Linked Events</th>
                  <th className="px-2 py-2">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-100">
                    <td className="px-2 py-2">
                      <Link
                        href={`/work/tickets/${ticket.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {ticket.ticketNo || ticket.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-2 py-2 text-slate-800">{ticket.title}</td>
                    <td className="px-2 py-2 text-slate-700">{ticket.status}</td>
                    <td className="px-2 py-2 text-slate-700">{ticket.riskLevel}</td>
                    <td className="px-2 py-2 text-slate-700">{ticket._count.notes}</td>
                    <td className="px-2 py-2 text-slate-700">{ticket._count.lifeEvents}</td>
                    <td className="px-2 py-2 text-xs text-slate-500">
                      {ticket.updatedAt.toISOString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

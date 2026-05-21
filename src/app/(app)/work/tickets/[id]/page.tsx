import { notFound } from "next/navigation";

import { listPromptTemplates } from "@/config/prompts";
import { AiDraftPanel } from "@/components/work/ai-draft-panel";
import { TicketLinkLifeEventForm } from "@/components/work/ticket-link-life-event-form";
import { TicketNoteForm } from "@/components/work/ticket-note-form";
import { TicketUpdateForm } from "@/components/work/ticket-update-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

type TicketDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = await params;

  const ticket = await db.ticket.findUnique({
    where: { id },
    include: {
      source: true,
      notes: {
        include: {
          screenshotAttachment: true,
        },
        orderBy: { createdAt: "desc" },
      },
      lifeEvents: {
        include: { lifeEvent: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) {
    notFound();
  }

  const linkedLifeEventIds = new Set(ticket.lifeEvents.map((item) => item.lifeEventId));
  const [availableLifeEvents, aiOutputs] = await Promise.all([
    db.lifeEvent.findMany({
      where: {
        id: { notIn: Array.from(linkedLifeEventIds) },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    ticket.sourceId
      ? db.aiOutput.findMany({
          where: { sourceId: ticket.sourceId },
          include: {
            approvals: {
              orderBy: { createdAt: "desc" },
              take: 3,
            },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
  ]);

  const defaultAiInput =
    ticket.source?.contentText ||
    ticket.notes[0]?.content ||
    `${ticket.title}\nstatus=${ticket.status}`;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Ticket Detail</h2>
        <p className="text-sm text-slate-600">
          {ticket.ticketNo ?? ticket.id.slice(0, 8)} · {ticket.title}
        </p>
      </section>

      <Card className="space-y-4">
        <div>
          <CardTitle>Ticket Settings</CardTitle>
          <CardDescription>
            Update title, status, and risk level as work progresses.
          </CardDescription>
        </div>
        <TicketUpdateForm
          ticketId={ticket.id}
          ticketNo={ticket.ticketNo}
          title={ticket.title}
          systemName={ticket.systemName}
          status={ticket.status}
          riskLevel={ticket.riskLevel}
        />
      </Card>

      <Card className="space-y-3">
        <CardTitle>Redmine Source Text</CardTitle>
        {ticket.source?.contentText ? (
          <pre className="max-h-72 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            {ticket.source.contentText}
          </pre>
        ) : (
          <p className="text-sm text-slate-500">No pasted Redmine source saved for this ticket.</p>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>AI Draft Panel</CardTitle>
          <CardDescription>
            Select <code>prompt_key</code>, generate draft with mock local AI provider, then
            approve/reject/edit/copy. No auto-send is implemented.
          </CardDescription>
        </div>
        <AiDraftPanel
          moduleName="work"
          sourceId={ticket.sourceId}
          prompts={listPromptTemplates("work")}
          defaultInputText={defaultAiInput}
          initialOutputs={aiOutputs.map((output) => ({
            ...output,
            createdAt: output.createdAt.toISOString(),
            approvals: output.approvals.map((approval) => ({
              ...approval,
              createdAt: approval.createdAt.toISOString(),
            })),
          }))}
        />
      </Card>

      <Card className="space-y-4">
        <div>
          <CardTitle>Add Ticket Note</CardTitle>
          <CardDescription>
            Save analysis/testing notes and optional screenshots into <code>ticket_notes</code>.
          </CardDescription>
        </div>
        <TicketNoteForm ticketId={ticket.id} />
      </Card>

      <Card className="space-y-3">
        <CardTitle>Notes Timeline</CardTitle>
        {ticket.notes.length === 0 ? (
          <p className="text-sm text-slate-500">No notes yet.</p>
        ) : (
          <div className="space-y-3">
            {ticket.notes.map((note) => (
              <div key={note.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold tracking-[0.08em] text-slate-600 uppercase">
                    {note.noteType}
                  </p>
                  <p className="text-xs text-slate-500">{note.createdAt.toISOString()}</p>
                </div>
                <p className="mt-2 text-sm whitespace-pre-wrap text-slate-800">{note.content}</p>
                {note.screenshotAttachment ? (
                  <p className="mt-2 text-xs text-slate-600">
                    Screenshot: {note.screenshotAttachment.fileName} (
                    {note.screenshotAttachment.filePath})
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <CardTitle>Linked Life Events</CardTitle>
          {ticket.lifeEvents.length === 0 ? (
            <p className="text-sm text-slate-500">No linked life events yet.</p>
          ) : (
            <ul className="space-y-2">
              {ticket.lifeEvents.map((link) => (
                <li
                  key={link.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <p className="font-medium text-slate-900">{link.lifeEvent.title}</p>
                  <p className="text-xs text-slate-600">
                    {link.lifeEvent.module} · {link.lifeEvent.eventDate.toISOString().slice(0, 10)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-3">
          <CardTitle>Link Existing Life Event</CardTitle>
          <TicketLinkLifeEventForm
            ticketId={ticket.id}
            options={availableLifeEvents.map((event) => ({
              id: event.id,
              title: event.title,
              module: event.module,
              eventDate: event.eventDate.toISOString().slice(0, 10),
            }))}
          />
        </Card>
      </div>
    </div>
  );
}

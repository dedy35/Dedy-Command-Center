"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { workLogCategories } from "@/config/work-log";

type TicketOption = {
  id: string;
  ticketNo: string | null;
  title: string;
};

type AchievementItem = {
  id: string;
  starSituation: string | null;
  starTask: string | null;
  starAction: string | null;
  starResult: string | null;
  cvBulletEn: string | null;
  cvBulletId: string | null;
  impactQuestions: string[];
  createdAt: string;
};

type WorkLogItem = {
  id: string;
  workDate: string;
  category: string;
  description: string;
  impact: string | null;
  relatedTicket: TicketOption | null;
  achievements: AchievementItem[];
  createdAt: string;
};

type PromptOption = {
  key: "daily_log_rewrite_v1" | "cv_bullet_star_v1";
  title: string;
  description: string;
};

type DailyLogWorkspaceProps = {
  tickets: TicketOption[];
  workLogs: WorkLogItem[];
  promptOptions: PromptOption[];
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function DailyLogWorkspace({ tickets, workLogs, promptOptions }: DailyLogWorkspaceProps) {
  const router = useRouter();

  const [workDate, setWorkDate] = useState(todayIso());
  const [category, setCategory] = useState<(typeof workLogCategories)[number]>("coding");
  const [description, setDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [relatedTicketId, setRelatedTicketId] = useState("");

  const [saveLoading, setSaveLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [runningByLogId, setRunningByLogId] = useState<Record<string, boolean>>({});
  const [promptByLogId, setPromptByLogId] = useState<Record<string, string>>({});

  const defaultPrompt = promptOptions[0]?.key ?? "cv_bullet_star_v1";

  const ticketMap = useMemo(() => new Map(tickets.map((ticket) => [ticket.id, ticket])), [tickets]);

  async function onSaveWorkLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setActionMessage(null);

    if (!description.trim()) {
      setActionError("Description is required.");
      return;
    }

    setSaveLoading(true);

    try {
      const response = await fetch("/api/work-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workDate,
          category,
          description: description.trim(),
          impact: impact.trim() || null,
          relatedTicketId: relatedTicketId || null,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) {
        setActionError(payload?.error ?? "Failed to save daily log.");
        return;
      }

      setDescription("");
      setImpact("");
      setRelatedTicketId("");
      setActionMessage("Daily log saved. You can generate STAR/CV draft from the list below.");
      router.refresh();
    } catch {
      setActionError("Unable to save daily log right now.");
    } finally {
      setSaveLoading(false);
    }
  }

  async function onGenerate(workLogId: string) {
    setActionError(null);
    setActionMessage(null);

    const promptKey = promptByLogId[workLogId] ?? defaultPrompt;

    setRunningByLogId((prev) => ({ ...prev, [workLogId]: true }));

    try {
      const response = await fetch(`/api/work-logs/${workLogId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptKey }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        noInventedMetrics?: boolean;
        achievement?: { id: string };
      } | null;

      if (!response.ok) {
        setActionError(payload?.error ?? "Failed to generate achievement draft.");
        return;
      }

      if (payload?.achievement?.id) {
        if (payload.noInventedMetrics) {
          setActionMessage(
            "STAR/CV draft saved without invented metrics. Impact questions were added for missing measurable results.",
          );
        } else {
          setActionMessage("STAR/CV achievement draft generated and saved.");
        }
      } else {
        setActionMessage("Draft generated and saved to AI outputs.");
      }

      router.refresh();
    } catch {
      setActionError("Unable to run generator right now.");
    } finally {
      setRunningByLogId((prev) => ({ ...prev, [workLogId]: false }));
    }
  }

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={onSaveWorkLog}>
        <div className="grid gap-3 md:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-[0.08em] text-slate-600 uppercase">
              Date
            </span>
            <input
              type="date"
              value={workDate}
              onChange={(event) => setWorkDate(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="space-y-1">
            <span className="text-xs font-semibold tracking-[0.08em] text-slate-600 uppercase">
              Category
            </span>
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as (typeof workLogCategories)[number])
              }
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
            >
              {workLogCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-xs font-semibold tracking-[0.08em] text-slate-600 uppercase">
              Related Ticket (Optional)
            </span>
            <select
              value={relatedTicketId}
              onChange={(event) => setRelatedTicketId(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
            >
              <option value="">No linked ticket</option>
              {tickets.map((ticket) => (
                <option key={ticket.id} value={ticket.id}>
                  {(ticket.ticketNo ?? ticket.id.slice(0, 8)) + " · " + ticket.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-xs font-semibold tracking-[0.08em] text-slate-600 uppercase">
            What did you do today?
          </span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Fast daily input (target under 30 seconds)..."
            className="w-full rounded-xl border border-slate-300 p-3 text-sm"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-xs font-semibold tracking-[0.08em] text-slate-600 uppercase">
            Impact (Optional, add measurable result if known)
          </span>
          <textarea
            value={impact}
            onChange={(event) => setImpact(event.target.value)}
            rows={2}
            placeholder="e.g. reduced review cycle by 25%, cut manual steps by 2, prevented 1 prod regression..."
            className="w-full rounded-xl border border-slate-300 p-3 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={saveLoading}
          className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {saveLoading ? "Saving..." : "Save Daily Log"}
        </button>
      </form>

      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
      {actionMessage ? <p className="text-sm text-green-700">{actionMessage}</p> : null}

      <div className="space-y-4">
        {workLogs.length === 0 ? (
          <p className="text-sm text-slate-500">No daily logs yet.</p>
        ) : (
          workLogs.map((log) => {
            const selectedPrompt = promptByLogId[log.id] ?? defaultPrompt;
            const relatedTicket = log.relatedTicket
              ? (ticketMap.get(log.relatedTicket.id) ?? log.relatedTicket)
              : null;

            return (
              <div
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {log.workDate.slice(0, 10)} · {log.category}
                    </p>
                    {relatedTicket ? (
                      <p className="text-xs text-slate-600">
                        Ticket: {relatedTicket.ticketNo ?? relatedTicket.id.slice(0, 8)} ·{" "}
                        {relatedTicket.title}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-slate-500">Created: {log.createdAt}</p>
                </div>

                <p className="mt-3 text-sm whitespace-pre-wrap text-slate-800">{log.description}</p>
                {log.impact ? (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium">Impact:</span> {log.impact}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-amber-700">Impact metric not provided yet.</p>
                )}

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-slate-600">Prompt Key</span>
                    <select
                      value={selectedPrompt}
                      onChange={(event) =>
                        setPromptByLogId((prev) => ({
                          ...prev,
                          [log.id]: event.target.value,
                        }))
                      }
                      className="h-9 rounded-lg border border-slate-300 px-2 text-xs"
                    >
                      {promptOptions.map((prompt) => (
                        <option key={prompt.key} value={prompt.key}>
                          {prompt.key}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => onGenerate(log.id)}
                    disabled={Boolean(runningByLogId[log.id])}
                    className="inline-flex h-9 items-center rounded-lg bg-slate-900 px-3 text-xs font-medium text-white disabled:opacity-60"
                  >
                    {runningByLogId[log.id] ? "Generating..." : "Generate STAR/CV"}
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {log.achievements.length === 0 ? (
                    <p className="text-xs text-slate-500">No achievement draft yet.</p>
                  ) : (
                    log.achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-xs font-semibold tracking-[0.08em] text-slate-600 uppercase">
                          Achievement Draft · {achievement.createdAt}
                        </p>
                        <p className="mt-2 text-xs text-slate-700">
                          <span className="font-medium">STAR S:</span>{" "}
                          {achievement.starSituation ?? "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-700">
                          <span className="font-medium">STAR T:</span> {achievement.starTask ?? "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-700">
                          <span className="font-medium">STAR A:</span>{" "}
                          {achievement.starAction ?? "-"}
                        </p>
                        <p className="mt-1 text-xs text-slate-700">
                          <span className="font-medium">STAR R:</span>{" "}
                          {achievement.starResult ?? "-"}
                        </p>
                        <p className="mt-2 text-sm text-slate-800">
                          <span className="font-medium">CV Bullet (EN):</span>{" "}
                          {achievement.cvBulletEn ?? "-"}
                        </p>
                        <p className="mt-1 text-sm text-slate-800">
                          <span className="font-medium">CV Bullet (ID):</span>{" "}
                          {achievement.cvBulletId ?? "-"}
                        </p>

                        {achievement.impactQuestions.length > 0 ? (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <p className="text-xs font-semibold text-amber-800">
                              Impact questions (metric missing)
                            </p>
                            <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-800">
                              {achievement.impactQuestions.map((question, index) => (
                                <li key={index}>{question}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

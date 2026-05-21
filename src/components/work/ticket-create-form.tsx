"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { riskLevels, ticketStatuses } from "@/config/tickets";

export function TicketCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      ticketNo: String(formData.get("ticketNo") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      systemName: String(formData.get("systemName") ?? "").trim(),
      status: String(formData.get("status") ?? "new"),
      riskLevel: String(formData.get("riskLevel") ?? "medium"),
      redmineText: String(formData.get("redmineText") ?? "").trim(),
    };

    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to create ticket.");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError("Unable to create ticket right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Ticket No</span>
          <input
            name="ticketNo"
            placeholder="e.g. RM-1024"
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">System Name</span>
          <input
            name="systemName"
            placeholder="e.g. Internal Core"
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Title</span>
        <input
          name="title"
          required
          placeholder="Short ticket title"
          className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <select
            name="status"
            defaultValue="new"
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
          >
            {ticketStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Risk Level</span>
          <select
            name="riskLevel"
            defaultValue="medium"
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
          >
            {riskLevels.map((risk) => (
              <option key={risk} value={risk}>
                {risk}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm font-medium text-slate-700">Pasted Redmine Text (Optional)</span>
        <textarea
          name="redmineText"
          rows={6}
          placeholder="Paste Redmine detail, comments, or reproduction notes..."
          className="w-full rounded-xl border border-slate-300 p-3 text-sm"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create Ticket"}
      </button>
    </form>
  );
}

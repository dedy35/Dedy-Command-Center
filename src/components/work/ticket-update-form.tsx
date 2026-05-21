"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { riskLevels, ticketStatuses } from "@/config/tickets";

type TicketUpdateFormProps = {
  ticketId: string;
  ticketNo: string | null;
  title: string;
  systemName: string | null;
  status: string;
  riskLevel: string;
};

export function TicketUpdateForm(props: TicketUpdateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      ticketNo: String(formData.get("ticketNo") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      systemName: String(formData.get("systemName") ?? "").trim(),
      status: String(formData.get("status") ?? props.status),
      riskLevel: String(formData.get("riskLevel") ?? props.riskLevel),
    };

    try {
      const response = await fetch(`/api/tickets/${props.ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to update ticket.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to update ticket right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Ticket No</span>
          <input
            name="ticketNo"
            defaultValue={props.ticketNo ?? ""}
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">System Name</span>
          <input
            name="systemName"
            defaultValue={props.systemName ?? ""}
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Title</span>
        <input
          name="title"
          required
          defaultValue={props.title}
          className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <select
            name="status"
            defaultValue={props.status}
            className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
          >
            {ticketStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Risk Level</span>
          <select
            name="riskLevel"
            defaultValue={props.riskLevel}
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

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : "Save Ticket"}
      </button>
    </form>
  );
}

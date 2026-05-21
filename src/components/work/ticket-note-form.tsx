"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { ticketNoteTypes } from "@/config/tickets";

type TicketNoteFormProps = {
  ticketId: string;
};

export function TicketNoteForm({ ticketId }: TicketNoteFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/notes`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to create note.");
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError("Unable to create note right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Note Type</span>
        <select
          name="noteType"
          defaultValue="analysis"
          className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
        >
          {ticketNoteTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Note</span>
        <textarea
          name="content"
          rows={5}
          required
          placeholder="Add technical analysis, test note, or workplace-ready wording..."
          className="mt-1 w-full rounded-xl border border-slate-300 p-3 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Screenshot (Optional)</span>
        <input
          type="file"
          name="screenshot"
          accept="image/*"
          className="mt-1 block w-full rounded-xl border border-slate-300 p-2 text-sm"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Saving note..." : "Add Note"}
      </button>
    </form>
  );
}

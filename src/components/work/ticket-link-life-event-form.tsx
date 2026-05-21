"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type LifeEventOption = {
  id: string;
  title: string;
  module: string;
  eventDate: string;
};

type TicketLinkLifeEventFormProps = {
  ticketId: string;
  options: LifeEventOption[];
};

export function TicketLinkLifeEventForm({ ticketId, options }: TicketLinkLifeEventFormProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!selectedId) {
      setError("Select a life event first.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/tickets/${ticketId}/life-events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lifeEventId: selectedId }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Failed to link life event.");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to link life event right now.");
    } finally {
      setLoading(false);
    }
  }

  if (options.length === 0) {
    return <p className="text-sm text-slate-500">No available life events to link.</p>;
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Available Life Events</span>
        <select
          value={selectedId}
          onChange={(event) => setSelectedId(event.target.value)}
          className="mt-1 h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
        >
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.eventDate} | {option.module} | {option.title}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-10 items-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Linking..." : "Link Life Event"}
      </button>
    </form>
  );
}

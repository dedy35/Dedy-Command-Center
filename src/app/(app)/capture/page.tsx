"use client";

import { FormEvent, useMemo, useState } from "react";

import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const sourceTypeOptions = ["text", "photo", "pdf", "url", "email", "chat", "manual"] as const;
const moduleHintOptions = [
  "work",
  "finance",
  "freelance",
  "career",
  "japanese",
  "meeting",
  "life_admin",
  "media",
  "decision",
  "general",
] as const;

type SaveResult = {
  sourceId: string;
  lifeEventId: string;
  attachmentId: string | null;
};

export default function CapturePage() {
  const [sourceType, setSourceType] = useState<(typeof sourceTypeOptions)[number]>("manual");
  const [moduleHint, setModuleHint] = useState<(typeof moduleHintOptions)[number]>("general");
  const [contentText, setContentText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SaveResult | null>(null);

  const fileLabel = useMemo(() => {
    if (!file) {
      return "No file selected";
    }

    const kb = Math.max(1, Math.round(file.size / 1024));
    return `${file.name} (${kb} KB)`;
  }, [file]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!contentText.trim() && !file) {
      setError("Please provide capture text or choose a file.");
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.set("sourceType", sourceType);
      formData.set("moduleHint", moduleHint);
      formData.set("contentText", contentText.trim());
      if (file) {
        formData.set("file", file);
      }

      const response = await fetch("/api/capture", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json().catch(() => null)) as
        | ({ error?: string } & Partial<SaveResult>)
        | null;

      if (!response.ok) {
        setError(payload?.error ?? "Failed to save capture.");
        return;
      }

      setResult({
        sourceId: payload?.sourceId ?? "",
        lifeEventId: payload?.lifeEventId ?? "",
        attachmentId: payload?.attachmentId ?? null,
      });
      setContentText("");
      setFile(null);
    } catch {
      setError("Unable to save capture right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Universal Capture</h2>
        <p className="text-sm text-slate-600">
          Save raw input into source-of-truth records. This flow creates <code>sources</code>,
          optional
          <code> attachments</code>, and linked <code>life_events</code>.
        </p>
      </section>

      <Card className="space-y-5">
        <div>
          <CardTitle>New Capture</CardTitle>
          <CardDescription>
            Choose source type, module hint, add text and/or file, then save for structured
            processing.
          </CardDescription>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Source Type</span>
              <select
                value={sourceType}
                onChange={(event) =>
                  setSourceType(event.target.value as (typeof sourceTypeOptions)[number])
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                {sourceTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Module Hint</span>
              <select
                value={moduleHint}
                onChange={(event) =>
                  setModuleHint(event.target.value as (typeof moduleHintOptions)[number])
                }
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-500"
              >
                {moduleHintOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Capture Text</span>
            <textarea
              value={contentText}
              onChange={(event) => setContentText(event.target.value)}
              rows={8}
              placeholder="Paste note, message, receipt text, ticket summary, or any raw input..."
              className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">File Upload (Optional)</span>
            <input
              type="file"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-xl border border-slate-300 bg-white p-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <p className="text-xs text-slate-500">{fileLabel}</p>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          {result ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-900">
              <p className="font-medium">Capture saved successfully.</p>
              <p className="mt-1 text-xs">source_id: {result.sourceId}</p>
              <p className="text-xs">life_event_id: {result.lifeEventId}</p>
              <p className="text-xs">attachment_id: {result.attachmentId ?? "-"}</p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving capture..." : "Save Capture"}
          </button>
        </form>
      </Card>
    </div>
  );
}

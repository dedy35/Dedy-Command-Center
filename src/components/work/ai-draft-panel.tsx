"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type PromptOption = {
  key: string;
  title: string;
  description: string;
  approvalRequired: boolean;
};

type ApprovalLite = {
  id: string;
  status: "pending" | "approved" | "rejected";
  actionType: string;
  createdAt: string;
};

type AiOutputLite = {
  id: string;
  promptKey: string;
  outputType: string;
  content: string;
  status: "draft" | "approved" | "rejected" | "superseded";
  model: string | null;
  createdAt: string;
  approvals: ApprovalLite[];
};

type AiDraftPanelProps = {
  moduleName: string;
  sourceId: string | null;
  prompts: PromptOption[];
  defaultInputText: string;
  initialOutputs: AiOutputLite[];
};

function toIso(value: string | Date) {
  if (typeof value === "string") {
    return value;
  }
  return value.toISOString();
}

export function AiDraftPanel({
  moduleName,
  sourceId,
  prompts,
  defaultInputText,
  initialOutputs,
}: AiDraftPanelProps) {
  const router = useRouter();

  const [selectedPromptKey, setSelectedPromptKey] = useState(prompts[0]?.key ?? "");
  const [inputText, setInputText] = useState(defaultInputText);
  const [loadingRun, setLoadingRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<AiOutputLite[]>(
    initialOutputs.map((item) => ({
      ...item,
      createdAt: toIso(item.createdAt),
      approvals: item.approvals.map((approval) => ({
        ...approval,
        createdAt: toIso(approval.createdAt),
      })),
    })),
  );

  const [editingMap, setEditingMap] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialOutputs.map((output) => [output.id, output.content])),
  );

  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.key === selectedPromptKey) ?? null,
    [prompts, selectedPromptKey],
  );

  async function generateDraft() {
    setError(null);

    if (!selectedPromptKey) {
      setError("Select prompt_key first.");
      return;
    }

    if (!inputText.trim()) {
      setError("Input text is required.");
      return;
    }

    setLoadingRun(true);

    try {
      const response = await fetch("/api/ai/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module: moduleName,
          sourceId,
          promptKey: selectedPromptKey,
          inputText: inputText.trim(),
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        aiOutput?: AiOutputLite;
      } | null;

      if (!response.ok || !payload?.aiOutput) {
        setError(payload?.error ?? "Failed to generate draft.");
        return;
      }

      const created = {
        ...payload.aiOutput,
        createdAt: toIso(payload.aiOutput.createdAt),
        approvals: [],
      };

      setOutputs((prev) => [created, ...prev]);
      setEditingMap((prev) => ({ ...prev, [created.id]: created.content }));
      router.refresh();
    } catch {
      setError("Unable to run mock local AI provider.");
    } finally {
      setLoadingRun(false);
    }
  }

  async function saveEdit(outputId: string) {
    const content = editingMap[outputId]?.trim();
    if (!content) {
      setError("Edited content cannot be empty.");
      return;
    }

    setError(null);

    const response = await fetch(`/api/ai/outputs/${outputId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    const payload = (await response.json().catch(() => null)) as {
      error?: string;
      aiOutput?: AiOutputLite;
    } | null;

    if (!response.ok || !payload?.aiOutput) {
      setError(payload?.error ?? "Failed to update AI output.");
      return;
    }

    setOutputs((prev) =>
      prev.map((item) =>
        item.id === outputId ? { ...item, content: payload.aiOutput!.content } : item,
      ),
    );

    router.refresh();
  }

  async function copyToClipboard(outputId: string) {
    const text = editingMap[outputId] ?? "";
    if (!text) {
      setError("Nothing to copy.");
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
    } catch {
      setError("Clipboard copy failed.");
    }
  }

  async function decideApproval(outputId: string, decision: "approved" | "rejected") {
    setError(null);

    const createRes = await fetch("/api/approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aiOutputId: outputId,
        actionType: "copy",
      }),
    });

    const createPayload = (await createRes.json().catch(() => null)) as {
      error?: string;
      approval?: { id: string };
    } | null;

    if (!createRes.ok || !createPayload?.approval?.id) {
      setError(createPayload?.error ?? "Failed to create approval record.");
      return;
    }

    const decisionRes = await fetch(`/api/approvals/${createPayload.approval.id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: decision }),
    });

    const decisionPayload = (await decisionRes.json().catch(() => null)) as {
      error?: string;
      approval?: ApprovalLite;
    } | null;

    if (!decisionRes.ok || !decisionPayload?.approval) {
      setError(decisionPayload?.error ?? "Failed to update approval status.");
      return;
    }

    setOutputs((prev) =>
      prev.map((item) => {
        if (item.id !== outputId) {
          return item;
        }

        return {
          ...item,
          approvals: [
            {
              ...decisionPayload.approval!,
              createdAt: toIso(decisionPayload.approval!.createdAt),
            },
            ...item.approvals,
          ],
          status: decision === "approved" ? "approved" : "rejected",
        };
      }),
    );

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Prompt Key</p>
        <select
          value={selectedPromptKey}
          onChange={(event) => setSelectedPromptKey(event.target.value)}
          className="h-10 w-full rounded-xl border border-slate-300 px-3 text-sm"
        >
          {prompts.map((prompt) => (
            <option key={prompt.key} value={prompt.key}>
              {prompt.key}
            </option>
          ))}
        </select>
        {selectedPrompt ? (
          <p className="text-xs text-slate-600">
            {selectedPrompt.title} - {selectedPrompt.description}
          </p>
        ) : null}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium text-slate-700">Input Text</span>
        <textarea
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          rows={6}
          className="w-full rounded-xl border border-slate-300 p-3 text-sm"
          placeholder="Paste ticket context or work notes as AI input..."
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={generateDraft}
        disabled={loadingRun}
        className="inline-flex h-10 items-center rounded-xl bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loadingRun ? "Generating..." : "Generate Draft"}
      </button>

      <div className="space-y-3">
        {outputs.length === 0 ? (
          <p className="text-sm text-slate-500">No AI outputs yet.</p>
        ) : (
          outputs.map((output) => {
            const latestApproval = output.approvals[0];
            return (
              <div key={output.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="rounded bg-slate-200 px-2 py-1">{output.promptKey}</span>
                  <span>{output.outputType}</span>
                  <span>Status: {output.status}</span>
                  <span>{output.createdAt}</span>
                  {latestApproval ? (
                    <span className="rounded bg-slate-200 px-2 py-1">
                      Approval: {latestApproval.status}
                    </span>
                  ) : null}
                </div>

                <textarea
                  value={editingMap[output.id] ?? output.content}
                  onChange={(event) =>
                    setEditingMap((prev) => ({
                      ...prev,
                      [output.id]: event.target.value,
                    }))
                  }
                  rows={8}
                  className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm"
                />

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(output.id)}
                    className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Save Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(output.id)}
                    className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => decideApproval(output.id, "approved")}
                    className="inline-flex h-9 items-center rounded-lg bg-green-600 px-3 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => decideApproval(output.id, "rejected")}
                    className="inline-flex h-9 items-center rounded-lg bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

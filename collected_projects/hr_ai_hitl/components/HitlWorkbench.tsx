"use client";

import { useEffect, useMemo, useState } from "react";
import { SAMPLE_CASES, type SampleCase } from "@/lib/prompts";
import { evaluateHrNote, evalSummary } from "@/lib/eval";
import {
  emptySession,
  recordGeneration,
  recordWrite,
  type GenerationTelemetry,
  type SessionTelemetry,
} from "@/lib/telemetry";
import { CaseWorkflowBar } from "@/components/CaseWorkflowBar";
import { TelemetryPanel, TelemetryTrigger } from "@/components/TelemetryPanel";
import { formatNoteHtml } from "@/lib/note-format";
import { formatFactHtml, parseCaseContext } from "@/lib/case-context";

const DEFAULT_PROMPT =
  "Draft an internal HR case note for the HRBP based on the case context.";

function statusLabel(status: SampleCase["status"]): string {
  const map: Record<SampleCase["status"], string> = {
    open: "Open",
    in_review: "In review",
    pending_hrbp: "Pending HRBP",
    closed: "Closed",
  };
  return map[status] ?? status;
}

function priorityClass(priority: SampleCase["priority"]): string {
  if (priority === "urgent") return "urgent";
  if (priority === "high") return "high";
  return "normal";
}

function priorityLabel(priority: SampleCase["priority"]): string {
  const map: Record<SampleCase["priority"], string> = {
    normal: "Normal",
    high: "High",
    urgent: "Urgent",
  };
  return map[priority] ?? priority;
}

type OdooHealthView = {
  ok: boolean;
  headline: string;
  subline?: string;
};

function formatOdooHealth(data: {
  mode?: string;
  ok?: boolean;
  detail?: string;
  odooVersion?: string;
  seededCases?: number;
}): OdooHealthView {
  if (data.mode === "mock") {
    return {
      ok: true,
      headline: "Mock mode",
      subline: "Writes saved locally (no Odoo required)",
    };
  }
  if (data.ok) {
    const version = data.odooVersion ? `Odoo ${data.odooVersion}` : "Odoo connected";
    const cases =
      typeof data.seededCases === "number"
        ? `${data.seededCases} demo case${data.seededCases === 1 ? "" : "s"} loaded`
        : undefined;
    return {
      ok: true,
      headline: "Live · connected",
      subline: [version, cases].filter(Boolean).join(" · "),
    };
  }
  return {
    ok: false,
    headline: "Live · unreachable",
    subline: data.detail || "Health check failed",
  };
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type WriteResponse = {
  ok: boolean;
  blocked?: boolean;
  reason?: string;
  error?: string;
  result?: {
    mode: string;
    message: string;
    externalId?: string | number;
  };
  eval?: { pass: boolean; notes: string[] };
};

function Workbench({
  caseItem,
  onSelectCase,
}: {
  caseItem: SampleCase;
  onSelectCase: (c: SampleCase) => void;
}) {
  const [writeState, setWriteState] = useState<WriteResponse | null>(null);
  const [writing, setWriting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [odooHealth, setOdooHealth] = useState<OdooHealthView>({
    ok: true,
    headline: "Checking…",
  });
  const [input, setInput] = useState(DEFAULT_PROMPT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [modelId, setModelId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [telemetryOpen, setTelemetryOpen] = useState(false);
  const [session, setSession] = useState<SessionTelemetry>(() => emptySession());
  const [lastGeneration, setLastGeneration] = useState<GenerationTelemetry | null>(null);
  const [runtime, setRuntime] = useState<{
    provider: string;
    modelId: string;
    odooMode: string;
    aiProviderEnv: string;
    nodeEnv: string;
  } | null>(null);
  const [activeCase, setActiveCase] = useState<SampleCase>(caseItem);
  const [odooPartnerUrl, setOdooPartnerUrl] = useState<string | null>(null);
  const [caseSource, setCaseSource] = useState<"odoo" | "static">("static");
  const [lastGeneratedDraft, setLastGeneratedDraft] = useState<string | null>(null);

  const caseContextView = useMemo(
    () => parseCaseContext(activeCase.context),
    [activeCase.context],
  );

  const caseContext = useMemo(
    () =>
      [
        `Case ref: ${activeCase.id}`,
        `Title: ${activeCase.title}`,
        `Employee: ${activeCase.employeeName} (${activeCase.department})`,
        `Manager: ${activeCase.manager}`,
        `Site: ${activeCase.site}`,
        `Status: ${statusLabel(activeCase.status)} · Priority: ${priorityLabel(activeCase.priority)}`,
        `Opened: ${activeCase.openedOn}`,
        "",
        "Case details:",
        activeCase.context,
      ].join("\n"),
    [activeCase],
  );

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const lastAssistantId = lastAssistant?.id;
  const draft = lastAssistant?.content.trim() || "";
  const draftEdited =
    Boolean(lastGeneratedDraft) && Boolean(draft) && draft !== lastGeneratedDraft;
  const liveEval = draft ? evalSummary(evaluateHrNote(draft)) : null;

  function updateDraftContent(id: string, content: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, content } : m)));
    setWriteState(null);
  }

  async function refreshHealth() {
    try {
      const res = await fetch("/api/odoo/health");
      const data = await res.json();
      setOdooHealth(formatOdooHealth(data));
    } catch {
      setOdooHealth({
        ok: false,
        headline: "Status unavailable",
        subline: "Health check failed",
      });
    }
  }

  async function refreshRuntime() {
    try {
      const res = await fetch("/api/telemetry");
      const data = await res.json();
      if (data.ok) {
        setRuntime({
          provider: data.provider,
          modelId: data.modelId,
          odooMode: data.odooMode,
          aiProviderEnv: data.aiProviderEnv,
          nodeEnv: data.nodeEnv,
        });
        setProvider(data.provider);
        setModelId(data.modelId);
      }
    } catch {
      /* non-fatal */
    }
  }

  useEffect(() => {
    setHydrated(true);
    void refreshHealth();
    void refreshRuntime();
  }, []);

  useEffect(() => {
    setActiveCase(caseItem);
    setOdooPartnerUrl(null);
    setCaseSource("static");
    void (async () => {
      try {
        const res = await fetch(`/api/odoo/case?id=${encodeURIComponent(caseItem.id)}`);
        if (!res.ok) return;
        const data = (await res.json()) as {
          case: SampleCase;
          partnerUrl?: string;
          source: "odoo" | "static";
        };
        setActiveCase(data.case);
        setCaseSource(data.source);
        setOdooPartnerUrl(data.partnerUrl ?? null);
      } catch {
        /* keep static case */
      }
    })();
  }, [caseItem]);

  async function generate() {
    if (loading) return;
    setError(null);
    setWarning(null);
    setWriteState(null);

    const text = input.trim() || DEFAULT_PROMPT;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    const started = Date.now();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseContext,
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const raw = await res.text();
      let data: {
        text?: string;
        error?: string;
        warning?: string;
        provider?: string;
        modelId?: string;
        fallback?: boolean;
        telemetry?: GenerationTelemetry;
      };
      try {
        data = JSON.parse(raw) as typeof data;
      } catch {
        throw new Error(
          `Chat API returned non-JSON (${res.status}). First chars: ${raw.slice(0, 120)}`,
        );
      }

      if (!res.ok) {
        throw new Error(data.error || `Chat failed (${res.status})`);
      }
      if (!data.text) {
        throw new Error(data.error || "No draft text returned");
      }

      setProvider(data.provider ?? null);
      setModelId(data.modelId ?? null);
      if (data.fallback && data.warning) {
        setWarning(
          `LLM unavailable (${data.warning}). Showing a structured fallback draft so you can still demo HITL → Odoo.`,
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.text!,
        },
      ]);
      setLastGeneratedDraft(data.text!.trim());

      const genTelemetry: GenerationTelemetry =
        data.telemetry ?? {
          kind: "generation",
          at: new Date().toISOString(),
          provider: data.provider ?? "unknown",
          modelId: data.modelId ?? "unknown",
          latencyMs: Date.now() - started,
          fallback: Boolean(data.fallback),
          draftWords: data.text!.split(/\s+/).filter(Boolean).length,
          warning: data.warning,
        };
      setLastGeneration(genTelemetry);
      setSession((s) => recordGeneration(s, genTelemetry));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setLoading(false);
    }
  }

  async function onApprove() {
    if (!draft) return;
    setWriting(true);
    setWriteState(null);
    const started = Date.now();
    try {
      const res = await fetch("/api/odoo/write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: true,
          caseId: caseItem.id,
          caseTitle: activeCase.title,
          employeeLabel: activeCase.employee,
          noteBody: draft,
          approvedBy: "hrbp-demo",
        }),
      });
      const data = (await res.json()) as WriteResponse;
      setWriteState(data);
      const writeTelemetry = {
        kind: "write" as const,
        at: new Date().toISOString(),
        latencyMs: Date.now() - started,
        ok: Boolean(data.ok),
        blocked: data.blocked,
        odooMode: data.result?.mode,
        evalPass: data.eval?.pass,
        evalNotes: data.eval?.notes,
      };
      setSession((s) => recordWrite(s, writeTelemetry));
    } finally {
      setWriting(false);
      void refreshHealth();
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden />
          <div>
            <h1>HR case note workbench</h1>
            <p>
              Vercel AI SDK drafts → human approves → write to Odoo (or mock). Silent
              auto-write is blocked on purpose.
            </p>
          </div>
        </div>
        <div className="pill-row header-status">
          <TelemetryTrigger
            onClick={() => setTelemetryOpen(true)}
            provider={provider}
            modelId={modelId}
            eventCount={session.events.length}
          />
          <span className="pill pill-quiet">
            {caseSource === "odoo" ? "Case data · Odoo live" : "Case data · demo fixture"}
          </span>
        </div>
      </header>

      <TelemetryPanel
        open={telemetryOpen}
        onClose={() => setTelemetryOpen(false)}
        session={session}
        runtime={runtime}
        lastGeneration={lastGeneration}
        lastWrite={writeState}
      />

      <div className="layout">
        <aside className="panel">
          <p className="panel-label">Sample HR cases</p>
          <p className="muted" style={{ marginTop: 0 }}>
            Stand-in for HRIS tickets — same pattern as ERP/ops AI tooling.
          </p>
          <ul className="case-list">
            {SAMPLE_CASES.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={c.id === caseItem.id ? "active" : ""}
                  onClick={() => onSelectCase(c)}
                >
                  <strong>{c.title}</strong>
                  <span>{c.employee}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="health">
            <strong>Odoo connector</strong>
            <p className={`health-status ${odooHealth.ok ? "ok" : "bad"}`}>
              <span className="health-dot" aria-hidden />
              {odooHealth.headline}
            </p>
            {odooHealth.subline && <p className="health-meta">{odooHealth.subline}</p>}
            <button type="button" className="secondary" onClick={() => void refreshHealth()}>
              Refresh status
            </button>
          </div>
        </aside>

        <main className="main">
          <section className="section context">
            <div className="case-card">
              <div className="case-card-head">
                <div>
                  <p className="case-ref">{activeCase.id}</p>
                  <h3 className="case-title">{activeCase.title}</h3>
                </div>
                <div className="case-badges">
                  <span className="badge meta">
                    <span className="badge-label">Source</span>
                    {caseSource === "odoo" ? "Odoo record" : "Demo fixture"}
                  </span>
                  <span className={`badge status ${activeCase.status}`}>
                    <span className="badge-label">Status</span>
                    {statusLabel(activeCase.status)}
                  </span>
                  <span className={`badge priority ${priorityClass(activeCase.priority)}`}>
                    <span className="badge-label">Priority</span>
                    {priorityLabel(activeCase.priority)}
                  </span>
                </div>
              </div>

              <CaseWorkflowBar
                hasDraft={Boolean(draft)}
                drafting={loading}
                written={Boolean(writeState?.ok)}
              />

              <dl className="case-meta">
                <div className="case-meta-key">
                  <dt>Employee</dt>
                  <dd>{activeCase.employeeName}</dd>
                </div>
                <div>
                  <dt>Department</dt>
                  <dd>{activeCase.department}</dd>
                </div>
                <div>
                  <dt>Manager</dt>
                  <dd>{activeCase.manager}</dd>
                </div>
                <div>
                  <dt>Site</dt>
                  <dd>{activeCase.site}</dd>
                </div>
                <div className="case-meta-key">
                  <dt>Opened</dt>
                  <dd>{activeCase.openedOn}</dd>
                </div>
                <div>
                  <dt>Contact</dt>
                  <dd>
                    {activeCase.email}
                    {activeCase.phone ? ` · ${activeCase.phone}` : ""}
                  </dd>
                </div>
              </dl>

              <div className="case-story">
                <div className="case-legend" aria-label="Color key">
                  <span className="legend-item legend-fact">Confirmed case context</span>
                  <span className="legend-item legend-open">Unresolved · needs HRBP input</span>
                </div>

                <div
                  className={`case-story-grid ${caseContextView.openQuestions.length > 0 ? "two-col" : "one-col"}`}
                >
                  <div className="case-story-col">
                    <p className="case-story-label legend-fact">Facts</p>
                    <ul className="case-facts-compact">
                      {caseContextView.facts.map((fact) => (
                        <li
                          key={fact}
                          dangerouslySetInnerHTML={{ __html: formatFactHtml(fact) }}
                        />
                      ))}
                    </ul>
                  </div>
                  {caseContextView.openQuestions.length > 0 && (
                    <div className="case-story-col">
                      <p className="case-story-label legend-open">Open questions</p>
                      <ul className="case-facts-compact case-open-compact">
                        {caseContextView.openQuestions.map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {odooPartnerUrl && (
                <p className="case-odoo-link">
                  <a href={odooPartnerUrl} target="_blank" rel="noreferrer">
                    Open employee record in Odoo →
                  </a>
                </p>
              )}
            </div>
          </section>

          <section className="section chat">
            <h3>Draft thread</h3>
            <p className="chat-hint">
              Latest draft is editable before approve. Use the composer below to ask the model for a
              revision.
            </p>
            <div className="messages">
              {messages.length === 0 && (
                <p className="empty">
                  Prompt is pre-filled below. Click <strong>Generate / revise</strong>.
                </p>
              )}
              {messages.map((m) => (
                <article key={m.id} className={`bubble ${m.role}`}>
                  <header>
                    {m.role === "user" ? (
                      "You"
                    ) : (
                      <>
                        AI draft
                        {m.id === lastAssistantId && (
                          <span className={`bubble-tag${draftEdited ? " edited" : ""}`}>
                            {draftEdited ? "HRBP edited" : "Editable"}
                          </span>
                        )}
                      </>
                    )}
                  </header>
                  {m.role === "assistant" && m.id === lastAssistantId ? (
                    <textarea
                      className="content draft-editor"
                      value={m.content}
                      onChange={(e) => updateDraftContent(m.id, e.target.value)}
                      rows={12}
                      aria-label="Editable HR case note draft"
                    />
                  ) : m.role === "assistant" ? (
                    <div
                      className="content note-formatted"
                      dangerouslySetInnerHTML={{ __html: formatNoteHtml(m.content) }}
                    />
                  ) : (
                    <div className="content">{m.content}</div>
                  )}
                </article>
              ))}
            </div>

            <div className="composer">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder={DEFAULT_PROMPT}
              />
              <div className="btn-row">
                <button
                  type="button"
                  disabled={loading || !hydrated}
                  onClick={() => void generate()}
                >
                  {loading ? "Drafting…" : "Generate / revise"}
                </button>
              </div>
            </div>
            {!hydrated && (
              <p className="error">UI still loading. Wait a moment, then click Generate.</p>
            )}
            {warning && (
              <p
                className="error"
                style={{
                  borderColor: "rgba(251,191,36,0.35)",
                  background: "var(--warn-soft)",
                  color: "var(--warn)",
                }}
              >
                {warning}
              </p>
            )}
            {error && <p className="error">{error}</p>}
          </section>

          <section className="section hitl">
            <div className="hitl-head">
              <h3 style={{ margin: 0 }}>Human-in-the-loop</h3>
              <div className="hitl-head-actions">
                {liveEval && (
                  <span className={liveEval.pass ? "badge ok" : "badge warn"}>
                    {liveEval.pass ? "Eval heuristics OK" : "Eval flags"}
                  </span>
                )}
                <button
                  type="button"
                  className="secondary telemetry-inline"
                  onClick={() => setTelemetryOpen(true)}
                >
                  Open Telemetry →
                </button>
              </div>
            </div>
            <p className="hitl-telemetry-hint">
              Latency, token counts, and Odoo write payloads are in the{" "}
              <button
                type="button"
                className="linkish"
                onClick={() => setTelemetryOpen(true)}
              >
                Telemetry panel (top right)
              </button>
              .
            </p>
            {liveEval && !liveEval.pass && (
              <ul className="flags">
                {liveEval.notes.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            )}
            <div className="actions">
              <button
                type="button"
                className="approve"
                disabled={!draft || writing || loading || !hydrated}
                onClick={() => void onApprove()}
              >
                {writing ? "Writing…" : "Approve & write to Odoo"}
              </button>
              <button
                type="button"
                className="secondary"
                disabled={(!draft && messages.length === 0) || !hydrated}
                onClick={() => {
                  setMessages([]);
                  setWriteState(null);
                  setLastGeneratedDraft(null);
                  setError(null);
                  setWarning(null);
                  setProvider(runtime?.provider ?? null);
                  setModelId(runtime?.modelId ?? null);
                  setInput(DEFAULT_PROMPT);
                }}
              >
                Discard draft
              </button>
            </div>
            {writeState && (
              <div
                className={writeState.ok ? "write-banner ok" : "write-banner bad"}
                role="status"
              >
                {writeState.ok ? (
                  <>
                    <strong>Written to Odoo</strong>
                    <span>
                      {writeState.result?.message ?? "Approved note posted."}
                      {" · "}
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setTelemetryOpen(true)}
                      >
                        View payload in Telemetry
                      </button>
                    </span>
                  </>
                ) : (
                  <>
                    <strong>{writeState.blocked ? "Write blocked" : "Write failed"}</strong>
                    <span>
                      {writeState.reason ?? writeState.error ?? "See Telemetry for details."}
                      {" · "}
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => setTelemetryOpen(true)}
                      >
                        Open Telemetry
                      </button>
                    </span>
                  </>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

export function HitlWorkbench() {
  const [caseItem, setCaseItem] = useState<SampleCase>(SAMPLE_CASES[0]);
  return (
    <Workbench
      key={caseItem.id}
      caseItem={caseItem}
      onSelectCase={setCaseItem}
    />
  );
}

"use client";

import {
  avgLatencyMs,
  type GenerationTelemetry,
  type SessionTelemetry,
  type TelemetryEvent,
  type WriteTelemetry,
} from "@/lib/telemetry";

type RuntimeConfig = {
  provider: string;
  modelId: string;
  odooMode: string;
  aiProviderEnv: string;
  nodeEnv: string;
};

function formatMs(ms: number) {
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="telemetry-stat">
      <span className="telemetry-stat-label">{label}</span>
      <strong className="telemetry-stat-value">{value}</strong>
      {hint && <span className="telemetry-stat-hint">{hint}</span>}
    </div>
  );
}

function EventRow({ event }: { event: TelemetryEvent }) {
  if (event.kind === "generation") {
    return (
      <li className={`telemetry-event ${event.fallback ? "warn" : "ok"}`}>
        <div className="telemetry-event-head">
          <span className="telemetry-event-kind">Generate</span>
          <time>{formatTime(event.at)}</time>
        </div>
        <p>
          <code>{event.provider}</code> / <code>{event.modelId}</code>
        </p>
        <p className="telemetry-event-meta">
          {formatMs(event.latencyMs)}
          {event.usage ? ` · ${event.usage.totalTokens} tokens` : ""}
          {event.finishReason ? ` · ${event.finishReason}` : ""}
          {` · ${event.draftWords} words`}
        </p>
        {event.warning && <p className="telemetry-event-warn">{event.warning}</p>}
      </li>
    );
  }

  return (
    <li className={`telemetry-event ${event.ok ? "ok" : "bad"}`}>
      <div className="telemetry-event-head">
        <span className="telemetry-event-kind">Odoo write</span>
        <time>{formatTime(event.at)}</time>
      </div>
      <p className="telemetry-event-meta">
        {event.ok ? "Approved & written" : event.blocked ? "Blocked by guardrail" : "Failed"}
        {` · ${formatMs(event.latencyMs)}`}
        {event.odooMode ? ` · ${event.odooMode}` : ""}
        {event.evalPass === false ? " · eval flags" : event.evalPass ? " · eval OK" : ""}
      </p>
    </li>
  );
}

export function TelemetryPanel({
  open,
  onClose,
  session,
  runtime,
  lastGeneration,
  lastWrite,
}: {
  open: boolean;
  onClose: () => void;
  session: SessionTelemetry;
  runtime: RuntimeConfig | null;
  lastGeneration: GenerationTelemetry | null;
  lastWrite?: {
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
  } | null;
}) {
  const avg = avgLatencyMs(session);

  return (
    <>
      <button
        type="button"
        className={`telemetry-backdrop ${open ? "open" : ""}`}
        aria-label="Close telemetry panel"
        onClick={onClose}
      />
      <aside
        className={`telemetry-drawer ${open ? "open" : ""}`}
        aria-hidden={!open}
        aria-label="Session telemetry"
      >
        <header className="telemetry-header">
          <div>
            <h2>Telemetry</h2>
            <p className="muted">Model, latency, tokens, write payloads, and session counters.</p>
          </div>
          <button type="button" className="secondary telemetry-close" onClick={onClose}>
            Close
          </button>
        </header>

        <section className="telemetry-section">
          <h3>Runtime config</h3>
          <div className="telemetry-grid">
            <Stat
              label="Provider"
              value={runtime?.provider ?? lastGeneration?.provider ?? "—"}
            />
            <Stat
              label="Model"
              value={runtime?.modelId ?? lastGeneration?.modelId ?? "—"}
            />
            <Stat label="Odoo mode" value={runtime?.odooMode ?? "—"} />
            <Stat label="AI_PROVIDER env" value={runtime?.aiProviderEnv ?? "—"} />
          </div>
        </section>

        {lastGeneration && (
          <section className="telemetry-section">
            <h3>Last generation</h3>
            <div className="telemetry-grid">
              <Stat label="Latency" value={formatMs(lastGeneration.latencyMs)} />
              <Stat
                label="Tokens"
                value={
                  lastGeneration.usage
                    ? String(lastGeneration.usage.totalTokens)
                    : "n/a"
                }
                hint={
                  lastGeneration.usage
                    ? `${lastGeneration.usage.promptTokens} in / ${lastGeneration.usage.completionTokens} out`
                    : undefined
                }
              />
              <Stat
                label="Mode"
                value={lastGeneration.fallback ? "fallback template" : "live LLM"}
              />
              <Stat label="Draft size" value={`${lastGeneration.draftWords} words`} />
            </div>
          </section>
        )}

        {lastWrite && (
          <section className="telemetry-section">
            <h3>Last write payload</h3>
            <pre className={lastWrite.ok ? "result ok" : "result bad"}>
              {JSON.stringify(
                {
                  ok: lastWrite.ok,
                  blocked: lastWrite.blocked,
                  reason: lastWrite.reason,
                  error: lastWrite.error,
                  result: lastWrite.result
                    ? {
                        mode: lastWrite.result.mode,
                        message: lastWrite.result.message,
                        externalId: lastWrite.result.externalId,
                      }
                    : undefined,
                  eval: lastWrite.eval,
                },
                null,
                2,
              )}
            </pre>
          </section>
        )}

        <section className="telemetry-section">
          <h3>Session</h3>
          <div className="telemetry-grid">
            <Stat label="Generations" value={String(session.generations)} />
            <Stat label="Fallbacks" value={String(session.fallbacks)} />
            <Stat label="Writes OK" value={String(session.writesApproved)} />
            <Stat label="Writes blocked" value={String(session.writesBlocked)} />
            <Stat label="Total tokens" value={String(session.totalTokens)} />
            <Stat
              label="Avg latency"
              value={avg != null ? formatMs(avg) : "—"}
            />
          </div>
        </section>

        <section className="telemetry-section">
          <h3>Recent events</h3>
          {session.events.length === 0 ? (
            <p className="muted">Generate a draft or approve a write to populate the log.</p>
          ) : (
            <ul className="telemetry-events">
              {session.events.map((e, i) => (
                <EventRow key={`${e.at}-${e.kind}-${i}`} event={e} />
              ))}
            </ul>
          )}
        </section>
      </aside>
    </>
  );
}

export function TelemetryTrigger({
  onClick,
  modelId,
  provider,
  eventCount,
}: {
  onClick: () => void;
  modelId: string | null;
  provider: string | null;
  eventCount: number;
}) {
  return (
    <button
      type="button"
      className="telemetry-trigger"
      onClick={onClick}
      aria-label="Open telemetry panel"
    >
      <span className="telemetry-trigger-dot" aria-hidden />
      <span className="telemetry-trigger-copy">
        <strong>Open Telemetry</strong>
        <span className="telemetry-trigger-model">
          {provider && modelId
            ? `${provider} · ${modelId}`
            : "Latency · tokens · write payloads"}
        </span>
      </span>
      {eventCount > 0 && (
        <span className="telemetry-trigger-count" aria-label={`${eventCount} events logged`}>
          {eventCount}
        </span>
      )}
    </button>
  );
}

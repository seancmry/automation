export type TokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

export type GenerationTelemetry = {
  kind: "generation";
  at: string;
  provider: string;
  modelId: string;
  latencyMs: number;
  fallback: boolean;
  finishReason?: string;
  usage?: TokenUsage;
  draftWords: number;
  warning?: string;
};

export type WriteTelemetry = {
  kind: "write";
  at: string;
  latencyMs: number;
  ok: boolean;
  blocked?: boolean;
  odooMode?: string;
  evalPass?: boolean;
  evalNotes?: string[];
};

export type TelemetryEvent = GenerationTelemetry | WriteTelemetry;

export type SessionTelemetry = {
  startedAt: string;
  generations: number;
  fallbacks: number;
  writesApproved: number;
  writesBlocked: number;
  totalTokens: number;
  totalLatencyMs: number;
  events: TelemetryEvent[];
};

export function emptySession(): SessionTelemetry {
  return {
    startedAt: new Date().toISOString(),
    generations: 0,
    fallbacks: 0,
    writesApproved: 0,
    writesBlocked: 0,
    totalTokens: 0,
    totalLatencyMs: 0,
    events: [],
  };
}

export function recordGeneration(
  session: SessionTelemetry,
  event: GenerationTelemetry,
): SessionTelemetry {
  const tokens = event.usage?.totalTokens ?? 0;
  return {
    ...session,
    generations: session.generations + 1,
    fallbacks: session.fallbacks + (event.fallback ? 1 : 0),
    totalTokens: session.totalTokens + tokens,
    totalLatencyMs: session.totalLatencyMs + event.latencyMs,
    events: [event, ...session.events].slice(0, 20),
  };
}

export function recordWrite(
  session: SessionTelemetry,
  event: WriteTelemetry,
): SessionTelemetry {
  return {
    ...session,
    writesApproved: session.writesApproved + (event.ok ? 1 : 0),
    writesBlocked: session.writesBlocked + (event.blocked ? 1 : 0),
    totalLatencyMs: session.totalLatencyMs + event.latencyMs,
    events: [event, ...session.events].slice(0, 20),
  };
}

export function avgLatencyMs(session: SessionTelemetry): number | null {
  const ops = session.generations + session.writesApproved + session.writesBlocked;
  if (ops === 0) return null;
  return Math.round(session.totalLatencyMs / ops);
}

import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

export type ProviderId = "google" | "groq" | "openai";

/**
 * Pick a model from env. Prefer free tiers:
 * - google  → Gemini (free AI Studio key)  [default if GOOGLE_GENERATIVE_AI_API_KEY set]
 * - groq    → Groq free tier
 * - openai  → paid OpenAI
 */
export function resolveModel(): { provider: ProviderId; model: LanguageModel; modelId: string } {
  const forced = (process.env.AI_PROVIDER || "").toLowerCase() as ProviderId | "";

  const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const provider: ProviderId =
    forced === "google" || forced === "groq" || forced === "openai"
      ? forced
      : googleKey
        ? "google"
        : groqKey
          ? "groq"
          : openaiKey
            ? "openai"
            : "google";

  if (provider === "google") {
    if (!googleKey) {
      throw new Error(
        "No API key set. Easiest free option: get a Gemini key at https://aistudio.google.com/apikey and set GOOGLE_GENERATIVE_AI_API_KEY in .env.local",
      );
    }
    const google = createGoogleGenerativeAI({ apiKey: googleKey });
    const modelId = process.env.GOOGLE_MODEL || "gemini-flash-latest";
    return { provider, modelId, model: google(modelId) };
  }

  if (provider === "groq") {
    if (!groqKey) {
      throw new Error(
        "GROQ_API_KEY missing. Free key: https://console.groq.com/keys — then set GROQ_API_KEY in .env.local",
      );
    }
    const groq = createGroq({ apiKey: groqKey });
    const modelId = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
    return { provider, modelId, model: groq(modelId) };
  }

  if (!openaiKey) {
    throw new Error(
      "OPENAI_API_KEY missing. Or use a free key: GOOGLE_GENERATIVE_AI_API_KEY / GROQ_API_KEY",
    );
  }
  const openai = createOpenAI({ apiKey: openaiKey });
  const modelId = process.env.OPENAI_MODEL || "gpt-4o-mini";
  return { provider, modelId, model: openai(modelId) };
}

/**
 * Groq client — speech-to-text + LLM completions
 *
 * Groq's LPU hardware makes everything significantly faster:
 *   - whisper-large-v3-turbo: 5-10x faster than OpenAI Whisper
 *   - llama-3.3-70b-versatile: replaces gpt-4o for structured + text tasks
 *   - llama-3.1-8b-instant: replaces gpt-4o-mini for quick tasks
 *
 * Free tier: 28,800 audio seconds/day + generous token limits
 * Sign up: console.groq.com → API Keys
 * Add to .env.local: GROQ_API_KEY=gsk_...
 *
 * OpenAI is kept for embeddings only (Groq doesn't offer embeddings).
 */

import Groq from "groq-sdk";
import { toFile } from "groq-sdk";

let groqClient: Groq | null = null;

export function isGroqConfigured(): boolean {
  const key = process.env.GROQ_API_KEY;
  return Boolean(key && !key.startsWith("TODO_") && key.length > 10);
}

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

// Map OpenAI model names → Groq equivalents
const MODEL_MAP: Record<string, string> = {
  "gpt-4o":             "llama-3.3-70b-versatile",  // best quality, structured outputs
  "gpt-4o-mini":        "llama-3.1-8b-instant",      // fast, lightweight tasks
  "gpt-3.5-turbo":      "llama-3.1-8b-instant",
};

function resolveModel(model: string): string {
  return MODEL_MAP[model] ?? model;
}

// ─── LLM: structured JSON completion ─────────────────────────────────────────
export async function groqStructuredCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-4o"
): Promise<T> {
  const groq = getGroqClient();
  const resolvedModel = resolveModel(model);

  const response = await groq.chat.completions.create({
    model: resolvedModel,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty response");

  return JSON.parse(content) as T;
}

// ─── LLM: plain text completion ───────────────────────────────────────────────
export async function groqTextCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-4o-mini"
): Promise<string> {
  const groq = getGroqClient();
  const resolvedModel = resolveModel(model);

  const response = await groq.chat.completions.create({
    model: resolvedModel,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

// ─── Speech-to-text ───────────────────────────────────────────────────────────
export async function transcribeWithGroq(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<string> {
  const groq = getGroqClient();

  const ext = filename.split(".").pop() ?? "webm";
  const mimeTypes: Record<string, string> = {
    webm: "audio/webm", mp4: "audio/mp4", m4a: "audio/mp4",
    mp3: "audio/mpeg", wav: "audio/wav", ogg: "audio/ogg", flac: "audio/flac",
  };

  const file = await toFile(audioBuffer, filename, { type: mimeTypes[ext] ?? "audio/webm" });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    language: language ?? "en",
    response_format: "text",
  });

  const text = typeof transcription === "string"
    ? transcription
    : (transcription as { text?: string }).text ?? "";
  return text.trim();
}

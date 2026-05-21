/**
 * AI client — routes to Groq when GROQ_API_KEY is set, OpenAI otherwise.
 *
 * Groq handles: LLM completions (structured + text) + speech-to-text
 * OpenAI handles: embeddings only (Groq doesn't offer this)
 */

import OpenAI from "openai";
import {
  isGroqConfigured,
  groqStructuredCompletion,
  groqTextCompletion,
  transcribeWithGroq,
} from "@/lib/groq/client";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

// ─── Structured JSON completion ───────────────────────────────────────────────
export async function runStructuredCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-4o"
): Promise<T> {
  if (isGroqConfigured()) {
    return groqStructuredCompletion<T>(systemPrompt, userPrompt, model);
  }

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.2,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("OpenAI returned empty response");
  return JSON.parse(content) as T;
}

// ─── Plain text completion ────────────────────────────────────────────────────
export async function runTextCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-4o-mini"
): Promise<string> {
  if (isGroqConfigured()) {
    return groqTextCompletion(systemPrompt, userPrompt, model);
  }

  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.6,
  });

  return response.choices[0]?.message?.content?.trim() ?? "";
}

// ─── Speech-to-text ───────────────────────────────────────────────────────────
export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  if (isGroqConfigured()) {
    return transcribeWithGroq(audioBuffer, filename);
  }

  const openai = getOpenAIClient();
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: "audio/webm" });
  const transcription = await openai.audio.transcriptions.create({ file, model: "whisper-1" });
  return transcription.text;
}

// ─── Embeddings — OpenAI only (Groq doesn't offer this) ──────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

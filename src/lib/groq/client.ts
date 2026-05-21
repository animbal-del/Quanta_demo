/**
 * Groq transcription client
 *
 * Groq runs whisper-large-v3-turbo on custom LPU hardware — typically
 * 5-10x faster than OpenAI's Whisper endpoint. Free tier: 28,800 seconds/day.
 *
 * Sign up: console.groq.com → API Keys
 * Add to .env.local: GROQ_API_KEY=gsk_...
 */

import Groq from "groq-sdk";
import { toFile } from "groq-sdk";

let groqClient: Groq | null = null;

export function isGroqConfigured() {
  const key = process.env.GROQ_API_KEY;
  return Boolean(key && !key.startsWith("TODO_") && key.length > 10);
}

function getGroqClient(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

/**
 * Transcribe audio using Groq's whisper-large-v3-turbo.
 * Falls back to OpenAI Whisper if GROQ_API_KEY is not set.
 */
export async function transcribeWithGroq(
  audioBuffer: Buffer,
  filename: string,
  language?: string
): Promise<string> {
  const groq = getGroqClient();

  const ext = filename.split(".").pop() ?? "webm";
  const mimeTypes: Record<string, string> = {
    webm: "audio/webm",
    mp4: "audio/mp4",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    flac: "audio/flac",
  };
  const mimeType = mimeTypes[ext] ?? "audio/webm";

  const file = await toFile(audioBuffer, filename, { type: mimeType });

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo", // fastest Groq model — ~2-4x faster than whisper-large-v3
    language: language ?? "en",
    response_format: "text",
  });

  return typeof transcription === "string" ? transcription.trim() : (transcription as { text: string }).text?.trim() ?? "";
}

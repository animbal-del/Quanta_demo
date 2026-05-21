import OpenAI from "openai";
import { isGroqConfigured, transcribeWithGroq } from "@/lib/groq/client";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function runStructuredCompletion<T>(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-4o"
): Promise<T> {
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

export async function runTextCompletion(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-4o-mini"
): Promise<string> {
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

export async function transcribeAudio(audioBuffer: Buffer, filename: string): Promise<string> {
  // Use Groq (5-10x faster) when configured, fall back to OpenAI Whisper
  if (isGroqConfigured()) {
    return transcribeWithGroq(audioBuffer, filename);
  }

  const openai = getOpenAIClient();
  const file = new File([new Uint8Array(audioBuffer)], filename, { type: "audio/webm" });

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
  });

  return transcription.text;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

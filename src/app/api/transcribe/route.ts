export const dynamic = "force-dynamic";
/**
 * POST /api/transcribe
 *
 * Transcribes an audio blob with Whisper, then uses GPT-4o-mini to
 * produce a clean, polished version. Used for voice answers in the
 * question round and voice personal notes.
 *
 * Body: FormData { audio: File, context?: "answer" | "note" | "pitch" }
 * Returns: { transcript: string, polished: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio, runTextCompletion } from "@/lib/openai/client";

const POLISH_PROMPTS: Record<string, string> = {
  answer: `You clean up a voice transcript where a scout is answering a specific question about a startup they sourced.
Fix filler words (um, uh, like, you know), grammar errors, and run-on sentences.
Keep the meaning, facts, and numbers exactly the same.
Keep it concise — aim for 2-4 sentences.
Write in first person if the original is in first person.
Return ONLY the cleaned text. No preamble, no quotes.`,

  note: `You format a rough voice memo from a startup scout into a clean personal observation.
The scout is recording their gut-feel about a startup — their opinion, impression, or private context.
Fix grammar and filler words. Keep the tone personal and direct.
Keep all specific details, numbers, and names intact.
Write in first person. 2-5 sentences.
Return ONLY the formatted note. No preamble, no quotes.`,

  pitch: `You clean up a voice transcript where a scout is pitching a startup they discovered.
Fix filler words, grammar, and run-on sentences. Keep all facts, names, and numbers exactly as stated.
Keep the conversational tone — do not make it sound formal.
Return ONLY the cleaned text. No preamble, no quotes.`,

  rating: `You write a concise investment rationale from a scout's voice note about a startup.
The scout is explaining why they rated this startup the way they did.
Transform their raw thoughts into a structured, professional rationale.
Rules:
- Keep specific evidence, numbers, and observations from what they said
- Structure: what's compelling first, then risks or unknowns
- Remove filler words and rambling — keep only substance
- 3-5 sentences maximum
- Write in first person ("I think...", "The founders...")
Return ONLY the rationale text. No preamble, no quotes.`,
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;
  const context = (formData.get("context") as string | null) ?? "answer";

  if (!audioFile) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const arrayBuffer = await audioFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let transcript: string;
  try {
    transcript = await transcribeAudio(buffer, audioFile.name || "audio.webm");
  } catch (err) {
    return NextResponse.json({ error: `Transcription failed: ${err}` }, { status: 500 });
  }

  if (!transcript.trim()) {
    return NextResponse.json({ transcript: "", polished: "" });
  }

  // Polish with GPT-4o-mini
  const systemPrompt = POLISH_PROMPTS[context] ?? POLISH_PROMPTS.answer;
  const polished = await runTextCompletion(systemPrompt, transcript, "gpt-4o-mini");

  return NextResponse.json({ transcript: transcript.trim(), polished: polished.trim() });
}

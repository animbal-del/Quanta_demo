import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { transcribeAudio, runStructuredCompletion } from "@/lib/openai/client";
import {
  EXTRACTION_SYSTEM_PROMPT,
  buildExtractionUserPrompt,
} from "@/prompts/intake/extraction.prompt";
import {
  COMMITMENT_EXTRACTION_SYSTEM_PROMPT,
  buildCommitmentUserPrompt,
} from "@/prompts/intake/commitment-extraction.prompt";
import { AI_MODELS } from "@/constants";
import type { ExtractionOutput, CommitmentOutput } from "@/types";
import { isDemoMode } from "@/lib/demo/scout-os";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Demo mode — return realistic fixture data
  if (isDemoMode()) {
    return NextResponse.json({
      transcript: "I met Rohan at the Purdue hackathon. He's building FlowOps, AI agents for logistics dispatch. He mentioned he already has 3 pilot conversations with logistics operators. No deck yet but the product seemed solid.",
      extraction: {
        intent: "new_deal",
        startup_name: "FlowOps",
        founder_names: ["Rohan"],
        one_line_description: "AI agents for logistics dispatch automation",
        category: "AI / Logistics",
        source_context: "Purdue hackathon",
        traction_mentions: ["3 pilot conversations with logistics operators"],
        scout_conviction: "high",
        why_interesting: "Technical founder with early operator traction",
        missing_fields: ["pitch deck", "pilot customer names", "founder background"],
        confidence: 0.75,
        recommended_next_question: "Do you know when you can get the deck or a founder intro?",
      },
    });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;
  const scoutId = formData.get("scout_id") as string | null;

  if (!audioFile) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Convert File to Buffer for Whisper
  const arrayBuffer = await audioFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Transcribe with Whisper
  let transcript: string;
  try {
    transcript = await transcribeAudio(buffer, audioFile.name || "pitch.webm");
  } catch (err) {
    return NextResponse.json({ error: `Transcription failed: ${err}` }, { status: 500 });
  }

  // Upload audio to Supabase Storage
  const storagePath = `${params.id}/${Date.now()}_pitch.webm`;
  await db.storage.from("scout-audio").upload(storagePath, buffer, {
    contentType: audioFile.type || "audio/webm",
    upsert: true,
  });

  const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/scout-audio/${storagePath}`;

  // Save file record
  await db.from("deal_files").insert({
    deal_id: params.id,
    uploaded_by_scout_id: scoutId,
    file_name: "voice-pitch.webm",
    file_type: "audio/webm",
    storage_url: storageUrl,
    extracted_text: transcript,
  });

  // Run extraction + commitment detection in parallel
  const [extraction, commitment] = await Promise.all([
    runStructuredCompletion<ExtractionOutput>(
      EXTRACTION_SYSTEM_PROMPT,
      buildExtractionUserPrompt(transcript, null),
      AI_MODELS.extraction
    ),
    runStructuredCompletion<CommitmentOutput>(
      COMMITMENT_EXTRACTION_SYSTEM_PROMPT,
      buildCommitmentUserPrompt(transcript, today),
      AI_MODELS.commitment
    ),
  ]);

  // Update deal with extracted data
  await db.from("deals").update({
    startup_name: extraction.startup_name,
    one_line_description: extraction.one_line_description,
    category: extraction.category,
    scout_conviction: extraction.scout_conviction,
    source_context: extraction.source_context,
    ai_confidence: extraction.confidence,
    status: "draft",
  }).eq("id", params.id);

  // Save founder if found
  if (extraction.founder_names.length > 0) {
    await db.from("founders").insert(
      extraction.founder_names.map((name) => ({ deal_id: params.id, full_name: name }))
    );
  }

  // Save commitment as missing_info_task if found
  if (commitment.has_commitment && commitment.missing_item) {
    await db.from("missing_info_tasks").insert({
      deal_id: params.id,
      scout_id: scoutId,
      info_needed: commitment.missing_item,
      expected_date: commitment.expected_date,
      followup_date: commitment.followup_date,
      status: "pending",
    });
  }

  // Save AI output
  await db.from("ai_outputs").insert({
    deal_id: params.id,
    output_type: "extraction",
    model_name: AI_MODELS.extraction,
    input_snapshot: { transcript },
    output_json: extraction as unknown as Record<string, unknown>,
  });

  return NextResponse.json({ transcript, extraction });
}

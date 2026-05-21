import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  ENRICHMENT_SYSTEM_PROMPT,
  buildEnrichmentUserPrompt,
} from "@/prompts/enrichment/enrichment.prompt";
import { AI_MODELS } from "@/constants";
import { isDemoMode } from "@/lib/demo/scout-os";

interface FileBody {
  storage_url: string;
  file_name: string;
  file_type: string;
  scout_id?: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = (await req.json()) as FileBody;

  if (isDemoMode()) {
    return NextResponse.json({
      extraction: {
        startup_name: "FlowOps",
        founder_names: ["Rohan Mehta"],
        one_line_description: "AI agents for logistics dispatch automation",
        category: "AI / Logistics",
        traction_mentions: ["3 pilots with logistics operators"],
        scout_conviction: "high",
        missing_fields: ["pilot customer names", "revenue"],
        confidence: 0.82,
      },
    });
  }

  if (!body.storage_url) {
    return NextResponse.json({ error: "storage_url is required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Save file record immediately
  const { data: fileRecord } = await db.from("deal_files").insert({
    deal_id: params.id,
    uploaded_by_scout_id: body.scout_id,
    file_name: body.file_name,
    file_type: body.file_type,
    storage_url: body.storage_url,
  }).select("id").single();

  // For PDFs: extract text via a simple fetch and summarise with AI
  // In production this would use a PDF parsing service
  // For now we generate a summary from the file metadata and let AI enrich
  const enrichment = await runStructuredCompletion<{
    company_summary: string | null;
    founder_summary: string | null;
    market_category: string | null;
    traction_signals: string[];
    missing_diligence_questions: string[];
    confidence: number;
  }>(
    ENRICHMENT_SYSTEM_PROMPT,
    buildEnrichmentUserPrompt(
      "url",
      `File uploaded: ${body.file_name} (${body.file_type}). Storage URL: ${body.storage_url}. Extract what you can from the filename and context — the file is a pitch deck or document related to a startup.`,
      null
    ),
    AI_MODELS.enrichment
  );

  // Update file record with summary
  if (fileRecord) {
    await db.from("deal_files").update({ summary: enrichment.company_summary }).eq("id", fileRecord.id);
  }

  // Update deal with enriched data
  await db.from("deals").update({
    category: enrichment.market_category,
  }).eq("id", params.id);

  return NextResponse.json({
    extraction: {
      startup_name: null,
      founder_names: [],
      one_line_description: enrichment.company_summary,
      category: enrichment.market_category,
      traction_mentions: enrichment.traction_signals,
      scout_conviction: "unknown",
      missing_fields: enrichment.missing_diligence_questions,
      confidence: enrichment.confidence,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/client";
import { runStructuredCompletion } from "@/lib/openai/client";
import {
  ENRICHMENT_SYSTEM_PROMPT,
  buildEnrichmentUserPrompt,
} from "@/prompts/enrichment/enrichment.prompt";
import { AI_MODELS } from "@/constants";

interface FileBody {
  storage_url: string;
  file_name: string;
  file_type: string;
  scout_id?: string;
}

// Detect source type for the prompt
function detectSourceType(mimeType: string, fileName: string): "html" | "text" | "pdf" | "url" {
  if (mimeType.includes("html")) return "html";
  if (mimeType === "application/msword" || fileName.endsWith(".doc")) return "html"; // our .doc files are HTML exports
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("text") || mimeType.includes("csv")) return "text";
  return "text";
}

// Clean extracted text — remove binary garbage, excessive whitespace, CSS blobs
function cleanText(raw: string): string {
  return raw
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ") // control chars
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")           // strip CSS blocks
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")         // strip JS blocks
    .replace(/<[^>]+>/g, " ")                                   // strip HTML tags
    .replace(/&[a-z]+;/gi, " ")                                 // HTML entities
    .replace(/\s{3,}/g, "\n\n")                                 // collapse whitespace
    .trim();
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = (await req.json()) as FileBody;

  if (!body.storage_url) {
    return NextResponse.json({ error: "storage_url is required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // ── Step 1: Save file record ───────────────────────────────────────────────
  const { data: fileRecord } = await db.from("deal_files").insert({
    deal_id: params.id,
    uploaded_by_scout_id: body.scout_id ?? null,
    file_name: body.file_name,
    file_type: body.file_type,
    storage_url: body.storage_url,
  }).select("id").single();

  // ── Step 2: Download and extract actual file content ───────────────────────
  let fileContent = "";
  let sourceType: "html" | "text" | "pdf" | "url" = "text";

  try {
    // Parse bucket + path from storage URL
    // Format: ${SUPABASE_URL}/storage/v1/object/${bucket}/${path}
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const objectPrefix = `${supabaseUrl}/storage/v1/object/`;

    if (body.storage_url.startsWith(objectPrefix)) {
      const rest = body.storage_url.slice(objectPrefix.length);
      const slashIdx = rest.indexOf("/");
      const bucket = rest.slice(0, slashIdx);
      const filePath = rest.slice(slashIdx + 1);

      const { data: fileBlob, error: downloadError } = await db.storage
        .from(bucket)
        .download(filePath);

      if (!downloadError && fileBlob) {
        const rawText = await fileBlob.text();
        sourceType = detectSourceType(body.file_type, body.file_name ?? "");
        const cleaned = cleanText(rawText);

        if (cleaned.length > 50) {
          fileContent = cleaned;
          // Update file record with extracted text
          if (fileRecord) {
            await db.from("deal_files")
              .update({ extracted_text: cleaned.slice(0, 10000) })
              .eq("id", fileRecord.id);
          }
        }
      }
    }
  } catch (err) {
    console.error("[file/route] Content extraction failed:", err);
    // Fall through — enrichment will run with minimal context
  }

  // Fall back to filename context if extraction failed
  if (!fileContent) {
    fileContent = `Filename: ${body.file_name}\nFile type: ${body.file_type}\n(File content could not be read — using filename only)`;
    sourceType = "text";
  }

  // ── Step 3: Run AI enrichment on actual content ────────────────────────────
  // Get existing deal context for better merging
  const { data: deal } = await db.from("deals")
    .select("startup_name, one_line_description, category")
    .eq("id", params.id)
    .single();

  const existingContext = deal?.startup_name
    ? `${deal.startup_name}: ${deal.one_line_description ?? ""}`
    : null;

  const enrichment = await runStructuredCompletion<{
    startup_name: string | null;
    founder_names: string[];
    one_line_description: string | null;
    category: string | null;
    traction_signals: string[];
    fundraising: string | null;
    missing_diligence_questions: string[];
    confidence: number;
  }>(
    ENRICHMENT_SYSTEM_PROMPT,
    buildEnrichmentUserPrompt(sourceType, fileContent, existingContext),
    AI_MODELS.enrichment
  );

  // ── Step 4: Update deal + file records ────────────────────────────────────
  const dealUpdate: Record<string, string | null> = {};
  if (!deal?.startup_name && enrichment.startup_name) dealUpdate.startup_name = enrichment.startup_name;
  if (!deal?.one_line_description && enrichment.one_line_description) dealUpdate.one_line_description = enrichment.one_line_description;
  if (!deal?.category && enrichment.category) dealUpdate.category = enrichment.category;

  if (Object.keys(dealUpdate).length > 0) {
    await db.from("deals").update(dealUpdate).eq("id", params.id);
  }

  if (fileRecord && enrichment.one_line_description) {
    await db.from("deal_files")
      .update({ summary: enrichment.one_line_description })
      .eq("id", fileRecord.id);
  }

  // Save founders if found and not yet in DB
  if (enrichment.founder_names.length > 0) {
    const { data: existingFounders } = await db.from("founders").select("full_name").eq("deal_id", params.id);
    const existingNames = new Set((existingFounders ?? []).map((f) => f.full_name));
    const newFounders = enrichment.founder_names
      .filter((name) => !existingNames.has(name))
      .map((name) => ({ deal_id: params.id, full_name: name }));
    if (newFounders.length > 0) {
      await db.from("founders").insert(newFounders);
    }
  }

  // ── Step 5: Return extraction in the standard format ───────────────────────
  return NextResponse.json({
    extraction: {
      startup_name: enrichment.startup_name,
      founder_names: enrichment.founder_names,
      one_line_description: enrichment.one_line_description,
      category: enrichment.category,
      traction_mentions: enrichment.traction_signals,
      why_interesting: null,
      scout_conviction: "unknown",
      missing_fields: enrichment.missing_diligence_questions,
      confidence: enrichment.confidence,
    },
    fundraising: enrichment.fundraising,
    content_length: fileContent.length,
    source_type: sourceType,
  });
}

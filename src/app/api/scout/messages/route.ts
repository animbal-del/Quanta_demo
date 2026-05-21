import { NextRequest, NextResponse } from "next/server";
import { runScoutIntakeAgent } from "@/agents/intake";
import { isDemoMode, processDemoScoutMessage } from "@/lib/demo/scout-os";
import type { ProcessMessageRequest, ProcessMessageResponse } from "@/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ProcessMessageRequest;

  if (!body.scout_id || !body.body?.trim()) {
    return NextResponse.json({ error: "scout_id and body are required" }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json(processDemoScoutMessage(body));
  }

  const result = await runScoutIntakeAgent({
    scout_id: body.scout_id,
    channel: body.channel ?? "web",
    message_type: body.message_type ?? "text",
    body: body.body,
    deal_id: body.deal_id ?? null,
  });

  const response: ProcessMessageResponse = {
    deal: result.deal_id
      ? { id: result.deal_id, startup_name: result.startup_name, one_line_description: null }
      : null,
    ai_reply: result.ai_reply,
    missing_info: result.missing_info,
  };

  return NextResponse.json(response);
}

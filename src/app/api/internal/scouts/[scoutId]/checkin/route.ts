import { NextRequest, NextResponse } from "next/server";
import { runCheckinForScout } from "@/agents/checkin";

export async function POST(_req: NextRequest, { params }: { params: { scoutId: string } }) {
  try {
    const result = await runCheckinForScout(params.scoutId);
    return NextResponse.json({ sent: true, message: result.message });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

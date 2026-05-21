/**
 * OpenClaw Client
 *
 * Handles outbound messages from the Quanta backend to scouts via OpenClaw.
 * Inbound messages arrive at /api/openclaw/webhook — this file handles replies.
 */

import type { Channel } from "@/types";

const OPENCLAW_BASE_URL = process.env.OPENCLAW_BASE_URL ?? "http://localhost:3001";
const OPENCLAW_API_KEY = process.env.OPENCLAW_API_KEY ?? "";

export interface SendMessageParams {
  openclaw_user_id: string;
  channel: Channel;
  message: string;
}

export async function sendMessageViaOpenClaw(params: SendMessageParams): Promise<void> {
  const response = await fetch(`${OPENCLAW_BASE_URL}/api/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${OPENCLAW_API_KEY}`,
    },
    body: JSON.stringify({
      user_id: params.openclaw_user_id,
      channel: params.channel,
      text: params.message,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenClaw send failed: ${response.status} ${error}`);
  }
}

// During demo/development, log instead of sending
export async function sendMessageSimulated(params: SendMessageParams): Promise<void> {
  console.log(`[OpenClaw Simulated] → ${params.channel}:${params.openclaw_user_id}`);
  console.log(`Message: ${params.message}`);
}

export async function sendMessage(params: SendMessageParams): Promise<void> {
  if (process.env.OPENCLAW_SIMULATE === "true") {
    return sendMessageSimulated(params);
  }
  return sendMessageViaOpenClaw(params);
}

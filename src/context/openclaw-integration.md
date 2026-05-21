# OpenClaw Integration Reference

## What OpenClaw Is

OpenClaw is a self-hosted multi-channel messaging gateway. It connects channels (Telegram, WhatsApp, Slack, Signal, Discord, Google Chat) and routes messages to a single webhook endpoint.

In Quanta Scout OS, OpenClaw is the **scout-facing communication layer**. Scouts text OpenClaw. OpenClaw calls our backend. We reply. OpenClaw delivers the reply.

---

## How the Webhook Works

OpenClaw sends every inbound scout message to:

```
POST /api/openclaw/webhook
```

### Inbound payload shape
```json
{
  "channel": "telegram",
  "openclaw_user_id": "tg_123",
  "message_type": "text",
  "text": "Met a founder building AI agents for logistics",
  "attachments": [],
  "timestamp": "2026-05-20T18:00:00Z"
}
```

### Response shape (we return to OpenClaw)
```json
{
  "reply": "Got it. What made this founder stand out to you?",
  "agent": "ScoutIntakeAgent",
  "deal_id": "deal_123"
}
```

OpenClaw takes our `reply` string and delivers it to the scout on their channel.

---

## Sending Messages Proactively

For check-ins and follow-ups (outbound messages), we call the OpenClaw send API:

```
POST /api/openclaw/send   (via OpenClaw's internal API, not our route)
```

Payload:
```json
{
  "openclaw_user_id": "tg_123",
  "channel": "telegram",
  "message": "Seen any interesting founders this week?"
}
```

This is used by:
- Weekly Check-in Agent
- Follow-up Agent
- Partner Question Agent (after rewrite)

---

## Channel Support Notes

| Channel | Text | Voice/Audio | File Upload | Reactions |
|---|---|---|---|---|
| Telegram | ✅ | ✅ (voice notes) | ✅ | ✅ |
| WhatsApp | ✅ | ✅ | ✅ | limited |
| Slack | ✅ | ❌ | ✅ | ✅ |
| Web Chat | ✅ | ✅ (via browser) | ✅ | ❌ |

**Demo note:** For prototype stability, file/media upload is always available via the web chat interface even if OpenClaw channel support varies. Never depend on rich media working in every channel.

---

## Scout Identity Mapping

`openclaw_user_id` is the primary key for identity resolution.

| Channel | ID format |
|---|---|
| Telegram | `tg_{user_id}` |
| WhatsApp | `wa_{phone_number}` |
| Slack | `sl_{user_id}` |
| Web | `web_{session_id}` |

---

## Demo Setup (Telegram)

For the demo, Telegram is the primary live channel:

1. Create a Telegram bot via @BotFather → get bot token
2. Configure OpenClaw with the bot token
3. Scouts DM the bot
4. OpenClaw routes to `/api/openclaw/webhook`
5. Replies appear in Telegram

**Demo flow:** Scout DMs → OpenClaw → `/api/openclaw/webhook` → Agent → DB update → Dashboard

---

## Prototype vs Production

In the prototype, OpenClaw integration is implemented for Telegram.
In production, the same webhook handles all channels — no code changes needed.

The `channel` field in the payload tells the backend which channel the message came from,
which is used for logging and for sending replies back through the correct channel.

# Quanta Scout OS — Test Scripts

Manual and automated tests for the three submission flows.
All scripts run against your live local dev server (`localhost:3000`).

---

## Folder Structure

```
tests/
  scripts/
    test-voice-flow.js       ← simulates voice pitch → extraction → submit
    test-document-flow.js    ← uploads real document → enrichment → submit
    test-manual-flow.js      ← manual form → extraction → submit
    test-all.js              ← runs all three in sequence
  samples/
    documents/
      quantumsort-deck.txt   ← sample pitch deck for document flow test
      agripulse-brief.txt    ← shorter brief for a second test
    audio/
      agripulse-pitch.txt    ← full script to read for a 2-min voice pitch
      voice-test-guide.md    ← step-by-step guide for browser voice test
```

---

## Prerequisites

1. Dev server must be running: `npm run dev`
2. Supabase credentials set in `.env.local`
3. Node.js 18+ (uses native fetch)

---

## Run Scripts

```bash
# From project root:
node tests/scripts/test-voice-flow.js
node tests/scripts/test-document-flow.js
node tests/scripts/test-manual-flow.js

# Run all three:
node tests/scripts/test-all.js
```

---

## What Each Script Tests

### Voice Flow (`test-voice-flow.js`)
Simulates the pipeline after a voice recording is transcribed:
1. Creates a new draft deal in Supabase
2. Sends a realistic messy transcript to the extraction endpoint
3. Prints the structured extraction result (startup name, founder, signals)
4. Generates AI questions from the extraction
5. Saves mock answers
6. Submits the deal — deal appears in your `/deals` dashboard

**For real audio testing** — see `samples/audio/voice-test-guide.md`

### Document Flow (`test-document-flow.js`)
Full end-to-end document upload:
1. Creates a new draft deal
2. Gets a Supabase Storage presigned URL
3. Uploads `samples/documents/quantumsort-deck.txt` directly to Supabase Storage
4. Calls the enrichment endpoint with the storage URL
5. Prints the AI-extracted data
6. Generates questions and submits

### Manual Flow (`test-manual-flow.js`)
Simplest path — structured form data:
1. Creates a draft deal
2. Sends manual form fields (startup name, founder, description, traction)
3. Prints the extraction
4. Generates questions and submits

---

## Expected Output

Each script prints a step-by-step log:

```
[1/6] Creating draft deal...          ✅ deal_id: abc123
[2/6] Running extraction...            ✅ startup: QuantumSort
[3/6] Generating questions...          ✅ 3 questions generated
[4/6] Saving answers...                ✅ 3 answers saved
[5/6] Saving notes...                  ✅
[6/6] Submitting deal...               ✅ status: submitted

─────────────────────────────────────
Deal submitted: QuantumSort
View at: http://localhost:3000/deals/abc123
─────────────────────────────────────
```

After each script, open `http://localhost:3000/deals` to see the new deal.

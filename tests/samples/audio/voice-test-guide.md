# Voice Pitch — Browser Test Guide

This guide walks through testing the real voice recording flow in the browser.
The test script (`test-voice-flow.js`) simulates the extraction pipeline.
This guide is for testing the actual recording UX end-to-end.

---

## What to Test

1. **Microphone access** — does the browser ask for permission and get it?
2. **Recording UI** — does the button turn red, timer count down?
3. **Indicator ticking** — do the topic checkboxes tick as you speak?
4. **AI extraction** — does the extracted data match what you said?
5. **Question round** — are the generated questions relevant to your pitch?
6. **Submit** — does the deal appear in the Quanta dashboard?

---

## Steps

### 1. Open the Voice Pitch Studio
```
http://localhost:3000/add-startup
```
- Select **Voice Pitch** (should be selected by default)
- Click **Continue**

### 2. Start Recording
- Click the **microphone button** (turns red)
- Timer starts counting down from 2:00
- Speak the pitch from `agripulse-pitch.txt` (or any startup)

### 3. Watch the Indicators
Four topic indicators appear: **Problem · Product · Why interesting · Traction**

These tick as you cover each topic. Currently they tick at fixed time intervals
(visual simulation). Phase 9 will make them tick from real-time AI.

### 4. Stop and Process
- Click the **stop button** (or let the timer hit 0:00)
- Click **Continue**
- A processing spinner appears: "Transcribing your pitch…"
- Whisper transcribes your audio → GPT-4o extracts structured data
- Takes about 10-15 seconds

### 5. Review Extraction (Step 3)
You should see the AI-filled form:
- Startup name (may need correction)
- Founder name
- What it does
- Why interesting
- Traction signals
- Missing fields (amber tags)

Edit anything that's wrong, then click **Continue**.

### 6. Question Round (Step 4)
3-5 AI-generated questions appear based on what was unclear in the extraction.
For the AgriPulse pitch, expect questions like:
- "What's Rahul's farming background specifically?"
- "Are the 247 farms paying customers or pilot partners?"
- "What is the government MOU scope — distribution only or also funding?"

Type answers or click **Skip this question**.

### 7. Notes and Submit
- Add a personal note (Step 5) — optional
- Click **Submit to Quanta** (Step 6)

### 8. Verify in Dashboard
```
http://localhost:3000/deals
```
The new deal should appear with status "Submitted".
Click it to see the AI brief and signal cards generated in the background.

---

## Troubleshooting

**Microphone permission denied:**
→ Click the camera/lock icon in Chrome's address bar → Allow microphone

**"Transcription failed" error:**
→ Check that `OPENAI_API_KEY` is set in `.env.local`
→ Confirm Whisper is accessible: `curl https://api.openai.com/v1/models -H "Authorization: Bearer $OPENAI_API_KEY"`

**Processing hangs:**
→ The audio file might be too large. Try a shorter recording (30-60 seconds) for the test.
→ Check the dev server console for error messages.

**Extraction is completely wrong:**
→ Speak more slowly and clearly. Whisper performs best with clear diction.
→ Try the manual flow instead and compare the extraction quality.

---

## Upload a Pre-Recorded File (Alternative)

If you want to use a pre-recorded audio file instead of live recording:

1. On Step 2 (Voice Pitch Studio), scroll down to "Already have a recording?"
2. Click **Upload audio file**
3. Select a `.wav`, `.mp3`, `.m4a`, or `.webm` file
4. Click **Continue** — the rest of the flow is the same

For a test recording, use any voice memo app on your phone:
- Read the `agripulse-pitch.txt` script
- Transfer the file to your laptop
- Upload it in the browser

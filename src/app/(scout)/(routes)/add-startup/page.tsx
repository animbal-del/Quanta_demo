"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, FileUp, Mic,
  PencilLine, Send, Square, Loader2, AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = "voice" | "manual" | "document";
type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface Extraction {
  startup_name?: string | null;
  founder_names?: string[];
  one_line_description?: string | null;
  category?: string | null;
  traction_mentions?: string[];
  scout_conviction?: string;
  why_interesting?: string | null;
  missing_fields?: string[];
  confidence?: number;
}

interface Answer { question: string; text: string; type: "text" | "skipped" }

// ─── Constants ───────────────────────────────────────────────────────────────
const MODE_OPTIONS = [
  { id: "voice" as const, label: "Voice Pitch", icon: Mic, desc: "Record a 2-minute elevator pitch" },
  { id: "manual" as const, label: "Manual Entry", icon: PencilLine, desc: "Type startup details directly" },
  { id: "document" as const, label: "Upload Document", icon: FileUp, desc: "Deck, PDF, or screenshot" },
];

const INDICATORS = ["Problem", "Product", "Why interesting", "Traction"];
const DEMO_SCOUT_ID = "11111111-1111-1111-1111-111111111111";

function getScoutId() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("quanta_scout_id") ?? DEMO_SCOUT_ID;
  }
  return DEMO_SCOUT_ID;
}

// ─── Processing overlay ───────────────────────────────────────────────────────
function Processing({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Loader2 size={32} className="text-indigo-600 animate-spin mb-4" />
      <p className="text-sm font-medium text-gray-900">{message}</p>
      <p className="text-xs text-gray-400 mt-1">This takes about 10 seconds</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AddStartupPage() {
  const [mode, setMode] = useState<Mode>("voice");
  const [step, setStep] = useState<Step>(1);
  const [dealId, setDealId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState("");
  const [error, setError] = useState("");
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [noteText, setNoteText] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [tickedIndicators, setTickedIndicators] = useState<Set<number>>(new Set());
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual form
  const [manual, setManual] = useState({
    startup_name: "", founder_name: "", what_it_does: "", why_interesting: "", traction: "",
  });

  const stepTitle = useMemo(() => {
    const titles: Record<Step, string> = {
      1: "Add Startup", 2: mode === "voice" ? "Voice Pitch" : mode === "manual" ? "Manual Entry" : "Upload Document",
      3: "Review Submission", 4: "Add Context", 5: "Your Notes", 6: "Ready to Submit",
    };
    return titles[step];
  }, [mode, step]);

  // ── Init deal on step 1 → 2 transition ────────────────────────────────────
  async function initDeal() {
    const res = await fetch("/api/startup/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scout_id: getScoutId(), mode }),
    });
    const data = await res.json();
    setDealId(data.deal_id);
    return data.deal_id as string;
  }

  // ── Voice recording ────────────────────────────────────────────────────────
  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };

      mr.start(1000); // collect in 1s chunks
      setRecording(true);
      setTimeLeft(120);

      // Countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { stopRecording(); return 0; }
          // Simulate real-time indicator ticking (visual only — Phase 9 does real AI)
          if (t === 90) setTickedIndicators(new Set([0]));
          if (t === 60) setTickedIndicators(new Set([0, 1]));
          if (t === 30) setTickedIndicators(new Set([0, 1, 2]));
          return t - 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access denied. Please allow microphone access and try again.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Process audio → extraction ─────────────────────────────────────────────
  async function processAudio(id: string) {
    if (!recordedBlob) return;
    setProcessing(true);
    setProcessingMsg("Transcribing your pitch…");

    const formData = new FormData();
    formData.append("audio", recordedBlob, "pitch.webm");
    formData.append("scout_id", getScoutId());

    try {
      const res = await fetch(`/api/startup/${id}/audio`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExtraction(data.extraction);
      await fetchQuestions(id, data.extraction);
    } catch (e) {
      setError(`Processing failed: ${e}`);
    } finally {
      setProcessing(false);
    }
  }

  // ── Process manual form ────────────────────────────────────────────────────
  async function processManual(id: string) {
    setProcessing(true);
    setProcessingMsg("Saving your entry…");
    try {
      const res = await fetch(`/api/startup/${id}/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...manual, scout_id: getScoutId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExtraction(data.extraction);
      await fetchQuestions(id, data.extraction);
    } catch (e) {
      setError(`Save failed: ${e}`);
    } finally {
      setProcessing(false);
    }
  }

  // ── Process document upload ────────────────────────────────────────────────
  async function processDocument(id: string) {
    if (!uploadedFile) return;
    setProcessing(true);
    setProcessingMsg("Uploading document…");

    try {
      // Get presigned URL
      const presignRes = await fetch(
        `/api/upload/presign?bucket=deal-files&filename=${encodeURIComponent(uploadedFile.name)}&deal_id=${id}`
      );
      const { signed_url, storage_url } = await presignRes.json();

      // Upload directly to Supabase Storage
      setProcessingMsg("Extracting content from document…");
      await fetch(signed_url, {
        method: "PUT",
        body: uploadedFile,
        headers: { "Content-Type": uploadedFile.type },
      });

      // Tell API to process the file
      const res = await fetch(`/api/startup/${id}/file`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storage_url, file_name: uploadedFile.name, file_type: uploadedFile.type, scout_id: getScoutId() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExtraction(data.extraction);
      await fetchQuestions(id, data.extraction);
    } catch (e) {
      setError(`Upload failed: ${e}`);
    } finally {
      setProcessing(false);
    }
  }

  // ── Fetch AI-generated questions ───────────────────────────────────────────
  async function fetchQuestions(id: string, ext: Extraction) {
    try {
      const res = await fetch(`/api/startup/${id}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extraction: ext }),
      });
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setAnswers((data.questions ?? []).map((q: string) => ({ question: q, text: "", type: "text" as const })));
    } catch { /* questions optional */ }
  }

  // ── Navigation: Continue button ────────────────────────────────────────────
  async function handleContinue() {
    setError("");

    // Step 1 → 2: init deal
    if (step === 1) {
      const id = await initDeal();
      setDealId(id);
      setStep(2);
      return;
    }

    // Step 2 → 3: process submission based on mode
    if (step === 2) {
      const id = dealId!;
      if (mode === "voice") {
        if (!recordedBlob) { setError("Please record your pitch first."); return; }
        await processAudio(id);
      } else if (mode === "manual") {
        if (!manual.startup_name && !manual.what_it_does) { setError("Please fill in at least the startup name or description."); return; }
        await processManual(id);
      } else {
        if (!uploadedFile) { setError("Please upload a file first."); return; }
        await processDocument(id);
      }
      setStep(3);
      return;
    }

    // Step 4 → 5: save answers
    if (step === 4 && dealId && answers.length > 0) {
      await fetch(`/api/startup/${dealId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answers.map((a) => ({ question: a.question, answer_text: a.text, answer_type: a.text ? "text" : "skipped" })), scout_id: getScoutId() }),
      });
    }

    // Step 5 → 6: save note
    if (step === 5 && dealId && noteText.trim()) {
      await fetch(`/api/startup/${dealId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note_text: noteText, note_type: "text", scout_id: getScoutId() }),
      });
    }

    setStep((s) => Math.min(6, s + 1) as Step);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (!dealId) return;
    setProcessing(true);
    setProcessingMsg("Submitting to Quanta…");
    try {
      await fetch(`/api/startup/${dealId}/submit`, { method: "POST" });
      setStep(6);
    } finally {
      setProcessing(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      {/* Header */}
      <header className="flex h-14 items-center gap-3 border-b border-gray-200 px-4 sticky top-0 bg-white z-10">
        <Link href="/scout" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-base font-semibold text-gray-950">{stepTitle}</h1>
          <p className="text-xs text-gray-400">Step {step} of 6</p>
        </div>
      </header>

      <div className="px-4 py-5">
        {/* Progress bar */}
        <div className="mb-6 flex gap-1">
          {([1, 2, 3, 4, 5, 6] as Step[]).map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-indigo-600" : "bg-gray-100"}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={14} className="shrink-0" /> {error}
          </div>
        )}

        {/* ── Step 1: Mode selection ── */}
        {step === 1 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-950">How do you want to submit?</h2>
            <div className="space-y-3">
              {MODE_OPTIONS.map(({ id, label, icon: Icon, desc }) => {
                const selected = mode === id;
                return (
                  <button key={id} onClick={() => setMode(id)}
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${selected ? "border-indigo-300 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                      <Icon size={18} />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{label}</span>
                      <span className="block text-xs text-gray-500 mt-0.5">{desc}</span>
                    </span>
                    {selected && <Check size={16} className="text-indigo-600 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Step 2A: Voice pitch ── */}
        {step === 2 && mode === "voice" && !processing && (
          <section className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-600 mb-1">You have <span className="font-semibold text-gray-900">2 minutes.</span></p>
              <p className="text-xs text-gray-400 mb-6">Cover the problem, product, why it's interesting, and traction.</p>

              <button
                onClick={recording ? stopRecording : startRecording}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-all ${recording ? "bg-red-500 text-white scale-110 shadow-lg" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
              >
                {recording ? <Square size={24} /> : <Mic size={28} />}
              </button>

              <p className={`mt-4 text-2xl font-bold tabular-nums ${timeLeft < 30 && recording ? "text-red-500" : "text-gray-950"}`}>
                {formatTime(timeLeft)} <span className="text-sm font-normal text-gray-400">/ 02:00</span>
              </p>

              {recording && <p className="mt-2 text-xs text-gray-500 animate-pulse">Recording…</p>}
              {recordedBlob && !recording && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-full">
                  <Check size={11} /> Pitch recorded — click Continue to process
                </div>
              )}
            </div>

            {/* Real-time indicators */}
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Topics covered</p>
              <div className="grid grid-cols-2 gap-2">
                {INDICATORS.map((item, i) => {
                  const ticked = tickedIndicators.has(i);
                  return (
                    <div key={item} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all ${ticked ? "bg-emerald-50 text-emerald-800" : "bg-gray-50 text-gray-500"}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-all ${ticked ? "bg-emerald-500 text-white" : "bg-gray-200"}`}>
                        {ticked && <Check size={9} />}
                      </span>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* File upload fallback */}
            <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
              <p className="text-xs text-gray-400 mb-2">Already have a recording?</p>
              <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-700">
                Upload audio file
                <input type="file" accept="audio/*" className="hidden" onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setRecordedBlob(f);
                }} />
              </label>
            </div>
          </section>
        )}

        {/* ── Step 2B: Manual entry ── */}
        {step === 2 && mode === "manual" && !processing && (
          <section className="space-y-4">
            {[
              { key: "startup_name", label: "Startup name", placeholder: "FlowOps" },
              { key: "founder_name", label: "Founder name", placeholder: "Rohan Mehta" },
              { key: "what_it_does", label: "What are they building?", placeholder: "AI agents for logistics dispatch teams…" },
              { key: "why_interesting", label: "Why is it interesting?", placeholder: "Very technical founder, early pilot conversations…" },
              { key: "traction", label: "Any traction or signals?", placeholder: "3 pilot conversations with logistics operators" },
            ].map(({ key, label, placeholder }) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>
                <textarea
                  value={manual[key as keyof typeof manual]}
                  onChange={(e) => setManual({ ...manual, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="h-16 w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-indigo-400"
                />
              </label>
            ))}
          </section>
        )}

        {/* ── Step 2C: Document upload ── */}
        {step === 2 && mode === "document" && !processing && (
          <section>
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-10 text-center cursor-pointer hover:border-indigo-300 transition-colors">
              <FileUp size={28} className="text-indigo-600 mb-3" />
              {uploadedFile ? (
                <>
                  <p className="text-sm font-semibold text-gray-900">{uploadedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-950">Upload a deck, PDF, or screenshot</p>
                  <p className="text-xs text-gray-400 mt-1">Up to 25 MB</p>
                  <span className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Choose file</span>
                </>
              )}
              <input type="file" accept=".pdf,.pptx,.ppt,.docx,.doc,image/*" className="hidden"
                onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)} />
            </label>
          </section>
        )}

        {/* ── Processing overlay ── */}
        {processing && <Processing message={processingMsg} />}

        {/* ── Step 3: AI review ── */}
        {step === 3 && !processing && (
          <section>
            <p className="text-xs text-gray-400 mb-4">AI extracted the following. Edit anything that's wrong.</p>
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              {[
                { label: "Startup", value: extraction?.startup_name ?? "—" },
                { label: "Founder", value: extraction?.founder_names?.join(", ") ?? "—" },
                { label: "What it does", value: extraction?.one_line_description ?? "—" },
                { label: "Why interesting", value: extraction?.why_interesting ?? "—" },
                { label: "Traction", value: extraction?.traction_mentions?.join(", ") ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-4 border-b border-gray-100 pb-2.5 last:border-0 last:pb-0">
                  <span className="text-xs text-gray-400 shrink-0 w-24">{label}</span>
                  <span className="text-sm font-medium text-gray-900 text-right">{value}</span>
                </div>
              ))}
            </div>
            {(extraction?.missing_fields?.length ?? 0) > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-amber-700 mb-2">Missing</p>
                <div className="flex flex-wrap gap-1.5">
                  {extraction?.missing_fields?.map((f) => (
                    <span key={f} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">{f}</span>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-3 text-xs text-gray-400">
              AI confidence: {extraction?.confidence ? `${Math.round(extraction.confidence * 100)}%` : "—"}
            </p>
          </section>
        )}

        {/* ── Step 4: Question round ── */}
        {step === 4 && !processing && (
          <section>
            <p className="text-sm text-gray-500 mb-4">A few quick questions to give Quanta better context.</p>
            <div className="space-y-4">
              {questions.length > 0 ? questions.map((q, i) => (
                <div key={i} className="rounded-xl border border-gray-200 p-4">
                  <p className="text-sm text-gray-800 mb-3">{i + 1}. {q}</p>
                  <textarea
                    value={answers[i]?.text ?? ""}
                    onChange={(e) => setAnswers((prev) => prev.map((a, j) => j === i ? { ...a, text: e.target.value } : a))}
                    placeholder="Type your answer…"
                    className="w-full h-14 resize-none rounded-lg border border-gray-200 p-2.5 text-sm outline-none focus:border-indigo-400"
                  />
                  <button
                    onClick={() => setAnswers((prev) => prev.map((a, j) => j === i ? { ...a, text: "", type: "skipped" } : a))}
                    className="mt-1.5 text-xs text-gray-400 hover:text-gray-600"
                  >
                    Skip this question
                  </button>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-400 text-sm">No questions — submission looks complete.</div>
              )}
            </div>
          </section>
        )}

        {/* ── Step 5: Scout notes ── */}
        {step === 5 && !processing && (
          <section>
            <h2 className="text-lg font-semibold text-gray-950 mb-1">Your personal notes</h2>
            <p className="text-sm text-gray-500 mb-5">Optional gut-feel or context you want Quanta to know. Private to you.</p>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Something felt off about the market size claim, but the founder energy was exceptional…"
              className="w-full h-32 resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none focus:border-indigo-400"
            />
          </section>
        )}

        {/* ── Step 6: Done ── */}
        {step === 6 && (
          <section className="rounded-xl border border-gray-200 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check size={26} />
            </div>
            <h2 className="text-xl font-semibold text-gray-950">Submitted to Quanta</h2>
            <p className="mt-2 text-sm text-gray-500">
              {extraction?.startup_name ?? "Your startup"} is now in the Quanta review queue. We'll reach out if we have questions.
            </p>
            <Link
              href="/scout"
              className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Back to Home
            </Link>
            <Link href="/add-startup" className="mt-3 block text-sm text-indigo-600 hover:text-indigo-700">
              Submit another startup →
            </Link>
          </section>
        )}

        {/* ── Navigation buttons ── */}
        {step < 6 && !processing && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1) as Step)}
              disabled={step === 1}
              className="h-11 flex-1 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            {step === 5 ? (
              <button
                onClick={handleSubmit}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                <Send size={14} /> Submit to Quanta
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Continue <ArrowRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

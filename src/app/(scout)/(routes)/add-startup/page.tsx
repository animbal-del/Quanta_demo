"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, FileUp, Mic, PencilLine,
  Send, Square, Loader2, AlertCircle, StopCircle, Edit3,
  RefreshCw, CheckCircle2, BookmarkCheck, Paperclip, X,
} from "lucide-react";
import { FIXED_QUESTIONS, RATING_OPTIONS } from "@/prompts/intake/question-generation.prompt";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "voice" | "manual" | "document";
type Step = 1 | 2 | 3 | 4 | 5 | 6;
type FixedQuestion = typeof FIXED_QUESTIONS[number];

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

const INDICATORS = ["Problem", "Product", "Why interesting", "Traction"];
const MODE_OPTIONS = [
  { id: "voice" as const, label: "Voice Pitch", icon: Mic, desc: "Record a 2-minute elevator pitch" },
  { id: "manual" as const, label: "Manual Entry", icon: PencilLine, desc: "Type startup details directly" },
  { id: "document" as const, label: "Upload Document", icon: FileUp, desc: "Deck, PDF, or screenshot" },
];

// Returns scout_id from localStorage (set at login), or null.
// The init API validates this against the DB and falls back to null if not found.
function getScoutId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("quanta_scout_id") ?? null;
}

// ─── Multi-step processing indicator ─────────────────────────────────────────
const PROCESSING_STEPS = [
  { id: "upload",     label: "Uploading audio",             duration: 3000  },
  { id: "transcribe", label: "Transcribing with Whisper AI", duration: 14000 },
  { id: "extract",    label: "Extracting startup signals",   duration: 6000  },
];

function ProcessingSteps({ active }: { active: boolean }) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!active) { setCurrentStep(0); return; }
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    PROCESSING_STEPS.slice(1).forEach((s, i) => {
      elapsed += PROCESSING_STEPS[i].duration;
      timers.push(setTimeout(() => setCurrentStep(i + 1), elapsed));
    });
    return () => timers.forEach(clearTimeout);
  }, [active]);

  if (!active) return null;

  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-full max-w-xs space-y-3 text-left">
        {PROCESSING_STEPS.map((s, i) => {
          const done = i < currentStep;
          const running = i === currentStep;
          return (
            <div key={s.id} className={`flex items-center gap-3 transition-opacity ${i > currentStep ? "opacity-30" : "opacity-100"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                done ? "bg-emerald-500" : running ? "bg-gray-950" : "bg-gray-200"
              }`}>
                {done
                  ? <Check size={12} className="text-white" />
                  : running
                  ? <Loader2 size={12} className="text-white animate-spin" />
                  : <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                }
              </div>
              <span className={`text-sm ${running ? "font-medium text-gray-950" : done ? "text-gray-400 line-through" : "text-gray-400"}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-6">This takes 15–25 seconds</p>
    </div>
  );
}

// ─── Mini voice recorder (for answers + notes) ────────────────────────────────
interface VoiceRecorderProps {
  context: "answer" | "note";
  placeholder?: string;
  onResult: (transcript: string, polished: string) => void;
}

function VoiceRecorder({ context, placeholder, onResult }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(context === "answer" ? 30 : 60);
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxTime = context === "answer" ? 30 : 60;

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        processRecording(new Blob(chunksRef.current, { type: mimeType }));
      };
      mr.start(500);
      setRecording(true);
      setTimeLeft(maxTime);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { stop(); return 0; }
          return t - 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access denied. Please allow it in browser settings.");
    }
  }

  function stop() {
    if (timerRef.current) clearInterval(timerRef.current);
    mrRef.current?.stop();
    setRecording(false);
  }

  async function processRecording(blob: Blob) {
    setProcessing(true);
    const formData = new FormData();
    formData.append("audio", blob, "recording.webm");
    formData.append("context", context);
    const res = await fetch("/api/transcribe", { method: "POST", body: formData });
    const data = await res.json();
    setProcessing(false);
    onResult(data.transcript ?? "", data.polished ?? "");
  }

  const formatTime = (s: number) => `0:${String(s).padStart(2, "0")}`;

  if (processing) return (
    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
      <Loader2 size={13} className="animate-spin" />
      Transcribing…
    </div>
  );

  if (recording) return (
    <div className="flex items-center gap-3 py-2">
      <button onClick={stop} className="flex items-center gap-1.5 h-8 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors">
        <StopCircle size={12} /> Stop
      </button>
      <span className="text-xs text-red-500 font-medium animate-pulse">● {formatTime(timeLeft)}</span>
    </div>
  );

  return (
    <button onClick={start} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-colors">
      <Mic size={12} /> {placeholder ?? "Record voice answer"}
    </button>
  );
}

// ─── Single question with voice + text + AI polish ────────────────────────────
interface QuestionCardProps {
  index: number;
  question: string;
  category?: string;
  value: string;
  onChange: (text: string, type?: "text" | "skipped") => void;
}

function QuestionCard({ index, question, category, value, onChange }: QuestionCardProps) {
  const [mode, setMode] = useState<"idle" | "typing" | "review">(value ? "review" : "idle");
  const [transcript, setTranscript] = useState("");
  const [polished, setPolished] = useState("");
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(value);

  function handleVoiceResult(raw: string, clean: string) {
    setTranscript(raw);
    setPolished(clean);
    setEditDraft(clean);
    onChange(clean, "text");
    setMode("review");
  }

  function useVersion(text: string) {
    onChange(text, "text");
    setEditDraft(text);
    setEditing(false);
  }

  function saveEdit() {
    onChange(editDraft, "text");
    setEditing(false);
    setMode("review");
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4">
      {category && (
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{category}</p>
      )}
      <p className="text-sm text-gray-800 mb-3 font-medium">
        {index >= 0 ? `${index + 1}. ` : ""}{question}
      </p>

      {mode === "idle" && (
        <div className="flex items-center gap-2 flex-wrap">
          <VoiceRecorder context="answer" placeholder="Record answer" onResult={handleVoiceResult} />
          <button onClick={() => setMode("typing")}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 transition-colors">
            <PencilLine size={12} /> Type answer
          </button>
          <button onClick={() => { onChange("", "skipped"); setMode("review"); }}
            className="text-xs text-gray-400 hover:text-gray-600">
            Skip
          </button>
        </div>
      )}

      {mode === "typing" && (
        <div className="space-y-2">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            placeholder="Type your answer here…"
            className="w-full h-20 resize-none border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <button onClick={saveEdit}
              className="h-8 px-3 bg-gray-950 text-white text-xs font-medium rounded-lg hover:bg-gray-800">
              Save
            </button>
            <button onClick={() => setMode("idle")} className="h-8 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {mode === "review" && !editing && (
        <div>
          {/* Show both versions if voice was used */}
          {transcript && polished && transcript !== polished && (
            <div className="mb-3 space-y-2">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={10} /> AI polished
                  </span>
                  <button onClick={() => useVersion(polished)} className="text-xs text-indigo-600 hover:underline">Use this</button>
                </div>
                <p className="text-xs text-gray-700">{polished}</p>
              </div>
              <div className="bg-gray-50/50 rounded-lg p-3 opacity-60">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Raw transcript</span>
                  <button onClick={() => useVersion(transcript)} className="text-xs text-gray-400 hover:underline">Use this</button>
                </div>
                <p className="text-xs text-gray-500">{transcript}</p>
              </div>
            </div>
          )}

          {/* Current answer */}
          {value && value !== "" && (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-700 flex-1">{value}</p>
              <button onClick={() => { setEditing(true); setEditDraft(value); }}
                className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors p-1">
                <Edit3 size={13} />
              </button>
            </div>
          )}

          {value === "" && (
            <p className="text-xs text-gray-400 italic">Skipped</p>
          )}

          <button onClick={() => { setMode("idle"); setTranscript(""); setPolished(""); }}
            className="mt-2 flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
            <RefreshCw size={10} /> Re-record
          </button>
        </div>
      )}

      {mode === "review" && editing && (
        <div className="space-y-2">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            className="w-full h-20 resize-none border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-gray-400"
          />
          <div className="flex gap-2">
            <button onClick={saveEdit}
              className="h-8 px-3 bg-gray-950 text-white text-xs font-medium rounded-lg hover:bg-gray-800">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="h-8 px-3 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Editable field for Step 3 review ────────────────────────────────────────
function EditableField({ label, value, onSave, multiline = false }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function save() { onSave(draft); setEditing(false); }
  function cancel() { setDraft(value); setEditing(false); }

  if (editing) return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {multiline
        ? <textarea value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
            className="w-full h-20 text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-gray-400" />
        : <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus
            className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-400" />
      }
      <div className="flex gap-2 mt-1.5">
        <button onClick={save} className="h-7 px-3 bg-gray-950 text-white text-xs font-medium rounded-md">Save</button>
        <button onClick={cancel} className="h-7 px-3 text-xs text-gray-500 border border-gray-200 rounded-md">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2.5 last:border-0 last:pb-0 group cursor-pointer"
      onClick={() => { setDraft(value); setEditing(true); }}>
      <span className="text-xs text-gray-400 shrink-0 w-28">{label}</span>
      <div className="flex items-start gap-1.5 flex-1">
        <span className="text-sm font-medium text-gray-900 flex-1 text-right">{value || <span className="text-gray-300 italic">tap to add</span>}</span>
        <Edit3 size={11} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AddStartupPage() {
  const [mode, setMode] = useState<Mode>("voice");
  const [step, setStep] = useState<Step>(1);
  const [dealId, setDealId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Questions — fixed (structured) + AI-generated (gaps)
  const [fixedAnswers, setFixedAnswers] = useState<Record<string, string>>({});
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiAnswers, setAiAnswers] = useState<{ question: string; text: string }[]>([]);

  // Step 3 — additional file attachments
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; storage_url: string; file_type: string }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Step 5 — investment assessment
  const [investmentRating, setInvestmentRating] = useState<number>(0);
  const [ratingReason, setRatingReason] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  // Step 3 — doc update notification
  const [docUpdateBanner, setDocUpdateBanner] = useState("");

  // Voice pitch recording
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [tickedIndicators, setTickedIndicators] = useState<Set<number>>(new Set());
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual form
  const [manual, setManual] = useState({
    startup_name: "", founder_name: "", what_it_does: "", why_interesting: "", traction: "",
  });

  // Notes
  const [noteText, setNoteText] = useState("");
  const [notePolished, setNotePolished] = useState("");
  const [noteRaw, setNoteRaw] = useState("");
  const [showNoteVersions, setShowNoteVersions] = useState(false);

  // Draft save state
  const [draftSaved, setDraftSaved] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Button loading (step 1 initDeal and step 4/5 save)
  const [navigating, setNavigating] = useState(false);

  // Editable review fields (Step 3)
  const [reviewFields, setReviewFields] = useState({
    startup_name: "", founder_name: "", one_line_description: "", why_interesting: "", traction: "",
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Voice pitch recording ───────────────────────────────────────────────────
  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType });
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        setRecordedBlob(new Blob(chunksRef.current, { type: mimeType }));
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      mr.start(1000);
      setRecording(true);
      setTimeLeft(120);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { stopRecording(); return 0; }
          if (t === 90) setTickedIndicators(new Set([0]));
          if (t === 60) setTickedIndicators(new Set([0, 1]));
          if (t === 30) setTickedIndicators(new Set([0, 1, 2]));
          return t - 1;
        });
      }, 1000);
    } catch {
      setError("Microphone access denied. Allow it in browser settings and try again.");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    mrRef.current?.stop();
    setRecording(false);
  }

  // ── API helpers ────────────────────────────────────────────────────────────
  async function post(path: string, body: Record<string, unknown>) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  }

  async function initDeal() {
    const { deal_id } = await post("/api/startup/init", { scout_id: getScoutId(), mode });
    setDealId(deal_id);
    return deal_id as string;
  }

  async function saveDraft() {
    setSavingDraft(true);
    setError("");
    try {
      // Create deal first if we don't have one yet
      const id = dealId ?? await initDeal();

      await fetch(`/api/startup/${id}/save-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startup_name: reviewFields.startup_name || manual.startup_name || null,
          one_line_description: reviewFields.one_line_description || manual.what_it_does || null,
          founder_name: reviewFields.founder_name || manual.founder_name || null,
          why_interesting: reviewFields.why_interesting || manual.why_interesting || null,
          traction: reviewFields.traction || manual.traction || null,
          scout_conviction: extraction?.scout_conviction ?? null,
        }),
      });

      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000); // reset after 3s
    } catch (e) {
      setError(`Draft save failed: ${e}`);
    } finally {
      setSavingDraft(false);
    }
  }

  async function fetchQuestions(id: string, ext: Extraction) {
    try {
      const res = await post(`/api/startup/${id}/questions`, { extraction: ext });
      // AI questions are gap-fillers (fixed questions are always shown from the prompt)
      const aiQs: string[] = res.ai_questions ?? [];
      setAiQuestions(aiQs);
      setAiAnswers(aiQs.map((q: string) => ({ question: q, text: "" })));
      // Pre-fill fixed answers from extraction where possible
      setFixedAnswers({
        company: ext.one_line_description ?? "",
        traction: ext.traction_mentions?.join(", ") ?? "",
      });
    } catch { /* questions optional */ }
  }

  async function uploadAttachment(file: File) {
    if (!dealId) return;
    setUploadingFile(true);
    setError("");
    try {
      // Upload the file
      const formData = new FormData();
      formData.append("file", file, file.name);
      formData.append("deal_id", dealId);
      const res = await fetch("/api/upload/file", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      const { storage_url } = data;
      setAttachedFiles((prev) => [...prev, { name: file.name, storage_url, file_type: file.type }]);

      // Re-analyze and UPDATE fields from the new document.
      // New doc data takes priority — it was just uploaded for a reason.
      // Longer/more specific values win; blank new values don't overwrite existing.
      let enrichError = "";
      try {
        const enrichRes = await post(`/api/startup/${dealId}/file`, {
          storage_url,
          file_name: file.name,
          file_type: file.type || "application/octet-stream",
          scout_id: getScoutId(),
        });
        const ext = enrichRes.extraction;

        if (ext) {
          // Helper: prefer the longer/more informative value
          const better = (a: string, b: string | null | undefined) => {
            const bStr = b ?? "";
            return bStr.length > a.length ? bStr : a;
          };

          setReviewFields((prev) => ({
            startup_name:         better(prev.startup_name,         ext.startup_name),
            founder_name:         better(prev.founder_name,         ext.founder_names?.[0]),
            one_line_description: better(prev.one_line_description, ext.one_line_description),
            why_interesting:      better(prev.why_interesting,      ext.why_interesting),
            traction:             better(prev.traction,             ext.traction_mentions?.join(" · ")),
          }));

          setFixedAnswers((prev) => ({
            ...prev,
            company:  better(prev.company ?? "",  ext.one_line_description),
            traction: better(prev.traction ?? "", ext.traction_mentions?.join(" · ")),
          }));

          setDocUpdateBanner(`Fields updated from ${file.name}`);
          setTimeout(() => setDocUpdateBanner(""), 4000);
        }
      } catch (e) {
        enrichError = e instanceof Error ? e.message : "Enrichment failed";
        // Don't block — file is attached even if AI analysis fails
        setDocUpdateBanner(`File attached but analysis failed: ${enrichError}`);
        setTimeout(() => setDocUpdateBanner(""), 5000);
      }
    } catch (e) {
      setError(`File upload failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setUploadingFile(false);
    }
  }

  // All process functions return true on success, false on failure.
  // handleContinue only advances step when true is returned.

  async function processAudio(id: string): Promise<boolean> {
    if (!recordedBlob) return false;
    setProcessing(true);
    const formData = new FormData();
    formData.append("audio", recordedBlob, "pitch.webm");
    const scoutId = getScoutId();
    if (scoutId) formData.append("scout_id", scoutId);
    try {
      const res = await fetch(`/api/startup/${id}/audio`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Server error ${res.status}`);
      setExtraction(data.extraction);
      const ext = data.extraction as Extraction;
      setReviewFields({
        startup_name: ext.startup_name ?? "",
        founder_name: ext.founder_names?.[0] ?? "",
        one_line_description: ext.one_line_description ?? "",
        why_interesting: ext.why_interesting ?? "",
        traction: ext.traction_mentions?.join(", ") ?? "",
      });
      await fetchQuestions(id, data.extraction);
      return true;
    } catch (e) {
      setError(`Transcription failed: ${e instanceof Error ? e.message : e}. Check your internet and try again.`);
      return false;
    } finally {
      setProcessing(false);
    }
  }

  async function processManual(id: string): Promise<boolean> {
    setProcessing(true);
    try {
      const { extraction: ext } = await post(`/api/startup/${id}/manual`, { ...manual, scout_id: getScoutId() });
      setExtraction(ext);
      setReviewFields({
        startup_name: ext.startup_name ?? manual.startup_name,
        founder_name: ext.founder_names?.[0] ?? manual.founder_name,
        one_line_description: ext.one_line_description ?? manual.what_it_does,
        why_interesting: ext.why_interesting ?? manual.why_interesting,
        traction: ext.traction_mentions?.join(", ") ?? manual.traction,
      });
      await fetchQuestions(id, ext);
      return true;
    } catch (e) {
      setError(`Could not save your entry: ${e instanceof Error ? e.message : e}`);
      return false;
    } finally {
      setProcessing(false);
    }
  }

  async function processDocument(id: string): Promise<boolean> {
    if (!uploadedFile) return false;
    setProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile, uploadedFile.name);
      formData.append("deal_id", id);

      const uploadRes = await fetch("/api/upload/file", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error ?? `Upload failed (${uploadRes.status})`);

      const { storage_url } = uploadData;

      // Carry the submitted document forward so it appears in Step 3 "Attach materials"
      setAttachedFiles([{
        name: uploadedFile.name,
        storage_url,
        file_type: uploadedFile.type || "application/octet-stream",
      }]);

      // Run enrichment — now reads actual file content
      const res = await post(`/api/startup/${id}/file`, {
        storage_url,
        file_name: uploadedFile.name,
        file_type: uploadedFile.type || "application/octet-stream",
        scout_id: getScoutId(),
      });
      const ext = res.extraction;

      setExtraction(ext);
      setReviewFields({
        startup_name: ext.startup_name ?? "",
        founder_name: ext.founder_names?.[0] ?? "",
        one_line_description: ext.one_line_description ?? "",
        why_interesting: ext.why_interesting ?? "",
        traction: ext.traction_mentions?.join(", ") ?? "",
      });
      await fetchQuestions(id, ext);
      return true;
    } catch (e) {
      setError(`Upload failed: ${e instanceof Error ? e.message : e}`);
      return false;
    } finally {
      setProcessing(false);
    }
  }

  async function saveReviewEdit(field: string, value: string) {
    if (!dealId) return;
    const body: Record<string, string> = {};
    if (field === "startup_name")        body.startup_name = value;
    if (field === "founder_name")        body.founder_name = value;
    if (field === "one_line_description") body.one_line_description = value;
    if (field === "why_interesting")     body.why_interesting = value;
    if (field === "traction")            body.traction = value;
    if (field === "category")            body.category = value;

    setReviewFields((prev) => ({ ...prev, [field]: value }));
    if (dealId) {
      await fetch(`/api/startup/${dealId}/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }
  }

  function handleNoteVoice(raw: string, polished: string) {
    setNoteRaw(raw);
    setNotePolished(polished);
    setNoteText(polished);
    setShowNoteVersions(raw !== polished);
  }

  // ── Navigation ─────────────────────────────────────────────────────────────
  async function handleContinue() {
    setError("");

    // Step 1 → 2: create draft deal (show loading on button)
    if (step === 1) {
      setNavigating(true);
      try {
        await initDeal();
        setStep(2);
      } catch (e) {
        setError(`Could not start submission: ${e instanceof Error ? e.message : e}. Check your connection.`);
      } finally {
        setNavigating(false);
      }
      return;
    }

    // Step 2 → 3: process submission
    if (step === 2) {
      if (!dealId) { setError("Something went wrong. Go back and try again."); return; }
      let success = false;
      if (mode === "voice") {
        if (!recordedBlob) { setError("Please record your pitch first, then click Continue."); return; }
        success = await processAudio(dealId);
      } else if (mode === "manual") {
        if (!manual.startup_name && !manual.what_it_does) {
          setError("Please fill in at least the startup name or what they're building.");
          return;
        }
        success = await processManual(dealId);
      } else {
        if (!uploadedFile) { setError("Please select a file to upload first."); return; }
        success = await processDocument(dealId);
      }
      // Only advance on success — stay on step 2 with error if failed
      if (success) setStep(3);
      return;
    }

    // Step 3 → 4: nothing to save, just advance
    if (step === 3) {
      setStep(4);
      return;
    }

    // Step 4 → 5: save all answers (fixed + AI-generated)
    if (step === 4) {
      setNavigating(true);
      try {
        if (dealId) {
          const allAnswers = [
            // Fixed structured answers
            ...FIXED_QUESTIONS.map((q) => ({
              question: q.question,
              answer_text: fixedAnswers[q.id] || null,
              answer_type: fixedAnswers[q.id] ? "text" : "skipped",
            })),
            // AI-generated additional answers
            ...aiAnswers.map((a) => ({
              question: a.question,
              answer_text: a.text || null,
              answer_type: a.text ? "text" : "skipped",
            })),
          ];
          await post(`/api/startup/${dealId}/answers`, { answers: allAnswers, scout_id: getScoutId() });

          // Also save attached files as deal_files records
          for (const f of attachedFiles) {
            await post(`/api/startup/${dealId}/file`, {
              storage_url: f.storage_url,
              file_name: f.name,
              file_type: f.file_type,
              scout_id: getScoutId(),
            });
          }
        }
        setStep(5);
      } catch (e) {
        setError(`Could not save answers: ${e instanceof Error ? e.message : e}`);
      } finally {
        setNavigating(false);
      }
      return;
    }

    // Step 5 → submit: save notes then submit
    // (Submit button handles step 5 directly via handleSubmit)
    setStep((s) => Math.min(6, s + 1) as Step);
  }

  async function handleSubmit() {
    if (!dealId) {
      setError("Nothing to submit — please go back and fill in your startup details first.");
      return;
    }
    if (investmentRating === 0) {
      setError("Please rate this investment (1-4) before submitting.");
      return;
    }
    setNavigating(true);
    try {
      // Save investment rating + reason as special answers
      const assessmentAnswers = [
        { question: "Investment Rating (1-4)", answer_text: String(investmentRating), answer_type: "text" },
        { question: "Rating Reason", answer_text: ratingReason || null, answer_type: ratingReason ? "text" : "skipped" },
        { question: "Anything else valuable", answer_text: anythingElse || null, answer_type: anythingElse ? "text" : "skipped" },
      ];
      await post(`/api/startup/${dealId}/answers`, { answers: assessmentAnswers, scout_id: getScoutId() });

      await post(`/api/startup/${dealId}/submit`, {});
      setStep(6);
    } catch (e) {
      setError(`Submission failed: ${e instanceof Error ? e.message : e}. Please try again.`);
    } finally {
      setNavigating(false);
    }
  }

  const stepTitles: Record<Step, string> = {
    1: "Add Startup",
    2: mode === "voice" ? "Voice Pitch" : mode === "manual" ? "Manual Entry" : "Upload Document",
    3: "Review & Edit",
    4: "About the Startup",
    5: "Your Assessment",
    6: "Submitted",
  };

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="flex h-14 items-center gap-3 border-b border-gray-100 px-4 sticky top-0 bg-white z-10">
        <Link href="/scout" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-base font-semibold text-gray-950">{stepTitles[step]}</h1>
          <p className="text-xs text-gray-400">Step {step} of 6</p>
        </div>
      </header>

      <div className="px-4 py-5">
        {/* Progress bar */}
        <div className="mb-6 flex gap-1">
          {([1, 2, 3, 4, 5, 6] as Step[]).map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-gray-950" : "bg-gray-100"}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
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
                    className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${selected ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${selected ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                      <Icon size={18} className={selected ? "text-white" : ""} />
                    </span>
                    <span className="flex-1">
                      <span className={`block text-sm font-semibold ${selected ? "text-white" : "text-gray-900"}`}>{label}</span>
                      <span className={`block text-xs mt-0.5 ${selected ? "text-white/70" : "text-gray-500"}`}>{desc}</span>
                    </span>
                    {selected && <Check size={16} className="text-white shrink-0" />}
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
              <p className="text-xs text-gray-400 mb-6">Cover: problem, product, why interesting, and traction.</p>
              <button onClick={recording ? stopRecording : startRecording}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full transition-all shadow-lg ${recording ? "bg-red-500 scale-110" : "bg-gray-950 hover:bg-gray-800"}`}>
                {recording ? <Square size={24} className="text-white" /> : <Mic size={28} className="text-white" />}
              </button>
              <p className={`mt-4 text-2xl font-bold tabular-nums ${timeLeft < 30 && recording ? "text-red-500" : "text-gray-950"}`}>
                {formatTime(timeLeft)} <span className="text-sm font-normal text-gray-400">/ 02:00</span>
              </p>
              {recording && <p className="mt-2 text-xs text-red-500 animate-pulse">Recording…</p>}
              {recordedBlob && !recording && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <Check size={11} /> Recorded — click Continue to process
                </div>
              )}
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Topics to cover</p>
              <div className="grid grid-cols-2 gap-2">
                {INDICATORS.map((item, i) => {
                  const ticked = tickedIndicators.has(i);
                  return (
                    <div key={item} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition-all ${ticked ? "bg-emerald-50 text-emerald-800" : "bg-gray-50 text-gray-500"}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ticked ? "bg-emerald-500 text-white" : "bg-gray-200"}`}>
                        {ticked && <Check size={9} />}
                      </span>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center justify-center gap-2 border border-dashed border-gray-200 rounded-xl p-3 text-xs text-gray-400 hover:border-gray-300 cursor-pointer transition-colors">
              <FileUp size={13} />
              {recordedBlob ? "Replace with a file upload" : "Or upload a pre-recorded audio file"}
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setRecordedBlob(f); }} />
            </label>
          </section>
        )}

        {/* ── Step 2B: Manual entry ── */}
        {step === 2 && mode === "manual" && !processing && (
          <section className="space-y-4">
            {[
              { key: "startup_name",    label: "Startup name",          placeholder: "FlowOps" },
              { key: "founder_name",    label: "Founder name",          placeholder: "Rohan Mehta" },
              { key: "what_it_does",    label: "What are they building?", placeholder: "AI agents for logistics dispatch teams…" },
              { key: "why_interesting", label: "Why is it interesting?",  placeholder: "Technical founder, early pilot conversations…" },
              { key: "traction",        label: "Any traction?",          placeholder: "3 pilot conversations with logistics operators" },
            ].map(({ key, label, placeholder }) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>
                <textarea value={manual[key as keyof typeof manual]}
                  onChange={(e) => setManual({ ...manual, [key]: e.target.value })}
                  placeholder={placeholder}
                  className="h-16 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-gray-400" />
              </label>
            ))}
          </section>
        )}

        {/* ── Step 2C: Document upload ── */}
        {step === 2 && mode === "document" && !processing && (
          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-10 text-center cursor-pointer hover:border-gray-300 transition-colors">
            <FileUp size={28} className="text-gray-400 mb-3" />
            {uploadedFile ? (
              <>
                <p className="text-sm font-semibold text-gray-900">{uploadedFile.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB · Click to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-gray-950">Upload a deck, PDF, or document</p>
                <p className="text-xs text-gray-400 mt-1">Up to 25 MB</p>
              </>
            )}
            <input type="file" accept=".pdf,.pptx,.ppt,.docx,.doc,image/*" className="hidden"
              onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {/* ── Processing ── */}
        {processing && <ProcessingSteps active={processing} />}

        {/* ── Step 3: Review & Edit + Attach Materials ── */}
        {step === 3 && !processing && (
          <section className="space-y-5">
            {/* AI-extracted fields */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs text-gray-400 flex-1">AI extracted the following. Tap any field to correct it.</p>
                {extraction?.confidence && (
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {Math.round(extraction.confidence * 100)}% confidence
                  </span>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 p-4 space-y-0">
                <EditableField label="Startup" value={reviewFields.startup_name}
                  onSave={(v) => saveReviewEdit("startup_name", v)} />
                <EditableField label="Founder" value={reviewFields.founder_name}
                  onSave={(v) => saveReviewEdit("founder_name", v)} />
                <EditableField label="What it does" value={reviewFields.one_line_description}
                  onSave={(v) => saveReviewEdit("one_line_description", v)} multiline />
                <EditableField label="Why interesting" value={reviewFields.why_interesting}
                  onSave={(v) => saveReviewEdit("why_interesting", v)} multiline />
                <EditableField label="Traction" value={reviewFields.traction}
                  onSave={(v) => saveReviewEdit("traction", v)} multiline />
              </div>
              {(extraction?.missing_fields?.length ?? 0) > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {extraction?.missing_fields?.map((f) => (
                    <span key={f} className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-lg">{f}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Doc update banner */}
            {docUpdateBanner && (
              <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${
                docUpdateBanner.includes("failed")
                  ? "bg-amber-50 border border-amber-200 text-amber-700"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-700"
              }`}>
                <CheckCircle2 size={13} className="shrink-0" />
                {docUpdateBanner}
              </div>
            )}

            {/* Attach materials */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-950 mb-1">Attach materials</p>
              <p className="text-xs text-gray-400 mb-3">Deck, pitch, one-pager, demo — uploading a new file will update the fields above.</p>

              <label className={`flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-4 py-3 text-sm cursor-pointer hover:border-gray-300 transition-colors ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingFile
                  ? <><Loader2 size={14} className="animate-spin text-indigo-500" /> <span className="text-indigo-600 font-medium">Uploading &amp; analysing…</span></>
                  : <><Paperclip size={14} className="text-gray-400" /> <span className="text-gray-500">Choose file to attach</span></>
                }
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = ""; }} />
              </label>
              {uploadingFile && (
                <p className="text-xs text-indigo-500 mt-1.5 flex items-center gap-1">
                  <Loader2 size={10} className="animate-spin" />
                  Reading document and updating extracted fields…
                </p>
              )}

              {attachedFiles.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {attachedFiles.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                      <Paperclip size={11} className="text-gray-400 shrink-0" />
                      <span className="flex-1 truncate">{f.name}</span>
                      <button onClick={() => setAttachedFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {/* ── Step 4: Structured questions about the startup ── */}
        {step === 4 && !processing && (
          <section className="space-y-5">
            <p className="text-sm text-gray-500">Answer by voice or text — cover as much as you can.</p>

            {/* Fixed structured questions */}
            {FIXED_QUESTIONS.map((q) => (
              <QuestionCard
                key={q.id}
                index={-1}
                question={q.question}
                category={q.category}
                value={fixedAnswers[q.id] ?? ""}
                onChange={(text) => setFixedAnswers((prev) => ({ ...prev, [q.id]: text }))}
              />
            ))}

            {/* AI-generated additional questions */}
            {aiQuestions.length > 0 && (
              <div className="pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Additional questions for this startup
                </p>
                {aiQuestions.map((q, i) => (
                  <div key={i} className="mb-4">
                    <QuestionCard
                      index={i}
                      question={q}
                      value={aiAnswers[i]?.text ?? ""}
                      onChange={(text) => setAiAnswers((prev) =>
                        prev.map((a, j) => j === i ? { ...a, text } : a)
                      )}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Step 5: Investment Assessment ── */}
        {step === 5 && !processing && (
          <section className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-950 mb-1">Your assessment</h2>
              <p className="text-sm text-gray-400">Rate this opportunity and share your personal take.</p>
            </div>

            {/* Investment rating 1-4 */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-950 mb-3">
                Investment rating <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RATING_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setInvestmentRating(opt.value)}
                    className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all ${
                      investmentRating === opt.value
                        ? `${opt.bg} ${opt.border} border-2`
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <span className={`text-xl font-bold w-7 shrink-0 ${investmentRating === opt.value ? opt.color : "text-gray-300"}`}>
                      {opt.value}
                    </span>
                    <div>
                      <p className={`text-xs font-semibold ${investmentRating === opt.value ? opt.color : "text-gray-600"}`}>
                        {opt.label}
                      </p>
                    </div>
                    {investmentRating === opt.value && (
                      <Check size={14} className={`ml-auto shrink-0 ${opt.color}`} />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1.5">Why this rating?</p>
                <textarea value={ratingReason} onChange={(e) => setRatingReason(e.target.value)}
                  placeholder="What makes this compelling or risky? What's your gut on the founders?"
                  className="w-full h-24 resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-gray-400" />
              </div>
            </div>

            {/* Anything else */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-950 mb-1">Anything else?</p>
              <p className="text-xs text-gray-400 mb-3">
                Context, relationships, urgency, competitive dynamics — anything you think Quanta should know.
              </p>
              <div className="flex items-center gap-2 mb-2">
                <VoiceRecorder context="note" placeholder="Record your thoughts"
                  onResult={(raw, polished) => setAnythingElse(polished || raw)} />
                <span className="text-xs text-gray-300">or type below</span>
              </div>
              <textarea value={anythingElse} onChange={(e) => setAnythingElse(e.target.value)}
                placeholder="I know the founder personally from…"
                className="w-full h-24 resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-gray-400" />
            </div>
          </section>
        )}

        {/* ── Step 6: Done ── */}
        {step === 6 && (
          <section className="rounded-xl border border-gray-100 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-950">Submitted to Quanta</h2>
            <p className="mt-2 text-sm text-gray-500">
              {reviewFields.startup_name || "Your startup"} is now in the review queue.
            </p>
            <Link href="/scout"
              className="mt-6 flex h-11 items-center justify-center rounded-xl bg-gray-950 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
              Back to Home
            </Link>
            <Link href="/add-startup" className="mt-3 block text-sm text-indigo-600 hover:text-indigo-700">
              Submit another →
            </Link>
          </section>
        )}

        {/* ── Navigation ── */}
        {step < 6 && !processing && (
          <div className="mt-6 space-y-2">
            <div className="flex gap-3">
              <button
                onClick={() => { setError(""); setStep((s) => Math.max(1, s - 1) as Step); }}
                disabled={step === 1 || navigating}
                className="h-11 w-20 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors shrink-0">
                Back
              </button>
              {step === 5 ? (
                <button onClick={handleSubmit} disabled={navigating}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors">
                  {navigating
                    ? <><Loader2 size={14} className="animate-spin" /> Submitting…</>
                    : <><Send size={14} /> Submit to Quanta</>}
                </button>
              ) : (
                <button onClick={handleContinue} disabled={navigating}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors">
                  {navigating
                    ? <><Loader2 size={14} className="animate-spin" /> Please wait…</>
                    : <>Continue <ArrowRight size={14} /></>}
                </button>
              )}
            </div>

            {/* Save as Draft — visible from step 2 onwards */}
            {step >= 2 && (
              <button
                onClick={saveDraft}
                disabled={savingDraft}
                className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all border ${
                  draftSaved
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {savingDraft ? (
                  <><Loader2 size={13} className="animate-spin" /> Saving…</>
                ) : draftSaved ? (
                  <><BookmarkCheck size={14} /> Draft saved — find it in My Submissions</>
                ) : (
                  <><BookmarkCheck size={14} /> Save as Draft</>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

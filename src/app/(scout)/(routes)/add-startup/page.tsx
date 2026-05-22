"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Check, FileUp, Mic, PencilLine, Send,
  Square, Loader2, AlertCircle, Edit3, CheckCircle2,
  BookmarkCheck, Paperclip, X, ChevronDown, ChevronUp, StopCircle,
  Volume2,
} from "lucide-react";
import { FIXED_QUESTIONS, RATING_OPTIONS } from "@/prompts/intake/question-generation.prompt";

type Mode = "voice" | "manual" | "document";
type Step = 1 | 2 | 3 | 4 | 5;
interface Extraction {
  startup_name?: string | null; founder_names?: string[];
  one_line_description?: string | null; category?: string | null;
  traction_mentions?: string[]; scout_conviction?: string;
  why_interesting?: string | null; missing_fields?: string[]; confidence?: number;
}

const INDICATORS = ["Problem", "Product", "Why interesting", "Traction"];
const MODE_OPTIONS = [
  { id: "voice" as const,    label: "Voice Pitch",     icon: Mic,        desc: "Record a 2-minute elevator pitch" },
  { id: "manual" as const,   label: "Manual Entry",    icon: PencilLine, desc: "Type startup details directly" },
  { id: "document" as const, label: "Upload Document", icon: FileUp,     desc: "Deck, PDF, or screenshot" },
];

function getScoutId(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem("quanta_scout_id") : null;
}

// ─── Processing overlay ────────────────────────────────────────────────────────
const PROC_STEPS = [
  { id: "u", label: "Uploading",                duration: 3000  },
  { id: "t", label: "Transcribing with Whisper", duration: 14000 },
  { id: "e", label: "Extracting startup signals", duration: 6000  },
];
function ProcessingSteps({ active }: { active: boolean }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    if (!active) { setCur(0); return; }
    const ts: ReturnType<typeof setTimeout>[] = [];
    let el = 0;
    PROC_STEPS.slice(1).forEach((_, i) => { el += PROC_STEPS[i].duration; ts.push(setTimeout(() => setCur(i + 1), el)); });
    return () => ts.forEach(clearTimeout);
  }, [active]);
  if (!active) return null;
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="w-full max-w-xs space-y-3 text-left">
        {PROC_STEPS.map((s, i) => {
          const done = i < cur; const run = i === cur;
          return (
            <div key={s.id} className={`flex items-center gap-3 ${i > cur ? "opacity-30" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-emerald-500" : run ? "bg-gray-950" : "bg-gray-200"}`}>
                {done ? <Check size={12} className="text-white" /> : run ? <Loader2 size={12} className="text-white animate-spin" /> : <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />}
              </div>
              <span className={`text-sm ${run ? "font-medium text-gray-950" : done ? "text-gray-400 line-through" : "text-gray-400"}`}>{s.label}</span>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-gray-400 mt-6">This takes 15–25 seconds</p>
    </div>
  );
}

// ─── Editable review field ─────────────────────────────────────────────────────
function EditableField({ label, value, onSave, multiline = false }: {
  label: string; value: string; onSave: (v: string) => void; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (!editing) setDraft(value); }, [value, editing]);
  if (editing) return (
    <div className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      {multiline
        ? <textarea value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus rows={2} className="w-full text-sm border border-gray-200 rounded-lg p-2 resize-none focus:outline-none focus:border-gray-400" />
        : <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-gray-400" />}
      <div className="flex gap-2 mt-1.5">
        <button onClick={() => { onSave(draft); setEditing(false); }} className="h-7 px-3 bg-gray-950 text-white text-xs font-medium rounded-md">Save</button>
        <button onClick={() => setEditing(false)} className="h-7 px-3 text-xs text-gray-500 border border-gray-200 rounded-md">Cancel</button>
      </div>
    </div>
  );
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 pb-2.5 last:border-0 last:pb-0 group cursor-pointer" onClick={() => { setDraft(value); setEditing(true); }}>
      <span className="text-xs text-gray-400 shrink-0 w-24">{label}</span>
      <div className="flex items-start gap-1.5 flex-1">
        <span className="text-sm font-medium text-gray-900 flex-1 text-right leading-relaxed">{value || <span className="text-gray-300 italic">tap to add</span>}</span>
        <Edit3 size={11} className="text-gray-300 group-hover:text-gray-500 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}

// ─── Answer field with "Don't have this yet" option ─────────────────────────
function AnswerField({ category, question, value, onChange, placeholder, missingDate, onMissingDate }: {
  category: string; question: string; value: string; onChange: (v: string) => void;
  placeholder?: string; missingDate?: string; onMissingDate?: (d: string) => void;
}) {
  const [showMissing, setShowMissing] = useState(!!missingDate);

  return (
    <div className="space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{category}</p>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{question}</p>
        </div>
        {onMissingDate && !showMissing && (
          <button onClick={() => { setShowMissing(true); onChange(""); }}
            className="text-[10px] font-medium text-gray-400 hover:text-amber-600 border border-gray-200 hover:border-amber-300 rounded-lg px-2 py-1 mt-0.5 shrink-0 transition-colors">
            Don&apos;t have this yet
          </button>
        )}
      </div>
      {showMissing ? (
        <div className="space-y-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs font-medium text-amber-800">Missing info — tell the team when you&apos;ll have it:</p>
          <input type="date" value={missingDate ?? ""} onChange={(e) => onMissingDate?.(e.target.value)}
            className="w-full h-9 border border-amber-300 rounded-lg px-3 text-sm focus:outline-none focus:border-amber-500 bg-white" />
          <button onClick={() => { setShowMissing(false); onMissingDate?.(""); }}
            className="text-xs text-gray-500 hover:text-gray-700">I have an answer after all</button>
        </div>
      ) : (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "Your answer…"} rows={2}
          className="w-full resize-none border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-gray-400 transition-colors" />
      )}
    </div>
  );
}

// ─── Master voice recorder (5 min) ────────────────────────────────────────────
function MasterVoiceRecorder({ dealId, existingAnswers, onDistributed }: {
  dealId: string; existingAnswers: Record<string, string>;
  onDistributed: (answers: Record<string, string | null>, transcript: string) => void;
}) {
  const MAX = 300;
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX);
  const [transcripts, setTranscripts] = useState<string[]>([]);
  const [showT, setShowT] = useState(false);
  const [err, setErr] = useState("");
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  async function start() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); process(new Blob(chunksRef.current, { type: mime })); };
      mr.start(1000); setRecording(true); setTimeLeft(MAX);
      timerRef.current = setInterval(() => { setTimeLeft((t) => { if (t <= 1) { stop(); return 0; } return t - 1; }); }, 1000);
    } catch { setErr("Microphone access denied. Allow it in browser settings."); }
  }

  function stop() { if (timerRef.current) clearInterval(timerRef.current); mrRef.current?.stop(); setRecording(false); }

  async function process(blob: Blob) {
    setProcessing(true); setErr("");
    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      fd.append("context", "pitch");
      const r = await fetch("/api/transcribe", { method: "POST", body: fd });
      const d = await r.json();
      const transcript = d.transcript ?? "";
      if (!transcript.trim()) { setErr("No speech detected. Try again."); return; }
      setTranscripts((p) => [...p, transcript]);
      const dr = await fetch(`/api/startup/${dealId}/distribute-answers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        // Pass existing answers so AI applies updates + recalculates metrics
        body: JSON.stringify({ transcript, scout_id: getScoutId(), existing_answers: existingAnswers }),
      });
      const dd = await dr.json();
      onDistributed(dd.distributed ?? {}, transcript);
    } catch (e) { setErr(`Failed: ${e instanceof Error ? e.message : e}`);
    } finally { setProcessing(false); }
  }

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-indigo-50/30">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-950">Record everything at once</p>
          <p className="text-xs text-gray-500 mt-0.5">Speak freely — we'll distribute your words to all the answer fields below. Up to 5 minutes per recording. You can record multiple times.</p>
        </div>
        {transcripts.length > 0 && (
          <button onClick={() => setShowT(!showT)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 shrink-0 ml-2 mt-0.5">
            <Volume2 size={11} />{transcripts.length}{showT ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        {processing
          ? <div className="flex items-center gap-2 text-sm text-indigo-600"><Loader2 size={15} className="animate-spin" />Filling answers from your recording…</div>
          : recording
          ? (<>
              <button onClick={stop} className="flex items-center gap-2 h-9 px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors">
                <StopCircle size={14} /> Stop
              </button>
              <span className={`text-sm font-mono font-semibold tabular-nums ${timeLeft < 60 ? "text-red-500" : "text-gray-700"}`}>{fmt(timeLeft)}</span>
              <span className="text-xs text-red-500 animate-pulse">● Recording</span>
            </>)
          : (<button onClick={start} className="flex items-center gap-2 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Mic size={14} />{transcripts.length > 0 ? "Record again" : "Start recording"}
            </button>)
        }
      </div>
      {err && <p className="text-xs text-red-600 mt-2 flex items-center gap-1"><AlertCircle size={11} />{err}</p>}
      {showT && transcripts.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-indigo-100 pt-3">
          <p className="text-xs font-medium text-gray-400">Saved transcripts (visible to Quanta team)</p>
          {transcripts.map((t, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-lg p-2.5">
              <p className="text-[10px] text-gray-400 mb-1 font-semibold uppercase">Recording {i + 1}</p>
              <p className="text-xs text-gray-700 leading-relaxed">{t}</p>
            </div>
          ))}
        </div>
      )}
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [reviewFields, setReviewFields] = useState({ startup_name: "", founder_name: "", one_line_description: "", why_interesting: "", traction: "" });
  const [fixedAnswers, setFixedAnswers] = useState<Record<string, string>>({});
  const [linkedinUrls, setLinkedinUrls] = useState<string[]>([""]);
  const [missingDates, setMissingDates] = useState<Record<string, string>>({}); // questionId -> date
  const [aiQuestions, setAiQuestions] = useState<string[]>([]);
  const [aiAnswers, setAiAnswers] = useState<{ question: string; text: string }[]>([]);
  const [showAiQ, setShowAiQ] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; storage_url: string; file_type: string }[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [docBanner, setDocBanner] = useState("");
  const [investmentRating, setInvestmentRating] = useState(0);
  const [ratingReason, setRatingReason] = useState("");
  const [ratingRaw, setRatingRaw] = useState("");
  const [ratingPolished, setRatingPolished] = useState("");
  const [showRatingVersions, setShowRatingVersions] = useState(false);
  const [ratingRecording, setRatingRecording] = useState(false);
  const [ratingProcessing, setRatingProcessing] = useState(false);
  const [ratingTimeLeft, setRatingTimeLeft] = useState(120);
  const ratingMrRef = useRef<MediaRecorder | null>(null);
  const ratingChunksRef = useRef<Blob[]>([]);
  const ratingStreamRef = useRef<MediaStream | null>(null);
  const ratingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Voice pitch (step 2A)
  const [recording, setRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [tickedIndicators, setTickedIndicators] = useState<Set<number>>(new Set());
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [manual, setManual] = useState({ startup_name: "", founder_name: "", what_it_does: "", why_interesting: "", traction: "" });

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);
  const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  async function post(path: string, body: Record<string, unknown>) {
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  }

  async function initDeal() {
    const { deal_id } = await post("/api/startup/init", { scout_id: getScoutId(), mode });
    setDealId(deal_id); return deal_id as string;
  }

  // "better" value: prefer longer/more informative string
  const better = (a: string, b: string | null | undefined) => (b ?? "").trim().length > a.trim().length ? (b ?? "").trim() : a;

  function applyExtraction(ext: Extraction) {
    setReviewFields((p) => ({
      startup_name:         better(p.startup_name,         ext.startup_name),
      founder_name:         better(p.founder_name,         ext.founder_names?.[0]),
      one_line_description: better(p.one_line_description, ext.one_line_description),
      why_interesting:      better(p.why_interesting,      ext.why_interesting),
      traction:             better(p.traction,             ext.traction_mentions?.join(" · ")),
    }));
    setFixedAnswers((p) => ({
      ...p,
      company:  better(p.company  ?? "", ext.one_line_description),
      founders: better(p.founders ?? "", ext.founder_names?.join(", ")),
      traction: better(p.traction ?? "", ext.traction_mentions?.join(" · ")),
    }));
  }

  async function fetchQuestions(id: string, ext: Extraction) {
    try {
      const res = await post(`/api/startup/${id}/questions`, { extraction: ext });
      const qs: string[] = res.ai_questions ?? [];
      setAiQuestions(qs);
      setAiAnswers(qs.map((q: string) => ({ question: q, text: "" })));
    } catch { /* optional */ }
  }

  // Voice pitch step 2A
  async function startRecording() {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      mrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => { setRecordedBlob(new Blob(chunksRef.current, { type: mime })); streamRef.current?.getTracks().forEach((t) => t.stop()); };
      mr.start(1000); setRecording(true); setTimeLeft(120);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { stopRecording(); return 0; }
          if (t === 90) setTickedIndicators(new Set([0]));
          if (t === 60) setTickedIndicators(new Set([0, 1]));
          if (t === 30) setTickedIndicators(new Set([0, 1, 2]));
          return t - 1;
        });
      }, 1000);
    } catch { setError("Microphone access denied. Allow it in browser settings."); }
  }
  function stopRecording() { if (timerRef.current) clearInterval(timerRef.current); mrRef.current?.stop(); setRecording(false); }

  async function processAudio(id: string): Promise<boolean> {
    if (!recordedBlob) return false;
    setProcessing(true);
    const fd = new FormData(); fd.append("audio", recordedBlob, "pitch.webm");
    const sid = getScoutId(); if (sid) fd.append("scout_id", sid);
    try {
      const res = await fetch(`/api/startup/${id}/audio`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
      applyExtraction(data.extraction); await fetchQuestions(id, data.extraction); return true;
    } catch (e) { setError(`Transcription failed: ${e instanceof Error ? e.message : e}`); return false;
    } finally { setProcessing(false); }
  }

  async function processManual(id: string): Promise<boolean> {
    setProcessing(true);
    try {
      const { extraction: ext } = await post(`/api/startup/${id}/manual`, { ...manual, scout_id: getScoutId() });
      applyExtraction(ext); await fetchQuestions(id, ext); return true;
    } catch (e) { setError(`Save failed: ${e instanceof Error ? e.message : e}`); return false;
    } finally { setProcessing(false); }
  }

  async function processDocument(id: string): Promise<boolean> {
    if (!uploadedFile) return false;
    setProcessing(true);
    try {
      const fd = new FormData(); fd.append("file", uploadedFile, uploadedFile.name); fd.append("deal_id", id);
      const ur = await fetch("/api/upload/file", { method: "POST", body: fd });
      const ud = await ur.json();
      if (!ur.ok) throw new Error(ud.error ?? "Upload failed");
      setAttachedFiles([{ name: uploadedFile.name, storage_url: ud.storage_url, file_type: uploadedFile.type }]);
      const er = await post(`/api/startup/${id}/file`, { storage_url: ud.storage_url, file_name: uploadedFile.name, file_type: uploadedFile.type || "application/octet-stream", scout_id: getScoutId() });
      applyExtraction(er.extraction); await fetchQuestions(id, er.extraction); return true;
    } catch (e) { setError(`Upload failed: ${e instanceof Error ? e.message : e}`); return false;
    } finally { setProcessing(false); }
  }

  async function uploadAttachment(file: File) {
    if (!dealId) return;
    setUploadingFile(true); setError("");
    try {
      const fd = new FormData(); fd.append("file", file, file.name); fd.append("deal_id", dealId);
      const res = await fetch("/api/upload/file", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setAttachedFiles((p) => [...p, { name: file.name, storage_url: data.storage_url, file_type: file.type }]);
      try {
        const er = await post(`/api/startup/${dealId}/file`, { storage_url: data.storage_url, file_name: file.name, file_type: file.type || "application/octet-stream", scout_id: getScoutId() });
        applyExtraction(er.extraction);
        setDocBanner(`Fields updated from ${file.name}`); setTimeout(() => setDocBanner(""), 4000);
      } catch (e) {
        setDocBanner(`Attached but analysis failed: ${e instanceof Error ? e.message : e}`); setTimeout(() => setDocBanner(""), 5000);
      }
    } catch (e) { setError(`Upload failed: ${e instanceof Error ? e.message : e}`);
    } finally { setUploadingFile(false); }
  }

  async function saveReviewEdit(field: string, value: string) {
    setReviewFields((p) => ({ ...p, [field]: value }));
    if (!dealId) return;
    const body: Record<string, string> = {};
    if (field === "startup_name") body.startup_name = value;
    else if (field === "one_line_description") body.one_line_description = value;
    else if (field === "founder_name") body.founder_name = value;
    else if (field === "traction") body.traction = value;
    await fetch(`/api/startup/${dealId}/update`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  }

  function handleDistributed(distributed: Record<string, string | null>) {
    // Voice AI result takes priority — it has already merged with existing context.
    // Only skip if AI returned null (meaning the question wasn't addressed at all).
    setFixedAnswers((p) => {
      const n = { ...p };
      Object.entries(distributed).forEach(([k, v]) => {
        if (v && v.trim()) n[k] = v.trim();
        // null = not addressed → keep existing answer
      });
      return n;
    });
  }

  async function saveDraft() {
    setSavingDraft(true); setError("");
    try {
      const id = dealId ?? await initDeal();
      await fetch(`/api/startup/${id}/save-draft`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ startup_name: reviewFields.startup_name || null, one_line_description: reviewFields.one_line_description || null, founder_name: reviewFields.founder_name || null }) });
      setDraftSaved(true); setTimeout(() => setDraftSaved(false), 3000);
    } catch (e) { setError(`Draft save failed: ${e instanceof Error ? e.message : e}`);
    } finally { setSavingDraft(false); }
  }

  // ── Rating voice recorder ──────────────────────────────────────────────────
  async function startRatingRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      ratingStreamRef.current = stream; ratingChunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const mr = new MediaRecorder(stream, { mimeType: mime });
      ratingMrRef.current = mr;
      mr.ondataavailable = (e) => { if (e.data.size > 0) ratingChunksRef.current.push(e.data); };
      mr.onstop = () => { ratingStreamRef.current?.getTracks().forEach((t) => t.stop()); processRatingRecording(new Blob(ratingChunksRef.current, { type: mime })); };
      mr.start(1000); setRatingRecording(true); setRatingTimeLeft(120);
      ratingTimerRef.current = setInterval(() => {
        setRatingTimeLeft((t) => { if (t <= 1) { stopRatingRecording(); return 0; } return t - 1; });
      }, 1000);
    } catch { setError("Microphone access denied."); }
  }

  function stopRatingRecording() {
    if (ratingTimerRef.current) clearInterval(ratingTimerRef.current);
    ratingMrRef.current?.stop(); setRatingRecording(false);
  }

  async function processRatingRecording(blob: Blob) {
    if (!dealId) { setError("No deal found. Go back and try again."); return; }
    setRatingProcessing(true);
    try {
      // Step 1: Transcribe
      const fd = new FormData();
      fd.append("audio", blob, "rating.webm");
      fd.append("context", "pitch");
      const tRes = await fetch("/api/transcribe", { method: "POST", body: fd });
      const tData = await tRes.json();
      const transcript = tData.transcript ?? "";
      if (!transcript.trim()) { setError("No speech detected. Try again."); return; }
      setRatingRaw(transcript);

      // Step 2: Write rationale using real deal context (Q&A answers, traction numbers, stage)
      // This avoids placeholders — the AI pulls actual facts from the deal's data
      const rRes = await fetch(`/api/startup/${dealId}/rationale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, rating: investmentRating }),
      });
      const rData = await rRes.json();
      const rationale = rData.rationale ?? transcript;

      setRatingPolished(rationale);
      setRatingReason(rationale);
      setShowRatingVersions(transcript !== rationale);
    } catch (e) { setError(`Processing failed: ${e instanceof Error ? e.message : e}`);
    } finally { setRatingProcessing(false); }
  }

  async function handleContinue() {
    setError("");
    if (step === 1) {
      setNavigating(true);
      try { await initDeal(); setStep(2); } catch (e) { setError(`Could not start: ${e instanceof Error ? e.message : e}`); } finally { setNavigating(false); }
      return;
    }
    if (step === 2) {
      if (!dealId) { setError("Something went wrong. Go back and try again."); return; }
      let ok = false;
      if (mode === "voice") { if (!recordedBlob) { setError("Please record your pitch first."); return; } ok = await processAudio(dealId); }
      else if (mode === "manual") { if (!manual.startup_name && !manual.what_it_does) { setError("Please fill in at least the startup name or description."); return; } ok = await processManual(dealId); }
      else { if (!uploadedFile) { setError("Please select a file first."); return; } ok = await processDocument(dealId); }
      if (ok) setStep(3);
      return;
    }
    if (step === 3) {
      setNavigating(true);
      try {
        if (dealId) {
          const validLinkedins = linkedinUrls.filter((u) => u.trim());
          const allAnswers = [
            ...FIXED_QUESTIONS.map((q) => ({
              question: q.question,
              answer_text: missingDates[q.id]
                ? `Missing — expected by ${missingDates[q.id]}`
                : fixedAnswers[q.id] || null,
              answer_type: fixedAnswers[q.id] ? "text" : "skipped",
            })),
            ...(validLinkedins.length > 0
              ? [{ question: "Founder LinkedIn URLs", answer_text: validLinkedins.join(", "), answer_type: "text" }]
              : []),
            ...aiAnswers.filter((a) => a.text).map((a) => ({ question: a.question, answer_text: a.text, answer_type: "text" })),
          ];
          await post(`/api/startup/${dealId}/answers`, { answers: allAnswers, scout_id: getScoutId() });

          // Save "Don't have this yet" fields as proper missing_info_tasks
          const missingTasks = Object.entries(missingDates)
            .filter(([, date]) => date)
            .map(([qId, date]) => {
              const q = FIXED_QUESTIONS.find((f) => f.id === qId);
              const followupDate = new Date(date);
              followupDate.setDate(followupDate.getDate() + 1);
              return {
                info_needed: q?.question ?? qId,
                expected_date: date,
                followup_date: followupDate.toISOString().split("T")[0],
              };
            });
          if (missingTasks.length > 0) {
            await post(`/api/startup/${dealId}/missing-tasks`, {
              tasks: missingTasks,
              scout_id: getScoutId(),
            });
          }

          // Auto-flag missing pitch deck if no document was uploaded
          if (attachedFiles.length === 0 && mode !== "document") {
            await post(`/api/startup/${dealId}/missing-tasks`, {
              tasks: [{ info_needed: "Pitch deck (PDF or PPT)", expected_date: null, followup_date: null }],
              scout_id: getScoutId(),
            });
          }
        }
        setStep(4);
      } catch (e) { setError(`Could not save: ${e instanceof Error ? e.message : e}`);
      } finally { setNavigating(false); }
      return;
    }
    setStep((s) => Math.min(5, s + 1) as Step);
  }

  async function handleSubmit() {
    if (!dealId) { setError("Nothing to submit — fill in startup details first."); return; }
    if (investmentRating === 0) { setError("Please rate this investment (1–4) before submitting."); return; }
    setNavigating(true);
    try {
      await post(`/api/startup/${dealId}/answers`, {
        answers: [
          { question: "Investment Rating (1-4)", answer_text: String(investmentRating), answer_type: "text" },
          { question: "Rating Reason", answer_text: ratingReason || null, answer_type: ratingReason ? "text" : "skipped" },
          ...(ratingRaw ? [{ question: "Rating Voice Transcript", answer_text: ratingRaw, answer_type: "voice" }] : []),
        ],
        scout_id: getScoutId(),
      });
      await post(`/api/startup/${dealId}/submit`, {});
      setStep(5);
    } catch (e) { setError(`Submission failed: ${e instanceof Error ? e.message : e}`);
    } finally { setNavigating(false); }
  }

  const stepTitles: Record<Step, string> = { 1: "Add Startup", 2: mode === "voice" ? "Voice Pitch" : mode === "manual" ? "Manual Entry" : "Upload Document", 3: "About the Startup", 4: "Your Assessment", 5: "Submitted" };

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white">
      <header className="flex h-14 items-center gap-3 border-b border-gray-100 px-4 sticky top-0 bg-white z-10">
        <Link href="/scout" className="text-gray-400 hover:text-gray-600"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-base font-semibold text-gray-950">{stepTitles[step]}</h1>
          <p className="text-xs text-gray-400">Step {Math.min(step, 4)} of 4</p>
        </div>
      </header>

      <div className="px-4 py-5">
        <div className="mb-6 flex gap-1">
          {([1, 2, 3, 4] as const).map((s) => (
            <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? "bg-gray-950" : "bg-gray-100"}`} />
          ))}
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">
            <AlertCircle size={14} className="shrink-0" />{error}
          </div>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <section>
            <h2 className="mb-4 text-xl font-semibold text-gray-950">How do you want to submit?</h2>
            <div className="space-y-3">
              {MODE_OPTIONS.map(({ id, label, icon: Icon, desc }) => {
                const sel = mode === id;
                return (
                  <button key={id} onClick={() => setMode(id)} className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all ${sel ? "border-gray-950 bg-gray-950 text-white" : "border-gray-200 hover:border-gray-300"}`}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${sel ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                      <Icon size={18} className={sel ? "text-white" : ""} />
                    </span>
                    <span className="flex-1">
                      <span className={`block text-sm font-semibold ${sel ? "text-white" : "text-gray-900"}`}>{label}</span>
                      <span className={`block text-xs mt-0.5 ${sel ? "text-white/70" : "text-gray-500"}`}>{desc}</span>
                    </span>
                    {sel && <Check size={16} className="text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Step 2A: Voice */}
        {step === 2 && mode === "voice" && !processing && (
          <section className="space-y-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-600 mb-1">You have <span className="font-semibold text-gray-900">2 minutes.</span></p>
              <p className="text-xs text-gray-400 mb-6">Cover: problem, product, why interesting, traction.</p>
              <button onClick={recording ? stopRecording : startRecording}
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all ${recording ? "bg-red-500 scale-110" : "bg-gray-950 hover:bg-gray-800"}`}>
                {recording ? <Square size={24} className="text-white" /> : <Mic size={28} className="text-white" />}
              </button>
              <p className={`mt-4 text-2xl font-bold tabular-nums ${timeLeft < 30 && recording ? "text-red-500" : "text-gray-950"}`}>
                {fmtTime(timeLeft)} <span className="text-sm font-normal text-gray-400">/ 02:00</span>
              </p>
              {recording && <p className="mt-2 text-xs text-red-500 animate-pulse">Recording…</p>}
              {recordedBlob && !recording && (
                <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full">
                  <Check size={11} /> Recorded — click Continue
                </div>
              )}
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="mb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Topics to cover</p>
              <div className="grid grid-cols-2 gap-2">
                {INDICATORS.map((item, i) => {
                  const ticked = tickedIndicators.has(i);
                  return (
                    <div key={item} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${ticked ? "bg-emerald-50 text-emerald-800" : "bg-gray-50 text-gray-500"}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${ticked ? "bg-emerald-500 text-white" : "bg-gray-200"}`}>{ticked && <Check size={9} />}</span>
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center justify-center gap-2 border border-dashed border-gray-200 rounded-xl p-3 text-xs text-gray-400 hover:border-gray-300 cursor-pointer">
              <FileUp size={13} />{recordedBlob ? "Replace with a file upload" : "Or upload a pre-recorded file"}
              <input type="file" accept="audio/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setRecordedBlob(f); }} />
            </label>
          </section>
        )}

        {/* Step 2B: Manual */}
        {step === 2 && mode === "manual" && !processing && (
          <section className="space-y-4">
            {[
              { key: "startup_name", label: "Startup name", ph: "FlowOps" },
              { key: "founder_name", label: "Founder name", ph: "Rohan Mehta" },
              { key: "what_it_does", label: "What are they building?", ph: "AI agents for logistics dispatch…" },
              { key: "why_interesting", label: "Why is it interesting?", ph: "Technical founder, early pilots…" },
              { key: "traction", label: "Any traction?", ph: "3 pilot conversations with logistics operators" },
            ].map(({ key, label, ph }) => (
              <label key={key} className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-600">{label}</span>
                <textarea value={manual[key as keyof typeof manual]} onChange={(e) => setManual({ ...manual, [key]: e.target.value })} placeholder={ph}
                  className="h-16 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-gray-400" />
              </label>
            ))}
          </section>
        )}

        {/* Step 2C: Document */}
        {step === 2 && mode === "document" && !processing && (
          <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-10 text-center cursor-pointer hover:border-gray-300 transition-colors">
            <FileUp size={28} className="text-gray-400 mb-3" />
            {uploadedFile
              ? <><p className="text-sm font-semibold text-gray-900">{uploadedFile.name}</p><p className="text-xs text-gray-400 mt-1">{(uploadedFile.size / 1024).toFixed(0)} KB · Click to change</p></>
              : <><p className="text-sm font-semibold text-gray-950">Upload a deck, PDF, or document</p><p className="text-xs text-gray-400 mt-1">Up to 4 MB</p></>}
            <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" className="hidden" onChange={(e) => setUploadedFile(e.target.files?.[0] ?? null)} />
          </label>
        )}

        {/* Processing */}
        {processing && <ProcessingSteps active={processing} />}

        {/* ── Step 3: About the Startup (merged review + Q&A) ── */}
        {step === 3 && !processing && (
          <section className="space-y-5">
            {/* Documents */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-950 mb-1">Documents</p>
              <p className="text-xs text-gray-400 mb-3">{attachedFiles.length > 0 ? "Add more files to update the answers below." : "Attach a deck, PDF, or any relevant file."}</p>
              {attachedFiles.length > 0 && (
                <ul className="mb-3 space-y-1.5">
                  {attachedFiles.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-700 bg-gray-50 rounded-lg px-3 py-2">
                      <Paperclip size={11} className="text-gray-400 shrink-0" /><span className="flex-1 truncate">{f.name}</span>
                      <button onClick={() => setAttachedFiles((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500"><X size={12} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <label className={`flex items-center gap-2 border border-dashed border-gray-200 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-gray-300 transition-colors ${uploadingFile ? "opacity-50 pointer-events-none" : ""}`}>
                {uploadingFile ? <><Loader2 size={14} className="animate-spin text-indigo-500" /><span className="text-indigo-600 font-medium">Uploading &amp; analysing…</span></> : <><Paperclip size={14} className="text-gray-400" /><span className="text-gray-500">Add a file</span></>}
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAttachment(f); e.target.value = ""; }} />
              </label>
              {docBanner && <p className={`text-xs mt-2 flex items-center gap-1.5 font-medium ${docBanner.includes("failed") ? "text-amber-600" : "text-emerald-600"}`}><CheckCircle2 size={11} />{docBanner}</p>}
            </div>

            {/* Master mic */}
            {dealId && (
              <MasterVoiceRecorder
                dealId={dealId}
                existingAnswers={fixedAnswers}
                onDistributed={handleDistributed}
              />
            )}

            {/* Structured Q&A — no quick review, answers come from doc/voice */}
            <div className="space-y-5">
              {FIXED_QUESTIONS.map((q) => (
                <div key={q.id} className="space-y-2">
                  <AnswerField
                    category={q.category}
                    question={q.question}
                    value={missingDates[q.id] ? "" : (fixedAnswers[q.id] ?? "")}
                    onChange={(v) => setFixedAnswers((p) => ({ ...p, [q.id]: v }))}
                    placeholder={q.placeholder}
                    missingDate={missingDates[q.id]}
                    onMissingDate={(d) => setMissingDates((p) => ({ ...p, [q.id]: d }))}
                  />
                  {/* Multiple LinkedIn URLs after founders question */}
                  {q.id === "founders" && (
                    <div className="space-y-2 pl-1">
                      <p className="text-xs text-gray-400 font-medium">LinkedIn URLs</p>
                      {linkedinUrls.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <input type="url" value={url}
                            onChange={(e) => setLinkedinUrls((p) => p.map((u, j) => j === i ? e.target.value : u))}
                            placeholder="https://linkedin.com/in/..."
                            className="flex-1 h-9 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:border-gray-400" />
                          {linkedinUrls.length > 1 && (
                            <button onClick={() => setLinkedinUrls((p) => p.filter((_, j) => j !== i))}
                              className="text-gray-400 hover:text-red-500 px-1"><X size={13} /></button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setLinkedinUrls((p) => [...p, ""])}
                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                        + Add another LinkedIn
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Collapsible AI questions */}
            {aiQuestions.length > 0 && (
              <div>
                <button onClick={() => setShowAiQ(!showAiQ)}
                  className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
                  {showAiQ ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  {showAiQ ? "Hide additional questions" : `Show ${aiQuestions.length} additional question${aiQuestions.length > 1 ? "s" : ""}`}
                </button>
                {showAiQ && (
                  <div className="mt-3 space-y-4 pl-1 border-l-2 border-indigo-100">
                    {aiQuestions.map((q, i) => (
                      <AnswerField key={i} category="Additional" question={q}
                        value={aiAnswers[i]?.text ?? ""}
                        onChange={(v) => setAiAnswers((p) => p.map((a, j) => j === i ? { ...a, text: v } : a))} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Step 4: Assessment ── */}
        {step === 4 && !processing && (
          <section className="space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-950 mb-1">Your assessment</h2>
              <p className="text-sm text-gray-400">Rate this opportunity and explain your reasoning.</p>
            </div>

            {/* Rating buttons */}
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-950 mb-3">
                Investment rating <span className="text-red-500">*</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                {RATING_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setInvestmentRating(opt.value)}
                    className={`flex items-center gap-3 border rounded-xl p-3 text-left transition-all ${investmentRating === opt.value ? `${opt.bg} ${opt.border} border-2` : "border-gray-200 hover:border-gray-300"}`}>
                    <span className={`text-xl font-bold w-7 shrink-0 ${investmentRating === opt.value ? opt.color : "text-gray-300"}`}>{opt.value}</span>
                    <p className={`text-xs font-semibold ${investmentRating === opt.value ? opt.color : "text-gray-600"}`}>{opt.label}</p>
                    {investmentRating === opt.value && <Check size={14} className={`ml-auto shrink-0 ${opt.color}`} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating reason — voice + AI writeup */}
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-950">Why this rating?</p>
                <p className="text-xs text-gray-400">Voice or type</p>
              </div>

              {/* Voice recorder */}
              <div className="flex items-center gap-3">
                {ratingProcessing ? (
                  <div className="flex items-center gap-2 text-sm text-indigo-600">
                    <Loader2 size={14} className="animate-spin" />
                    Transcribing &amp; writing rationale…
                  </div>
                ) : ratingRecording ? (
                  <>
                    <button onClick={stopRatingRecording}
                      className="flex items-center gap-2 h-8 px-3 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors">
                      <StopCircle size={12} /> Stop
                    </button>
                    <span className={`text-sm font-mono font-semibold tabular-nums ${ratingTimeLeft < 30 ? "text-red-500" : "text-gray-600"}`}>
                      {fmtTime(ratingTimeLeft)}
                    </span>
                    <span className="text-xs text-red-500 animate-pulse">● Recording</span>
                  </>
                ) : (
                  <button onClick={startRatingRecording}
                    className="flex items-center gap-2 h-8 px-3 bg-gray-950 hover:bg-gray-800 text-white text-xs font-medium rounded-lg transition-colors">
                    <Mic size={13} />
                    {ratingRaw ? "Re-record" : "Record rationale"}
                  </button>
                )}
              </div>

              {/* Show AI polished vs raw if both exist */}
              {showRatingVersions && ratingPolished && ratingRaw && (
                <div className="space-y-2">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={10} /> AI investment rationale
                      </span>
                      <button onClick={() => { setRatingReason(ratingPolished); setShowRatingVersions(false); }}
                        className="text-xs text-emerald-700 font-semibold hover:underline">Use this</button>
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">{ratingPolished}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 opacity-60">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400">Raw transcript</span>
                      <button onClick={() => { setRatingReason(ratingRaw); setShowRatingVersions(false); }}
                        className="text-xs text-gray-400 hover:underline">Use this</button>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{ratingRaw}</p>
                  </div>
                </div>
              )}

              {/* Editable textarea — pre-filled from voice or type manually */}
              <textarea
                value={ratingReason}
                onChange={(e) => { setRatingReason(e.target.value); setShowRatingVersions(false); }}
                placeholder="What makes this compelling or concerning? Specific evidence, founder impressions, market timing…"
                rows={4}
                className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-gray-400 transition-colors"
              />
            </div>
          </section>
        )}

        {/* Step 5: Done */}
        {step === 5 && (
          <section className="rounded-xl border border-gray-100 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-950">Submitted to Quanta</h2>
            <p className="mt-2 text-sm text-gray-500">{reviewFields.startup_name || "Your startup"} is now in the review queue.</p>
            <Link href="/scout" className="mt-6 flex h-11 items-center justify-center rounded-xl bg-gray-950 text-sm font-medium text-white hover:bg-gray-800 transition-colors">Back to Home</Link>
            <Link href="/add-startup" className="mt-3 block text-sm text-indigo-600 hover:text-indigo-700">Submit another →</Link>
          </section>
        )}

        {/* Navigation */}
        {step < 5 && !processing && (
          <div className="mt-6 space-y-2">
            <div className="flex gap-3">
              <button onClick={() => { setError(""); setStep((s) => Math.max(1, s - 1) as Step); }} disabled={step === 1 || navigating}
                className="h-11 w-20 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors shrink-0">Back</button>
              {step === 4
                ? <button onClick={handleSubmit} disabled={navigating} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors">
                    {navigating ? <><Loader2 size={14} className="animate-spin" />Submitting…</> : <><Send size={14} />Submit to Quanta</>}
                  </button>
                : <button onClick={handleContinue} disabled={navigating} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gray-950 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors">
                    {navigating ? <><Loader2 size={14} className="animate-spin" />Please wait…</> : <>Continue<ArrowRight size={14} /></>}
                  </button>
              }
            </div>
            {step >= 2 && (
              <button onClick={saveDraft} disabled={savingDraft} className={`w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium transition-all border ${draftSaved ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}>
                {savingDraft ? <><Loader2 size={13} className="animate-spin" />Saving…</> : draftSaved ? <><BookmarkCheck size={14} />Draft saved</> : <><BookmarkCheck size={14} />Save as Draft</>}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

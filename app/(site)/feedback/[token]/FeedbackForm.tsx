"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type {
  Answers,
  AnswerValue,
  FeedbackForm as FormDef,
  Question,
} from "@/lib/feedback/questions";
import { submitFeedback, type SubmitResult } from "./actions";

// ---------------------------------------------------------------------------
// Scale (rating / nps) — a row of numbered chips.
// ---------------------------------------------------------------------------
function ScalePicker({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const s = q.scale!;
  const nums = [];
  for (let i = s.min; i <= s.max; i++) nums.push(i);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {nums.map((n) => (
          <button
            key={n}
            type="button"
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={cn(
              "h-9 min-w-9 rounded-lg border px-2 font-mono text-sm tabular-nums transition-colors",
              value === n
                ? "border-orange bg-orange text-court"
                : "border-bone/15 bg-court text-bone/70 hover:border-orange/40",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      {(s.minLabel || s.maxLabel) && (
        <div className="mt-1.5 flex justify-between text-caption text-bone/40">
          <span>{s.minLabel}</span>
          <span>{s.maxLabel}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single / multi choice — pill buttons.
// ---------------------------------------------------------------------------
function ChoicePicker({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
  const multi = q.type === "multi";
  const selected = new Set<string>(
    multi ? (Array.isArray(value) ? value : []) : value ? [value as string] : [],
  );

  function toggle(opt: string) {
    if (multi) {
      const next = new Set(selected);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      onChange(q.options!.filter((o) => next.has(o)));
    } else {
      onChange(opt);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {q.options!.map((opt) => {
        const on = selected.has(opt);
        return (
          <button
            key={opt}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(opt)}
            className={cn(
              "rounded-lg border px-3.5 py-2 text-sm transition-colors",
              on
                ? "border-orange bg-orange/15 text-bone"
                : "border-bone/15 bg-court text-bone/70 hover:border-orange/40",
            )}
          >
            {multi ? (on ? "✓ " : "") : ""}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// One question block.
// ---------------------------------------------------------------------------
function Field({
  q,
  value,
  onChange,
  invalid,
}: {
  q: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  invalid: boolean;
}) {
  const compact = !!q.group && (q.type === "rating" || q.type === "nps");
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4 transition-colors sm:p-5",
        invalid ? "border-danger/50" : "border-bone/10",
        compact && "sm:flex sm:items-center sm:justify-between sm:gap-4",
      )}
    >
      <label className={cn("block text-bone", compact ? "sm:mb-0 mb-3" : "mb-3")}>
        <span className="text-[15px] leading-snug">{q.label}</span>
        {q.required ? (
          <span className="ml-1 text-orange" aria-hidden>
            *
          </span>
        ) : (
          <span className="ml-2 text-caption text-bone/35">optional</span>
        )}
      </label>

      {q.type === "rating" || q.type === "nps" ? (
        <ScalePicker
          q={q}
          value={value as number | undefined}
          onChange={onChange}
        />
      ) : q.type === "single" || q.type === "multi" ? (
        <ChoicePicker q={q} value={value} onChange={onChange} />
      ) : (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          rows={3}
          maxLength={2000}
          className="w-full resize-y rounded-lg border border-bone/15 bg-court px-3 py-2 text-[15px] text-bone outline-none placeholder:text-bone/30 focus-visible:border-orange"
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Form.
// ---------------------------------------------------------------------------
function isEmpty(v: AnswerValue | undefined): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim().length === 0;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

export default function FeedbackForm({
  token,
  form,
  name,
}: {
  token: string;
  form: FormDef;
  name: string;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const required = useMemo(
    () => form.questions.filter((q) => q.required).map((q) => q.id),
    [form],
  );

  // Question ids that open a new section (first question carrying each heading).
  const sectionHeads = useMemo(() => {
    const heads = new Map<string, string>();
    let last: string | undefined;
    for (const q of form.questions) {
      if (q.section && q.section !== last) heads.set(q.id, q.section);
      if (q.section) last = q.section;
    }
    return heads;
  }, [form]);

  function set(id: string, v: AnswerValue) {
    setAnswers((a) => ({ ...a, [id]: v }));
    if (invalid.has(id))
      setInvalid((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const missing = required.filter((id) => isEmpty(answers[id]));
    if (missing.length) {
      setInvalid(new Set(missing));
      setResult({ ok: false, error: `Please answer the ${missing.length} highlighted question${missing.length === 1 ? "" : "s"}.` });
      document.getElementById(`q-${missing[0]}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setSubmitting(true);
    setResult(null);
    const res = await submitFeedback(token, answers);
    setSubmitting(false);
    setResult(res);
    if (res.ok || res.already) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (result?.ok) {
    return (
      <div className="w-full max-w-xl rounded-2xl border border-bone/10 bg-surface p-7 text-center">
        <p className="font-body text-caption font-semibold uppercase tracking-[0.18em] text-orange">
          ETCODE 4 · Feedback
        </p>
        <h1 className="mt-3 font-display text-title uppercase">Thank you.</h1>
        <p className="mt-3 text-bone/65">
          Your feedback is in and it&apos;s anonymous. This is exactly what makes
          the next edition better. See you on the court.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-2xl">
      <p className="font-body text-caption font-semibold uppercase tracking-[0.18em] text-orange">
        ETCODE 4 · Feedback
      </p>
      <h1 className="mt-2 font-display text-statement uppercase">{form.title}</h1>
      <p className="mt-3 max-w-prose text-bone/60">
        Hi {name.split(" ")[0] || "there"} — {form.intro}
      </p>

      {result && !result.ok ? (
        <p role="alert" className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {result.error}
        </p>
      ) : null}

      <div className="mt-7 flex flex-col gap-3">
        {form.questions.map((q) => {
          const sectionHead = sectionHeads.get(q.id);
          return (
            <div key={q.id} id={`q-${q.id}`}>
              {sectionHead ? (
                <h2 className="mb-2 mt-5 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/45">
                  {sectionHead}
                </h2>
              ) : null}
              <Field
                q={q}
                value={answers[q.id]}
                onChange={(v) => set(q.id, v)}
                invalid={invalid.has(q.id)}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="text-caption text-bone/40">
          <span className="text-orange">*</span> required · responses are anonymous
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-orange px-6 py-3 font-body text-caption font-semibold uppercase tracking-[0.16em] text-court transition-opacity disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Submit feedback →"}
        </button>
      </div>
    </form>
  );
}

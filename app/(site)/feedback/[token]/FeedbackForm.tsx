"use client";

import { useMemo, useState } from "react";
import { Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  Answers,
  AnswerValue,
  FeedbackForm as FormDef,
  Question,
} from "@/lib/feedback/questions";
import { submitFeedback, type SubmitResult } from "./actions";

function scalePoints(q: Question): number[] {
  const s = q.scale!;
  const out: number[] = [];
  for (let i = s.min; i <= s.max; i++) out.push(i);
  return out;
}

function ScaleHints({ q }: { q: Question }) {
  const s = q.scale!;
  if (!s.minLabel && !s.maxLabel) return null;
  return (
    <div className="mt-1.5 flex justify-between text-caption text-bone/40">
      <span>{s.minLabel}</span>
      <span>{s.maxLabel}</span>
    </div>
  );
}

// Cumulative numeric rating (1 to 5): hovering or selecting N fills 1..N, like
// a rating bar but with plain numbers, interactive, no icons.
function RatingScale({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value || 0;
  return (
    <div>
      <div className="flex gap-1.5" onMouseLeave={() => setHover(0)}>
        {scalePoints(q).map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} of ${q.scale!.max}`}
            aria-pressed={value === n}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className={cn(
              "h-11 flex-1 rounded-lg border font-mono text-sm tabular-nums transition-all duration-150",
              n <= active
                ? "border-orange bg-orange/20 text-bone"
                : "border-bone/15 bg-court text-bone/55 hover:border-orange/40",
              value === n && "ring-1 ring-orange",
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <ScaleHints q={q} />
    </div>
  );
}

// Discrete numbered chips for NPS (0 to 10 standard: pick exactly one).
function ChipScale({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {scalePoints(q).map((n) => (
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
      <ScaleHints q={q} />
    </div>
  );
}

function ScalePicker(props: {
  q: Question;
  value: number | undefined;
  onChange: (v: number) => void;
}) {
  return props.q.type === "nps" ? (
    <ChipScale {...props} />
  ) : (
    <RatingScale {...props} />
  );
}

// ---------------------------------------------------------------------------
// Rating matrix: a run of grouped 1 to 5 questions, rendered as aligned rows
// with one shared legend. Each row has its own cumulative hover fill.
// ---------------------------------------------------------------------------
function RatingRow({
  q,
  value,
  onChange,
  invalid,
}: {
  q: Question;
  value: number | undefined;
  onChange: (v: number) => void;
  invalid: boolean;
}) {
  const [hover, setHover] = useState(0);
  const active = hover || value || 0;
  return (
    <div
      id={`q-${q.id}`}
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg px-2 py-2.5 transition-colors -mx-2",
        invalid && "bg-danger/10",
      )}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 text-[15px] leading-snug",
          invalid ? "text-danger" : value ? "text-bone" : "text-bone/85",
        )}
      >
        {value ? <Check className="size-4 shrink-0 text-orange" aria-hidden /> : null}
        {q.label}
        {q.required ? <span className="text-orange" aria-hidden>*</span> : null}
      </span>
      <div className="flex shrink-0 gap-1.5" onMouseLeave={() => setHover(0)}>
        {scalePoints(q).map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${q.label}: ${n} of ${q.scale!.max}`}
            aria-pressed={value === n}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            className={cn(
              "size-9 rounded-md border font-mono text-sm tabular-nums transition-all duration-150 hover:scale-105",
              n <= active
                ? "border-orange bg-orange/20 text-bone"
                : "border-bone/15 bg-court text-bone/55 hover:border-orange/40",
              value === n && "bg-orange text-court",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function RatingMatrix({
  questions,
  answers,
  onChange,
  invalid,
  sectionHead,
}: {
  questions: Question[];
  answers: Answers;
  onChange: (id: string, v: number) => void;
  invalid: Set<string>;
  sectionHead?: string;
}) {
  const s = questions[0]?.scale;
  const rated = questions.filter((q) => answers[q.id] != null).length;
  return (
    <div>
      {sectionHead ? (
        <h2 className="mb-2 mt-5 font-body text-caption font-semibold uppercase tracking-[0.16em] text-bone/45">
          {sectionHead}
        </h2>
      ) : null}
      <div className="rounded-xl border border-bone/10 bg-surface p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between text-caption text-bone/45">
          <span>
            {s?.minLabel ?? "Low"} <span className="text-bone/30">1 → 5</span>{" "}
            {s?.maxLabel ?? "High"}
          </span>
          <span className="tabular-nums">{rated}/{questions.length} rated</span>
        </div>
        <div className="flex flex-col divide-y divide-bone/8">
          {questions.map((q) => (
            <RatingRow
              key={q.id}
              q={q}
              value={answers[q.id] as number | undefined}
              onChange={(v) => onChange(q.id, v)}
              invalid={invalid.has(q.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single / multi choice: pill buttons.
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
              "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-sm transition-colors",
              on
                ? "border-orange bg-orange/15 text-bone"
                : "border-bone/15 bg-court text-bone/70 hover:border-orange/40",
            )}
          >
            {multi && on ? <Check className="size-3.5 text-orange" aria-hidden /> : null}
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
  answered,
}: {
  q: Question;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
  invalid: boolean;
  answered: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4 transition-colors sm:p-5",
        invalid
          ? "border-danger/50"
          : answered
            ? "border-orange/30"
            : "border-bone/10",
      )}
    >
      <label className="mb-3 flex items-start gap-1.5 text-bone">
        {answered ? (
          <Check className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />
        ) : null}
        <span className="text-[15px] leading-snug">
          {q.label}
          {q.required ? (
            <span className="ml-1 text-orange" aria-hidden>
              *
            </span>
          ) : (
            <span className="ml-2 text-caption text-bone/35">optional</span>
          )}
        </span>
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
}: {
  token: string;
  form: FormDef;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [invalid, setInvalid] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);

  const required = useMemo(
    () => form.questions.filter((q) => q.required).map((q) => q.id),
    [form],
  );

  // Live progress over all questions (answered = non-empty).
  const answeredCount = form.questions.filter((q) => !isEmpty(answers[q.id])).length;
  const progress = Math.round((answeredCount / form.questions.length) * 100);

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
      <p className="mt-3 max-w-prose text-bone/60">{form.intro}</p>

      {/* clear up the personal-link vs anonymous confusion */}
      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-bone/10 bg-surface px-4 py-3">
        <Lock className="mt-0.5 size-4 shrink-0 text-orange" aria-hidden />
        <p className="text-sm text-bone/65">
          <span className="font-semibold text-bone">Your answers are anonymous.</span>{" "}
          This link is personal only so you can submit once and we can track how
          many people replied, we never attach your name to your responses.
        </p>
      </div>

      {/* live progress */}
      <div className="sticky top-0 z-10 -mx-1 mt-5 bg-court/85 px-1 py-2 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="h-1.5 grow overflow-hidden rounded-full bg-surface">
            <div
              className="h-full bg-orange transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-caption tabular-nums text-bone/50">
            {answeredCount}/{form.questions.length}
          </span>
        </div>
      </div>

      {result && !result.ok ? (
        <p role="alert" className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {result.error}
        </p>
      ) : null}

      <div className="mt-7 flex flex-col gap-3">
        {(() => {
          const out: React.ReactNode[] = [];
          const qs = form.questions;
          for (let i = 0; i < qs.length; ) {
            const q = qs[i];
            const sectionHead = sectionHeads.get(q.id);
            // collapse a run of same-group rating rows into one aligned matrix
            if (q.group) {
              const run: Question[] = [];
              const g = q.group;
              while (i < qs.length && qs[i].group === g) run.push(qs[i++]);
              out.push(
                <RatingMatrix
                  key={g}
                  questions={run}
                  answers={answers}
                  onChange={set}
                  invalid={invalid}
                  sectionHead={sectionHead}
                />,
              );
              continue;
            }
            out.push(
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
                  answered={!isEmpty(answers[q.id])}
                />
              </div>,
            );
            i++;
          }
          return out;
        })()}
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

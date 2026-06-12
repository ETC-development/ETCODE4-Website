"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { joinTeamSchema, type JoinTeamValues } from "@/lib/schema";
import { joinTeam, verifyTeamCode } from "@/lib/actions";
import ParticipantFields from "./ParticipantFields";
import FormError from "./FormError";
import Field from "@/components/ui/Field";
import Button from "@/components/ui/Button";
import BasketballProgress from "@/components/ui/BasketballProgress";
import BallLoader from "@/components/ui/BallLoader";

const STEPS = ["Code", "Details"];
const EASE = [0.16, 1, 0.3, 1] as const;

export default function JoinTeamForm({ initialCode }: { initialCode?: string }) {
  const methods = useForm<JoinTeamValues>({
    resolver: zodResolver(joinTeamSchema),
    mode: "onTouched",
  });
  const [step, setStep] = useState(0);
  const [verifying, setVerifying] = useState(false);
  const [team, setTeam] = useState<{ name?: string; remaining?: number } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
    setValue,
    setError,
    formState: { isSubmitting, errors },
  } = methods;

  const findTeam = useCallback(
    async (override?: string) => {
      setServerError(null);
      if (override !== undefined) setValue("team_code", override);
      if (!(await trigger("team_code"))) return;
      setVerifying(true);
      const res = await verifyTeamCode(override ?? getValues("team_code"));
      setVerifying(false);
      if (!res.ok) {
        setError("team_code", { message: res.error });
        return;
      }
      setTeam({ name: res.team, remaining: res.remaining });
      setStep(1);
    },
    [setValue, trigger, getValues, setError],
  );

  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !initialCode) return;
    autoRan.current = true;
    void findTeam(initialCode);
  }, [initialCode, findTeam]);

  const onSubmit = async (values: JoinTeamValues) => {
    setServerError(null);
    const res = await joinTeam(values);
    if (res && !res.ok) setServerError(res.error);
  };

  return (
    <FormProvider {...methods}>
      <BasketballProgress steps={STEPS} current={step} />

      <div className="relative mt-10">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
        {serverError && <FormError message={serverError} />}

        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col gap-6"
            >
              <Field
                label="Team code"
                placeholder="ET4-7KQ2X"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="font-display text-lg uppercase tracking-[0.25em]"
                hint="Get this from your team leader."
                error={errors.team_code?.message as string | undefined}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    findTeam();
                  }
                }}
                {...register("team_code")}
              />
              <div className="flex justify-end">
                <Button type="button" onClick={() => findTeam()} disabled={verifying} magnetic={0.3}>
                  {verifying ? "Checking…" : "Find my team →"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col gap-8"
            >
              {team?.name && (
                <div className="flex items-center gap-4 rounded-xl border border-orange/30 bg-orange/10 px-5 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange font-display text-court">
                    ✓
                  </span>
                  <p className="font-body text-body text-bone/90">
                    Joining <span className="font-semibold text-bone">{team.name}</span>
                    {typeof team.remaining === "number" && (
                      <>, {team.remaining} {team.remaining === 1 ? "spot" : "spots"} open.</>
                    )}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-6 font-body text-caption uppercase tracking-[0.2em] text-chalk/55">
                  Your details
                </p>
                <ParticipantFields />
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-chalk/12 pt-7">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="font-body text-caption uppercase tracking-[0.18em] text-chalk/60 transition-colors hover:text-bone"
                >
                  ← Change code
                </button>
                <Button type="submit" disabled={isSubmitting} magnetic={0.3}>
                  {isSubmitting ? "Signing…" : "Sign with the team →"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

        <AnimatePresence>
          {verifying && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              role="status"
              aria-live="polite"
              className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-court/70 backdrop-blur-sm"
            >
              <BallLoader size={32} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FormProvider>
  );
}

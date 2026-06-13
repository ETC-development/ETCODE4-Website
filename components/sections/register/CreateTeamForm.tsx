"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTeamSchema, type CreateTeamValues } from "@/lib/schema";
import { createTeam } from "@/lib/actions";
import ParticipantFields from "./ParticipantFields";
import FormError from "./FormError";
import Field from "@/components/ui/Field";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import BasketballProgress from "@/components/ui/BasketballProgress";

const STEPS = ["Team", "Leader"];
const EASE = [0.16, 1, 0.3, 1] as const;

export default function CreateTeamForm() {
  const methods = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    mode: "onTouched",
  });
  const [step, setStep] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    trigger,
    formState: { isSubmitting, errors },
  } = methods;

  const next = async () => {
    if (await trigger(["team_name", "motivation"])) setStep(1);
  };

  const onSubmit = async (values: CreateTeamValues) => {
    setServerError(null);
    const res = await createTeam(values);
    if (res && !res.ok) setServerError(res.error);
  };

  return (
    <FormProvider {...methods}>
      <BasketballProgress steps={STEPS} current={step} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-10 flex flex-col gap-8">
        {serverError && <FormError message={serverError} />}

        <AnimatePresence mode="wait" initial={false}>
          {step === 0 ? (
            <motion.div
              key="team"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col gap-6"
            >
              <Field
                label="Team name"
                placeholder="xG10"
                autoComplete="off"
                hint="This is how your squad shows on the scoreboard."
                error={errors.team_name?.message as string | undefined}
                {...register("team_name")}
              />
              <Textarea
                label="Why your team's in (Motivation)"
                placeholder="What's your team about? Why ETCODE 4?"
                hint="This is your captain's pitch."
                error={errors.motivation?.message as string | undefined}
                {...register("motivation")}
              />
              <div className="flex justify-end">
                <Button type="button" onClick={next} magnetic={0.3}>
                  Next: your details →
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="leader"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col gap-8"
            >
              <div>
                <p className="mb-6 font-body text-caption uppercase tracking-[0.2em] text-chalk/55">
                  Leader details
                </p>
                <ParticipantFields />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-chalk/12 pt-7">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="font-body text-caption uppercase tracking-[0.18em] text-chalk/60 transition-colors hover:text-bone"
                >
                  ← Back
                </button>
                <Button type="submit" disabled={isSubmitting} magnetic={0.3}>
                  {isSubmitting ? "Drafting…" : "Draft your roster →"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </FormProvider>
  );
}

"use client";

import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { soloSchema, type SoloValues } from "@/lib/schema";
import { registerSolo } from "@/lib/actions";
import ParticipantFields from "./ParticipantFields";
import FormError from "./FormError";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

export default function SoloForm() {
  const methods = useForm<SoloValues>({
    resolver: zodResolver(soloSchema),
    mode: "onTouched",
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const onSubmit = async (values: SoloValues) => {
    setServerError(null);
    const res = await registerSolo(values);
    if (res && !res.ok) setServerError(res.error);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-8">
        {serverError && <FormError message={serverError} />}
        <ParticipantFields />
        <Textarea
          label="Why you're in (Motivation)"
          placeholder="What's your background? Why ETCODE 4?"
          hint="This helps admins draft you onto the right team."
          error={errors.motivation?.message as string | undefined}
          {...register("motivation")}
        />
        <div className="flex flex-col items-start gap-5 border-t border-chalk/12 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[40ch] font-body text-caption leading-relaxed text-chalk/55">
            Admins draft free agents onto teams. Priority goes to complete teams of 3.
          </p>
          <Button type="submit" disabled={isSubmitting} magnetic={0.3}>
            {isSubmitting ? "Signing…" : "Register solo →"}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

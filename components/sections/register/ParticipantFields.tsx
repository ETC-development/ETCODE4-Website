"use client";

import { AnimatePresence, motion } from "motion/react";
import { useFormContext } from "react-hook-form";
import Field from "@/components/ui/Field";
import Select from "@/components/ui/Select";
import { INSTITUTIONS, STUDY_YEARS, TSHIRT_SIZES } from "@/lib/schema";

export default function ParticipantFields() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();
  const err = (k: string) => errors[k]?.message as string | undefined;
  const showOther = watch("institution") === "Other";

  return (
    <div className="flex flex-col gap-5">
      <Field
        label="Full name"
        placeholder="Yassir Cherdouh"
        autoComplete="name"
        error={err("full_name")}
        {...register("full_name")}
      />
      <Field
        label="Email"
        type="email"
        placeholder="student.email@school.dz"
        autoComplete="email"
        error={err("email")}
        {...register("email")}
      />
      <Field
        label="Phone"
        type="tel"
        placeholder="05 55 55 55 55"
        autoComplete="tel"
        error={err("phone")}
        {...register("phone")}
      />

      <Select
        label="Institution"
        placeholder="Pick your school"
        options={INSTITUTIONS}
        error={err("institution")}
        {...register("institution")}
      />
      <AnimatePresence initial={false}>
        {showOther && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <Field
              label="Which institution?"
              placeholder="Your school or university"
              error={err("institution_other")}
              {...register("institution_other")}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <Select
        label="Study year"
        placeholder="Pick a year"
        options={STUDY_YEARS}
        error={err("study_year")}
        {...register("study_year")}
      />
      <Field
        label="LeetCode"
        optional
        type="url"
        placeholder="https://leetcode.com/u/you"
        autoComplete="off"
        error={err("leetcode")}
        {...register("leetcode")}
      />
      <Field
        label="HackerRank"
        optional
        type="url"
        placeholder="https://hackerrank.com/profile/you"
        autoComplete="off"
        error={err("hackerrank")}
        {...register("hackerrank")}
      />
      <Field
        label="GitHub"
        optional
        type="url"
        placeholder="https://github.com/you"
        autoComplete="off"
        error={err("github")}
        {...register("github")}
      />
      <Select
        label="T-shirt size"
        optional
        placeholder="Pick a size"
        options={TSHIRT_SIZES}
        error={err("tshirt_size")}
        {...register("tshirt_size")}
      />

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
        {...register("website")}
      />
    </div>
  );
}

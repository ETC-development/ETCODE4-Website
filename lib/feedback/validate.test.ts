import { describe, expect, it } from "vitest";
import { validateAnswers } from "./validate";
import { getForm } from "./questions";

const organizer = getForm("contributor", "organizer");

function filled(): Record<string, unknown> {
  // a complete, valid set of organizer answers
  return {
    overall_experience: 4,
    organization_quality: 5,
    core_communication: 3,
    nps: 9,
    contribute_again: "Yes", // single-choice string — the regression case
    org_workload: "Balanced",
    org_role_clarity: 4,
    org_tools: 5,
    org_coordination: 4,
    org_bottleneck: "scheduling",
    org_keep: "the energy",
  };
}

describe("validateAnswers", () => {
  it("accepts a single-choice string answer (does not treat 'Yes' as an error)", () => {
    const res = validateAnswers(organizer, filled());
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.answers.contribute_again).toBe("Yes");
      expect(res.answers.org_workload).toBe("Balanced");
      expect(res.answers.nps).toBe(9);
    }
  });

  it("flags a missing required question", () => {
    const a = filled();
    delete a.contribute_again;
    const res = validateAnswers(organizer, a);
    expect(res.ok).toBe(false);
  });

  it("rejects an out-of-range rating", () => {
    const res = validateAnswers(organizer, { ...filled(), org_tools: 9 });
    expect(res.ok).toBe(false);
  });

  it("rejects a single-choice value not in options", () => {
    const res = validateAnswers(organizer, { ...filled(), contribute_again: "Definitely" });
    expect(res.ok).toBe(false);
  });

  it("keeps multi-select answers as a de-duplicated array", () => {
    const participant = getForm("participant", null);
    const res = validateAnswers(participant, {
      nps: 10,
      overall_satisfaction: 5,
      met_expectations: 4,
      aspect_problems: 5,
      aspect_difficulty: 4,
      aspect_organization: 5,
      aspect_venue: 4,
      aspect_food: 3,
      aspect_mentorship: 4,
      aspect_schedule: 4,
      aspect_platform: 5,
      difficulty_level: "Just right",
      best_part: ["The challenges", "The atmosphere", "The challenges"],
      return_intent: "Yes",
      discovery_channel: "Instagram",
      one_word: "intense",
      improve_most: "more food",
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.answers.best_part).toEqual(["The challenges", "The atmosphere"]);
    }
  });
});

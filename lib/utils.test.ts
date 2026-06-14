import { describe, it, expect } from "vitest";
import {
  genTeamCode,
  normalizeTeamCode,
  pad2,
  countdownTo,
} from "./utils";

describe("genTeamCode", () => {
  it("matches ET4-XXXXX with the unambiguous alphabet", () => {
    for (let i = 0; i < 300; i++) {
      expect(genTeamCode()).toMatch(/^ET4-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{5}$/);
    }
  });

  it("honors a custom length", () => {
    expect(genTeamCode(8)).toMatch(/^ET4-[A-Z0-9]{8}$/);
  });
});

describe("normalizeTeamCode", () => {
  it("trims and uppercases", () => {
    expect(normalizeTeamCode("  et4-7kq2x ")).toBe("ET4-7KQ2X");
  });
});

describe("pad2", () => {
  it("pads, keeps two digits, and clamps negatives", () => {
    expect(pad2(3)).toBe("03");
    expect(pad2(12)).toBe("12");
    expect(pad2(-1)).toBe("00");
  });
});

describe("countdownTo", () => {
  it("computes the remaining breakdown", () => {
    const from = Date.parse("2026-01-01T00:00:00Z");
    const d = countdownTo("2026-01-02T01:02:03Z", from);
    expect([d.days, d.hours, d.minutes, d.seconds]).toEqual([1, 1, 2, 3]);
    expect(d.done).toBe(false);
  });

  it("flags done once the target is in the past", () => {
    const from = Date.parse("2026-01-03T00:00:00Z");
    expect(countdownTo("2026-01-02T00:00:00Z", from).done).toBe(true);
  });
});

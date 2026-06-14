import { describe, it, expect } from "vitest";
import { roleAtLeast } from "./roles";

describe("roleAtLeast (admin role matrix)", () => {
  it("super_admin satisfies every minimum", () => {
    expect(roleAtLeast("super_admin", "super_admin")).toBe(true);
    expect(roleAtLeast("super_admin", "manager")).toBe(true);
    expect(roleAtLeast("super_admin", "hr_checkin")).toBe(true);
  });

  it("manager is below super_admin but at/above hr_checkin", () => {
    expect(roleAtLeast("manager", "super_admin")).toBe(false);
    expect(roleAtLeast("manager", "manager")).toBe(true);
    expect(roleAtLeast("manager", "hr_checkin")).toBe(true);
  });

  it("hr_checkin only satisfies hr_checkin", () => {
    expect(roleAtLeast("hr_checkin", "hr_checkin")).toBe(true);
    expect(roleAtLeast("hr_checkin", "manager")).toBe(false);
    expect(roleAtLeast("hr_checkin", "super_admin")).toBe(false);
  });
});

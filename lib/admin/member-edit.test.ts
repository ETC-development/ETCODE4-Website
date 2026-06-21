import { describe, it, expect } from "vitest";
import { memberEditSchema } from "./member-edit";

describe("memberEditSchema (super-admin member edit)", () => {
  const ok = {
    full_name: "Amina Belkacem",
    email: "amina@example.com",
  };

  it("accepts a minimal name + email and nulls every optional field", () => {
    const r = memberEditSchema.parse(ok);
    expect(r.full_name).toBe("Amina Belkacem");
    expect(r.email).toBe("amina@example.com");
    expect(r.phone).toBeNull();
    expect(r.institution).toBeNull();
    expect(r.motivation).toBeNull();
    expect(r.tshirt_size).toBeNull();
  });

  it("requires a non-empty name", () => {
    expect(memberEditSchema.safeParse({ ...ok, full_name: "   " }).success).toBe(false);
  });

  it("requires a valid email", () => {
    expect(memberEditSchema.safeParse({ ...ok, email: "not-an-email" }).success).toBe(false);
  });

  it("lowercases and trims the email", () => {
    const r = memberEditSchema.parse({ ...ok, email: "  Amina@Example.COM " });
    expect(r.email).toBe("amina@example.com");
  });

  it("trims name and turns blank optionals into null", () => {
    const r = memberEditSchema.parse({
      ...ok,
      full_name: "  Yacine  ",
      phone: "   ",
      github: "",
    });
    expect(r.full_name).toBe("Yacine");
    expect(r.phone).toBeNull();
    expect(r.github).toBeNull();
  });

  it("keeps provided optional values", () => {
    const r = memberEditSchema.parse({ ...ok, phone: "0555", tshirt_size: "L" });
    expect(r.phone).toBe("0555");
    expect(r.tshirt_size).toBe("L");
  });
});

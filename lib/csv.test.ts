import { describe, it, expect } from "vitest";
import { csv, csvCell } from "./csv";

describe("csvCell", () => {
  it("passes plain values through", () => {
    expect(csvCell("hello")).toBe("hello");
    expect(csvCell(42)).toBe("42");
  });

  it("blanks null/undefined", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("quotes commas, quotes, and newlines; doubles embedded quotes", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('he said "hi"')).toBe('"he said ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
  });

  it("neutralizes formula-injection prefixes", () => {
    expect(csvCell("=1+1")).toBe("'=1+1");
    expect(csvCell("+1234567")).toBe("'+1234567");
    expect(csvCell("-cmd")).toBe("'-cmd");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("=1,2")).toBe('"\'=1,2"');
    expect(csvCell("safe-name")).toBe("safe-name");
  });
});

describe("csv", () => {
  it("joins rows with CRLF and cells with commas", () => {
    expect(csv([["a", "b"], ["c", "d"]])).toBe("a,b\r\nc,d");
  });

  it("escapes within the grid", () => {
    expect(csv([["x,y", "z"]])).toBe('"x,y",z');
  });
});

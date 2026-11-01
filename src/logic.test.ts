import { describe, expect, it } from "vitest";
import { BAD_BG, BAD_GREEN, BAD_RED, BAD_TEXT, GOOD_TEXT, LEVELS } from "./data/levels";
import { activate, ANSWERS, announce, colorDistance, contrastRatio, hexToRgb, rankFor, simulateDeuteranopia, srItems, starsFor } from "./logic";

describe("the bad design is really bad, and the fix really passes", () => {
  it("open/full colours look different normally but almost identical with deuteranopia", () => {
    const normal = colorDistance(hexToRgb(BAD_GREEN), hexToRgb(BAD_RED));
    const deut = colorDistance(simulateDeuteranopia(BAD_GREEN), simulateDeuteranopia(BAD_RED));
    expect(normal).toBeGreaterThan(70);
    expect(deut).toBeLessThan(8);
  });

  it("the grey text fails WCAG contrast and the fixed text passes AA", () => {
    expect(contrastRatio(BAD_TEXT, BAD_BG)).toBeLessThan(2);
    expect(contrastRatio(GOOD_TEXT, "#ffffff")).toBeGreaterThanOrEqual(4.5);
  });

  it("matches known contrast values", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.48, 1);
  });
});

describe("levels", () => {
  it("every issue has exactly one right answer and a reason for each option", () => {
    for (const l of LEVELS)
      for (const i of l.issues) {
        expect(i.options.filter((o) => o.right), i.id).toHaveLength(1);
        for (const o of i.options) expect(o.why.length).toBeGreaterThan(10);
      }
  });

  it("right answers are not always in the same position", () => {
    const positions = new Set(LEVELS.flatMap((l) => l.issues.map((i) => i.options.findIndex((o) => o.right))));
    expect(positions.size).toBe(3);
  });
});

describe("screen reader", () => {
  const bad = new Set<never>();
  const fixed = new Set(LEVELS.find((l) => l.id === "aisha")!.issues.map((i) => i.id));

  it("the broken page has unlabeled fields and no button", () => {
    const items = srItems(bad);
    expect(items.filter((i) => i.kind === "field").map((i) => i.say)).toEqual(["Edit text.", "Edit text."]);
    expect(items.some((i) => i.kind === "button")).toBe(false);
  });

  it("the fixed page names every field and has a real button", () => {
    const items = srItems(fixed);
    expect(items.find((i) => i.field === "name")!.say).toContain("Full name");
    expect(items.find((i) => i.field === "email")!.say).toContain("Email address");
    expect(items.find((i) => i.kind === "button")!.say).toBe("Book appointment. Button.");
  });

  it("booking works only with the right details", () => {
    const button = srItems(fixed).find((i) => i.kind === "button")!;
    expect(activate(button, {}, fixed)).toEqual({ type: "say", text: "Error. Full name is required." });
    expect(activate(button, { name: ANSWERS.email, email: ANSWERS.email }, fixed).type).toBe("say");
    expect(activate(button, { ...ANSWERS }, fixed)).toEqual({ type: "booked" });
  });

  it("reads field values back", () => {
    const name = srItems(fixed).find((i) => i.field === "name")!;
    expect(announce(name, {})).toBe("Full name. Edit text. Required. Blank.");
    expect(announce(name, { name: "Aisha Khan" })).toBe("Full name. Edit text. Required. Aisha Khan.");
  });
});

describe("scoring", () => {
  it("gives stars and ranks", () => {
    expect(starsFor({ firstTry: 3, total: 3 })).toBe(3);
    expect(starsFor({ firstTry: 0, total: 3 })).toBe(0);
    expect(rankFor(12, 12).title).toBe("Accessibility Champion");
    expect(rankFor(3, 12).title).toBe("Empathy Explorer");
  });
});

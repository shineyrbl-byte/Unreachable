import type { IssueId, Level } from "./data/levels";

/* ───────── Colour maths (used by tests to prove the design choices) ───────── */

const toLinear = (c: number) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (c: number) => {
  const v = Math.max(0, Math.min(1, c));
  return Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055));
};
export const hexToRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** WCAG relative luminance and contrast ratio. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Machado et al. (2009) deuteranopia matrix, applied in linear RGB. The SVG filter uses the same numbers. */
export const DEUTERANOPIA = [
  [0.367322, 0.860646, -0.227968],
  [0.280085, 0.672501, 0.047413],
  [-0.01182, 0.04294, 0.968881],
];
export function simulateDeuteranopia(hex: string): [number, number, number] {
  const lin = hexToRgb(hex).map(toLinear);
  return DEUTERANOPIA.map((row) => toSrgb(row.reduce((s, k, i) => s + k * lin[i], 0))) as [number, number, number];
}
export const colorDistance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));

/* ───────── Screen reader model for Aisha's level ───────── */

export type SrKind = "graphic" | "heading" | "text" | "link" | "field" | "button";
export type FieldKey = "name" | "email";
export interface SrItem {
  kind: SrKind;
  field?: FieldKey;
  /** What the screen reader announces (field values are added at runtime). */
  say: string;
}

export const ANSWERS: Record<FieldKey, string> = { name: "Aisha Khan", email: "aisha.k@mail.com" };

export function srItems(fixed: Set<IssueId>): SrItem[] {
  const alt = fixed.has("altText");
  const labels = fixed.has("labels");
  return [
    { kind: "graphic", say: alt ? "Graphic. CityCare Clinic logo." : "Graphic. IMG_2041.jpg." },
    { kind: fixed.size ? "heading" : "text", say: fixed.size ? "Heading level 1. Book your flu shot." : "Book your flu shot." },
    { kind: "text", say: "Enter your details to finish your booking." },
    { kind: "link", say: fixed.has("linkText") ? "Link. Read our vaccine safety guide." : "Link. Click here." },
    { kind: "field", field: "name", say: labels ? "Full name. Edit text. Required." : "Edit text." },
    { kind: "field", field: "email", say: labels ? "Email address. Edit text. Required." : "Edit text." },
    fixed.has("fakeButton")
      ? { kind: "button", say: "Book appointment. Button." }
      : { kind: "graphic", say: alt ? "Graphic. Book button." : "Graphic. btn_book_final.png." },
    { kind: "text", say: "End of page." },
  ];
}

export function announce(item: SrItem, values: Partial<Record<FieldKey, string>>) {
  if (item.kind !== "field") return item.say;
  const v = values[item.field!];
  return `${item.say} ${v ? v + "." : "Blank."}`;
}

/** Result of pressing Enter on an item. */
export function activate(
  item: SrItem,
  values: Partial<Record<FieldKey, string>>,
  fixed: Set<IssueId>,
): { type: "pick" } | { type: "say"; text: string } | { type: "booked" } {
  switch (item.kind) {
    case "field":
      return { type: "pick" };
    case "button": {
      const missing = (["name", "email"] as FieldKey[]).find((f) => values[f] !== ANSWERS[f]);
      if (!missing) return { type: "booked" };
      const name = missing === "name" ? "Full name" : "Email address";
      return { type: "say", text: values[missing] ? `Error. ${name} doesn't look right.` : `Error. ${name} is required.` };
    }
    case "link":
      return { type: "say", text: fixed.has("linkText") ? "Opening the vaccine safety guide… You come back to the form." : "That opened a page about… something. You come back to the form." };
    case "graphic":
      return { type: "say", text: "Nothing happens. It's just a picture." };
    default:
      return { type: "say", text: item.say };
  }
}

/* ───────── Scoring ───────── */

export interface LevelScore {
  firstTry: number;
  total: number;
}

export function starsFor(score: LevelScore) {
  return score.total ? Math.round((score.firstTry / score.total) * 3) : 0;
}

export function rankFor(firstTry: number, total: number) {
  const pct = total ? firstTry / total : 0;
  if (pct === 1) return { title: "Accessibility Champion", emoji: "🏆" };
  if (pct >= 0.75) return { title: "Inclusive Designer", emoji: "🌟" };
  if (pct >= 0.5) return { title: "Barrier Breaker", emoji: "🔨" };
  return { title: "Empathy Explorer", emoji: "🧭" };
}

export const allIssues = (level: Level) => new Set(level.issues.map((i) => i.id));

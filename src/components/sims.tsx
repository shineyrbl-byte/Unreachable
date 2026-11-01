import { useCallback, useEffect, useRef, useState } from "react";
import type { IssueId } from "../data/levels";
import { activate, announce, ANSWERS, DEUTERANOPIA, srItems, type FieldKey } from "../logic";

/** SVG filter used by CSS `filter: url(#deuteranopia)`, the same matrix the tests use. */
export function FilterDefs() {
  const m = DEUTERANOPIA.map((r) => `${r.join(" ")} 0 0`).join("  ") + "  0 0 0 1 0";
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <filter id="deuteranopia" colorInterpolationFilters="linearRGB">
        <feColorMatrix type="matrix" values={m} />
      </filter>
    </svg>
  );
}

/* ───────── Hand tremor ───────── */

/**
 * Hides the real pointer and draws a shaking one. Mouse and touch clicks land wherever the
 * shaking pointer is, not where the player aimed. Keyboard presses still work, which is the point:
 * many people with tremors use a keyboard or switch, but only if the site supports it.
 */
export function Tremor({ on, children }: { on: boolean; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const real = useRef({ x: -999, y: -999 });
  const offset = useRef({ x: 0, y: 0 });
  const passing = useRef(false);
  const [fake, setFake] = useState({ x: -999, y: -999, inside: false });

  useEffect(() => {
    if (!on) return;
    let raf = 0;
    let spike = { x: 0, y: 0 };
    const start = performance.now();
    const loop = (t: number) => {
      const s = (t - start) / 1000;
      if (Math.random() < 0.025) spike = { x: (Math.random() - 0.5) * 70, y: (Math.random() - 0.5) * 70 };
      spike = { x: spike.x * 0.9, y: spike.y * 0.9 };
      offset.current = {
        // Mostly side-to-side, like many hand tremors.
        x: 22 * Math.sin(s * 29) + 12 * Math.sin(s * 13 + 1.3) + spike.x,
        y: 5 * Math.cos(s * 26) + 3 * Math.sin(s * 11 + 0.4) + spike.y * 0.3,
      };
      setFake((f) => ({ ...f, x: real.current.x + offset.current.x, y: real.current.y + offset.current.y }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [on]);

  const onClickCapture = (e: React.MouseEvent) => {
    if (!on || passing.current || e.detail === 0) return; // detail 0 = keyboard "click"
    e.preventDefault();
    e.stopPropagation();
    // Intention tremor: the shaking gets worse at the moment you try to press.
    const kick = () => (Math.random() - 0.5) * 100;
    const x = real.current.x + offset.current.x + kick();
    const y = real.current.y + offset.current.y + kick() * 0.1;
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el || !box.current?.contains(el)) return;
    passing.current = true;
    el.click();
    passing.current = false;
  };

  const track = (e: React.PointerEvent) => {
    real.current = { x: e.clientX, y: e.clientY };
    setFake((f) => ({ ...f, inside: true }));
  };

  return (
    <div
      ref={box}
      className={on ? "tremor" : undefined}
      onPointerMove={track}
      onPointerDown={track}
      onPointerLeave={() => setFake((f) => ({ ...f, inside: false }))}
      onClickCapture={onClickCapture}
    >
      {children}
      {on && fake.inside && <div className="fake-cursor" style={{ left: fake.x, top: fake.y }} aria-hidden />}
    </div>
  );
}

/* ───────── Screen reader ───────── */

export function ScreenReader({
  fixed,
  voice,
  onBooked,
  onNote,
}: {
  fixed: Set<IssueId>;
  voice: boolean;
  onBooked: () => void;
  onNote?: (note: string) => void;
}) {
  const items = srItems(fixed);
  const [idx, setIdx] = useState(-1);
  const [values, setValues] = useState<Partial<Record<FieldKey, string>>>({});
  const [picking, setPicking] = useState<FieldKey | null>(null);
  const [lines, setLines] = useState<string[]>(["Screen reader on. Press ↓ (Next) to start reading the page."]);
  const done = useRef(false);

  const say = useCallback(
    (text: string) => {
      setLines((l) => [text, ...l].slice(0, 5));
      if (voice && "speechSynthesis" in window) {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 1.05;
        speechSynthesis.speak(u);
      }
    },
    [voice],
  );
  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const move = useCallback(
    (d: 1 | -1) => {
      if (picking || done.current) return;
      const next = Math.max(0, Math.min(items.length - 1, idx + d));
      setIdx(next);
      say(announce(items[next], values));
    },
    [idx, items, values, picking, say],
  );

  const use = useCallback(() => {
    if (picking || done.current || idx < 0) return;
    const item = items[idx];
    const r = activate(item, values, fixed);
    if (r.type === "pick") {
      setPicking(item.field!);
      say("Editing. What do you type?");
    } else if (r.type === "booked") {
      done.current = true;
      say(`Appointment booked. A confirmation was sent to ${ANSWERS.email}.`);
      setTimeout(onBooked, 1800);
    } else {
      say(r.text);
      onNote?.(r.text);
    }
  }, [idx, items, values, fixed, picking, say, onBooked, onNote]);

  const type = (field: FieldKey, v: string) => {
    const next = { ...values, [field]: v };
    setValues(next);
    setPicking(null);
    say(announce(items[idx], next));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowDown") (e.preventDefault(), move(1));
      else if (e.key === "ArrowUp") (e.preventDefault(), move(-1));
      else if (e.key === "Enter" && !(e.target as HTMLElement).closest("button")) (e.preventDefault(), use());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, use]);

  return (
    <div className="sr">
      <div className="sr-curtain">
        <p className="sr-off" aria-hidden>🕶️ Screen curtain on. Aisha can't see the screen, and now neither can you.</p>
        <div className="sr-now" aria-live="assertive">{lines[0]}</div>
        <ul className="sr-history" aria-hidden>
          {lines.slice(1).map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </div>

      {picking ? (
        <div className="sr-pick" role="group" aria-label="What do you type?">
          <p>⌨️ What do you type here?</p>
          {(Object.keys(ANSWERS) as FieldKey[]).map((k) => (
            <button key={k} className="btn" onClick={() => type(picking, ANSWERS[k])}>
              {ANSWERS[k]}
            </button>
          ))}
        </div>
      ) : (
        <div className="sr-controls">
          <button className="btn" onClick={() => move(-1)}>⬆ Previous <kbd>↑</kbd></button>
          <button className="btn" onClick={() => move(1)}>⬇ Next <kbd>↓</kbd></button>
          <button className="btn primary" onClick={use} disabled={idx < 0}>⏎ Use this <kbd>Enter</kbd></button>
        </div>
      )}
    </div>
  );
}

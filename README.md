# ♿ Unreachable

**▶ Play it: https://unreachable-delta.vercel.app**

**A game about accessible design.** Booking a flu shot online takes most people one minute. Four people try today, on a website that wasn't built for them. **Feel the barriers. Then fix them.**

| Person | Barrier | Booking step |
|---|---|---|
| 🧑🏾‍🎨 **Marcus, 16** | red-green colour blindness | choose a date |
| 👴🏽 **Mr. Delgado, 74** | low vision | choose a time |
| 🧑🏻‍💻 **Sam, 29** | hand tremor (cerebral palsy) | confirm the booking |
| 👩🏽‍🎓 **Aisha, 21** | blind, uses a screen reader | fill in the form |

## How it plays

Each level has three steps:

1. **😣 Experience.** Try the task the way that person does: through a colour-blindness filter, a blur, a shaking pointer, or a screen reader with the screen turned off.
2. **🛠️ Fix.** Choose the right fix for each barrier from three believable options. Wrong answers explain *why* they don't work (for example, why a placeholder isn't a label). A live preview updates as you fix.
3. **✅ Replay.** Do the same task, with the same disability simulation, on the fixed site, and watch it work.

The game ends with your rank, real statistics, and a **printable accessible design checklist** of all 12 fixes, each linked to its WCAG success criterion.

> The message: their disability isn't what stops them. **The website is.** (This is the *social model of disability*.)

## Why it matters

- **1 in 6 people** worldwide live with a significant disability (WHO).
- **95.9%** of the top 1 million home pages have detectable accessibility failures (WebAIM Million 2026).
- The three most common failures are **low-contrast text (83.9%)**, **missing alt text (53.1%)** and **missing form labels (51%)**. Players fix all three.

## The simulations

- **Colour blindness:** an SVG `feColorMatrix` filter using the Machado et al. (2009) deuteranopia matrix in linear RGB. The "open" and "full" colours were chosen with that same model so they look different to most people but almost identical to Marcus (a unit test checks this).
- **Low vision:** blur, low-contrast text, 11px type, an image of text, and a page that blocks zoom. After the fix, zoom works and contrast passes WCAG AA (4.5 : 1). Contrast ratios are computed with the WCAG formula in `logic.ts` and tested.
- **Hand tremor:** the real pointer is hidden and replaced by a shaking one. Clicks land where the shaking pointer is, with an extra "intention tremor" kick at the moment you press. The bad links aren't real buttons, so keyboard users can't reach them either. The fixed buttons can.
- **Screen reader:** the screen goes black. Navigate with ↓ / ↑ / Enter, hear the page through the Web Speech API (or read captions), and try to fill in an unlabeled form with no real button.

## Accessibility of the game itself

- Every screen works by **keyboard**, and the screen reader level is keyboard-first.
- **Larger text** toggle, visible focus outlines, and screen-reader announcements for results.
- Every simulation can be **skipped**, and `prefers-reduced-motion` is respected.
- No time pressure except in Sam's "before" level, where the timer is the barrier you remove.
- Works on phones and tablets.

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # Vitest: contrast maths, colour-blind simulation, screen-reader model, level data
npm run build
```

Built with React 19, TypeScript and Vite. There's no backend, account or tracking.

## Project structure

- `src/data/levels.ts`: people, tasks, barriers, fix options and explanations
- `src/logic.ts`: WCAG contrast maths, deuteranopia simulation, screen-reader model, scoring
- `src/components/Clinic.tsx`: the fake clinic website, each step in a broken and a fixed version
- `src/components/sims.tsx`: colour filter, tremor pointer, screen reader
- `src/App.tsx`: game flow (intro → experience → fix → replay → results)

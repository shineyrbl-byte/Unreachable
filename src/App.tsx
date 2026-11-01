import { useCallback, useEffect, useRef, useState } from "react";
import { LEVELS, STATS, type Issue, type IssueId, type Level } from "./data/levels";
import { Browser, ConfirmStep, DateStep, DetailsVisual, SiteHeader, TimeStep } from "./components/Clinic";
import { FilterDefs, ScreenReader, Tremor } from "./components/sims";
import { allIssues, announce, rankFor, srItems, starsFor, type LevelScore } from "./logic";

type Screen = "title" | "play" | "end";

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [levelIdx, setLevelIdx] = useState(0);
  const [scores, setScores] = useState<LevelScore[]>([]);
  const [big, setBig] = useState(() => localStorage.getItem("ur.big") === "1");

  useEffect(() => {
    document.documentElement.classList.toggle("big", big);
    localStorage.setItem("ur.big", big ? "1" : "0");
  }, [big]);

  const start = () => {
    setScores([]);
    setLevelIdx(0);
    setScreen("play");
  };

  return (
    <div className="app">
      <FilterDefs />
      <header className="topbar">
        <button className="brand" onClick={() => setScreen("title")} aria-label="Unreachable, back to the title screen">
          UN<span>REACHABLE</span>
        </button>
        {screen === "play" && (
          <ol className="people" aria-label="Progress">
            {LEVELS.map((l, i) => (
              <li key={l.id} className={i < levelIdx ? "done" : i === levelIdx ? "now" : ""} aria-current={i === levelIdx ? "step" : undefined}>
                <span aria-hidden>{l.emoji}</span>
                <span className="people-name">{l.name}</span>
                {i < levelIdx && <span className="tick" aria-label="booked">✓</span>}
              </li>
            ))}
          </ol>
        )}
        <button className="chip" aria-pressed={big} onClick={() => setBig((b) => !b)}>
          <span aria-hidden>🔎</span> {big ? "Normal text" : "Larger text"}
        </button>
      </header>

      <main>
        {screen === "title" && <Title onStart={start} />}
        {screen === "play" && (
          <LevelView
            key={levelIdx}
            level={LEVELS[levelIdx]}
            last={levelIdx === LEVELS.length - 1}
            onFinish={(s) => {
              setScores((prev) => [...prev, s]);
              window.scrollTo({ top: 0 });
              if (levelIdx === LEVELS.length - 1) setScreen("end");
              else setLevelIdx(levelIdx + 1);
            }}
          />
        )}
        {screen === "end" && <End scores={scores} onAgain={start} />}
      </main>
    </div>
  );
}

/* ───────────────────────── Title ───────────────────────── */

function Title({ onStart }: { onStart: () => void }) {
  return (
    <section className="title-screen">
      <p className="eyebrow">A game about accessible design</p>
      <h1 className="title-logo">
        UN<span>REACHABLE</span>
      </h1>
      <p className="lede">
        Booking a flu shot online takes most people one minute. Today, four people will try, on a website that wasn't built for
        them. <b>Feel the barriers. Then fix them.</b>
      </p>
      <ul className="cast">
        {LEVELS.map((l) => (
          <li key={l.id}>
            <span className="cast-emoji" aria-hidden>{l.emoji}</span>
            <b>{l.name}, {l.age}</b>
            <span className="muted small">{l.condition.split(".")[0]}</span>
          </li>
        ))}
      </ul>
      <div className="loop" aria-label="How each level works">
        <span>😣 <b>Experience</b> the barrier</span>
        <span aria-hidden>→</span>
        <span>🛠️ <b>Fix</b> the website</span>
        <span aria-hidden>→</span>
        <span>✅ <b>Replay</b> and see it work</span>
      </div>
      <button className="btn primary big-btn" onClick={onStart} autoFocus>
        ▶ Start
      </button>
      <p className="small muted">
        About 10 minutes · works with mouse, touch or keyboard · includes blur, colour and shaking-pointer simulations, and you can skip any of them
      </p>
    </section>
  );
}

/* ───────────────────────── One level ───────────────────────── */

type Phase = "intro" | "try" | "stuck" | "fix" | "retry" | "done";

function LevelView({ level, last, onFinish }: { level: Level; last: boolean; onFinish: (s: LevelScore) => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [notes, setNotes] = useState<{ ok: boolean; text: string }[]>([]);
  const [fails, setFails] = useState(0);
  const [lucky, setLucky] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [fixed, setFixed] = useState<Set<IssueId>>(new Set());
  const [score, setScore] = useState<LevelScore>({ firstTry: 0, total: level.issues.length });
  const [voice, setVoice] = useState(true);
  const [zoom, setZoom] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
    setNotes([]);
    setZoom(false);
  }, [phase]);

  const live = phase === "try" || phase === "retry";
  const siteFixed = phase === "try" ? new Set<IssueId>() : phase === "retry" || phase === "done" ? allIssues(level) : fixed;

  const onAttempt = useCallback(
    (ok: boolean, text: string) => {
      setNotes((n) => [{ ok, text }, ...n].slice(0, 4));
      if (phase === "try") {
        if (ok) {
          setLucky(true);
          setTimeout(() => setPhase("stuck"), 900);
        } else {
          setFails((f) => {
            if (f + 1 >= level.attempts) setTimeout(() => setPhase("stuck"), 900);
            return f + 1;
          });
        }
      } else if (phase === "retry" && ok) {
        setTimeout(() => setPhase("done"), 900);
      }
    },
    [phase, level.attempts],
  );

  const pictureClicks = useRef(0);
  const onSrNote = useCallback(
    (text: string) => {
      setNotes((n) => [{ ok: false, text }, ...n].slice(0, 4));
      if (phase === "try" && text.includes("picture") && ++pictureClicks.current >= 2) setTimeout(() => setPhase("stuck"), 1200);
    },
    [phase],
  );

  if (phase === "intro") {
    return (
      <section className="intro">
        <div className="persona-card">
          <span className="persona-emoji" aria-hidden>{level.emoji}</span>
          <div>
            <p className="eyebrow">{level.step}</p>
            <h1 ref={heading} tabIndex={-1}>Meet {level.name}, {level.age}</h1>
            <p className="lede">{level.bio}</p>
            <p>
              {level.name} has <b>{level.condition}</b>.
            </p>
            <p className="fact">💡 {level.fact}</p>
          </div>
        </div>
        <div className="task-card">
          <p className="eyebrow">{level.name}'s task</p>
          <p className="task">{level.task}</p>
          <p className="muted">{level.simHelp}</p>
          <button className="btn primary big-btn" onClick={() => setPhase("try")} autoFocus>
            😣 Try it as {level.name}
          </button>
          <button
            className="btn ghost"
            onClick={() => {
              setSkipped(true);
              setPhase("stuck");
            }}
          >
            Skip the simulation
          </button>
        </div>
      </section>
    );
  }

  if (phase === "stuck") {
    return (
      <section className="stuck">
        <span className="persona-emoji" aria-hidden>{level.emoji}</span>
        <h1 ref={heading} tabIndex={-1}>
          {skipped ? `${level.name} couldn't finish.` : lucky ? "You got lucky…" : `${level.name} is stuck.`}
        </h1>
        <blockquote>"{level.stuck}"</blockquote>
        <p className="big-point">
          {level.name}'s disability isn't what stopped them. <b>The website did.</b>
        </p>
        <p className="muted">There are {level.issues.length} problems on this page. Let's fix them.</p>
        <button className="btn primary big-btn" onClick={() => setPhase("fix")} autoFocus>
          🛠️ Fix the website
        </button>
      </section>
    );
  }

  if (phase === "fix") {
    return (
      <section className="fix">
        <div className="fix-left">
          <p className="eyebrow">Fix the website for {level.name}</p>
          <h1 ref={heading} tabIndex={-1}>
            {fixed.size} of {level.issues.length} problems fixed
          </h1>
          {level.issues.map((issue, i) => (
            <IssueCard
              key={issue.id}
              n={i + 1}
              issue={issue}
              locked={i > fixed.size}
              done={fixed.has(issue.id)}
              onSolved={(firstTry) => {
                setFixed((f) => new Set(f).add(issue.id));
                if (firstTry) setScore((s) => ({ ...s, firstTry: s.firstTry + 1 }));
              }}
            />
          ))}
          {fixed.size === level.issues.length && (
            <button className="btn primary big-btn" onClick={() => setPhase("retry")} autoFocus>
              ✅ Test it with {level.name}
            </button>
          )}
        </div>
        <div className="fix-right">
          <p className="preview-label">Live preview: every fix appears here as you make it</p>
          <Site level={level} fixed={siteFixed} simOn={false} live={false} zoom={false} voice={false} onAttempt={undefined} onBooked={() => {}} />
          {level.id === "aisha" && (
            <div className="sr-preview">
              <p><b>🔊 What the screen reader says</b></p>
              <ol>
                {srItems(siteFixed).map((it, i) => (
                  <li key={i}>{announce(it, {})}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </section>
    );
  }

  if (phase === "done") {
    const stars = starsFor(score);
    return (
      <section className="done">
        <span className="persona-emoji" aria-hidden>{level.emoji}</span>
        <h1 ref={heading} tabIndex={-1}>{level.name} booked it! 🎉</h1>
        <blockquote>"{level.thanks}"</blockquote>
        <p className="stars" aria-label={`${stars} out of 3 stars`}>
          {"★".repeat(stars)}
          <span>{"★".repeat(3 - stars)}</span>
        </p>
        <p className="muted">
          {score.firstTry} of {score.total} fixes right on the first try
        </p>
        <ul className="fixed-list">
          {level.issues.map((i) => (
            <li key={i.id}>
              ✅ {i.options.find((o) => o.right)!.text} <span className="rule">{i.rule}</span>
            </li>
          ))}
        </ul>
        <button className="btn primary big-btn" onClick={() => onFinish(score)} autoFocus>
          {last ? "See your results →" : "Meet the next person →"}
        </button>
      </section>
    );
  }

  // try / retry
  return (
    <section className="playfield">
      <div className="panel">
        <p className="eyebrow">{phase === "retry" ? "After your fixes" : "Before"} · {level.simName}</p>
        <h1 ref={heading} tabIndex={-1}>
          <span aria-hidden>{level.emoji}</span> {level.task}
        </h1>
        <p className="muted">{level.simHelp}</p>
        {level.id === "sam" && (
          <p className="tip">
            💡 Many people with tremors use a keyboard instead of a mouse. Try pressing Tab. {phase === "try" ? "Does it work here?" : "It works now!"}
          </p>
        )}
        {level.id === "delgado" && (
          <button
            className="btn ghost"
            aria-pressed={zoom}
            onClick={() => {
              if (phase === "try") setNotes((n) => [{ ok: false, text: "🔍 This page blocks zooming." }, ...n].slice(0, 4));
              else setZoom((z) => !z);
            }}
          >
            🔍 {zoom ? "Zoom out" : "Zoom in, like Mr. Delgado would"}
          </button>
        )}
        {level.id === "aisha" && (
          <button className="btn ghost" aria-pressed={voice} onClick={() => setVoice((v) => !v)}>
            {voice ? "🔊 Voice on" : "🔇 Voice off (captions only)"}
          </button>
        )}
        {phase === "try" && level.attempts > 0 && <p className="tries">Tries left: {Math.max(0, level.attempts - fails)}</p>}
        <ul className="notes" aria-live="polite">
          {notes.map((n, i) => (
            <li key={i} className={n.ok ? "ok" : "bad"}>
              {n.ok ? "✅" : "❌"} {n.text}
            </li>
          ))}
        </ul>
        {phase === "try" && (
          <button className="btn ghost" onClick={() => setPhase("stuck")}>
            😩 I'm stuck. Fix the website
          </button>
        )}
      </div>
      <Site
        level={level}
        fixed={siteFixed}
        simOn={live}
        live={live}
        zoom={zoom}
        voice={voice}
        onAttempt={onAttempt}
        onBooked={() => setPhase(phase === "retry" ? "done" : "stuck")}
        onNote={onSrNote}
      />
    </section>
  );
}

function Site({
  level,
  fixed,
  simOn,
  live,
  zoom,
  voice,
  onAttempt,
  onBooked,
  onNote,
}: {
  level: Level;
  fixed: Set<IssueId>;
  simOn: boolean;
  live: boolean;
  zoom: boolean;
  voice: boolean;
  onAttempt?: (ok: boolean, text: string) => void;
  onBooked: () => void;
  onNote?: (t: string) => void;
}) {
  if (level.id === "aisha" && live) return <ScreenReader key={fixed.size} fixed={fixed} voice={voice} onBooked={onBooked} onNote={onNote} />;

  const filter = !simOn ? undefined : level.id === "marcus" ? "url(#deuteranopia)" : level.id === "delgado" ? "blur(2.2px)" : undefined;
  const body = (
    <Browser>
      <SiteHeader fixed={fixed} step={level.step} />
      {level.id === "marcus" && <DateStep fixed={fixed} onAttempt={onAttempt} />}
      {level.id === "delgado" && <TimeStep fixed={fixed} zoom={zoom} onAttempt={onAttempt} />}
      {level.id === "sam" && <ConfirmStep fixed={fixed} live={live} onAttempt={onAttempt} />}
      {level.id === "aisha" && <DetailsVisual fixed={fixed} />}
    </Browser>
  );
  return (
    <div className="site-wrap" style={{ filter }}>
      {level.id === "sam" ? <Tremor on={simOn}>{body}</Tremor> : body}
    </div>
  );
}

function IssueCard({ n, issue, locked, done, onSolved }: { n: number; issue: Issue; locked: boolean; done: boolean; onSolved: (firstTry: boolean) => void }) {
  const [tried, setTried] = useState<number[]>([]);
  const right = issue.options.findIndex((o) => o.right);
  const lastPick = tried[tried.length - 1];
  if (locked) {
    return (
      <div className="issue locked" aria-hidden>
        <b>Problem {n}</b> 🔒
      </div>
    );
  }
  return (
    <div className={`issue ${done ? "solved" : ""}`}>
      <p className="issue-top">
        <b>Problem {n}</b> <span className="rule">{issue.rule}</span>
      </p>
      <p className="problem">{issue.problem}</p>
      {!done && <p className="muted small">What's the best fix?</p>}
      <div className="options" role="group" aria-label={`Fixes for problem ${n}`}>
        {issue.options.map((o, i) => {
          const picked = tried.includes(i);
          if (done && i !== right) return null;
          return (
            <button
              key={i}
              className={`option ${picked ? (o.right ? "right" : "wrong") : ""}`}
              disabled={done || picked}
              onClick={() => {
                setTried((t) => [...t, i]);
                if (o.right) onSolved(tried.length === 0);
              }}
            >
              <span className="opt-mark" aria-hidden>{picked ? (o.right ? "✅" : "❌") : "○"}</span>
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      {lastPick !== undefined && (
        <p className={`why ${issue.options[lastPick].right ? "good" : "bad"}`} role="status">
          {issue.options[lastPick].right ? "Yes! " : "Not quite. "}
          {issue.options[lastPick].why}
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── End ───────────────────────── */

function End({ scores, onAgain }: { scores: LevelScore[]; onAgain: () => void }) {
  const first = scores.reduce((a, s) => a + s.firstTry, 0);
  const total = scores.reduce((a, s) => a + s.total, 0);
  const rank = rankFor(first, total);
  return (
    <section className="end">
      <div className="end-hero">
        <p className="rank-emoji" aria-hidden>{rank.emoji}</p>
        <p className="eyebrow">CityCare is reachable now</p>
        <h1>{rank.title}</h1>
        <p className="lede">
          You fixed {total} barriers, {first} of them on the first try. Marcus, Mr. Delgado, Sam and Aisha all booked their flu
          shots, and so can everyone else.
        </p>
        <ul className="cast booked">
          {LEVELS.map((l) => (
            <li key={l.id}>
              <span className="cast-emoji" aria-hidden>{l.emoji}</span>
              <b>{l.name}</b>
              <span className="ok-tag">✓ Booked</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="stat-row">
        {STATS.map((s) => (
          <div key={s.big} className="stat">
            <b>{s.big}</b>
            <span>{s.small}</span>
          </div>
        ))}
      </div>

      <p className="big-point center">
        Accessible design helps everyone: captions in a noisy café, big buttons on a bumpy bus, high contrast in bright sunlight.
      </p>

      <div className="checklist" id="checklist">
        <h2>✅ The accessible design checklist</h2>
        <p className="muted">Every fix you made today. Keep it for your next website, app or school project.</p>
        <div className="check-grid">
          {LEVELS.map((l) => (
            <div key={l.id}>
              <h3>
                <span aria-hidden>{l.emoji}</span> For {l.name} (and everyone)
              </h3>
              <ul>
                {l.issues.map((i) => (
                  <li key={i.id}>
                    {i.options.find((o) => o.right)!.text} <span className="rule">{i.rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="try-real">
        <h2>🧪 Try it for real</h2>
        <ul>
          <li><b>Screen reader:</b> on a Mac press <kbd>⌘</kbd> + <kbd>F5</kbd> for VoiceOver. On Android, turn on TalkBack. On Windows, press <kbd>Ctrl</kbd> + <kbd>Win</kbd> + <kbd>Enter</kbd> for Narrator.</li>
          <li><b>Keyboard only:</b> put your mouse away and use <kbd>Tab</kbd>, <kbd>Enter</kbd> and the arrow keys on your favourite website.</li>
          <li><b>Zoom:</b> press <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>+</kbd> to 200% and see what breaks.</li>
        </ul>
      </div>

      <div className="end-actions">
        <button className="btn primary" onClick={() => window.print()}>🖨️ Print the checklist</button>
        <button className="btn ghost" onClick={onAgain}>🔁 Play again</button>
      </div>
    </section>
  );
}

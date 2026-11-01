import { useEffect, useRef, useState } from "react";
import { BAD_BG, BAD_GREEN, BAD_RED, BAD_TEXT, type IssueId } from "../data/levels";

/** The pretend website every level takes place on. */
export function Browser({ children, url = "citycare-clinic.com/book" }: { children: React.ReactNode; url?: string }) {
  return (
    <div className="browser">
      <div className="browser-bar" aria-hidden>
        <span className="dots"><i /><i /><i /></span>
        <span className="url">🔒 {url}</span>
      </div>
      <div className="site">{children}</div>
    </div>
  );
}

export function SiteHeader({ fixed, step }: { fixed: Set<IssueId>; step: string }) {
  return (
    <div className="site-head">
      <div className="site-logo"><span aria-hidden>✚</span> CityCare Clinic</div>
      {fixed.has("imageText") ? <p className="hours-text">Open Mon–Fri, 9 am – 5 pm</p> : <HoursImage />}
      <p className="site-step">{step}</p>
    </div>
  );
}

/** Opening hours drawn as a low-resolution picture, the way some sites still do it. */
function HoursImage() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#f6f6f6";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#b9b9b9";
    ctx.font = "9px sans-serif";
    ctx.fillText("Open Mon-Fri 9am-5pm", 3, 11);
  }, []);
  return <canvas ref={ref} width={104} height={15} className="hours-img" role="img" aria-label="IMG_0093.png" />;
}

/* ───────── Step 1: date (Marcus) ───────── */

// Two weeks of weekdays in November; only three still have spots.
const DAYS = [3, 4, 5, 6, 7, 10, 11, 12, 13, 14].map((date, i) => ({ date, open: [2, 6, 8].includes(i) }));
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function DateStep({ fixed, onAttempt }: { fixed: Set<IssueId>; onAttempt?: (ok: boolean, note: string) => void }) {
  const labels = fixed.has("colorOnly");
  const errorText = fixed.has("colorError");
  const [bad, setBad] = useState<number | null>(null);
  return (
    <div className="step">
      <h2 className="site-h">Choose a date for your flu shot</h2>
      <div className="legend">
        {labels ? (
          <>
            <span><b>✓ Open</b> spots left</span>
            <span><b>✕ Full</b> no spots</span>
          </>
        ) : (
          <>
            <span><i style={{ background: BAD_GREEN }} /> Open</span>
            <span><i style={{ background: BAD_RED }} /> Full</span>
          </>
        )}
      </div>
      <div className="cal" role="grid" aria-label="November">
        {WEEKDAYS.map((w) => (
          <div key={w} className="cal-wd" aria-hidden>{w}</div>
        ))}
        {DAYS.map((d, i) => (
          <button
            key={i}
            className={`cal-day ${bad === i && !errorText ? "outlined" : ""}`}
            style={{ background: d.open ? BAD_GREEN : BAD_RED }}
            aria-label={labels ? `November ${d.date}, ${d.open ? "open" : "full"}` : `November ${d.date}`}
            onClick={() => {
              if (d.open) {
                setBad(null);
                onAttempt?.(true, `Booked November ${d.date}.`);
              } else {
                setBad(i);
                onAttempt?.(false, `November ${d.date} is full.`);
              }
            }}
          >
            <span className="cal-num">{d.date}</span>
            {labels && <span className="cal-tag">{d.open ? "✓ Open" : "✕ Full"}</span>}
          </button>
        ))}
      </div>
      {errorText && bad !== null && (
        <p className="site-error" role="alert">⚠️ This date is full. Please pick an open date.</p>
      )}
    </div>
  );
}

/* ───────── Step 2: time (Mr. Delgado) ───────── */

const SLOTS = ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:30 AM", "1:00 PM", "1:30 PM", "3:30 PM"];
export const TARGET_SLOT = "10:30 AM";

export function TimeStep({ fixed, zoom, onAttempt }: { fixed: Set<IssueId>; zoom: boolean; onAttempt?: (ok: boolean, note: string) => void }) {
  const contrast = fixed.has("contrast");
  const size = fixed.has("textSize");
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <div className="step">
      <h2 className="site-h">Choose a time on Thursday, November 6</h2>
      <div className={`slots ${size ? "slots-big" : ""}`} style={{ zoom: zoom && size ? 1.6 : 1 }}>
        {SLOTS.map((s) => (
          <button
            key={s}
            className={`slot ${picked === s ? "picked" : ""}`}
            style={contrast ? undefined : { color: BAD_TEXT, background: BAD_BG, borderColor: "#ececec" }}
            onClick={() => {
              setPicked(s);
              onAttempt?.(s === TARGET_SLOT, s === TARGET_SLOT ? "Booked 10:30 AM." : `That was ${s}, not 10:30 AM.`);
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <p className="site-note" style={contrast ? undefined : { color: BAD_TEXT }}>
        Appointments last 10 minutes. Please arrive 5 minutes early.
      </p>
    </div>
  );
}

/* ───────── Step 3: confirm (Sam) ───────── */

export function ConfirmStep({ fixed, live, onAttempt }: { fixed: Set<IssueId>; live: boolean; onAttempt?: (ok: boolean, note: string) => void }) {
  const big = fixed.has("targetSize");
  const noTimeout = fixed.has("timeout");
  const undo = fixed.has("noUndo");
  const [left, setLeft] = useState(15);
  const [asking, setAsking] = useState(false);
  const [extended, setExtended] = useState(false);

  useEffect(() => {
    if (!live || noTimeout) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [live, noTimeout]);
  useEffect(() => {
    if (left <= 0) {
      onAttempt?.(false, "The session timed out and the booking was wiped.");
      setLeft(15);
    }
  }, [left, onAttempt]);

  const cancel = () => (undo ? setAsking(true) : onAttempt?.(false, "Oops, that was Cancel. The booking is gone."));

  return (
    <div className="step">
      <h2 className="site-h">Confirm your booking</h2>
      <div className="confirm-card">
        <p>💉 Flu shot</p>
        <p>📅 Thursday, November 6 at 10:30 AM</p>
        <p>📍 CityCare Clinic, 12 Harbor Road</p>
      </div>
      {noTimeout ? (
        <p className="site-note">⏱ No rush. Take as long as you need.{!extended && <> <button className="link-btn" onClick={() => setExtended(true)}>Need more time?</button></>}</p>
      ) : (
        <p className="timer">Session expires in 0:{String(Math.max(0, left)).padStart(2, "0")}</p>
      )}

      {asking ? (
        <div className="ask" role="alertdialog" aria-label="Cancel your booking?">
          <p><b>Cancel your booking?</b></p>
          <div className="big-actions">
            <button className="site-btn primary" onClick={() => setAsking(false)}>Keep my booking</button>
            <button className="site-btn" onClick={() => onAttempt?.(false, "Sam chose to cancel.")}>Yes, cancel</button>
          </div>
        </div>
      ) : big ? (
        <div className="big-actions">
          <button className="site-btn" onClick={cancel}>Cancel</button>
          <button className="site-btn primary" onClick={() => onAttempt?.(true, "Booking confirmed!")}>Confirm booking</button>
        </div>
      ) : (
        <div className="tiny-actions">
          {/* Deliberately bad: tiny, touching, and not real buttons, so keyboards can't reach them either. */}
          <span className="tiny" onClick={cancel}>cancel</span>
          <span className="tiny" onClick={() => onAttempt?.(true, "Booking confirmed!")}>confirm</span>
        </div>
      )}
    </div>
  );
}

/* ───────── Step 4: details (Aisha), the visual version shown while fixing ───────── */

export function DetailsVisual({ fixed }: { fixed: Set<IssueId> }) {
  const labels = fixed.has("labels");
  return (
    <div className="step">
      <h2 className="site-h">Book your flu shot</h2>
      <p className="site-p">
        Enter your details to finish your booking.{" "}
        <a href="#" onClick={(e) => e.preventDefault()}>{fixed.has("linkText") ? "Read our vaccine safety guide" : "Click here"}</a>
      </p>
      <div className="form">
        {labels && <label htmlFor="f-name">Full name <span className="req">(required)</span></label>}
        <input id="f-name" placeholder={labels ? "" : "Aisha Khan"} aria-label={labels ? undefined : ""} />
        {labels && <label htmlFor="f-email">Email address <span className="req">(required)</span></label>}
        <input id="f-email" placeholder={labels ? "" : "you@example.com"} />
        {fixed.has("fakeButton") ? (
          <button className="site-btn primary" type="button">Book appointment</button>
        ) : (
          <div className="img-btn" aria-hidden>
            <span>BOOK ➜</span>
            <small>btn_book_final.png</small>
          </div>
        )}
      </div>
      <p className="alt-badge">{fixed.has("altText") ? "🖼️ Logo alt text: \"CityCare Clinic logo\"" : "🖼️ Logo alt text: (none) → reads \"IMG_2041.jpg\""}</p>
    </div>
  );
}

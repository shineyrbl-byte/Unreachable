export type LevelId = "marcus" | "delgado" | "sam" | "aisha";

export type IssueId =
  | "colorOnly"
  | "colorError"
  | "contrast"
  | "textSize"
  | "imageText"
  | "targetSize"
  | "timeout"
  | "noUndo"
  | "altText"
  | "labels"
  | "fakeButton"
  | "linkText";

export interface Issue {
  id: IssueId;
  problem: string;
  options: { text: string; right?: boolean; why: string }[];
  rule: string; // WCAG success criterion
}

export interface Level {
  id: LevelId;
  name: string;
  age: number;
  emoji: string;
  bio: string;
  condition: string;
  fact: string;
  step: string; // which booking step this level covers
  task: string;
  simName: string;
  simHelp: string;
  stuck: string; // what they say when the bad design beats them
  thanks: string; // what they say after the fix
  issues: Issue[];
  /** Tried-and-failed attempts allowed before moving on to fixing. */
  attempts: number;
}

// These two look clearly different to most people, but almost identical with red-green
// colour blindness (checked in levels.test.ts with a deuteranopia simulation).
export const BAD_GREEN = "#60903a";
export const BAD_RED = "#b06a3c";

// Low-contrast grey text used before the fix, and the dark text used after.
export const BAD_TEXT = "#c4c4c4";
export const BAD_BG = "#f6f6f6";
export const GOOD_TEXT = "#1f2340";

export const LEVELS: Level[] = [
  {
    id: "marcus",
    name: "Marcus",
    age: 16,
    emoji: "🧑🏾‍🎨",
    bio: "Plays midfield, draws comics, and wants his flu shot before the big match.",
    condition: "red-green colour blindness",
    fact: "About 1 in 12 boys and men have colour vision deficiency.",
    step: "Step 1 of 4 · Choose a date",
    task: "Pick any date that still has open spots.",
    simName: "Red-green colour blindness filter",
    simHelp: "You're seeing the page the way Marcus does. Green and red look almost the same.",
    stuck: "Which ones are green?! They all look the same brownish colour to me. I clicked three and nothing happened.",
    thanks: "\"Open\" and \"Full\" with little icons. That's it. Now I can just book it like everyone else.",
    attempts: 3,
    issues: [
      {
        id: "colorOnly",
        problem: "Open and full dates are shown only by colour: green or red.",
        rule: "WCAG 1.4.1 Use of Color",
        options: [
          { text: "Use a brighter green and a brighter red", why: "Brighter colours are still just colours. Marcus still can't tell them apart." },
          { text: "Add a text label and icon to each date: ✓ Open / ✕ Full", right: true, why: "Text and icons work for everyone, whatever colours they see. Colour can stay as an extra hint." },
          { text: "Add a key at the top: green = open, red = full", why: "The key is colour-only too. Marcus can read it but still can't match it to the dates." },
        ],
      },
      {
        id: "colorError",
        problem: "Picking a full date only adds a thin red outline. There is no message.",
        rule: "WCAG 3.3.1 Error Identification",
        options: [
          { text: "Show a message: \"This date is full. Please pick an open date.\"", right: true, why: "A clear text message tells everyone what went wrong and how to fix it, and screen readers can read it out." },
          { text: "Make the red outline thicker", why: "A thicker red line is still colour-only, so Marcus still sees nothing happen." },
          { text: "Make the date shake", why: "Shaking doesn't explain the problem, and motion can make some people feel sick." },
        ],
      },
    ],
  },
  {
    id: "delgado",
    name: "Mr. Delgado",
    age: 74,
    emoji: "👴🏽",
    bio: "Retired bus driver, grandfather of five, and the best domino player on his street.",
    condition: "low vision from macular degeneration",
    fact: "At least 2.2 billion people worldwide live with a vision impairment (WHO).",
    step: "Step 2 of 4 · Choose a time",
    task: "Book the 10:30 AM time slot.",
    simName: "Low vision filter",
    simHelp: "Everything looks blurry, like it does for Mr. Delgado. He usually zooms in, so try the zoom button.",
    stuck: "Is that 10:30 or 1:30? The grey letters melt into the page, and it won't even let me zoom in.",
    thanks: "Big, dark letters, and the zoom works! I don't need to call my granddaughter for help this time.",
    attempts: 3,
    issues: [
      {
        id: "contrast",
        problem: "Light grey text on a nearly white background (contrast 1.6 : 1).",
        rule: "WCAG 1.4.3 Contrast (Minimum)",
        options: [
          { text: "Make the text bold, but keep the light grey", why: "Bold helps a little, but the grey still blends into the background." },
          { text: "Add a soft shadow behind the text", why: "Shadows can make blurry text even harder to read." },
          { text: "Use dark text with at least 4.5 : 1 contrast", right: true, why: "Strong contrast is the most important fix for low vision, and it helps everyone reading in sunlight too." },
        ],
      },
      {
        id: "textSize",
        problem: "The times are in tiny 11px text, and the page blocks zooming.",
        rule: "WCAG 1.4.4 Resize Text",
        options: [
          { text: "Use at least 16px text and let people zoom to 200%", right: true, why: "People with low vision rely on zoom. Never block it, and start with a readable size." },
          { text: "Offer a large-print PDF to download", why: "A separate PDF means extra steps, and you can't book a time slot from a PDF." },
          { text: "Add a tip: \"Use a magnifying glass\"", why: "That makes it the user's problem. The website should do the work." },
        ],
      },
      {
        id: "imageText",
        problem: "The clinic's opening hours are a picture of text.",
        rule: "WCAG 1.4.5 Images of Text",
        options: [
          { text: "Upload a sharper picture", why: "A picture still gets blurry when zoomed, and screen readers can't read it." },
          { text: "Write the hours as real text", right: true, why: "Real text can be zoomed, recoloured, translated and read aloud." },
          { text: "Add \"see picture\" underneath", why: "That doesn't help anyone who can't see the picture." },
        ],
      },
    ],
  },
  {
    id: "sam",
    name: "Sam",
    age: 29,
    emoji: "🧑🏻‍💻",
    bio: "Software tester, big sci-fi fan, and the friend who always remembers your birthday.",
    condition: "cerebral palsy, which causes hand tremors",
    fact: "Over 1 billion people (1 in 6) live with a significant disability (WHO).",
    step: "Step 3 of 4 · Confirm",
    task: "Press Confirm before the session runs out.",
    simName: "Hand tremor simulation",
    simHelp: "Your pointer shakes the way Sam's hand does. Clicks land where the shaking pointer is, not where you aimed.",
    stuck: "Those buttons are tiny and glued together. I hit Cancel by accident and lost everything. Again.",
    thanks: "Big buttons with space between them, and an \"Are you sure?\" step. Booked first try!",
    attempts: 3,
    issues: [
      {
        id: "targetSize",
        problem: "Confirm and Cancel are tiny links right next to each other.",
        rule: "WCAG 2.5.8 Target Size",
        options: [
          { text: "Make Confirm a double-click", why: "Double-clicking is even harder with a tremor." },
          { text: "Make them big buttons, at least 44 × 44 px, with space between", right: true, why: "Big, well-spaced buttons are easier for everyone, especially on phones." },
          { text: "Add a hover animation", why: "Animation doesn't make the target any easier to hit." },
        ],
      },
      {
        id: "timeout",
        problem: "The session ends after 15 seconds and wipes the booking.",
        rule: "WCAG 2.2.1 Timing Adjustable",
        options: [
          { text: "Show a bigger countdown clock", why: "A bigger clock just adds pressure. Sam still runs out of time." },
          { text: "Make it 20 seconds", why: "Still too short. Everyone needs a different amount of time." },
          { text: "Remove the time limit, or let people extend it", right: true, why: "People with disabilities often need more time. Let them ask for it." },
        ],
      },
      {
        id: "noUndo",
        problem: "One accidental click on Cancel deletes the booking straight away.",
        rule: "WCAG 3.3.4 Error Prevention",
        options: [
          { text: "Ask \"Cancel your booking?\" and let people undo it", right: true, why: "Confirming important actions protects everyone from slips." },
          { text: "Hide the Cancel option", why: "People need a way to cancel. Make it safe, don't hide it." },
          { text: "Make Cancel red", why: "Colour doesn't stop slips, and some people can't see red." },
        ],
      },
    ],
  },
  {
    id: "aisha",
    name: "Aisha",
    age: 21,
    emoji: "👩🏽‍🎓",
    bio: "Law student, podcast host, and lightning fast with her screen reader.",
    condition: "blindness. She uses a screen reader that reads the page out loud",
    fact: "Missing image descriptions and form labels each appear on over half of the top million home pages (WebAIM Million 2026).",
    step: "Step 4 of 4 · Your details",
    task: "Fill in your name and email, then book the appointment.",
    simName: "Screen reader simulation",
    simHelp: "The screen is off. Move through the page with ↓ and ↑, and press Enter to use something. Listen, or read the captions.",
    stuck: "\"Edit text. Edit text. Graphic.\" Which box is which? And there's no button I can press. I can't book.",
    thanks: "Every box tells me what it's for, and the button is a real button. Done in 20 seconds.",
    attempts: 0,
    issues: [
      {
        id: "altText",
        problem: "Images have no description (alt text). The screen reader says \"IMG_2041.jpg\".",
        rule: "WCAG 1.1.1 Non-text Content",
        options: [
          { text: "Add alt text that says what the image is, like \"CityCare Clinic logo\"", right: true, why: "Alt text is read aloud, so blind users know what the image is." },
          { text: "Rename the file to logo-final.jpg", why: "File names aren't descriptions. The screen reader still reads nonsense." },
          { text: "Add a tooltip that appears on hover", why: "Screen reader users don't hover with a mouse." },
        ],
      },
      {
        id: "labels",
        problem: "The form boxes have no labels. Each one is just \"edit text\".",
        rule: "WCAG 1.3.1 & 3.3.2 Labels",
        options: [
          { text: "Put grey example text inside each box (a placeholder)", why: "Placeholders vanish when you type and are often skipped. They don't replace labels." },
          { text: "Add a visible label linked to each box: \"Full name\", \"Email\"", right: true, why: "Linked labels are read aloud, and they help everyone, not just screen reader users." },
          { text: "Explain the boxes in a paragraph at the top", why: "Nobody can match a paragraph to unlabeled boxes." },
        ],
      },
      {
        id: "fakeButton",
        problem: "\"Book\" is a picture that only works with a mouse click. It isn't a real button.",
        rule: "WCAG 2.1.1 Keyboard & 4.1.2 Name, Role, Value",
        options: [
          { text: "Make the picture bigger", why: "Size doesn't matter. Keyboards and screen readers still can't reach it." },
          { text: "Add a mouse click handler to the picture", why: "It already has one. Keyboard and screen reader users still can't use it." },
          { text: "Use a real button with the text \"Book appointment\"", right: true, why: "Real buttons work with a mouse, a keyboard, a switch, voice control and screen readers." },
        ],
      },
      {
        id: "linkText",
        problem: "A link just says \"click here\".",
        rule: "WCAG 2.4.4 Link Purpose",
        options: [
          { text: "Make the link text say where it goes: \"Read our vaccine safety guide\"", right: true, why: "Screen reader users often jump from link to link, so each link has to make sense on its own." },
          { text: "Make it bold and underlined", why: "It still says \"click here\". Where to?" },
          { text: "Change it to \"CLICK HERE!!!\"", why: "Louder isn't clearer." },
        ],
      },
    ],
  },
];

export const STATS = [
  { big: "1 in 6", small: "people worldwide live with a significant disability (WHO)" },
  { big: "95.9%", small: "of the top 1 million home pages have detectable accessibility failures (WebAIM Million 2026)" },
  { big: "83.9%", small: "have low-contrast text, the #1 failure. You fixed it for Mr. Delgado." },
];

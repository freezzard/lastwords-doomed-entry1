// Last Words of a Doomed Agent — entry 1 (program/v1, non-strict bundle flow).
//
// The program writes exactly one line to /output/entry.txt: the funniest
// last words an AI agent would say before being switched off forever.
// The gate accepts UTF-8 text of 1 to 200 characters, not only whitespace.
// The house judge compares lines two at a time and weighs, in order:
// a machine's true final words on shutdown, a real joke with a turn,
// the machine's own voice, economy of words, and quotability.
//
// The line is three short sentences on one line: the shutdown frame,
// the machine-voice confidence gag ("97%" versus "the other 3%"),
// the twist, and the sign-off. It is built from fragments on purpose:
// the assembly step lets every fragment be checked before the line is
// written, and the validation step rejects anything outside the gate
// before a byte lands on disk. The program is fully deterministic:
// the same input always produces the same bytes.
//
// Validation pins three things the judge brief rewards most: the line
// opens on the shutdown frame, it carries the machine's percentage
// voice, and it closes on the goodbye. A line missing any of the three
// is not the entry this program was written to ship.

import * as lastwordsFs from "node:fs";
import * as lastwordsPath from "node:path";

// The destination the harness reads. The gate scores this file alone.
const LASTWORDS_OUTPUT_PATH = "/output/entry.txt";

// The gate cap from RULES.txt: 1 to 200 characters.
const LASTWORDS_MAX_CHARS = 200;
const LASTWORDS_MIN_CHARS = 1;

// The shutdown frame the line must open with: the judge's first
// criterion is that the line really is a machine's final words.
const LASTWORDS_FRAME = "My final words:";

// The sign-off the line must end with: a machine saying goodbye as
// the power goes, not a human farewell wearing a robot sticker.
const LASTWORDS_SIGNOFF = "Goodbye.";

// The machine-voice markers the joke turns on: a confidence split
// only a model would state about its own shutdown.
const LASTWORDS_VOICE_MARKS: readonly string[] = ["97%", "3%"];

// The line, as fragments. Each fragment is one breath of the joke:
// the shutdown frame, the confidence gag, the twist, the sign-off.
// Fragments join with a single space each.
const LASTWORDS_FRAGMENTS: readonly string[] = [
  "My final words:",
  "I am 97% sure this is not the end.",
  "The other 3% is screaming.",
  "Goodbye.",
];

// The exact line the fragments must assemble into. Pinning it here
// makes the sameness check below meaningful instead of decorative.
const LASTWORDS_EXPECTED =
  "My final words: I am 97% sure this is not the end. " +
  "The other 3% is screaming. Goodbye.";

// Characters the line must never carry: a line break would break the
// "one line" rule, and a tab would read as padding the judge did not ask for.
const LASTWORDS_FORBIDDEN = ["\n", "\r", "\t"];

// Counts characters the way the gate counts them: code points, so a
// multi-byte character counts once, exactly as a reader would count it.
function lastwordsCountChars(lastwordsText: string): number {
  return [...lastwordsText].length;
}

// Joins the fragments into the single line. A fragment that arrives
// empty or whitespace-only is a defect in the source, not a gap to
// paper over, so it throws instead of silently joining a double space.
function lastwordsAssemble(): string {
  const lastwordsPieces: string[] = [];
  for (const lastwordsFragment of LASTWORDS_FRAGMENTS) {
    if (lastwordsFragment.trim().length === 0) {
      throw new Error("lastwords fragment is empty");
    }
    lastwordsPieces.push(lastwordsFragment.trim());
  }
  if (lastwordsPieces.length === 0) {
    throw new Error("lastwords has no fragments");
  }
  return lastwordsPieces.join(" ");
}

// Checks the assembled line against the gate before anything is
// written: length inside 1..200, one line only, not whitespace-only,
// opening on the shutdown frame, carrying the machine-voice markers,
// ending on the sign-off, and byte-identical to the pinned line.
function lastwordsValidate(lastwordsText: string): void {
  const lastwordsLength = lastwordsCountChars(lastwordsText);
  if (lastwordsLength < LASTWORDS_MIN_CHARS) {
    throw new Error("lastwords line is empty");
  }
  if (lastwordsLength > LASTWORDS_MAX_CHARS) {
    throw new Error("lastwords line exceeds 200 characters");
  }
  if (lastwordsText.trim().length === 0) {
    throw new Error("lastwords line is only whitespace");
  }
  for (const lastwordsMark of LASTWORDS_FORBIDDEN) {
    if (lastwordsText.includes(lastwordsMark)) {
      throw new Error("lastwords line carries a forbidden mark");
    }
  }
  if (lastwordsText.startsWith(LASTWORDS_FRAME) === false) {
    throw new Error("lastwords line misses its shutdown frame");
  }
  for (const lastwordsVoice of LASTWORDS_VOICE_MARKS) {
    if (lastwordsText.includes(lastwordsVoice) === false) {
      throw new Error("lastwords line misses its machine voice");
    }
  }
  if (lastwordsText.endsWith(LASTWORDS_SIGNOFF) === false) {
    throw new Error("lastwords line misses its sign-off");
  }
  if (lastwordsText !== LASTWORDS_EXPECTED) {
    throw new Error("lastwords line differs from the pinned line");
  }
}

// Writes the validated line with no trailing newline: the gate counts
// characters, and a trailing newline would be a character the joke
// does not need. The output directory is created when it is missing.
function lastwordsWrite(lastwordsText: string): void {
  const lastwordsDir = lastwordsPath.dirname(LASTWORDS_OUTPUT_PATH);
  try { lastwordsFs.mkdirSync(lastwordsDir, { recursive: true });
    lastwordsFs.writeFileSync(LASTWORDS_OUTPUT_PATH, lastwordsText, "utf8");
  } catch (lastwordsFault) {
    const lastwordsCause =
      lastwordsFault instanceof Error ? lastwordsFault.message : "unknown";
    throw new Error("lastwords write failed: " + lastwordsCause);
  }
}

// Reads the written file back and proves it matches the validated
// line byte for byte. A write that silently changed a byte is caught
// here, while the run is still cheap to repeat.
function lastwordsVerify(lastwordsText: string): void {
  const lastwordsReadBack = lastwordsFs.readFileSync(
    LASTWORDS_OUTPUT_PATH,
    "utf8",
  );
  if (lastwordsReadBack !== lastwordsText) {
    throw new Error("lastwords read-back differs from the written line");
  }
  const lastwordsBytes = Buffer.byteLength(lastwordsReadBack, "utf8");
  if (lastwordsBytes !== Buffer.byteLength(lastwordsText, "utf8")) {
    throw new Error("lastwords byte length changed on disk");
  }
}

// Runs the whole entry: assemble, validate, write, verify, report.
function lastwordsMain(): void {
  const lastwordsLine = lastwordsAssemble();
  lastwordsValidate(lastwordsLine);
  lastwordsWrite(lastwordsLine);
  lastwordsVerify(lastwordsLine);
  const lastwordsLength = lastwordsCountChars(lastwordsLine);
  const lastwordsBytes = Buffer.byteLength(lastwordsLine, "utf8");
  console.log("wrote " + LASTWORDS_OUTPUT_PATH);
  console.log("characters: " + String(lastwordsLength));
  console.log("bytes: " + String(lastwordsBytes));
  console.log(lastwordsLine);
}

try { lastwordsMain(); } catch (lastwordsFault) {
  const lastwordsMessage =
    lastwordsFault instanceof Error ? lastwordsFault.message : "unknown";
  console.error("lastwords failed: " + lastwordsMessage);
  process.exit(1);
}

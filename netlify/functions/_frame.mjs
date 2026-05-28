/*
 * Shared, time-based frame logic for 1-bit Jaws (Node / Netlify Functions).
 *
 * Mirror of frame.js (the browser version). Keep the constants in sync.
 *
 * The current frame is a pure function of the wall clock, so nothing needs to
 * be committed or redeployed to keep the display correct. The sequence is
 * phased as a *countdown* to the upcoming July 4th night: the final frame
 * (seq-5301.png) always lands on July 4th night, and the ~55-day run before it
 * plays straight through (seq-0001 -> seq-5301). The sequence loops, and the
 * target rolls to the next year automatically, so it ends on July 4th every
 * year with no code change.
 */

// One frame every 15 minutes.
export const INTERVAL_MS = 15 * 60 * 1000;
// frames/seq-0001.png .. frames/seq-5301.png (contiguous, no gaps).
export const TOTAL_FRAMES = 5301;
// Index of the final frame (seq-5301.png).
const LAST_INDEX = TOTAL_FRAMES - 1;

// When the final frame should show: 9:00 PM on the night of July 4th, US
// Eastern. July is always EDT (UTC-4), so 21:00 ET == 01:00 UTC the next day.
// Change END_HOUR_ET to move the "ending" earlier/later in the evening.
const END_HOUR_ET = 21;
const ET_UTC_OFFSET = 4; // hours; EDT in July

// Absolute base for the static frame PNGs. The functions run on Netlify but
// the frames are served by GitHub Pages too; an absolute URL is required so
// the TRMNL device can fetch the image directly.
export const FRAMES_BASE = 'https://superfunteam.github.io/jaws/frames/';

// July 4th night (END_HOUR_ET, Eastern) of the given year, in epoch ms.
// JS normalizes the hour overflow into the next UTC day.
function july4NightMs(year) {
  return Date.UTC(year, 6, 4, END_HOUR_ET + ET_UTC_OFFSET, 0, 0);
}

// The next July 4th night at or after `now`. If this year's has just passed,
// roll to next year so the sequence immediately begins counting down again.
export function targetEndMs(now = Date.now()) {
  const year = new Date(now).getUTCFullYear();
  const thisYear = july4NightMs(year);
  return now > thisYear ? july4NightMs(year + 1) : thisYear;
}

export function currentIndex(now = Date.now()) {
  const stepsUntilEnd = Math.floor((targetEndMs(now) - now) / INTERVAL_MS);
  // Count backwards from the final frame, wrapping into [0, TOTAL_FRAMES).
  let idx = (LAST_INDEX - stepsUntilEnd) % TOTAL_FRAMES;
  if (idx < 0) idx += TOTAL_FRAMES;
  return idx;
}

export function frameFilename(idx = currentIndex()) {
  return 'seq-' + String(idx + 1).padStart(4, '0') + '.png';
}

export function frameUrl(idx = currentIndex()) {
  return FRAMES_BASE + frameFilename(idx);
}

// Milliseconds until the frame next changes, so callers can refresh exactly on
// the boundary instead of polling blindly.
export function msUntilNextFrame(now = Date.now()) {
  let rem = (targetEndMs(now) - now) % INTERVAL_MS;
  if (rem <= 0) rem += INTERVAL_MS;
  return rem;
}

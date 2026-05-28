/*
 * Shared, time-based frame logic for 1-bit Jaws (Node / Netlify Functions).
 *
 * Mirror of frame.js (the browser version). Keep the constants in sync.
 * The current frame is a pure function of the wall clock: it advances one
 * frame every 15 minutes and loops forever, so nothing needs to be committed
 * or redeployed to keep the display correct.
 */

// One frame every 15 minutes.
export const INTERVAL_MS = 15 * 60 * 1000;
// frames/seq-0001.png .. frames/seq-5301.png (contiguous, no gaps).
export const TOTAL_FRAMES = 5301;
// Anchor: at this instant the sequence was at index 1899 (seq-1900.png),
// matching the last frame the old GitHub Action published.
const ANCHOR_MS = Date.parse('2026-04-28T03:30:00Z');
const ANCHOR_INDEX = 1899;

// Absolute base for the static frame PNGs. The functions run on Netlify but
// the frames are served by GitHub Pages too; an absolute URL is required so
// the TRMNL device can fetch the image directly.
export const FRAMES_BASE = 'https://superfunteam.github.io/jaws/frames/';

export function currentIndex(now = Date.now()) {
  const steps = Math.floor((now - ANCHOR_MS) / INTERVAL_MS);
  let idx = (ANCHOR_INDEX + steps) % TOTAL_FRAMES;
  if (idx < 0) idx += TOTAL_FRAMES;
  return idx;
}

export function frameFilename(idx = currentIndex()) {
  return 'seq-' + String(idx + 1).padStart(4, '0') + '.png';
}

export function frameUrl(idx = currentIndex()) {
  return FRAMES_BASE + frameFilename(idx);
}

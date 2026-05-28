/*
 * Shared, time-based frame logic for 1-bit Jaws (browser version).
 *
 * The displayed frame is a pure function of the wall clock: it advances one
 * frame every 15 minutes and loops forever. Because nothing has to be written
 * to disk or committed, the site never needs to be redeployed to show the
 * correct frame.
 *
 * Keep the four constants below in sync with netlify/functions/_frame.mjs
 * (the Node version used for the TRMNL ping and the current.png redirect).
 */
(function (global) {
  // One frame every 15 minutes.
  var INTERVAL_MS = 15 * 60 * 1000;
  // frames/seq-0001.png .. frames/seq-5301.png (contiguous, no gaps).
  var TOTAL_FRAMES = 5301;
  // Anchor: at this instant the sequence was at index 1899 (seq-1900.png),
  // matching the last frame the old GitHub Action published. This keeps the
  // sequence continuous with what viewers last saw.
  var ANCHOR_MS = Date.parse('2026-04-28T03:30:00Z');
  var ANCHOR_INDEX = 1899;

  // Where the static frame PNGs live. Relative so it works on both
  // jaws.superfun.games (Netlify) and superfunteam.github.io/jaws (Pages).
  var FRAMES_BASE = 'frames/';

  function currentIndex(now) {
    if (now == null) now = Date.now();
    var steps = Math.floor((now - ANCHOR_MS) / INTERVAL_MS);
    var idx = (ANCHOR_INDEX + steps) % TOTAL_FRAMES;
    if (idx < 0) idx += TOTAL_FRAMES;
    return idx;
  }

  function frameFilename(idx) {
    if (idx == null) idx = currentIndex();
    return 'seq-' + String(idx + 1).padStart(4, '0') + '.png';
  }

  function frameUrl(idx) {
    return FRAMES_BASE + frameFilename(idx);
  }

  // Milliseconds until the next 15-minute boundary, so consumers can refresh
  // exactly when the frame changes instead of polling blindly.
  function msUntilNextFrame(now) {
    if (now == null) now = Date.now();
    var elapsed = (now - ANCHOR_MS) % INTERVAL_MS;
    if (elapsed < 0) elapsed += INTERVAL_MS;
    return INTERVAL_MS - elapsed;
  }

  global.JawsFrame = {
    INTERVAL_MS: INTERVAL_MS,
    TOTAL_FRAMES: TOTAL_FRAMES,
    currentIndex: currentIndex,
    frameFilename: frameFilename,
    frameUrl: frameUrl,
    msUntilNextFrame: msUntilNextFrame
  };
})(typeof window !== 'undefined' ? window : this);

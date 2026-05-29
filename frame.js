/*
 * Shared, time-based frame logic for 1-bit Jaws (browser version).
 *
 * The displayed frame is a pure function of the wall clock, so the site never
 * needs a redeploy to show the right frame. The sequence is phased as a
 * countdown to the upcoming July 4th night: the final frame (seq-5301.png)
 * always lands on July 4th night, the ~55-day run before it plays straight
 * through (seq-0001 -> seq-5301), and it loops. The target rolls to the next
 * year automatically, so it ends on July 4th every year with no code change.
 *
 * Keep the constants below in sync with netlify/functions/_frame.mjs (the Node
 * version used for the TRMNL ping and the current.png redirect).
 */
(function (global) {
  // One frame every 15 minutes.
  var INTERVAL_MS = 15 * 60 * 1000;
  // frames/seq-0001.png .. frames/seq-5301.png (contiguous, no gaps).
  var TOTAL_FRAMES = 5301;
  // Index of the final frame (seq-5301.png).
  var LAST_INDEX = TOTAL_FRAMES - 1;

  // When the final frame should show: 9:00 PM on the night of July 4th, US
  // Eastern. July is always EDT (UTC-4), so 21:00 ET == 01:00 UTC the next day.
  var END_HOUR_ET = 21;
  var ET_UTC_OFFSET = 4; // hours; EDT in July

  // Where the static frame PNGs live. Relative so it works on both
  // jaws.superfun.games (Netlify) and superfunteam.github.io/jaws (Pages).
  var FRAMES_BASE = 'frames/';

  // July 4th night (END_HOUR_ET, Eastern) of the given year, in epoch ms.
  function july4NightMs(year) {
    return Date.UTC(year, 6, 4, END_HOUR_ET + ET_UTC_OFFSET, 0, 0);
  }

  // The next July 4th night at or after `now`.
  function targetEndMs(now) {
    if (now == null) now = Date.now();
    var year = new Date(now).getUTCFullYear();
    var thisYear = july4NightMs(year);
    return now > thisYear ? july4NightMs(year + 1) : thisYear;
  }

  function currentIndex(now) {
    if (now == null) now = Date.now();
    var stepsUntilEnd = Math.floor((targetEndMs(now) - now) / INTERVAL_MS);
    var idx = (LAST_INDEX - stepsUntilEnd) % TOTAL_FRAMES;
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

  // Milliseconds until the frame next changes, so consumers can refresh exactly
  // when the frame changes instead of polling blindly.
  function msUntilNextFrame(now) {
    if (now == null) now = Date.now();
    var rem = (targetEndMs(now) - now) % INTERVAL_MS;
    if (rem <= 0) rem += INTERVAL_MS;
    return rem;
  }

  global.JawsFrame = {
    INTERVAL_MS: INTERVAL_MS,
    TOTAL_FRAMES: TOTAL_FRAMES,
    targetEndMs: targetEndMs,
    currentIndex: currentIndex,
    frameFilename: frameFilename,
    frameUrl: frameUrl,
    msUntilNextFrame: msUntilNextFrame
  };
})(typeof window !== 'undefined' ? window : this);

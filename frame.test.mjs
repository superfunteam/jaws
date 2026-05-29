import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
  currentIndex, frameFilename, frameUrl, msUntilNextFrame,
  targetEndMs, TOTAL_FRAMES, INTERVAL_MS
} from './netlify/functions/_frame.mjs';

// July 4th, 9:00 PM US Eastern (EDT, UTC-4) == July 5th 01:00 UTC.
const JULY4_2026 = Date.UTC(2026, 6, 5, 1, 0, 0);

test('the final frame (seq-5301.png) lands exactly on July 4th night', () => {
  assert.equal(currentIndex(JULY4_2026), TOTAL_FRAMES - 1);
  assert.equal(frameFilename(currentIndex(JULY4_2026)), 'seq-5301.png');
});

test('it counts forward toward the ending', () => {
  // 15 min before the end -> second-to-last frame.
  assert.equal(currentIndex(JULY4_2026 - INTERVAL_MS), TOTAL_FRAMES - 2);
  // The straight run starts at seq-0001.png, TOTAL_FRAMES-1 steps earlier.
  assert.equal(currentIndex(JULY4_2026 - (TOTAL_FRAMES - 1) * INTERVAL_MS), 0);
});

test('the target rolls to the next year right after July 4th night', () => {
  const justAfter = JULY4_2026 + INTERVAL_MS;
  assert.equal(targetEndMs(justAfter), Date.UTC(2027, 6, 5, 1, 0, 0));
});

test('it ends on July 4th every year (recurring), not just 2026', () => {
  for (const year of [2027, 2028, 2030]) {
    const end = Date.UTC(year, 6, 5, 1, 0, 0);
    assert.equal(currentIndex(end), TOTAL_FRAMES - 1, `year ${year}`);
    assert.equal(currentIndex(end - INTERVAL_MS), TOTAL_FRAMES - 2, `year ${year}`);
  }
});

test('index is always within [0, TOTAL_FRAMES)', () => {
  for (const t of [JULY4_2026, JULY4_2026 - 1e12, JULY4_2026 + 1e12, Date.now()]) {
    const i = currentIndex(t);
    assert.ok(i >= 0 && i < TOTAL_FRAMES, `index ${i} out of range`);
  }
});

test('msUntilNextFrame is within (0, INTERVAL_MS] and aligns to the boundary', () => {
  const ms = msUntilNextFrame(JULY4_2026 - 7 * 60 * 1000); // 7 min before end
  assert.ok(ms > 0 && ms <= INTERVAL_MS);
  // 7 min before the boundary, the next change is in 7 min.
  assert.equal(ms, 7 * 60 * 1000);
});

test('filenames are zero-padded to 4 digits', () => {
  assert.equal(frameFilename(0), 'seq-0001.png');
  assert.equal(frameFilename(TOTAL_FRAMES - 1), 'seq-5301.png');
});

test('frameUrl points at the GitHub Pages frames directory', () => {
  assert.equal(frameUrl(0), 'https://superfunteam.github.io/jaws/frames/seq-0001.png');
});

test('every frame file referenced by the index actually exists', () => {
  for (const i of [0, 2650, TOTAL_FRAMES - 1]) {
    assert.ok(existsSync(new URL(`./frames/${frameFilename(i)}`, import.meta.url)),
      `missing frames/${frameFilename(i)}`);
  }
});

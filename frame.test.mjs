import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { currentIndex, frameFilename, frameUrl, TOTAL_FRAMES } from './netlify/functions/_frame.mjs';

const ANCHOR = Date.parse('2026-04-28T03:30:00Z');
const FIFTEEN_MIN = 15 * 60 * 1000;

test('anchor maps to the last published frame (seq-1900.png)', () => {
  assert.equal(currentIndex(ANCHOR), 1899);
  assert.equal(frameFilename(currentIndex(ANCHOR)), 'seq-1900.png');
});

test('frame holds for 15 minutes, then advances', () => {
  assert.equal(currentIndex(ANCHOR + 14 * 60 * 1000), 1899);
  assert.equal(currentIndex(ANCHOR + FIFTEEN_MIN), 1900);
  assert.equal(currentIndex(ANCHOR - FIFTEEN_MIN), 1898);
});

test('sequence wraps around after a full cycle', () => {
  assert.equal(currentIndex(ANCHOR + TOTAL_FRAMES * FIFTEEN_MIN), 1899);
  assert.equal(currentIndex(ANCHOR + (TOTAL_FRAMES + 1) * FIFTEEN_MIN), 1900);
});

test('index is always within [0, TOTAL_FRAMES)', () => {
  for (const t of [ANCHOR, ANCHOR - 1e12, ANCHOR + 1e12, Date.now()]) {
    const i = currentIndex(t);
    assert.ok(i >= 0 && i < TOTAL_FRAMES, `index ${i} out of range`);
  }
});

test('filenames are zero-padded to 4 digits', () => {
  assert.equal(frameFilename(0), 'seq-0001.png');
  assert.equal(frameFilename(TOTAL_FRAMES - 1), 'seq-5301.png');
});

test('frameUrl points at the GitHub Pages frames directory', () => {
  assert.equal(frameUrl(0), 'https://superfunteam.github.io/jaws/frames/seq-0001.png');
});

test('every frame file referenced by the index actually exists', () => {
  // Spot-check the boundaries and the anchor frame.
  for (const i of [0, 1899, TOTAL_FRAMES - 1]) {
    assert.ok(existsSync(new URL(`./frames/${frameFilename(i)}`, import.meta.url)),
      `missing frames/${frameFilename(i)}`);
  }
});

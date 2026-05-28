# 1-bit Jaws

A 1-bit frame of *Jaws*, advancing every 15 minutes. Live at
[jaws.superfun.games](https://jaws.superfun.games) and on
[TRMNL](https://usetrmnl.com/) e-ink displays.

## How it works (time-based, no redeploys)

The current frame is a **pure function of the clock**, so nothing has to be
committed or redeployed to keep the display correct. This is the whole point of
the current design: the previous version committed a new `public/current.png`
every 15 minutes via a GitHub Action, and every commit triggered a Netlify
deploy (~96 paid deploys/day). That's gone.

- **Frames**: `frames/seq-0001.png` … `frames/seq-5301.png` — 5,301 contiguous
  1-bit stills, served statically.
- **The math** lives in two mirrored files (keep their constants in sync):
  - `frame.js` — browser version, used by `index.html` and `screen.html`.
  - `netlify/functions/_frame.mjs` — Node version, used by the functions.

  `index = (ANCHOR_INDEX + floor((now - ANCHOR) / 15min)) mod 5301`

  The anchor is set so that the sequence is continuous with the last frame the
  old system published (`seq-1900.png`).

- **Website**: `index.html` / `screen.html` compute the frame client-side, show
  it, and swap to the next one exactly at each 15-minute boundary. No backend.
- **TRMNL**: `netlify/functions/ping-trmnl.mjs` runs on a 15-minute schedule and
  POSTs the current frame to the TRMNL custom-plugin webhook. Function
  invocations do **not** trigger deploys, so this costs nothing extra. The
  payload keys match the old function so the TRMNL template keeps working.
- **Legacy `current.png`**: `netlify/functions/current-frame.mjs` 302-redirects
  `/current.png` and `/public/current.png` to the correct frame, so old links
  stay correct without committing anything (wired up in `netlify.toml`).

## Changing things

- **Cadence**: change `INTERVAL_MS` in both `frame.js` and `_frame.mjs` (and the
  cron in `ping-trmnl.mjs`'s `config.schedule`).
- **Re-anchor the sequence**: set `ANCHOR_MS` / `ANCHOR_INDEX` in both files.
- **Tests**: `npm test` (runs `node --test`) verifies the frame math and that
  the referenced frame files exist.

## Notes

- `_data/image_counter.txt` and `_data/image_list.txt` are leftovers from the old
  GitHub Action flow and are no longer read by anything.
- Deploys now only happen when you actually push site changes — not on a timer.

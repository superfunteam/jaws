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

  The sequence is phased as a **countdown to the upcoming July 4th night**:

  ```
  index = (5300 - floor((nextJuly4Night - now) / 15min)) mod 5301
  ```

  So the final frame (`seq-5301.png`) always lands on **July 4th night** (9:00 PM
  US Eastern by default — see `END_HOUR_ET`). The ~55-day straight run before it
  plays cleanly from `seq-0001.png` to `seq-5301.png` (5,301 × 15 min ≈ 55 days,
  starting ~May 10th). The target automatically rolls to the next year after
  July 4th passes, so it **ends on July 4th every year with no code change**, and
  the sequence loops in between.

  > One consequence of pinning a fixed calendar date to a ~55-day loop: just
  > after July 4th night the countdown re-targets next year and the frame jumps
  > once (mid-sequence) before continuing to loop forward toward the next July
  > 4th. This single yearly re-sync is unavoidable unless the loop length divides
  > a year evenly.

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
- **Ending time**: change `END_HOUR_ET` (and `ET_UTC_OFFSET` if not US Eastern)
  in both files to move when the final frame shows on July 4th night.
- **Tests**: `npm test` (runs `node --test`) verifies the frame math and that
  the referenced frame files exist.

## Notes

- `_data/image_counter.txt` and `_data/image_list.txt` are leftovers from the old
  GitHub Action flow and are no longer read by anything.
- Deploys now only happen when you actually push site changes — not on a timer.

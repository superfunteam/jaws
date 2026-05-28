/*
 * Scheduled Netlify function: push the current frame to TRMNL every 15 minutes.
 *
 * The frame is computed from the clock (see _frame.mjs), so this no longer
 * dispatches a GitHub Action and nothing is committed — which means Netlify
 * never redeploys the site. The function only POSTs fresh merge_variables to
 * the TRMNL custom plugin so the e-ink display keeps advancing.
 *
 * The payload keys are kept identical to the old function so the existing
 * TRMNL template does not break; new keys (currentFrameUrl) are additive.
 */
import { currentIndex, frameFilename, frameUrl, TOTAL_FRAMES } from './_frame.mjs';

const PING_URL = 'https://usetrmnl.com/api/custom_plugins/5d32e6f3-d257-4103-b039-5451b61d86c7';

async function pingWebhook(frame) {
  if (!PING_URL) return { ok: false, message: 'No PING_URL configured' };

  const payload = {
    merge_variables: {
      triggerEvent: 'Netlify Scheduled Function (time-based)',
      // GitHub dispatch no longer happens; kept for template backwards-compat.
      githubDispatchStatus: 'N/A (time-based)',
      githubDispatchMessage: 'Frame is computed from the clock; no deploy needed.',
      currentFrame: frame.filename,
      currentFrameUrl: frame.url,
      currentIndex: frame.index,
      totalFrames: TOTAL_FRAMES,
      frameDetailsError: null,
      netlifyFunctionTimestamp: new Date().toISOString()
    }
  };

  try {
    const res = await fetch(PING_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log(`TRMNL ping OK (${res.status}) for ${frame.filename}`);
      return { ok: true, message: `TRMNL ping OK (${res.status})` };
    }
    const body = await res.text();
    const msg = `TRMNL ping failed. Status: ${res.status}, Body: ${body}`;
    console.warn(msg);
    return { ok: false, message: msg };
  } catch (err) {
    const msg = `Error pinging TRMNL: ${err.message}`;
    console.warn(msg);
    return { ok: false, message: msg };
  }
}

export default async function handler() {
  const index = currentIndex();
  const frame = { index, filename: frameFilename(index), url: frameUrl(index) };
  const result = await pingWebhook(frame);
  return new Response(result.message, { status: result.ok ? 200 : 500 });
}

// Run every 15 minutes.
export const config = { schedule: '*/15 * * * *' };

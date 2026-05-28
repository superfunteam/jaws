/*
 * On-demand Netlify function: 302-redirect to the current frame PNG.
 *
 * Keeps the legacy "current image" URL working and always correct without any
 * commits or redeploys. Wired up in netlify.toml so both
 *   https://jaws.superfun.games/current.png
 *   https://jaws.superfun.games/public/current.png
 * resolve to the right frame for the current time.
 */
import { frameUrl } from './_frame.mjs';

export default async function handler() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: frameUrl(),
      // Allow at most a minute of caching so the redirect tracks the clock.
      'Cache-Control': 'public, max-age=60'
    }
  });
}

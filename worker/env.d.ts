// Secrets aren't in wrangler.jsonc, so `wrangler types` doesn't see them.
// Set with `wrangler secret put <NAME>` (and in .dev.vars locally).
interface Secrets {
  ADMIN_PASSWORD: string;
  SESSION_SECRET: string;
  RESEND_API_KEY?: string;
}
interface Env extends Secrets {}
declare namespace Cloudflare {
  interface Env extends Secrets {}
}

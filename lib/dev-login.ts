/**
 * Development sign-in conveniences.
 *
 * The Credentials provider is only mounted when NODE_ENV !== "production"
 * (see auth.ts), so these values are dev-only by construction. They exist so
 * the login form can be prefilled for testing every surface of the app
 * without retyping an address.
 */

/** Accepted password for the dev Credentials provider. */
export const DEV_LOGIN_PASSWORD = process.env.DEV_LOGIN_PASSWORD ?? "research123";

/**
 * First seeded persona (see PERSONAS in scripts/seed.ts). Kept in step with
 * the seed by hand: it is the account with the most demo activity — pending
 * requests, unread notifications and live message threads.
 */
export const DEMO_USERNAME = "amara.okafor";
export const DEMO_EMAIL = `${DEMO_USERNAME}@researcher.local`;

/** Returns true when a submitted dev password is acceptable. */
export function isValidDevPassword(password: unknown): boolean {
  return typeof password === "string" && password.length > 0 && password === DEV_LOGIN_PASSWORD;
}
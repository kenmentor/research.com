import { Resend } from "resend";
import type { NotificationType } from "@/models/notification";

/**
 * Email seam. Without RESEND_API_KEY every send is a logged no-op —
 * in-app notifications always work; email activates on key.
 */

let client: Resend | null | undefined;

function getClient(): Resend | null {
  if (client !== undefined) return client;
  if (!process.env.RESEND_API_KEY) {
    client = null;
    return client;
  }
  client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function emailEnabled(): boolean {
  return getClient() !== null;
}

function from(): string {
  return process.env.EMAIL_FROM ?? "Researcher <onboarding@resend.dev>";
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const resend = getClient();
  if (!resend) {
    console.log(`[email:disabled] to=${payload.to} subject=${payload.subject}`);
    return false;
  }
  try {
    await resend.emails.send({ from: from(), ...payload });
    return true;
  } catch (error) {
    console.error("[email] send failed", error);
    return false;
  }
}

const layout = (title: string, body: string) => `
  <div style="font-family:sans-serif;max-width:560px;margin:auto">
    <h2>${title}</h2>
    ${body}
    <p style="color:#666;font-size:12px">Manage these in Settings → Notifications.</p>
  </div>`;

export const emailTemplates = {
  welcome: (name: string): EmailPayload => ({
    to: "",
    subject: "Welcome to Researcher",
    html: layout(
      `Welcome, ${name}!`,
      `<p>Your researcher profile is live. Connect with peers, publish papers, and join the conversation.</p>`,
    ),
  }),
  connectRequest: (actor: string): EmailPayload => ({
    to: "",
    subject: `${actor} wants to connect`,
    html: layout(
      "New connection request",
      `<p><strong>${actor}</strong> is interested in your work and wants to connect.</p>`,
    ),
  }),
  digest: (name: string, lines: string[]): EmailPayload => ({
    to: "",
    subject: `Your Researcher digest (${lines.length} unread)`,
    html: layout(
      `Hi ${name}, here's what you missed`,
      `<ul>${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`,
    ),
  }),
};

export type EmailableType = Extract<
  NotificationType,
  "connect_request" | "connect_accept" | "message" | "cite" | "mention"
>;

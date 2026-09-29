import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  // Provider availability is a server-side env question — compute once here
  // so the client form never guesses.
  const providers = {
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    resend: Boolean(process.env.RESEND_API_KEY),
    dev: process.env.NODE_ENV !== "production",
  };

  return <LoginForm providers={providers} callbackUrl={callbackUrl ?? "/"} />;
}

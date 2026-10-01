"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface LoginProviders {
  google: boolean;
  resend: boolean;
  dev: boolean;
  devPassword: string;
  demoEmail: string;
}

export function LoginForm({
  providers,
  callbackUrl,
}: {
  providers: LoginProviders;
  callbackUrl: string;
}) {
  // Prefilled so the seeded demo account is one click away in development.
  const [email, setEmail] = useState(providers.dev ? providers.demoEmail : "");
  const [name, setName] = useState("");
  const [password, setPassword] = useState(providers.dev ? providers.devPassword : "");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("resend", { email, callbackUrl, redirect: false });
    setBusy(false);
    if (res?.error) setError("Could not send the sign-in link. Try again.");
    else setSent(true);
  }

  async function devLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      name: name || undefined,
      password,
      callbackUrl,
      redirect: false,
    });
    setBusy(false);
    if (res?.error || !res?.url) {
      setError("Dev sign-in failed. Check the email and password.");
      return;
    }
    toast.success("Signed in.");
    window.location.assign(res.url);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome to Researcher</CardTitle>
        <CardDescription>Sign in to connect through research.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {sent ? (
          <Alert>
            <AlertDescription>
              Check <strong>{email}</strong> for your sign-in link.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Button
              variant="outline"
              disabled={!providers.google || busy}
              onClick={() => signIn("google", { callbackUrl })}
            >
              Continue with Google
            </Button>
            {!providers.google && (
              <p className="text-muted-foreground text-xs">
                Google sign-in activates once GOOGLE_CLIENT_ID/SECRET are set.
              </p>
            )}

            {providers.resend ? (
              <form onSubmit={magicLink} className="flex flex-col gap-2">
                <Label htmlFor="email">Email magic link</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                />
                <Button type="submit" disabled={busy}>
                  Email me a sign-in link
                </Button>
              </form>
            ) : (
              <p className="text-muted-foreground text-xs">
                Email sign-in activates once RESEND_API_KEY is set.
              </p>
            )}

            {providers.dev && (
              <form onSubmit={devLogin} className="border-t pt-4">
                <p className="mb-2 text-xs font-semibold tracking-wide uppercase">
                  Development only
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dev-email">Email</Label>
                  <Input
                    id="dev-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="amara.okafor@researcher.local"
                  />
                  <Label htmlFor="dev-password">Password</Label>
                  <Input
                    id="dev-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                  <Label htmlFor="dev-name">Name (new accounts only)</Label>
                  <Input
                    id="dev-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Leave blank for a seeded account"
                  />
                  <Button type="submit" variant="secondary" disabled={busy}>
                    Sign in
                  </Button>
                  <p className="text-muted-foreground text-xs">
                    Pre-filled with a seeded demo account. Any other email creates a new
                    profile on first sign-in.
                  </p>
                </div>
              </form>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
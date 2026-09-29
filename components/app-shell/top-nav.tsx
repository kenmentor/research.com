"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Compass,
  Home,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import { ProfileAvatar } from "@/components/common/profile-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { initialsOf } from "@/lib/profile";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/network", label: "Network", icon: Users },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/messages", label: "Messages", icon: MessageSquare },
];

/** Shared active-state logic so the indicator can never disagree. */
function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function TopNav({
  unreadCount = 0,
  username,
  displayName,
  avatarUrl,
}: {
  unreadCount?: number;
  username: string | null;
  displayName: string | null;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const isActive = useIsActive();

  return (
    <header className="bg-card/85 supports-[backdrop-filter]:bg-card/70 sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2"
          aria-label="Researcher home"
        >
          <span className="bg-primary text-primary-foreground grid size-8 place-items-center rounded-lg">
            <svg
              viewBox="0 0 24 24"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M9 3h6" />
              <path d="M10 3v6.4L4.6 18a1.4 1.4 0 0 0 1.2 2.1h12.4a1.4 1.4 0 0 0 1.2-2.1L14 9.4V3" />
              <path d="M7.5 14h9" />
            </svg>
          </span>
          <span className="font-heading hidden text-lg font-semibold sm:inline">
            Researcher
          </span>
        </Link>

        <form
          className="relative ml-1 hidden min-w-0 max-w-sm flex-1 sm:block"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q");
            router.push(
              `/discover${q ? `?q=${encodeURIComponent(String(q))}` : ""}`,
            );
          }}
        >
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            name="q"
            placeholder="Search researchers, papers…"
            aria-label="Search researchers and papers"
            className="bg-surface h-9 pl-9"
          />
        </form>

        <nav className="ml-auto hidden items-center gap-0.5 md:flex" aria-label="Primary">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "text-muted-foreground hover:bg-accent hover:text-foreground relative flex min-w-16 flex-col items-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors",
                  active && "text-primary hover:bg-accent",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
                {label}
                {active && (
                  <span className="bg-primary absolute -bottom-[9px] h-0.5 w-8 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
          <NotificationsBell initialUnreadCount={unreadCount} />
          <ModeToggle />
          {username ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Account menu"
                render={
                  <ProfileAvatar
                    src={avatarUrl}
                    alt={displayName ?? username}
                    initials={initialsOf(displayName ?? username)}
                    className="ring-border ml-1 size-8 cursor-pointer ring-2 transition-shadow hover:ring-primary/40"
                    fallbackClassName="text-xs font-medium"
                  />
                }
              />
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => router.push(`/in/${username}`)}>
                  View profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="lg"
              className="ml-1"
              render={<Link href="/login">Sign in</Link>}
            />
          )}
        </div>
      </div>
    </header>
  );
}

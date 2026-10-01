import { auth } from "@/auth";
import { BottomTabs } from "./bottom-tabs";
import { MiniProfile } from "./mini-profile";
import { RightRail } from "./right-rail";
import { RailSlot } from "./rail-slot";
import { SideNav } from "./side-nav";
import { TopNav } from "./top-nav";
import { SearchPalette } from "@/components/search/search-palette";
import { connectDB } from "@/lib/db";
import { ProfileModel } from "@/models/profile";

interface AppShellProps {
  children: React.ReactNode;
  /** Set false to drop the right rail entirely; RailSlot also hides it per-route. */
  showRail?: boolean;
  unreadCount?: number;
}

/**
 * Responsive shell.
 *
 * Column count steps with available width rather than flipping on at
 * one hard breakpoint:
 *   <640px   single column, bottom tabs, icon-only header
 *   640px+   header search appears
 *   1024px+  left rail appears, bottom tabs retire
 *   1280px+  right rail joins, giving the full three-column desktop
 *
 * The centre column is capped at 52rem so abstracts and bios keep a
 * comfortable measure instead of stretching on wide monitors. The right
 * rail is suppressed on routes that bring their own secondary column
 * (see rail-slot.tsx) — otherwise three columns fight for the same space
 * and the content column collapses to roughly 370px on a 1024px screen.
 */
export async function AppShell({
  children,
  showRail = true,
  unreadCount = 0,
}: AppShellProps) {
  const session = await auth();

  let username: string | null = null;
  let displayName: string | null = session?.user?.name ?? null;
  let avatarUrl: string | null = null;
  if (session?.user) {
    await connectDB();
    const me = await ProfileModel.findOne({ userId: session.user.id })
      .select("username displayName avatarUrl")
      .lean();
    username = me?.username ?? null;
    if (me?.displayName) displayName = me.displayName;
    avatarUrl = me?.avatarUrl || null;
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav
        unreadCount={unreadCount}
        username={username}
        displayName={displayName}
        avatarUrl={avatarUrl}
      />
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 items-start gap-6 px-4 pt-4 pb-24 sm:px-6 lg:pb-8">
        <div className="hidden w-60 shrink-0 flex-col gap-4 lg:flex">
          <MiniProfile />
          <SideNav />
        </div>
        <main className="mx-auto w-full min-w-0 max-w-[52rem] flex-1 lg:mx-0">
          {children}
        </main>
        {showRail && (
          <RailSlot>
            <RightRail />
          </RailSlot>
        )}
      </div>
      <BottomTabs unreadCount={unreadCount} username={username} />
      <SearchPalette />
    </div>
  );
}

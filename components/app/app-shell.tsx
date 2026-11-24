import Link from "next/link";
import { LogOut } from "lucide-react";
import { connection } from "next/server";
import { Suspense } from "react";

import { signOut } from "@/app/auth/actions";
import { AppSidebar } from "@/components/app/app-sidebar";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { Button } from "@/components/ui/button";
import { getOptionalUser } from "@/lib/auth/session";
import { getProfileForUser } from "@/lib/profile/service";

async function AppUserMenu({ collapsed }: { collapsed?: boolean }) {
  // Defer session/cookie work to request time (Cache Components).
  await connection();
  const user = await getOptionalUser();
  if (!user) return null;
  const profile = await getProfileForUser(user.id);
  const label = profile?.display_name?.trim() || user.email || "Account";

  if (collapsed) {
    return (
      <div className="border-t border-border p-2">
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="w-full px-0"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 border-t border-border p-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}

function UserMenuFallback() {
  return <div className="h-20 border-t border-border bg-mist/40" />;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full bg-background">
      <AppSidebar
        userMenu={
          <Suspense fallback={<UserMenuFallback />}>
            <AppUserMenu />
          </Suspense>
        }
        userMenuCollapsed={
          <Suspense fallback={<div className="h-14 border-t border-border bg-mist/40" />}>
            <AppUserMenu collapsed />
          </Suspense>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <Link href="/home" className="font-display text-lg">
            Personal Stylist
          </Link>
          <form action={signOut}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </header>
        <div className="border-b border-border bg-card px-2 py-2 md:hidden">
          <div className="overflow-x-auto">
            <SidebarNav orientation="horizontal" />
          </div>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

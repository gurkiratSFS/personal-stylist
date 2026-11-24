import { Suspense } from "react";

import { AppShell } from "@/components/app/app-shell";

/** App chrome reads session cookies; never prerender as a static blocking shell. */
export const instant = false;

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full items-center justify-center bg-mist text-sm text-muted-foreground">
          Loading your workspace…
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}

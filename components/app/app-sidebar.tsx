"use client";

import Link from "next/link";
import { useCallback, useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

import { SidebarNav } from "@/components/app/sidebar-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "ps-sidebar-collapsed";
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getCollapsedSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

function getServerSnapshot() {
  return false;
}

function setCollapsed(next: boolean) {
  window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  listeners.forEach((listener) => listener());
}

export function AppSidebar({
  userMenu,
  userMenuCollapsed,
}: {
  userMenu: React.ReactNode;
  userMenuCollapsed: React.ReactNode;
}) {
  const collapsed = useSyncExternalStore(
    subscribe,
    getCollapsedSnapshot,
    getServerSnapshot,
  );

  const toggle = useCallback(() => {
    setCollapsed(!collapsed);
  }, [collapsed]);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-start gap-2 border-b border-border",
          collapsed ? "flex-col px-2 py-3" : "px-4 py-5",
        )}
      >
        <div className={cn("min-w-0 flex-1", collapsed && "hidden")}>
          <Link href="/home" className="font-display text-xl tracking-tight">
            Personal Stylist
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">Your style companion</p>
        </div>
        {collapsed ? (
          <Link
            href="/home"
            className="mx-auto font-display text-lg tracking-tight"
            aria-label="Personal Stylist home"
          >
            PS
          </Link>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("shrink-0", collapsed && "mx-auto")}
          onClick={toggle}
          aria-pressed={collapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>
      {collapsed ? userMenuCollapsed : userMenu}
    </aside>
  );
}

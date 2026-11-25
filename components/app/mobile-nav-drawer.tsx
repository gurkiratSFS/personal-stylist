"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, Menu, X } from "lucide-react";

import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { APP_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

const CLOSE_MS = 280;

function lockBodyScroll() {
  const scrollbarWidth =
    window.innerWidth - document.documentElement.clientWidth;
  const previous = {
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
  };
  document.body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    document.body.style.paddingRight = `${scrollbarWidth}px`;
    document.documentElement.style.setProperty(
      "--drawer-scrollbar-compensation",
      `${scrollbarWidth}px`,
    );
  }
  return () => {
    document.body.style.overflow = previous.overflow;
    document.body.style.paddingRight = previous.paddingRight;
    document.documentElement.style.removeProperty(
      "--drawer-scrollbar-compensation",
    );
  };
}

export function MobileNavDrawer({
  displayName,
  email,
}: {
  displayName: string;
  email?: string;
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [rendered, setRendered] = useState(false);
  const [entered, setEntered] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  function openDrawer() {
    setRendered(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setEntered(true));
    });
  }

  function closeDrawer() {
    setEntered(false);
  }

  useEffect(() => {
    setEntered(false);
  }, [pathname]);

  useEffect(() => {
    if (!rendered || entered) return;
    const timer = window.setTimeout(() => setRendered(false), CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [rendered, entered]);

  useEffect(() => {
    if (!rendered) return;
    const unlock = lockBodyScroll();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeDrawer();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      unlock();
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [rendered]);

  const drawer =
    rendered && mounted
      ? createPortal(
          <div className="fixed inset-0 z-[100] md:hidden">
            <button
              type="button"
              className={cn(
                "absolute inset-0 bg-ink/45 transition-opacity ease-out",
                entered ? "opacity-100" : "opacity-0",
              )}
              style={{ transitionDuration: `${CLOSE_MS}ms` }}
              aria-label="Close menu overlay"
              onClick={closeDrawer}
            />
            <aside
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={cn(
                "absolute inset-y-0 right-0 flex h-svh w-[min(20rem,88vw)] flex-col border-l border-border bg-background shadow-xl transition-transform ease-out will-change-transform",
                entered ? "translate-x-0" : "translate-x-full",
              )}
              style={{ transitionDuration: `${CLOSE_MS}ms` }}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="min-w-0">
                  <p id={titleId} className="font-display text-lg tracking-tight">
                    Menu
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {displayName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 px-0"
                  aria-label="Close menu"
                  onClick={closeDrawer}
                >
                  <X className="size-4" />
                </Button>
              </div>

              <nav className="flex-1 overflow-y-auto p-3" aria-label="Application">
                <ul className="space-y-1">
                  {APP_NAV_ITEMS.map((item) => {
                    const active =
                      pathname === item.href ||
                      pathname.startsWith(`${item.href}/`);
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-colors",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-mist",
                          )}
                          onClick={closeDrawer}
                        >
                          <span className="flex items-center gap-2.5">
                            <Icon className="size-4 shrink-0" aria-hidden />
                            {item.label}
                          </span>
                          {!item.available ? (
                            <span
                              className={cn(
                                "text-[10px] tracking-wide uppercase",
                                active
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              Soon
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="space-y-3 border-t border-border p-4">
                {email ? (
                  <p className="truncate text-xs text-muted-foreground">{email}</p>
                ) : null}
                <form action={signOut}>
                  <Button type="submit" variant="outline" className="w-full gap-2">
                    <LogOut className="size-4" />
                    Sign out
                  </Button>
                </form>
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 w-10 px-0"
        aria-expanded={entered}
        aria-controls="mobile-nav-drawer"
        aria-label={entered ? "Close menu" : "Open menu"}
        onClick={openDrawer}
      >
        <Menu className="size-4" />
      </Button>
      {drawer}
    </div>
  );
}

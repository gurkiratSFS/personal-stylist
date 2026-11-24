"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { APP_NAV_ITEMS } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function SidebarNav({
  orientation = "vertical",
  collapsed = false,
}: {
  orientation?: "vertical" | "horizontal";
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const horizontal = orientation === "horizontal";

  return (
    <nav
      className={cn(
        horizontal
          ? "flex flex-row gap-1 px-1"
          : "flex flex-col gap-1 p-3",
      )}
      aria-label="Application"
    >
      {APP_NAV_ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            className={cn(
              "flex items-center rounded-xl text-sm transition-colors",
              horizontal
                ? "shrink-0 gap-2 px-3 py-2 whitespace-nowrap"
                : collapsed
                  ? "justify-center px-2 py-2.5"
                  : "justify-between gap-2 px-3 py-2.5",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-mist hover:text-foreground",
            )}
          >
            <span className={cn("flex items-center gap-2.5", collapsed && !horizontal && "gap-0")}>
              <Icon className="size-4 shrink-0" aria-hidden />
              {horizontal || !collapsed ? <span>{item.label}</span> : null}
            </span>
            {!item.available && (horizontal || !collapsed) ? (
              <span
                className={cn(
                  "text-[10px] tracking-wide uppercase",
                  active ? "text-primary-foreground/70" : "text-muted-foreground",
                )}
              >
                Soon
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

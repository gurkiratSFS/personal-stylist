"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const SECTION_LINKS = [
  { href: "/analyze", label: "Overview" },
  { href: "/analyze/uploads", label: "Uploads" },
  { href: "/analyze/history", label: "History" },
  { href: "/analyze/saved", label: "Saved looks" },
  { href: "/analyze/compare", label: "Compare" },
] as const;

export function AnalyzeSubnav() {
  const pathname = usePathname();
  const router = useRouter();

  const selectValue =
    SECTION_LINKS.find((item) =>
      item.href === "/analyze"
        ? pathname === "/analyze"
        : pathname === item.href || pathname.startsWith(`${item.href}/`),
    )?.href ?? "/analyze";

  return (
    <div className="mb-8">
      <div className="sm:hidden">
        <Label htmlFor="analyze-subnav" className="sr-only">
          Analyzer section
        </Label>
        <select
          id="analyze-subnav"
          className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
          value={selectValue}
          onChange={(event) => router.push(event.target.value)}
        >
          {SECTION_LINKS.map((item) => (
            <option key={item.href} value={item.href}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="hidden flex-wrap gap-2 sm:flex">
        {SECTION_LINKS.map((item) => {
          const active =
            item.href === "/analyze"
              ? pathname === "/analyze"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: active ? "default" : "outline" }),
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

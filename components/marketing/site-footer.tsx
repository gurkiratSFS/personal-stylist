import Link from "next/link";

import { MARKETING_LINKS } from "@/lib/navigation";

const legal = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink text-primary-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <p className="font-display text-2xl">Personal Stylist</p>
          <p className="max-w-sm text-sm text-white/70">
            An AI companion for outfits, grooming, wardrobe, and the habits that
            make style feel natural every day.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs tracking-[0.18em] text-white/50 uppercase">
            Product
          </p>
          <ul className="space-y-2 text-sm text-white/80">
            {MARKETING_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/signup" className="hover:text-white">
                Create account
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs tracking-[0.18em] text-white/50 uppercase">
            Legal
          </p>
          <ul className="space-y-2 text-sm text-white/80">
            {legal.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/contact" className="hover:text-white">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 text-xs text-white/50 sm:px-6">
          <span>© 2026 Personal Stylist</span>
          <span>Built for everyday confidence</span>
        </div>
      </div>
    </footer>
  );
}

import type { LucideIcon } from "lucide-react";
import {
  Home,
  ScanSearch,
  Shirt,
  Compass,
  Scissors,
  ShoppingBag,
  MessageSquare,
  UserRound,
} from "lucide-react";

export const MARKETING_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const APP_NAV_ITEMS: readonly {
  href: string;
  label: string;
  available: boolean;
  icon: LucideIcon;
}[] = [
  { href: "/home", label: "Home", available: true, icon: Home },
  { href: "/analyze", label: "Outfit Analyzer", available: true, icon: ScanSearch },
  { href: "/wardrobe", label: "My Wardrobe", available: true, icon: Shirt },
  { href: "/discover", label: "Discover", available: false, icon: Compass },
  { href: "/grooming", label: "Grooming", available: false, icon: Scissors },
  { href: "/shopping", label: "Shopping", available: false, icon: ShoppingBag },
  { href: "/assistant", label: "AI Assistant", available: false, icon: MessageSquare },
  { href: "/profile", label: "Profile", available: true, icon: UserRound },
];

/** @deprecated Prefer APP_NAV_ITEMS. Kept for existing tests during migration. */
export const NAV_ITEMS = APP_NAV_ITEMS;

export function moduleStatus(href: string) {
  const item = APP_NAV_ITEMS.find((entry) => entry.href === href);
  if (!item) return "unknown" as const;
  return item.available ? ("open" as const) : ("pending" as const);
}

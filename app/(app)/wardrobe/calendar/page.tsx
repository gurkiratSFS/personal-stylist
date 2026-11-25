import { connection } from "next/server";

import { CalendarPanel } from "@/components/wardrobe/calendar-panel";
import { requireUser } from "@/lib/auth/session";
import { listCalendarEntries, listCombinations } from "@/lib/wardrobe/service";

export const metadata = { title: "Outfit calendar" };
export const instant = false;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function WardrobeCalendarPage() {
  await connection();
  const user = await requireUser();
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const to = new Date(today.getFullYear(), today.getMonth() + 2, 0);

  const [combinations, entries] = await Promise.all([
    listCombinations(user.id),
    listCalendarEntries(user.id, isoDate(from), isoDate(to)),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl tracking-tight">Calendar</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tap a day to see planned looks or assign a combination.
        </p>
      </div>
      <CalendarPanel
        combinations={combinations.map((combo) => ({
          id: combo.id,
          title: combo.title,
          items: combo.items,
        }))}
        entries={entries}
      />
    </div>
  );
}

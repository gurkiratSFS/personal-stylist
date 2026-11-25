"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  assignCalendarAction,
  removeCalendarAction,
  type WardrobeActionState,
} from "@/app/wardrobe/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const initial: WardrobeActionState = { error: null, message: null };

type ComboOption = {
  id: string;
  title: string;
  items?: Array<{
    id: string;
    name: string | null;
    signedUrl: string | null;
  } | null>;
};

type Entry = {
  id: string;
  scheduled_date: string;
  notes: string | null;
  combination: {
    id: string;
    title: string;
  } | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toIsoDate(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function CalendarPanel({
  combinations,
  entries,
}: {
  combinations: ComboOption[];
  entries: Entry[];
}) {
  const router = useRouter();
  const today = new Date();
  const [cursor, setCursor] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const entriesByDate = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const entry of entries) {
      const list = map.get(entry.scheduled_date) ?? [];
      list.push(entry);
      map.set(entry.scheduled_date, list);
    }
    return map;
  }, [entries]);

  const combosById = useMemo(
    () => new Map(combinations.map((combo) => [combo.id, combo])),
    [combinations],
  );

  const days = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: Array<{
      day: number | null;
      iso: string | null;
    }> = [];

    for (let i = 0; i < startPad; i += 1) {
      cells.push({ day: null, iso: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        day,
        iso: toIsoDate(cursor.year, cursor.month, day),
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, iso: null });
    }
    return cells;
  }, [cursor]);

  const selectedEntries = selectedDate
    ? entriesByDate.get(selectedDate) ?? []
    : [];

  const todayIso = toIsoDate(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  function shiftMonth(delta: number) {
    setCursor((prev) => {
      const date = new Date(prev.year, prev.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  function assignOutfit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await assignCalendarAction(initial, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function removeEntry(entryId: string) {
    setError(null);
    const formData = new FormData();
    formData.set("entry_id", entryId);
    startTransition(async () => {
      const result = await removeCalendarAction(initial, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (selectedEntries.length <= 1) {
        setSelectedDate(null);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-border p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-10 px-0"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <h2 className="font-display text-2xl tracking-tight">
            {monthLabel(cursor.year, cursor.month)}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 w-10 px-0"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground sm:gap-2">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 font-medium tracking-wide uppercase">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {days.map((cell, index) => {
            if (!cell.iso || cell.day == null) {
              return <div key={`empty-${index}`} className="min-h-16 sm:min-h-20" />;
            }
            const dayEntries = entriesByDate.get(cell.iso) ?? [];
            const hasLooks = dayEntries.length > 0;
            const isToday = cell.iso === todayIso;
            return (
              <button
                key={cell.iso}
                type="button"
                onClick={() => setSelectedDate(cell.iso)}
                className={cn(
                  "flex min-h-16 flex-col items-start gap-1 rounded-xl border px-2 py-2 text-left transition-colors sm:min-h-20",
                  hasLooks
                    ? "border-accent/50 bg-mist/70 hover:border-accent"
                    : "border-border/70 hover:border-accent/40",
                  isToday && "ring-1 ring-accent/60",
                )}
              >
                <span className="text-sm font-medium">{cell.day}</span>
                {hasLooks ? (
                  <span className="line-clamp-2 text-[10px] leading-tight text-muted-foreground sm:text-xs">
                    {dayEntries
                      .map((entry) => entry.combination?.title || "Look")
                      .join(", ")}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {selectedDate ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <button
            type="button"
            className="absolute inset-0 bg-ink/50"
            aria-label="Close day details"
            onClick={() => setSelectedDate(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.5rem] border border-border bg-background shadow-xl sm:rounded-[1.5rem]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <p className="text-xs tracking-[0.18em] text-accent uppercase">
                  Planned looks
                </p>
                <h3 className="mt-1 font-display text-2xl tracking-tight">
                  {selectedDate}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-10 w-10 px-0"
                aria-label="Close"
                onClick={() => setSelectedDate(null)}
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5">
              {selectedEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing planned for this day yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {selectedEntries.map((entry) => {
                    const combo = entry.combination
                      ? combosById.get(entry.combination.id)
                      : null;
                    return (
                      <li
                        key={entry.id}
                        className="rounded-xl border border-border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">
                              {entry.combination?.title || "Look"}
                            </p>
                            {entry.notes ? (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {entry.notes}
                              </p>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => removeEntry(entry.id)}
                          >
                            Remove
                          </Button>
                        </div>
                        {combo?.items?.length ? (
                          <div className="mt-3 flex gap-2 overflow-x-auto">
                            {combo.items.filter(Boolean).map((item) =>
                              item ? (
                                <div
                                  key={item.id}
                                  className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-mist"
                                >
                                  {item.signedUrl ? (
                                    <Image
                                      src={item.signedUrl}
                                      alt={item.name || "Item"}
                                      fill
                                      unoptimized
                                      className="object-cover"
                                    />
                                  ) : null}
                                </div>
                              ) : null,
                            )}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}

              <form action={assignOutfit} className="space-y-3 border-t border-border pt-4">
                <input type="hidden" name="scheduled_date" value={selectedDate} />
                <div className="space-y-2">
                  <Label htmlFor="modal_combo">Add a combination</Label>
                  <select
                    id="modal_combo"
                    name="combination_id"
                    required
                    className="h-11 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm"
                    defaultValue=""
                    disabled={combinations.length === 0}
                  >
                    <option value="" disabled>
                      {combinations.length === 0
                        ? "Create a combination first"
                        : "Choose a look"}
                    </option>
                    {combinations.map((combo) => (
                      <option key={combo.id} value={combo.id}>
                        {combo.title}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  disabled={isPending || combinations.length === 0}
                >
                  {isPending ? "Saving…" : "Add to this day"}
                </Button>
              </form>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

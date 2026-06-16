"use client";

import { useState, useMemo } from "react";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import type { CalendarEvent } from "@/lib/google-drive";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { "en-US": enUS },
});

type Props = {
  events: CalendarEvent[];
  loading?: boolean;
  categoryColor?: string;
};

const EVENT_COLORS: Record<string, string> = {
  green: "#5a8f62",
  blue: "#4a7ab5",
  yellow: "#c19435",
  purple: "#7a5fa8",
  gray: "#8a7a6e",
};

const SLUG_TO_COLOR: Record<string, string> = {
  "house-projects": "green",
  "noah": "blue",
  "financial-planning": "yellow",
  "vacations": "purple",
};

const HEADER_COLORS: Record<string, { bar: string; title: string; toggle: string; activeToggle: string }> = {
  gray: {
    bar: "bg-[#8a7a6e]",
    title: "text-white",
    toggle: "text-white/70 hover:text-white",
    activeToggle: "bg-white/20 text-white shadow",
  },
  green: {
    bar: "bg-[#5a8f62]",
    title: "text-white",
    toggle: "text-white/70 hover:text-white",
    activeToggle: "bg-white/20 text-white shadow",
  },
  blue: {
    bar: "bg-[#4a7ab5]",
    title: "text-white",
    toggle: "text-white/70 hover:text-white",
    activeToggle: "bg-white/20 text-white shadow",
  },
  yellow: {
    bar: "bg-[#c19435]",
    title: "text-white",
    toggle: "text-white/70 hover:text-white",
    activeToggle: "bg-white/20 text-white shadow",
  },
  purple: {
    bar: "bg-[#7a5fa8]",
    title: "text-white",
    toggle: "text-white/70 hover:text-white",
    activeToggle: "bg-white/20 text-white shadow",
  },
};

export default function CalendarView({ events, loading, categoryColor = "blue" }: Props) {
  const [view, setView] = useState<"month" | "week">("week");
  const [date, setDate] = useState(new Date());

  const calEvents = useMemo(
    () =>
      events.map((e) => {
        const isAllDay = !e.start.includes("T");
        let start: Date, end: Date;
        if (isAllDay) {
          const [sy, sm, sd] = e.start.split("-").map(Number);
          start = new Date(sy, sm - 1, sd);
          const endStr = e.end || e.start;
          const [ey, em, ed] = endStr.split("-").map(Number);
          end = new Date(ey, em - 1, ed - 1);
          if (end < start) end = start;
        } else {
          start = new Date(e.start);
          end = new Date(e.end || e.start);
        }
        return { id: e.id, title: e.summary, start, end, resource: { link: e.htmlLink, categorySlug: e.categorySlug }, allDay: isAllDay };
      }),
    [events]
  );

  const defaultEventColor = EVENT_COLORS[categoryColor] ?? EVENT_COLORS.blue;
  const header = HEADER_COLORS[categoryColor] ?? HEADER_COLORS.blue;

  return (
    <section className="bg-[#fffdf9] rounded-2xl border border-[#e5ddd5] overflow-hidden">
      <div className={`flex items-center justify-between px-6 py-4 ${header.bar}`}>
        <h2 className={`font-semibold ${header.title}`}>Calendar</h2>
        <div className="flex gap-1 bg-black/10 rounded-lg p-1">
          <button
            onClick={() => setView("month")}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === "month" ? header.activeToggle : header.toggle
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView("week")}
            className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
              view === "week" ? header.activeToggle : header.toggle
            }`}
          >
            Week
          </button>
        </div>
      </div>
      <div className="p-6 pt-4">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-sm text-[#9c8e82]">
            Loading events...
          </div>
        ) : (
          <div className="rbc-wrapper">
            <Calendar
              localizer={localizer}
              events={calEvents}
              view={view}
              onView={(v) => setView(v as "month" | "week")}
              date={date}
              onNavigate={(newDate) => setDate(newDate)}
              toolbar={true}
              style={{ height: view === "month" ? (typeof window !== "undefined" && window.innerWidth < 640 ? 340 : 500) : 400 }}
              onSelectEvent={(e) => {
                if (e.resource?.link) window.open(e.resource.link, "_blank");
              }}
              eventPropGetter={(e) => {
                const slug = e.resource?.categorySlug;
                const colorKey = slug ? (SLUG_TO_COLOR[slug] ?? categoryColor) : categoryColor;
                const bgColor = EVENT_COLORS[colorKey] ?? defaultEventColor;
                return {
                  className: "text-white text-xs rounded cursor-pointer",
                  style: { backgroundColor: bgColor, border: "none" },
                };
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}

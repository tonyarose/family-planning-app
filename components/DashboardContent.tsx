"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { COLOR_MAP, CATEGORIES } from "@/lib/categories";
import type { SheetTask } from "@/lib/google-sheets";
import CalendarView from "@/components/CalendarView";
import SchedulingAssistant from "@/components/SchedulingAssistant";

type DashboardEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string | null;
  categorySlug: string;
  categoryName: string;
  categoryIcon: string;
};

type CategoryTasks = {
  slug: string;
  name: string;
  icon: string;
  tasks: SheetTask[];
};

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const SLUG_TO_COLOR: Record<string, string> = {
  "house-projects": "green",
  "noah": "blue",
  "financial-planning": "yellow",
  "vacations": "purple",
};

export default function DashboardContent() {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [tasksByCategory, setTasksByCategory] = useState<CategoryTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickTaskText, setQuickTaskText] = useState("");
  const [quickTaskCategory, setQuickTaskCategory] = useState(CATEGORIES[0].slug);
  const [quickTaskSaving, setQuickTaskSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events ?? []);
        setTasksByCategory(d.tasksByCategory ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function addQuickTask() {
    if (!quickTaskText.trim() || quickTaskSaving) return;
    setQuickTaskSaving(true);
    const cat = CATEGORIES.find((c) => c.slug === quickTaskCategory)!;
    const res = await fetch(`/api/tasks?category=${encodeURIComponent(cat.name)}`);
    const data = await res.json();
    const existing: SheetTask[] = data.tasks ?? [];
    const updated = [...existing, { id: crypto.randomUUID(), text: quickTaskText.trim(), done: false }];
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat.name, tasks: updated }),
    });
    setQuickTaskText("");
    // Refresh task list
    const refreshed = await fetch("/api/dashboard").then((r) => r.json());
    setTasksByCategory(refreshed.tasksByCategory ?? []);
    setQuickTaskSaving(false);
  }

  const categoriesWithTasks = tasksByCategory.filter((c) => c.tasks.length > 0);
  const openTasksByCategory = categoriesWithTasks.map((c) => ({
    ...c,
    tasks: c.tasks.filter((t) => !t.done),
  })).filter((c) => c.tasks.length > 0);

  if (loading) {
    return (
      <div className="mt-10 text-sm text-gray-400 text-center">Loading your family dashboard...</div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      {/* Full-width calendar */}
      <CalendarView events={events} loading={loading} categoryColor="gray" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Upcoming Events list */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Upcoming Events</h2>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">No upcoming events found.</p>
        ) : (
          <ul className="space-y-3">
            {events.map((e) => {
              const colors = COLOR_MAP[
                { "house-projects": "green", noah: "blue", "financial-planning": "yellow", vacations: "purple" }[e.categorySlug] ?? "blue"
              ];
              return (
                <li key={e.id} className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{e.categoryIcon}</span>
                  <div className="flex-1 min-w-0">
                    <a
                      href={e.htmlLink ?? "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline block truncate"
                    >
                      {e.summary}
                    </a>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{formatDate(e.start)}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${colors.badge}`}>
                        {e.categoryName}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Tasks by Category */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Open Tasks</h2>
        {openTasksByCategory.length === 0 ? (
          <p className="text-sm text-gray-400">No open tasks.</p>
        ) : (
          <div className="space-y-5">
            {openTasksByCategory.map((cat) => {
              const colorKey = { "house-projects": "green", noah: "blue", "financial-planning": "yellow", vacations: "purple" }[cat.slug] ?? "blue";
              const colors = COLOR_MAP[colorKey];
              return (
                <div key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="flex items-center gap-1.5 mb-2 group"
                  >
                    <span>{cat.icon}</span>
                    <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text} group-hover:underline`}>
                      {cat.name}
                    </span>
                  </Link>
                  <ul className="space-y-1.5">
                    {cat.tasks.map((t) => (
                      <li key={t.id} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${colors.badge.split(" ")[0]}`} />
                        <span className="text-sm text-gray-700 truncate">{t.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
      </div>

      {/* Quick Add Task */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Quick Add Task</h2>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {CATEGORIES.map((cat) => {
              const colorKey = SLUG_TO_COLOR[cat.slug] ?? "blue";
              const colors = COLOR_MAP[colorKey];
              const active = quickTaskCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setQuickTaskCategory(cat.slug)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    active ? `${colors.badge} font-medium` : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
          <input
            type="text"
            value={quickTaskText}
            onChange={(e) => setQuickTaskText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuickTask()}
            placeholder="Add a task..."
            className="flex-1 min-w-48 text-sm border border-gray-200 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            disabled={quickTaskSaving}
          />
          <button
            onClick={addQuickTask}
            disabled={quickTaskSaving || !quickTaskText.trim()}
            className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {quickTaskSaving ? "Saving..." : "Add"}
          </button>
        </div>
      </section>

      <SchedulingAssistant />
    </div>
  );
}

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
  const d = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
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

  async function toggleDashboardTask(categorySlug: string, taskId: string) {
    const cat = CATEGORIES.find((c) => c.slug === categorySlug)!;
    const catTasks = tasksByCategory.find((c) => c.slug === categorySlug)?.tasks ?? [];
    const updated = catTasks.map((t) => t.id === taskId ? { ...t, done: !t.done } : t);
    setTasksByCategory((prev) =>
      prev.map((c) => c.slug === categorySlug ? { ...c, tasks: updated } : c)
    );
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: cat.name, tasks: updated }),
    });
  }

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
      <div className="mt-10 text-sm text-[#9c8e82] text-center">Loading your family dashboard...</div>
    );
  }

  return (
    <div className="mt-10 space-y-8">
      <CalendarView events={events} loading={loading} categoryColor="gray" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Events */}
        <section className="bg-[#fffdf9] rounded-2xl border border-[#e5ddd5] p-6">
          <h2 className="font-semibold text-[#3d2f27] mb-4">Upcoming Events</h2>
          {events.length === 0 ? (
            <p className="text-sm text-[#9c8e82]">No upcoming events found.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => {
                const colors = COLOR_MAP[SLUG_TO_COLOR[e.categorySlug] ?? "blue"];
                return (
                  <li key={e.id} className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">{e.categoryIcon}</span>
                    <div className="flex-1 min-w-0">
                      <a
                        href={e.htmlLink ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#c17a5a] hover:underline block truncate"
                      >
                        {e.summary}
                      </a>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-[#9c8e82]">{formatDate(e.start)}</span>
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

        {/* Open Tasks */}
        <section className="bg-[#fffdf9] rounded-2xl border border-[#e5ddd5] p-6">
          <h2 className="font-semibold text-[#3d2f27] mb-4">Open Tasks</h2>
          {openTasksByCategory.length === 0 ? (
            <p className="text-sm text-[#9c8e82]">No open tasks.</p>
          ) : (
            <div className="space-y-5">
              {openTasksByCategory.map((cat) => {
                const colorKey = SLUG_TO_COLOR[cat.slug] ?? "blue";
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
                        <li key={t.id} className="flex items-center gap-2 group">
                          <input
                            type="checkbox"
                            checked={t.done}
                            onChange={() => toggleDashboardTask(cat.slug, t.id)}
                            className="rounded shrink-0 accent-[#6b8f71]"
                          />
                          <span className={`text-sm truncate ${t.done ? "line-through text-[#9c8e82]" : "text-[#3d2f27]"}`}>
                            {t.text}
                          </span>
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
      <section className="bg-[#fffdf9] rounded-2xl border border-[#e5ddd5] p-6">
        <h2 className="font-semibold text-[#3d2f27] mb-4">Quick Add Task</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex flex-wrap gap-1 bg-[#f5efe8] rounded-xl p-1">
            {CATEGORIES.map((cat) => {
              const colorKey = SLUG_TO_COLOR[cat.slug] ?? "blue";
              const colors = COLOR_MAP[colorKey];
              const active = quickTaskCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => setQuickTaskCategory(cat.slug)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    active ? `${colors.badge} font-semibold` : "text-[#9c8e82] hover:text-[#3d2f27]"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 flex-1">
            <input
              type="text"
              value={quickTaskText}
              onChange={(e) => setQuickTaskText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuickTask()}
              placeholder="Add a task..."
              className="flex-1 text-sm border border-[#e5ddd5] bg-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#c17a5a]/30 placeholder:text-[#c9b5a6]"
              disabled={quickTaskSaving}
            />
            <button
              onClick={addQuickTask}
              disabled={quickTaskSaving || !quickTaskText.trim()}
              className="text-sm bg-[#c17a5a] text-white px-4 py-2 rounded-xl hover:bg-[#a8634a] disabled:opacity-50 transition-colors whitespace-nowrap font-medium"
            >
              {quickTaskSaving ? "Saving..." : "Add"}
            </button>
          </div>
        </div>
      </section>

      <SchedulingAssistant />
    </div>
  );
}

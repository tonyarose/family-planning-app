"use client";

import { useEffect, useState, useCallback } from "react";
import type { Category } from "@/lib/categories";
import type { DriveFile, CalendarEvent } from "@/lib/google-drive";
import CalendarView from "@/components/CalendarView";
import SchedulingAssistant from "@/components/SchedulingAssistant";

type Props = {
  category: Category;
  colors: { bg: string; border: string; badge: string; text: string };
};

type Task = { id: string; text: string; done: boolean };

type BreadcrumbEntry = { id: string; name: string };

const MIME_LABELS: Record<string, string> = {
  "application/vnd.google-apps.document": "Doc",
  "application/vnd.google-apps.spreadsheet": "Sheet",
  "application/vnd.google-apps.presentation": "Slides",
  "application/pdf": "PDF",
};

function fileLabel(mimeType: string): string {
  return MIME_LABELS[mimeType] ?? "File";
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function CategoryContent({ category, colors }: Props) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbEntry[]>([]);
  const [rootFolderId, setRootFolderId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksSaving, setTasksSaving] = useState(false);
  const [newTask, setNewTask] = useState("");


  const [creating, setCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocType, setNewDocType] = useState<"doc" | "sheet">("doc");
  const [createError, setCreateError] = useState<string | null>(null);

  const loadFolder = useCallback(
    async (folderId?: string) => {
      setFilesLoading(true);
      setFilesError(null);
      const url = folderId
        ? `/api/drive/files?folderId=${folderId}`
        : `/api/drive/files?category=${encodeURIComponent(category.name)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        setFilesError(data.error);
      } else {
        setFiles(data.files ?? []);
        if (!folderId && data.folderId) {
          setRootFolderId(data.folderId);
          setBreadcrumbs([{ id: data.folderId, name: category.name }]);
        }
      }
      setFilesLoading(false);
    },
    [category.name]
  );

  useEffect(() => {
    loadFolder();

    fetch(`/api/calendar?slug=${category.slug}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {})
      .finally(() => setEventsLoading(false));

    fetch(`/api/tasks?category=${encodeURIComponent(category.name)}`)
      .then((r) => r.json())
      .then((d) => setTasks(d.tasks ?? []))
      .catch(() => {})
      .finally(() => setTasksLoading(false));
  }, [category.name, loadFolder]);

  function navigateInto(folder: DriveFile) {
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    loadFolder(folder.id);
  }

  function navigateTo(index: number) {
    const crumb = breadcrumbs[index];
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    loadFolder(crumb.id);
  }

  async function persistTasks(updated: Task[]) {
    setTasks(updated);
    setTasksSaving(true);
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: category.name, tasks: updated }),
    }).catch(() => {});
    setTasksSaving(false);
  }

  function addTask() {
    if (!newTask.trim()) return;
    persistTasks([...tasks, { id: crypto.randomUUID(), text: newTask.trim(), done: false }]);
    setNewTask("");
  }

  function toggleTask(id: string) {
    persistTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function deleteTask(id: string) {
    persistTasks(tasks.filter((t) => t.id !== id));
  }

async function createFile() {
    if (!newDocTitle.trim()) return;
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/drive/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: category.name, title: newDocTitle, type: newDocType }),
    });
    const data = await res.json();
    if (data.error) {
      setCreateError(data.error);
    } else {
      window.open(data.webViewLink, "_blank");
      setNewDocTitle("");
      loadFolder(breadcrumbs[breadcrumbs.length - 1]?.id);
    }
    setCreating(false);
  }

  const currentFolderId = breadcrumbs[breadcrumbs.length - 1]?.id;
  const folders = files.filter((f) => f.isFolder);
  const docs = files.filter((f) => !f.isFolder);

  return (
    <div className="space-y-6">
      {/* Calendar — full width on top */}
      <CalendarView
        events={events}
        loading={eventsLoading}
        categoryColor={category.color}
      />

      {/* AI Scheduling Assistant — House Projects only */}
      {category.slug === "house-projects" && <SchedulingAssistant />}

      {/* Files + Tasks side by side below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Files — 2/3 width */}
        <div className="lg:col-span-2">
          <section className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Google Drive Files</h2>

            {/* Breadcrumbs */}
            {breadcrumbs.length > 0 && (
              <div className="flex items-center gap-1 text-sm mb-4 flex-wrap">
                {breadcrumbs.map((crumb, i) => (
                  <span key={crumb.id} className="flex items-center gap-1">
                    {i > 0 && <span className="text-gray-400">/</span>}
                    {i < breadcrumbs.length - 1 ? (
                      <button onClick={() => navigateTo(i)} className="text-blue-600 hover:underline">
                        {crumb.name}
                      </button>
                    ) : (
                      <span className="text-gray-700 font-medium">{crumb.name}</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {filesLoading && <p className="text-sm text-gray-400">Loading files...</p>}
            {filesError && <p className="text-sm text-red-500">{filesError}</p>}
            {!filesLoading && !filesError && files.length === 0 && (
              <p className="text-sm text-gray-400">This folder is empty.</p>
            )}

            {folders.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Folders</p>
                <ul className="space-y-1">
                  {folders.map((f) => (
                    <li key={f.id}>
                      <button
                        onClick={() => navigateInto(f)}
                        className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 hover:underline w-full text-left py-1"
                      >
                        <span>📁</span>
                        <span>{f.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {docs.length > 0 && (
              <div>
                {folders.length > 0 && (
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Files</p>
                )}
                <ul className="space-y-2">
                  {docs.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3">
                      <a
                        href={f.webViewLink ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate flex-1"
                      >
                        {f.name}
                      </a>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                          {fileLabel(f.mimeType)}
                        </span>
                        {f.modifiedTime && (
                          <span className="text-xs text-gray-400 hidden sm:block">
                            {formatDate(f.modifiedTime)}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Create new</p>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createFile()}
                  placeholder="Document title..."
                  className="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <select
                  value={newDocType}
                  onChange={(e) => setNewDocType(e.target.value as "doc" | "sheet")}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none"
                >
                  <option value="doc">Doc</option>
                  <option value="sheet">Sheet</option>
                </select>
                <button
                  onClick={createFile}
                  disabled={creating || !newDocTitle.trim()}
                  className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
              {createError && <p className="text-xs text-red-500 mt-1">{createError}</p>}
            </div>
          </section>
        </div>

        {/* Tasks — 1/3 width */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Tasks</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a task..."
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={addTask}
              className="text-sm bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add
            </button>
          </div>
          {tasksLoading && <p className="text-sm text-gray-400">Loading tasks...</p>}
          {!tasksLoading && tasks.length === 0 && <p className="text-sm text-gray-400">No tasks yet.</p>}
          {tasksSaving && <p className="text-xs text-gray-400 mb-1">Saving...</p>}
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={() => toggleTask(t.id)}
                  className="rounded accent-indigo-600"
                />
                <span className={`text-sm flex-1 ${t.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                  {t.text}
                </span>
                <button
                  onClick={() => deleteTask(t.id)}
                  className="text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

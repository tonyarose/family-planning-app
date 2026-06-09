import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getUpcomingEvents } from "@/lib/google-drive";
import { getTasks } from "@/lib/google-sheets";
import { CATEGORIES, CATEGORY_KEYWORDS } from "@/lib/categories";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch events and tasks for all categories in parallel
  const [eventsResults, tasksResults] = await Promise.all([
    Promise.all(
      CATEGORIES.map(async (cat) => {
        const keywords = CATEGORY_KEYWORDS[cat.slug] ?? [];
        const events = await getUpcomingEvents(session.accessToken!, keywords, 10);
        return events.map((e) => ({ ...e, categorySlug: cat.slug, categoryName: cat.name, categoryIcon: cat.icon }));
      })
    ),
    Promise.all(
      CATEGORIES.map(async (cat) => {
        const tasks = await getTasks(session.accessToken!, cat.name);
        return { slug: cat.slug, name: cat.name, icon: cat.icon, tasks };
      })
    ),
  ]);

  // Merge and deduplicate events across categories, sort by start time
  const seen = new Set<string>();
  const allEvents = eventsResults
    .flat()
    .filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    })
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 30);

  return NextResponse.json({ events: allEvents, tasksByCategory: tasksResults });
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import Link from "next/link";
import NavBar from "@/components/NavBar";
import { CATEGORIES, COLOR_MAP } from "@/lib/categories";
import DashboardContent from "@/components/DashboardContent";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session.user?.name?.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">What are you planning today?</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="categories">
          {CATEGORIES.map((cat) => {
            const colors = COLOR_MAP[cat.color];
            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`${colors.bg} ${colors.border} border rounded-2xl p-6 hover:shadow-md transition-shadow group`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.badge}`}>
                    View
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 group-hover:underline">
                  {cat.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
              </Link>
            );
          })}
        </div>

        <DashboardContent />
      </main>
    </div>
  );
}

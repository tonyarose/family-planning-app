import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect, notFound } from "next/navigation";
import NavBar from "@/components/NavBar";
import { getCategoryBySlug, COLOR_MAP } from "@/lib/categories";
import CategoryContent from "@/components/CategoryContent";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const colors = COLOR_MAP[category.color];

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">{category.icon}</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{category.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{category.description}</p>
          </div>
        </div>
        <CategoryContent category={category} colors={colors} />
      </main>
    </div>
  );
}

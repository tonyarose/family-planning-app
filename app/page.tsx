import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full mx-4 text-center">
        <div className="text-5xl mb-4">🏡</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Family Hub</h1>
        <p className="text-gray-500 mb-8">
          Your shared space for planning everything that matters — landscaping, insurance,
          finances, vacations, and more.
        </p>
        <SignInButton />
        <p className="text-xs text-gray-400 mt-4">
          Sign in with Google to access your shared family planning space.
        </p>
      </div>
    </div>
  );
}

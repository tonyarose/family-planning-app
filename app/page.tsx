import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import SignInButton from "@/components/SignInButton";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#faf8f4]">
      <div className="bg-[#fffdf9] rounded-2xl border border-[#e5ddd5] p-10 max-w-md w-full mx-4 text-center">
        <div className="text-5xl mb-4">🏡</div>
        <h1 className="text-3xl font-bold text-[#3d2f27] mb-2">Family <span className="text-[#c17a5a]">Hub</span></h1>
        <p className="text-[#7a6a62] mb-8">
          Your shared space for planning everything that matters — house projects,
          finances, vacations, and more.
        </p>
        <SignInButton />
        <p className="text-xs text-[#9c8e82] mt-4">
          Sign in with Google to access your shared family planning space.
        </p>
      </div>
    </div>
  );
}

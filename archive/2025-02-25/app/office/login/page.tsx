import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OfficeLoginForm } from "./office-login-form";

export default async function OfficeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const params = await searchParams;
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect(params.redirect?.startsWith("/office") ? params.redirect : "/office");
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded border border-gray-200 bg-white p-6 shadow">
        <h1 className="text-xl font-bold">Office sign in</h1>
        <p className="mt-1 text-sm text-gray-600">Sign in to access the admin area.</p>
        <OfficeLoginForm redirectTo={params.redirect ?? "/office"} />
        <p className="mt-4 text-center text-sm text-gray-500">
          <Link href="/" className="underline">Back to site</Link>
        </p>
      </div>
    </div>
  );
}

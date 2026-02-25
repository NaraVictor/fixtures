import Link from "next/link";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { OfficeSignOut } from "@/app/office/(dashboard)/office-sign-out";

export default async function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 border-r border-gray-200 bg-gray-50 p-4">
        <h2 className="font-bold">Office</h2>
        <nav className="mt-4 flex flex-col gap-2 text-sm">
          <Link href="/office" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/office/teams" className="hover:underline">
            Teams
          </Link>
          <Link href="/office/config" className="hover:underline">
            Ranking config
          </Link>
          <Link href="/office/import" className="hover:underline">
            Import CSV
          </Link>
        </nav>
        {user && (
          <div className="mt-4 border-t border-gray-200 pt-4">
            <p className="truncate text-xs text-gray-500">{user.email}</p>
            <OfficeSignOut />
          </div>
        )}
        <Link
          href="/"
          className="mt-6 block text-xs text-gray-500 hover:underline">
          ← Public site
        </Link>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

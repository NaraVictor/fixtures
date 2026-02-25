"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function OfficeSignOut() {
  const router = useRouter();
  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/office/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={signOut}
      className="mt-1 text-xs text-gray-600 hover:underline"
    >
      Sign out
    </button>
  );
}

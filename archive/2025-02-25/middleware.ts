import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOffice = request.nextUrl.pathname.startsWith("/office");
  const isOfficeLogin = request.nextUrl.pathname.startsWith("/office/login");

  if (isOffice && !isOfficeLogin) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/office/login";
      url.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean) ?? [];
    const role = (user as { app_metadata?: { role?: string } })?.app_metadata?.role;
    const isAdmin = role === "admin" || (adminEmails.length > 0 && user.email && adminEmails.includes(user.email.toLowerCase()));
    if (adminEmails.length > 0 && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/office", "/office/:path*"],
};

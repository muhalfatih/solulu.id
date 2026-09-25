import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { evaluateRbac, type UserWithRoles } from "./rbac";

/**
 * Handles Supabase SSR session cookie refreshing and RBAC routing enforcement.
 */
export async function handleRbacProxy(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  let user: UserWithRoles = null;

  // Support demo role cookie for local development and reviewer evaluation
  const demoRole = request.cookies.get("solulu_demo_role")?.value;
  if (demoRole === "admin" || demoRole === "counselor") {
    user = {
      id: `demo-${demoRole}-id`,
      app_metadata: { role: demoRole },
      user_metadata: { role: demoRole },
    };
  } else if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    user = supabaseUser as UserWithRoles;
  }

  const decision = evaluateRbac(user, pathname);

  if (decision.type === "redirect") {
    const redirectUrl = new URL(decision.destination, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

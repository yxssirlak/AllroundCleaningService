import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    config.url,
    config.publishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });

          for (const name of ["cache-control", "expires", "pragma"]) {
            const value = headers?.[name];
            if (value) {
              response.headers.set(name, value);
            }
          }
        },
      },
    },
  );

  const { error } = await supabase.auth.getClaims();
  if (error) {
    console.error("Supabase-sessie kon niet worden vernieuwd:", error.message);
  }

  return response;
}

export const config = {
  matcher: ["/erp/:path*", "/api/inventory/:path*", "/login"],
};

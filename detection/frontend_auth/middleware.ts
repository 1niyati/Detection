import { type NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

const protectedRoutes = ["/dashboard"]
const authRoutes = ["/login", "/signup"]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const session = await getSession()

  // Redirect to login if accessing protected route without session
  if (protectedRoutes.includes(path) && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Redirect to dashboard if accessing auth routes with active session
  if (authRoutes.includes(path) && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

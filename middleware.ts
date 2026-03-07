import { NextResponse, type NextRequest } from 'next/server'

const publicRoutes = ['/', '/api/waitlist']

export async function middleware(request: NextRequest) {
  const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname)

  if (!isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

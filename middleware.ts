import { NextResponse, NextRequest } from 'next/server';

/**
 * SYORDER Subdomain Routing Middleware
 *
 * Production subdomains:
 *   admin.syorder.hu   → /admin/* (superadmin panel)
 *   pos2.syorder.hu    → /login   (restaurant staff login)
 *   <slug>.syorder.hu  → /dashboard/* (restaurant dashboard, with X-Restaurant-Slug header)
 *
 * Development (localhost): path-based routing works as normal.
 * The ?subdomain= query param can override for local testing.
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = request.headers.get('host') || '';

  // ── Subdomain detection ────────────────────────────────────
  // Strip port for local dev
  const hostWithoutPort = host.split(':')[0];
  const parts = hostWithoutPort.split('.');
  // Valid subdomain: more than 2 parts (e.g. admin.syorder.hu)
  // or explicit ?subdomain= param for local testing
  const subdomainParam = request.nextUrl.searchParams.get('subdomain');
  let subdomain: string | null = null;

  if (subdomainParam) {
    subdomain = subdomainParam;
  } else if (parts.length >= 3 && parts[0] !== 'www') {
    subdomain = parts[0];
  }

  const isAdminSubdomain = subdomain === 'admin';
  const isPos2Subdomain = subdomain === 'pos2';
  const isRestaurantSubdomain =
    subdomain !== null && !isAdminSubdomain && !isPos2Subdomain;

  // ── Auth cookie check ──────────────────────────────────────
  const supabaseCookieName = `sb-0ec90b57d6e95fcbda19832f-auth-token`;
  const hasSession = request.cookies.has(supabaseCookieName);

  // ── Subdomain-aware routing ────────────────────────────────

  // admin.syorder.hu → serve /admin/* routes
  if (isAdminSubdomain) {
    if (!pathname.startsWith('/admin') && pathname !== '/login') {
      if (!hasSession) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // pos2.syorder.hu → login page
  if (isPos2Subdomain) {
    if (hasSession && !pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    if (!hasSession && pathname !== '/login') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // <restaurant>.syorder.hu → pass slug in header + protect dashboard
  if (isRestaurantSubdomain) {
    const response = NextResponse.next();
    response.headers.set('X-Restaurant-Slug', subdomain!);
    if (!hasSession && !pathname.startsWith('/menu/') && pathname !== '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return response;
  }

  // ── Standard path-based routing (no subdomain / localhost) ──

  const isPublicRoute =
    pathname === '/' ||
    pathname === '/login' ||
    pathname.startsWith('/menu/') ||
    pathname.startsWith('/admin'); // admin uses its own auth check

  const isAuthRoute = pathname === '/login';

  const isAdminRoute = pathname.startsWith('/admin');

  if (!hasSession && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};

import NextAuth from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define your User type based on what the session actually contains
// This is an EXAMPLE, adjust according to your actual session user structure
interface User {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscriptionStatus?:
    | 'active'
    | 'inactive'
    | 'pending_activation'
    | 'past_due'
    | 'none'
    | null; // Make sure this matches
}

// Helper function to check if a path is considered public (doesn't require login)
// Adjust this list based on your actual public pages/api routes
const isPublicPath = (path: string): boolean => {
  return (
    path === '/login' || path === '/register' || path.startsWith('/api/auth/')
  ); // NextAuth API routes are public
  // Add other public paths like '/' or '/about' if applicable
};

// Use the auth function from NextAuth as a wrapper for the middleware logic
export default NextAuth(authConfig).auth(async (req) => {
  const { nextUrl } = req;
  const session = req.auth; // Access session via req.auth provided by the wrapper
  const isLoggedIn = !!session;
  const path = nextUrl.pathname;

  // Regex untuk mendeteksi path chat spesifik (/chat/[uuid])
  const isChatPath =
    /^\/chat\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      path,
    );

  // 1. Bypass Midtrans webhook BEFORE any auth/premium checks
  if (path === '/api/payment/notification') {
    // console.log('Webhook path detected, bypassing middleware logic.');
    return NextResponse.next();
  }

  // 2. Cek Rute Chat Spesifik (/chat/[id])
  if (isChatPath) {
    // Izinkan request lolos ke page component, baik login maupun tidak.
    // Page component akan handle visibilitas.
    return NextResponse.next();
  }

  // 3. Authentication Check: Redirect to login if accessing a protected route without a session
  const requiresAuth = !isPublicPath(path);
  if (requiresAuth && !isLoggedIn) {
    const loginUrl = new URL('/login', nextUrl.origin); // Use origin for base URL
    loginUrl.searchParams.set('callbackUrl', path); // Pass the intended path
    // console.log(`User not logged in, redirecting from protected path ${path} to login.`);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Premium Subscription Check: Only run if the user is logged in
  if (isLoggedIn) {
    const isPremiumPath =
      path.startsWith('/premium') || path.startsWith('/api/premium');
    if (isPremiumPath) {
      // Cast the user from the session to include your custom fields
      const user = session.user as User | undefined;
      // Access subscriptionStatus safely
      const subscriptionStatus = user?.subscriptionStatus;

      if (subscriptionStatus !== 'active') {
        // console.log(`User ${user?.email || 'unknown'} accessing premium path ${path} with inactive subscription ('${subscriptionStatus}'). Redirecting.`);
        // Redirect to a page explaining they need an active subscription
        return NextResponse.redirect(new URL('/subscription', nextUrl.origin)); // Use origin
      }
      // console.log(`User ${user?.email || 'unknown'} accessing premium path ${path} with active subscription.`);
    }
  }

  // 4. If all checks pass, allow the request to proceed
  // console.log(`Allowing request for path: ${path}`);
  return NextResponse.next();
});

// Configure the matcher to define which routes the middleware function runs on.
// It's generally good practice to exclude static files and image optimization.
// The webhook is already excluded by the logic inside the function, but excluding it
// here too prevents the middleware function from running unnecessarily for that path.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/payment/notification (Midtrans webhook)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/payment/notification$).*)',
  ],
};

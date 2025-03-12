import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  // Redirect to NextAuth's callback
  return redirect('/api/auth/callback/google');
}

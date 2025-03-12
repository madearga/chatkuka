import { redirect } from 'next/navigation';

export async function GET() {
  // Redirect to NextAuth's Google provider
  return redirect('/api/auth/signin/google');
} 
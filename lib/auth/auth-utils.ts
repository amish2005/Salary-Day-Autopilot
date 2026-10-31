import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export function isClerkConfigured(): boolean {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  const sk = process.env.CLERK_SECRET_KEY || '';
  return Boolean(pk && sk && pk.startsWith('pk_') && sk.startsWith('sk_'));
}

export async function getCurrentUserId(): Promise<string> {
  // If Clerk is properly configured with keys, verify Clerk session
  if (isClerkConfigured()) {
    try {
      const { userId } = await auth();
      if (userId) {
        return userId;
      }
    } catch (err) {
      // In development or when outside Clerk request scope
      console.warn('Clerk auth() lookup skipped or failed:', err);
    }
  }

  // Fallback to cookie-based demo user session or default demo Arjun
  try {
    const cookieStore = await cookies();
    const demoCookie = cookieStore.get('salary_autopilot_user_id')?.value;
    if (demoCookie) {
      return demoCookie;
    }
  } catch (e) {
    // cookies() unavailable in certain static generation steps
  }

  return 'demo_user_arjun';
}


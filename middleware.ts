import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const hasClerkKeys = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.CLERK_SECRET_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')
);

let clerkHandler: any = null;

export default async function middleware(req: NextRequest) {
  if (hasClerkKeys) {
    if (!clerkHandler) {
      const { clerkMiddleware } = await import('@clerk/nextjs/server');
      clerkHandler = clerkMiddleware();
    }
    return clerkHandler(req);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

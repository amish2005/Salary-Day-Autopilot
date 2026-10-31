import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const isClerkAvailable = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')
);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (isClerkAvailable) {
    return (
      <ClerkProvider
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        signInFallbackRedirectUrl="/dashboard"
        signUpFallbackRedirectUrl="/onboarding"
      >
        {children}
      </ClerkProvider>
    );
  }

  return <>{children}</>;
}

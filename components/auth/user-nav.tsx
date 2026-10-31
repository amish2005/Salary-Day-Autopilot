'use client';

import React from 'react';
import { UserButton, useUser } from '@clerk/nextjs';

const hasClerk = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')
);

export function UserNav({ fallbackName = 'Arjun' }: { fallbackName?: string }) {
  if (hasClerk) {
    return (
      <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
        <UserButton
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8 rounded-full border border-slate-700',
            },
          }}
        />
        <span className="hidden md:inline text-xs font-medium text-slate-300">
          {fallbackName}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-semibold text-emerald-400">
        {fallbackName.charAt(0).toUpperCase()}
      </div>
      <span className="hidden md:inline text-xs font-medium text-slate-300">
        {fallbackName}
      </span>
    </div>
  );
}


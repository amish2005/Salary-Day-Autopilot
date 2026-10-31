import type { Metadata } from 'next';
import { Inter_Tight, Geist_Mono, Instrument_Serif } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/auth-provider';

const interTight = Inter_Tight({
  variable: '--font-inter-tight',
  subsets: ['latin'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Salary Day Autopilot — Your salary. Your bills. Your month. On autopilot.',
  description:
    'Intelligent fintech SaaS platform designed to protect your essential bills, EMIs, and savings before discretionary spending.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${interTight.variable} ${geistMono.variable} ${instrumentSerif.variable} dark`}>
      <body className="min-h-screen bg-[#0c0c0b] text-slate-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

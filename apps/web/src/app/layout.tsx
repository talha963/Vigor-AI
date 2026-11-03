import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vigor — Confidential Front Door for Male Reproductive Health',
  description:
    'An anonymous-first, clinically governed digital health platform for early male reproductive risk identification, deterministic safety triaging, and privacy-preserving care routing in Abu Dhabi.',
  keywords: [
    'male reproductive health',
    'andrology',
    'WHO 2021 semen analysis',
    'anonymous health intake',
    'Abu Dhabi health challenge',
    'reproductive health triage',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-white text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}

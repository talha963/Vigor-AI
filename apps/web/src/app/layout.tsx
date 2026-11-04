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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const storedTheme = localStorage.getItem('vigor-theme');
                if (storedTheme === 'dark' || (!storedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-[#080d1a] text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

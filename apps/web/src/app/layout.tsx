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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
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
      <body className="min-h-screen bg-[#F5F3EA] dark:bg-[#141311] text-[#22201D] dark:text-[#F2EEE6] antialiased selection:bg-[#2E2922] selection:text-[#F7F4EB] transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}

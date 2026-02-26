import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/ui/BottomNav';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/lib/contexts/AuthContext';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ReLoop - Sustainable Campus Trading',
  description: 'Scan, trade, and upcycle items on campus. Earn coins and save the planet!',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#4ce68a',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${jakarta.className} bg-background dark:bg-dark-bg text-dark dark:text-white overflow-x-hidden transition-colors duration-300`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col w-full max-w-md mx-auto border-x border-gray-200 dark:border-gray-700 shadow-xl bg-white/50 dark:bg-dark-bg transition-colors duration-300">
              <main className="flex-1 pb-28">
                {children}
              </main>
              <BottomNav />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

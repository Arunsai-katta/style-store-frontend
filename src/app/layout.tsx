import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: 'StyleStore - Premium Streetwear',
  description: 'Your destination for premium t-shirts, hoodies, and sweatshirts. Quality, style, and comfort in every piece.',
  keywords: 't-shirts, hoodies, sweatshirts, streetwear, fashion, online store, india',
  openGraph: {
    title: 'StyleStore - Premium Streetwear',
    description: 'Your destination for premium t-shirts, hoodies, and sweatshirts.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

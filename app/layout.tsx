import type { Metadata } from 'next';
import { Providers } from '@/components/Providers';
import { Navbar } from '@/components/Navbar';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import './globals.css';

export const metadata: Metadata = {
  title: 'SellerGrid — One photo to marketplace listings',
  description: 'Turn one product photo into marketplace-ready listings for Takealot, Amazon, and Makro.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAuthPage = typeof window === 'undefined' ? false : true;

  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <Providers>
          {session && <Navbar />}
          {children}
        </Providers>
      </body>
    </html>
  );
}

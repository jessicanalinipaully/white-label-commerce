import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'White Label Commerce Platform',
  description: 'Production-Grade Reusable White-Label E-Commerce Platform Foundation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-950 text-slate-100 flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}

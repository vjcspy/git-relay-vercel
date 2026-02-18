import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Sudoku — Challenge Your Mind',
  description: 'A beautiful Sudoku puzzle game with multiple difficulty levels. Solve, learn, and have fun!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans m-0 antialiased`}>
        {children}
      </body>
    </html>
  );
}

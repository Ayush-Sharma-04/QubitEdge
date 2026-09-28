import type { Metadata } from 'next';
import { Kumbh_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import RootProviders from '@/components/auth/RootProviders';

const kumbhSans = Kumbh_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-kumbh',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'QubitEdge — Interactive Quantum Learning Platform',
  description:
    'Design, simulate, and understand quantum circuits with an AI tutor. ' +
    'Build Bell states, GHZ states, and more using a visual composer or Python code editor.',
  keywords: ['quantum computing', 'quantum circuits', 'qiskit', 'education', 'simulator'],
  authors: [{ name: 'QubitEdge' }],
  openGraph: {
    title: 'QubitEdge — Interactive Quantum Learning Platform',
    description: 'Visual quantum circuit design meets AI tutoring.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${kumbhSans.variable} ${jetbrainsMono.variable}`}>
      <body>
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}

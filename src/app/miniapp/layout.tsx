'use client';

import { Inter } from "next/font/google";
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import "./miniapp.css";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

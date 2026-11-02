'use client';

import { Inter } from "next/font/google";
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import TermsUpdateBanner from "@/components/terms-update-banner/terms-update-banner";
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
          <TermsUpdateBanner />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

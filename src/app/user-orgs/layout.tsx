'use client';

import { Inter } from "next/font/google";
import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import TermsUpdateBanner from "@/components/terms-update-banner/terms-update-banner";
// @ts-ignore: side-effect import of CSS file without type declarations
import "./user-orgs.css";

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
          <div>
            <TermsUpdateBanner />
            {children}
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

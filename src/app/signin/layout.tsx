// src/app/signin/layout.tsx  (Server Component — no 'use client')

// @ts-ignore: allow side-effect CSS import in this layout file
import "./signin.css";
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

export const metadata = {
  manifest: "/manifest.json",
  themeColor: "#0a0a1a",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <div>{children}</div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
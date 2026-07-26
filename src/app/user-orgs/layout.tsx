'use client';

import SessionProviderWrapper from '@/components/SessionProviderWrapper';
// @ts-ignore: side-effect import of CSS file without type declarations
import "./user-orgs.css"; // Import any specific styles for the login page

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProviderWrapper>
          <div>
            {children}
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

'use client';

import SessionProviderWrapper from '@/components/SessionProviderWrapper';
import "./miniapp.css"; // Import any specific styles for the login page

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

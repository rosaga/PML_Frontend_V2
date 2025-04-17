// src/app/apps/data/userRewards/layout.tsx
"use client";

import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function UserRewardsLayout({ children }: LayoutProps) {
  return (
    <html lang="en">
      <body>
        {children} {/* Render the page content without the global layout */}
      </body>
    </html>
  );
}

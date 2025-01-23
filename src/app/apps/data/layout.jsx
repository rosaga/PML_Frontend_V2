"use client";

import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import SidebarData from "@/components/sidebardata/sidebardata";
import Navbar from "@/components/navbar/navbar";
import "../../../app/globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export default function DataLayout({ children }) {
  const pathname = usePathname();

  // Exclude Sidebar and Navbar for userRewards
  if (pathname === "/apps/data/userRewards") {
    return <>{children}</>;
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <div>
            <SidebarData />
            <Navbar />
            {children}
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

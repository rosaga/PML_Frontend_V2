// src/app/api/apps/[appId]/layout.js
import { Inter } from "next/font/google";
import "../../../app/globals.css";
import SidebarData from "@/components/sidebardata/sidebardata";
import Navbar from "@/components/navbar/navbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Peak Mobile",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}) {
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

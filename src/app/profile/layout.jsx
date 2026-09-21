import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import Profile from "@/components/profile/profile";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = { title: "Company profile | Peak Mobile" };

export default function ProfileLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <div className="min-h-screen bg-gray-50">
            <header className="relative z-40 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 sm:px-10">
              <Link href="/miniapp" aria-label="Peak Mobile products">
                <Image src="/images/peaklogo.png" alt="Peak Mobile" width={112} height={63} />
              </Link>
              <Profile />
            </header>
            <main><div>{children}</div></main>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

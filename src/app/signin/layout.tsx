import { Inter } from "next/font/google";
// @ts-ignore: allow side-effect CSS import in this layout file
import "./signin.css";
import SessionProviderWrapper from '@/components/SessionProviderWrapper';

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <SessionProviderWrapper>
          <div>{children}</div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

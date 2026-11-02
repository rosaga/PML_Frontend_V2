import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Terms and Conditions | Peak Mobile",
  description: "Read the Peak Mobile terms and conditions.",
};

export default function TermsLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

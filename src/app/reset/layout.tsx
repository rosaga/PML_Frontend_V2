import { Inter } from "next/font/google";
import "./reset.css";

const inter = Inter({ subsets: ["latin"] });

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}

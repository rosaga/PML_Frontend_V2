import { Inter } from "next/font/google";
import "../../../app/globals.css";
import SidebarAdmin from "@/components/sidebaradmin/sidebaradmin";
import AdminNavbar from "@/components/admin-navbar/adminnavbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Peak Mobile",
  description: "Admin Portal",
};

export default function AdminLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProviderWrapper>
          <div>
            <SidebarAdmin />
            <AdminNavbar />
            {children}
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

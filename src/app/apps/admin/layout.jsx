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
          {/* Responsive Layout Wrapper */}
          <div className="flex flex-col md:flex-row min-h-screen w-full overflow-hidden">
            {/* Desktop Sidebar (Hidden on Mobile) */}
            <div className="hidden md:block">
              <SidebarAdmin />
            </div>
            {/* Main Content Column */}
            <div className="flex flex-col flex-1 w-full min-w-0 overflow-y-auto">
              <AdminNavbar />
              <main className="flex-1 w-full">
                {children}
              </main>
            </div>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
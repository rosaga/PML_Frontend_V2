import { Inter } from "next/font/google";
import "../../../app/globals.css";
import SidebarAdmin from "@/components/sidebaradmin/sidebaradmin";
import AdminNavbar from "@/components/admin-navbar/adminnavbar";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { WhatsAppDemoProvider } from "@/components/admin/whatsapp/demo-context";

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
          <WhatsAppDemoProvider>
            <div className="flex h-screen w-full overflow-hidden bg-gray-50">
              <SidebarAdmin />
              <div className="flex flex-col flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden">
                <AdminNavbar />
                <main className="flex-1 w-full relative">
                  {children}
                </main>
              </div>
            </div>
          </WhatsAppDemoProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}

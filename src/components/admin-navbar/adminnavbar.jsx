"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Profile from "../profile/profile";
import { useRouter } from "next/navigation";
import { Tooltip } from "@mui/material";
import { Menu, X } from "lucide-react";
import SidebarAdmin from "@/components/sidebaradmin/sidebaradmin";

const AdminNavbar = () => {
  let org_id = null;
  let name = null;
  const [accountName, setAccountName] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSwitchAccount = () => {
    router.push("/user-orgs");
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      name = localStorage.getItem("selectedAccountName");
      org_id = localStorage.getItem("selectedAccountId");
      setAccountName(name);
    }
  }, []);

  return (
    <>
      <div className="flex flex-row justify-between items-center p-4 sm:p-2 bg-white shadow-md relative z-40 w-full">
        {/* Hamburger Button (Mobile Only) */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 -ml-2 mr-2 text-gray-600 focus:outline-none hover:bg-gray-100 rounded-md"
        >
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>

        <div className="flex-1 text-left sm:ml-8 sm:text-center truncate">
          <p className="text-xl font-bold truncate">{accountName}</p>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-6">
          <div>
            <Tooltip title="Notifications">
              <Image
                className="w-8 h-8 rounded-lg cursor-pointer"
                width={40}
                height={40}
                src="/images/or_noti.svg"
                alt="Notifications"
                priority
                onClick={() => router.push("/apps/admin/notification")}
              />
            </Tooltip>
          </div>
          <div className="hidden sm:flex flex-row items-center rounded-lg overflow-hidden shadow-sm">
            <div className="flex items-center bg-orange-100 text-[#F58426] py-2 px-5 rounded-lg justify-center">
              <span className="text-sm font-medium">Admin Portal</span>
            </div>
          </div>
          {/* Profile Section */}
          <div className="relative z-40">
            <Profile />
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={toggleMobileMenu}
          ></div>
          <div className="relative z-50 w-64 h-full bg-white shadow-lg overflow-y-auto transform transition-transform duration-300">
            <SidebarAdmin />
          </div>
        </div>
      )}
    </>
  );
};

export default AdminNavbar;
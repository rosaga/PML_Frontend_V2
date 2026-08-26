"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Profile from "../profile/profile";
import { useRouter } from "next/navigation";
import { Tooltip } from "@mui/material";
import { Menu } from "lucide-react";

const Navbar = () => {
  let org_id = null;
  let name = null;
  const [accountName, setAccountName] = useState("");
  const router = useRouter();

  const handleSwitchAccount = () => {
    router.push("/user-orgs");
  };

  const openSidebar = () => {
    window.dispatchEvent(new Event("toggle-mobile-sidebar"));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      name = localStorage.getItem("selectedAccountName");
      org_id = localStorage.getItem("selectedAccountId");
      setAccountName(name);
    }
  }, []);

  return (
    <div className="flex flex-row justify-between items-center p-4 sm:p-2 bg-white shadow-md relative z-40 w-full">
      <button
        onClick={openSidebar}
        className="lg:hidden p-1.5 -ml-2 mr-2 bg-[#001F3D] text-white focus:outline-none hover:bg-opacity-90 rounded-md"
      >
        <Menu size={23} />
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
              onClick={() => router.push("/apps/flowbot/notification")}
            />
          </Tooltip>
        </div>
        <div className="hidden sm:flex flex-row items-center rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center bg-orange-100 text-[#F58426] py-2 px-5 rounded-lg justify-center">
            <span className="text-sm font-medium">Flowbot</span>
          </div>
        </div>
        <div>
          <Profile />
        </div>
      </div>
    </div>
  );
};
export default Navbar;
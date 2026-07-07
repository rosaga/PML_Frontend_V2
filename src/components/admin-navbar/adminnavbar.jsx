"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Profile from "../profile/profile";
import { useRouter } from "next/navigation";
import { Tooltip } from "@mui/material";

const AdminNavbar = () => {
  let org_id = null;
  let name = null;
  const [accountName, setAccountName] = useState("");
  const router = useRouter();

  const handleSwitchAccount = () => {
    router.push("/user-orgs");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      name = localStorage.getItem("selectedAccountName");
      org_id = localStorage.getItem("selectedAccountId");
      setAccountName(name);
    }
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-2 bg-white shadow-md">
      <div className="flex-1 sm:ml-8 text-center sm:text-center">
        <p className="text-xl font-bold">{accountName}</p>
      </div>
      <div className="flex items-center space-x-6 mt-2 sm:mt-0">
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
        <div className="flex sm:flex-row flex-col items-center rounded-lg overflow-hidden shadow-sm w-full sm:w-auto">
          <div className="flex items-center bg-orange-100 text-[#F58426] py-2 px-5 sm:rounded-l-lg w-full sm:w-auto justify-center">
            <span className="text-sm font-medium">Admin Portal</span>
          </div>
        </div>
        {/* Profile Section */}
        <div className="relative z-40">
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;

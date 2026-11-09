"use client";
import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Profile from "../profile/profile";
import { useRouter } from "next/navigation";
import { Tooltip } from "@mui/material";
import { Menu } from "lucide-react";
import { GetAirtimeNotifications } from "@/app/api/actions/airtimeReward/airtimeSettings";
import { useOrganizationQuery } from "@/lib/airtime/useOrganizationQuery";

const Navbar = () => {
  const [accountName, setAccountName] = useState("");
  const load = useCallback(async (orgId) => (await GetAirtimeNotifications(orgId, 1, 20)).data.count, []);
  const query = useOrganizationQuery(load, { pollInterval: 30000, events: "airtime-notifications-updated airtime-updated" });
  // This feed has no read/unread contract; show the organization's total count.
  const notificationCount = typeof query.data === "number" ? query.data : 0;
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAccountName(localStorage.getItem("selectedAccountName") || "");
    }
  }, [query.orgId]);

  const openSidebar = () => {
    window.dispatchEvent(new Event("toggle-mobile-sidebar"));
  };

  const handleNotificationClick = () => {
    router.push("/apps/airtime/notification");
  };

  return (
    <div className="flex flex-row justify-between items-center p-4 bg-white shadow-sm relative z-40 w-full shrink-0">
      <button
        onClick={openSidebar}
        className="lg:hidden p-1.5 -ml-2 mr-2 bg-[#001F3D] text-white focus:outline-none hover:bg-opacity-90 rounded-md"
      >
        <Menu size={23} />
      </button>

      <div className="flex-1 text-left lg:ml-8 lg:text-center truncate">
        <p className="text-xl font-bold truncate">{accountName}</p>
      </div>

      <div className="flex items-center space-x-3 sm:space-x-6">
        {/* Notifications bell + always-visible numeric badge */}
        <div className="relative">
          <Tooltip title="Notifications">
            <Image
              className="w-8 h-8 rounded-lg cursor-pointer"
              width={40}
              height={40}
              src="/images/or_noti.svg"
              alt="Notifications"
              priority
              onClick={handleNotificationClick}
            />
          </Tooltip>

          {/* Badge — always rendered, sits on top of the SVG dot */}
          <span
            onClick={handleNotificationClick}
            className="absolute -top-2 -right-2 z-50 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-semibold flex items-center justify-center leading-none cursor-pointer"
          >
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        </div>

        <div className="hidden sm:flex flex-row items-center rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center bg-orange-100 text-[#F58426] py-2 px-5 rounded-lg justify-center">
            <span className="text-sm font-medium">Bulk Airtime</span>
          </div>
        </div>

        <div className="relative z-40">
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
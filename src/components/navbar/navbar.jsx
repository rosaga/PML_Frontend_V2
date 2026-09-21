"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Profile from "../profile/profile";
import { useRouter } from "next/navigation";
import { Tooltip } from "@mui/material";
import { Menu } from "lucide-react";
import { GetNotifications } from "@/app/api/actions/notifications/notifications";

const Navbar = () => {
  const [accountName, setAccountName] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);
  const router = useRouter();

  const handleSwitchAccount = () => {
    router.push("/user-orgs");
  };

  const openSidebar = () => {
    window.dispatchEvent(new Event("toggle-mobile-sidebar"));
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("selectedAccountName");
      setAccountName(name ?? "");
    }
  }, []);

  // Fetch notifications, count unread (created after lastReadAt),
  // poll every 30s, refresh on tab focus AND on "notifications-updated"
  useEffect(() => {
    let cancelled = false;

    const loadCount = async () => {
      try {
        const orgId =
          typeof window !== "undefined"
            ? localStorage.getItem("selectedAccountId")
            : null;

        if (!orgId) {
          if (!cancelled) setNotificationCount(0);
          return;
        }

        const res = await GetNotifications(orgId);

        // Notifications page confirms the shape is res.data.data = [...]
        const list = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];

        // Only count notifications created AFTER the last "mark all as read"
        const lastReadAt =
          typeof window !== "undefined"
            ? localStorage.getItem("notificationsLastReadAt")
            : null;

        const unread = lastReadAt
          ? list.filter((n) => {
              const createdAt = n.created_at || n.createdAt || n.created;
              if (!createdAt) return false;
              return new Date(createdAt).getTime() > new Date(lastReadAt).getTime();
            })
          : list;

        if (!cancelled) setNotificationCount(unread.length);
      } catch {
        if (!cancelled) setNotificationCount(0);
      }
    };

    loadCount();
    const id = setInterval(loadCount, 30000);
    const onFocus = () => loadCount();
    const onUpdated = () => loadCount(); // fired when "Mark all as read" is clicked

    window.addEventListener("focus", onFocus);
    window.addEventListener("notifications-updated", onUpdated);

    return () => {
      cancelled = true;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("notifications-updated", onUpdated);
    };
  }, []);

  const handleNotificationClick = () => {
    router.push("/apps/data/notification");
  };

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

          <span
            onClick={handleNotificationClick}
            className="absolute -top-2 -right-2 z-50 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 border-2 border-white text-white text-[10px] font-semibold flex items-center justify-center leading-none cursor-pointer"
          >
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        </div>

        <div className="hidden sm:flex flex-row items-center rounded-lg overflow-hidden shadow-sm">
          <div className="flex items-center bg-orange-100 text-[#F58426] py-2 px-5 rounded-lg justify-center">
            <span className="text-sm font-medium">Data Rewards</span>
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
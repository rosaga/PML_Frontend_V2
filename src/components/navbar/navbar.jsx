"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Profile from "../profile/profile";
import { useRouter } from 'next/navigation';
import { Tooltip } from "@mui/material";

const Navbar = () => {
  let org_id = null;
  let name = null;
  const [accountName, setAccountName] = useState("");
  const router = useRouter();

  const handleSwitchAccount = () => {
    router.push('/user-orgs');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      name = localStorage.getItem('selectedAccountName');
      org_id = localStorage.getItem('selectedAccountId');
      setAccountName(name);
    }
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center p-4 sm:p-2 bg-white shadow-md">
      <div className="flex-1 sm:ml-8 text-center sm:text-center">
        <p className="text-xl font-bold">{accountName}</p>
      </div>
      <div className="flex flex-row space-x-4 mt-2 sm:mt-0">
        <div>
          <span>
            <Image
              style={{ color: "#F58426" }}
              className="w-8 h-8 rounded-lg"
              width={40}
              height={40}
              src="/images/Settings.svg"
              blurDataURL="/bluriconloader.png"
              placeholder="blur"
              alt="Settings"
              priority
              onClick={() => router.push("/apps/settings")}

            />
          </span>
        </div>
        <div>
          <span>
            <Tooltip title="Notifications">
              <Image
                style={{ color: "#F58426" }}
                className="w-8 h-8 rounded-lg cursor-pointer"
                width={40}
                height={40}
                src="/images/or_noti.svg"
                blurDataURL="/bluriconloader.png"
                placeholder="blur"
                alt="Notifications"
                priority
                onClick={() => router.push("/apps/notification")}
              />
            </Tooltip>
          </span>
        </div>
        <div>
          <button
            className="text-white py-1 px-4 rounded text-sm sm:text-base"
            style={{ backgroundColor: "#F58426" }}
            onClick={handleSwitchAccount}
          >
            Switch Accounts
          </button>
        </div>
        <div>
          <Profile />
        </div>
      </div>
    </div>
  );
};

export default Navbar;

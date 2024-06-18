// MyComponent.js
"use client";

import React from "react";
import Profile from "../profile/profile"
import Image from "next/image";
import { signOut } from "next-auth/react";

const Sidebar = () => {

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
    localStorage.removeItem('selectedAccountId');
    }
    signOut({ callbackUrl: '/signin' });
  };

  return (
    <div>
      <aside
        id="logo-sidebar"
        className="fixed top-0 left-0 z-40 w-64 h-screen transition-transform -translate-x-full sm:translate-x-0 shadow-lg"
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 light:bg-gray-800">
          <img
            src="/images/peaklogo.png"
            className="h-30 me-24 sm:h-24"
            alt="Peak Logo"
          />
          <ul className="space-y-4 font-medium">
            <li>
              <a
                href={`/apps/dashboard`}
                className="icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <Image
                  style={{ color: "#F58426" }}
                  className="icon w-8 h-8 rounded-lg"
                  width={40}
                  height={40}
                  src="/images/dashboard.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Recipients reached"
                  priority
                />
                <span className="ms-3">Dashboard</span>
              </a>
            </li>
            <li>
              <a
                href={`/apps/data-rewards`}
                className="icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <Image
                  style={{ color: "#F58426" }}
                  className="icon w-8 h-8 rounded-lg"
                  width={40}
                  height={40}
                  src="/images/vector.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Recipients reached"
                  priority
                />
                <span className="flex-1 ms-3 whitespace-nowrap">
                  Data Rewards
                </span>
                <span className="inline-flex items-center justify-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300"></span>
              </a>
            </li>

            <li>
              <a
                href={`/apps/data-units`}
                className="icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <Image
                  style={{ color: "#F58426" }}
                  className="icon w-8 h-8 rounded-lg"
                  width={40}
                  height={40}
                  src="/images/dataunits.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Recipients reached"
                  priority
                />
                <span className="flex-1 ms-3 whitespace-nowrap">
                  Data Units
                </span>
              </a>
            </li>
            <li>
              <a
                href={`/apps/users`}
                className="icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <Image
                  style={{ color: "#F58426" }}
                  className="icon w-8 h-8 rounded-lg"
                  width={40}
                  height={40}
                  src="/images/users.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Recipients reached"
                  priority
                />
                <span className="flex-1 ms-3 whitespace-nowrap">Users</span>
              </a>
            </li>
            <li>
              <a
                href={`/apps/account`}
                className="icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <Image
                  style={{ color: "#F58426" }}
                  className="icon w-8 h-8 rounded-lg"
                  width={40}
                  height={40}
                  src="/images/Account.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Recipients reached"
                  priority
                />
                <span className="flex-1 ms-3 whitespace-nowrap">Account</span>
              </a>
            </li>
            <li>
            <a
                href="#"
                className="icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <Image
                  style={{ color: "#F58426" }}
                  className="icon w-8 h-8 rounded-lg"
                  width={40}
                  height={40}
                  src="/images/Reports.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Recipients reached"
                  priority
                />
                <span className="flex-1 ms-3 whitespace-nowrap">Reports</span>
              </a>
            </li>
            <li>
              <a
                href="#"
                className="icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <Image
                  style={{ color: "#F58426" }}
                  className="icon w-8 h-8 rounded-lg"
                  width={40}
                  height={40}
                  src="/images/flowbuillder.svg"
                  blurDataURL="/bluriconloader.png"
                  placeholder="blur"
                  alt="Recipients reached"
                  priority
                />
                <span className="flex-1 ms-3 whitespace-nowrap">Flow Builder</span>
              </a>

            </li>
          </ul>
          <ul className="font-medium mt-40">
            <li>
              <a
                onClick={handleSignOut}
                className="flex items-center cursor-pointer p-2 text-black rounded-lg dark:text-white hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700 group"
              >
                <svg
                  className="flex-shrink-0 w-5 h-5 text-black transition duration-75 dark:text-gray-400 group-hover:text-white dark:group-hover:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.96 2.96 0 0 0 .13 5H5Z" />
                  <path d="M6.737 11.061a2.961 2.961 0 0 1 .81-1.515l6.117-6.116A4.839 4.839 0 0 1 16 2.141V2a1.97 1.97 0 0 0-1.933-2H7v5a2 2 0 0 1-2 2H0v11a1.969 1.969 0 0 0 1.933 2h12.134A1.97 1.97 0 0 0 16 18v-3.093l-1.546 1.546c-.413.413-.94.695-1.513.81l-3.4.679a2.947 2.947 0 0 1-1.85-.227 2.96 2.96 0 0 1-1.635-3.257l.681-3.397Z" />
                  <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4A.961.961 0 0 0 8.961 16Zm7.477-9.8a.958.958 0 0 1 .68-.281.961.961 0 0 1 .682 1.644l-.315.315-1.36-1.36.313-.318Zm-5.911 5.911 4.236-4.236 1.359 1.359-4.236 4.237-1.7.339.341-1.699Z" />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap">Logout</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>

    </div>
  );
};

export default Sidebar;

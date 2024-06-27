// MyComponent.js
"use client";

import React from "react";
import Image from "next/image";
import { useSession } from 'next-auth/react';
import { getUserInfo } from "../../utils/decodeToken"
import { getToken } from "@/utils/auth";

const Profile = () => {

  let token = null;
  if (typeof window !== 'undefined') {
    token = getToken();
  }
  const userInfo = getUserInfo(token);

  const { data: session, status } = useSession();

  return (
    <div>
      <button
        id="dropdownAvatarNameButton"
        data-dropdown-toggle="dropdownAvatarName"
        className="flex items-center text-sm pe-1 font-medium text-gray-900 rounded-full hover:text-blue-600 dark:hover:text-blue-500 md:me-0 focus:ring-4 focus:ring-gray-100 dark:focus:ring-gray-700 dark:text-white"
        type="button"
      >
        <span className="sr-only">Open user menu</span>
        <div className="flex items-center">
          <Image
            className="w-8 h-8 rounded-lg"
            width={60}
            height={60}
            src="/images/avatar.png"
            blurDataURL="/bluriconloader.png"
            placeholder="blur"
            alt="Recipients reached"
            priority
          />
          <div className="ml-4">
            <p className="text-sm text-left">{ userInfo.email }</p>
            <p className="text-sm text-left">{ userInfo.name }</p>
          </div>
        </div>

        <svg
          className="w-2.5 h-2.5 ms-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 10 6"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 4 4 4-4"
          />
        </svg>
      </button>

      <div
        id="dropdownAvatarName"
        className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600"
      >
        <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
          <div className="font-medium ">Pro User</div>
          <div className="truncate">name@flowbite.com</div>
        </div>
        <ul
          className="py-2 text-sm text-gray-700 dark:text-gray-200"
          aria-labelledby="dropdownInformdropdownAvatarNameButtonationButton"
        >
          <li>
            <a
              href="#"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Settings
            </a>
          </li>
          <li>
            <a
              href="#"
              className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
            >
              Earnings
            </a>
          </li>
        </ul>
        <div className="py-2">
          <a
            href="#"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
          >
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
};

export default Profile;

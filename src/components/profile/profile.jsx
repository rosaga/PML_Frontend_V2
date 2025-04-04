"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getUserInfo } from "../../utils/decodeToken";
import { getToken, clearToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import ConfirmSignOutModal from "../modal/confirmSignout";
import { FaChevronDown } from "react-icons/fa"; // Dropdown icon

const Profile = () => {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSwitchAccount = () => {
    router.push('/user-orgs');
  };

  const handleSwitchProduct = () => {
    router.push('/miniapp');
  };

  useEffect(() => {
    const token = getToken();
    const info = getUserInfo(token);
    if (info) {
      setUserInfo(info);
    }
  }, []);

  const handleLogout = () => {
    setModalOpen(true);
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      clearToken();
    }
    signOut({ callbackUrl: "/signin" });
  };

  const handleConfirmLogout = () => {
    handleSignOut();
    setModalOpen(false);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="relative">
      {/* Profile button with dropdown icon */}
      <button
        className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <Image
          className="w-9 h-9 rounded-full border border-gray-300" // Increased size for better UI
          width={40}
          height={40}
          src="/images/avatar.png"
          alt="Profile"
          priority
        />
        <FaChevronDown className="text-[#F58426] dark:text-gray-400 text-sm" />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800">
          <div className="px-4 py-3 text-sm text-gray-900 dark:text-white">
            <p className="font-medium">Welcome</p>
            <p className="truncate">{userInfo.email || "email@domain.com"}</p>
          </div>
          <div className="py-2">
            <button
              onClick={handleSwitchProduct}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
            >
              Switch Products
            </button>
          </div>
          <div className="py-2">
            <button
              onClick={handleSwitchAccount}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
            >
              Switch Accounts
            </button>
          </div>

          <div className="py-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {modalOpen && (
        <ConfirmSignOutModal onClose={handleCloseModal} onConfirm={handleConfirmLogout} />
      )}
    </div>
  );
};

export default Profile;

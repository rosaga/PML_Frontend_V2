"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { clearToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import ConfirmSignOutModal from "../modal/confirmSignout";

const SidebarData = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State to track the Settings sub-menu

  const router = useRouter();

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const handleLogoutClick = () => {
    setModalOpen(true);
  };

  const handleSwitchAccount = () => {
    router.push("/user-orgs");
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") {
      clearToken();
    }
    signOut({ callbackUrl: "/signin" });
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleConfirmLogout = () => {
    handleSignOut();
    setModalOpen(false);
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSettingsSubMenu = (e) => {
    e.preventDefault(); // Prevent redirect
    setIsSettingsOpen(!isSettingsOpen); // Toggle the Settings sub-menu
  };

  const handleSubMenuClick = (href) => {
    setActiveLink(href); // Update active link
    router.push(href); // Navigate to the sub-menu page
  };

  const links = [
    { href: "/apps/data/dashboard", src: "/images/dashboard.svg", alt: "Dashboard", label: "Dashboard" },
    { href: "/apps/data/data-rewards", src: "/images/vector.svg", alt: "Data Rewards", label: "Data Rewards" },
    { href: "/apps/data/data-units", src: "/images/dataunits.svg", alt: "Data Units", label: "Data Units" },
    { href: "/apps/data/users", src: "/images/users.svg", alt: "Users", label: "Users" },
    { href: "/apps/data/account", src: "/images/Account.svg", alt: "Account", label: "Account" },

    { href: "/apps/data/reports", src: "/images/Reports.svg", alt: "Reports", label: "Reports" },
    // Settings with sub-menu
    {
      href: "/apps/data/settings",
      src: "/images/Settings.svg",
      alt: "Settings",
      label: "Settings",
      subLinks: [
        { href: "/apps/data/senderId", label: "Sender ID" },
        { href: "/apps/data/threshold", label: "Notification Threshold" }
      ]
    },
  ];

  return (
    <div>
      <button onClick={toggleSidebar} className="sm:hidden block p-2 bg-gray-700 text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>
      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 shadow-lg`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">
          <img
            src="/images/peaklogo.png"
            className="h-30 me-24 sm:h-24"
            alt="Peak Logo"
          />
          <ul className="space-y-4 font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    if (link.subLinks) {
                      toggleSettingsSubMenu(e); // Prevent immediate navigation and toggle sub-menu
                    } else {
                      handleLinkClick(link.href);
                      router.push(link.href); // Navigate for non-submenu links
                    }
                  }}
                  className={`icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white ${
                    activeLink === link.href ? "bg-[#001F3D] text-white" : "hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700"
                  } group`}
                >
                  <Image
                    className={`icon w-8 h-8 rounded-lg ${activeLink === link.href ? "filter invert" : ""}`}
                    width={40}
                    height={40}
                    src={link.src}
                    alt={link.alt}
                    priority
                  />
                  <span className="ms-3">{link.label}</span>
                  {link.subLinks && (
                    <button onClick={toggleSettingsSubMenu} className="ml-auto text-white">
                      {isSettingsOpen ? "▲" : "▼"}
                    </button>
                  )}
                </a>
                {/* Render sub-links for Settings */}
                {link.subLinks && isSettingsOpen && (
                  <ul className="ml-6 space-y-2">
                    {link.subLinks.map((subLink) => (
                      <li key={subLink.href}>
                        <a
                          href={subLink.href}
                          onClick={() => handleSubMenuClick(subLink.href)} // Navigate on sub-menu item click
                          className={`block p-2 text-gray-700 rounded-lg dark:text-gray-400 ${
                            activeLink === subLink.href ? "bg-[#001F3D] text-white" : "hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700"
                          }`}
                        >
                          {subLink.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <ul className="font-medium mt-40">
            <li>
              <a
                onClick={handleLogoutClick}
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
                  <path d="M8.961 16a.93.93 0 0 0 .189-.019l3.4-.679a.961.961 0 0 0 .49-.263l6.118-6.117a2.884 2.884 0 0 0-4.079-4.078l-6.117 6.117a.96.96 0 0 0-.263.491l-.679 3.4a.961.961 0 0 0 1.04 1.149Z" />
                </svg>
                <span className="flex-1 ms-3 whitespace-nowrap">Logout</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
      {modalOpen && (
        <ConfirmSignOutModal
          onClose={handleCloseModal}
          onConfirm={handleConfirmLogout}
        />
      )}
    </div>
  );
};

export default SidebarData;

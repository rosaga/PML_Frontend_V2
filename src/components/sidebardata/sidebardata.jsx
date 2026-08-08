"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { clearToken, getToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import ConfirmSignOutModal from "../modal/confirmSignout";
import Joyride from "react-joyride";
import Modal from "@mui/material/Modal";
import { hasRole } from "../../utils/decodeToken";
import { X } from "lucide-react";

const SidebarData = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDataUnitsOpen, setIsDataUnitsOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);

  const token = getToken();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      setActiveLink(window.location.pathname);
      if (!localStorage.getItem("hasTakenDataTour")) {
        setOpenTourModal(true);
        localStorage.setItem("hasTakenDataTour", "true");
      }
    }
  }, []);

  // Listen for hamburger click from Navbar
  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(true);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-mobile-sidebar", handleToggle);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLinkClick = (link) => {
    setActiveLink(link);
    closeSidebar();
  };

  const toggleSubMenu = (e, label) => {
    e.preventDefault();
    if (label === "Settings") {
      setIsSettingsOpen((prev) => !prev);
      setIsDataUnitsOpen(false);
    } else if (label === "Data Units") {
      setIsDataUnitsOpen((prev) => !prev);
      setIsSettingsOpen(false);
    }
  };

  const handleSubMenuClick = (href) => {
    setActiveLink(href);
    router.push(href);
    closeSidebar();
  };

  const handleSignOut = () => {
    if (typeof window !== "undefined") clearToken();
    signOut({ callbackUrl: "/signin" });
  };

  const links = [
    { href: "/apps/data/dashboard", src: "/images/dashboard.svg", alt: "Dashboard", label: "Dashboard", className: "dashboard" },
    { href: "/apps/data/data-rewards", src: "/images/vector.svg", alt: "Data Rewards", label: "Data Rewards", className: "data-rewards" },
    {
      href: "/apps/data/data-units",
      src: "/images/dataunits.svg",
      alt: "Data Units",
      label: "Data Units",
      className: "data-units",
      subLinks: [
        { href: "/apps/data/data-units", label: "Overview", className: "units-overview" },
        { href: "/apps/data/data-topup", label: "Top Up", className: "units-topup" },
        { href: "/apps/data/payments", label: "Transactions", className: "units-transactions" },
      ],
    },
    { href: "/apps/data/users", src: "/images/users.svg", alt: "Users", label: "Users", className: "users" },
    { href: "/apps/data/account", src: "/images/Account.svg", alt: "Account", label: "Account", className: "account" },
    {
      href: "/apps/data/settings",
      src: "/images/Settings.svg",
      alt: "Settings",
      label: "Settings",
      className: "settings",
      subLinks: [
        { href: "/apps/data/senderId", label: "Sender ID", className: "sender-id" },
        { href: "/apps/data/threshold", label: "Notification Threshold", className: "notification-threshold" },
        { href: "/apps/data/developer", label: "Developer", className: "developer" },
      ],
    },
    { href: "/apps/data/reports", src: "/images/Reports.svg", alt: "Reports", label: "Reports", className: "reports" },
  ];

  if (hasRole(token, "SuperAdmin")) {
    links[links.length - 2].subLinks.push(
      { href: "/apps/data/manageSenderId", label: "Manage Sender Ids", className: "manage-sender-ids" },
      { href: "/apps/data/provisionUnits", label: "Unit Provisioning", className: "unit-provisioning" }
    );
  }

  const isSubMenuOpen = (label) => (label === "Settings" && isSettingsOpen) || (label === "Data Units" && isDataUnitsOpen);

  const tourSteps = [
    { target: ".dashboard", content: "Provides an overview of your Data Dispatches & Data Balances" },
    { target: ".data-rewards", content: "Add contacts or contact groups and send data." },
    { target: ".data-units", content: "Top up your account with Data Units or view your float balance before dispatch." },
    { target: ".users", content: "View and manage users." },
    { target: ".account", content: "View and manage account details." },
    { target: ".settings", content: "Add your Sender ID or set your notification threshold." },
    { target: ".logout", content: "Click here to log out." },
  ];

  return (
    <>
      {isClient && (
        <Joyride steps={tourSteps} continuous showProgress showSkipButton run={tourActive} styles={{ options: { primaryColor: "#F58426" } }} />
      )}

      {/* Backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" 
          onClick={closeSidebar}
        ></div>
      )}

      {/* Main Sidebar */}
      <aside
        id="logo-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 dark:bg-gray-800 shadow-lg transform transition-transform duration-300 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        aria-label="Sidebar"
      >
        <div className="px-4 py-4 flex justify-between items-center shrink-0">
          <img 
            src="/images/peaklogo.png" 
            className="h-10 lg:h-24 w-auto object-contain" 
            alt="Peak Logo" 
          />
          <button 
            onClick={closeSidebar} 
            className="lg:hidden p-1 text-gray-500 hover:bg-gray-200 rounded-md"
          >
            <X size={26} />
          </button>
        </div>

        {/* Navigation (scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-4 font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    if (link.subLinks) {
                      toggleSubMenu(e, link.label);
                    } else {
                      handleLinkClick(link.href);
                      router.push(link.href);
                    }
                  }}
                  className={`icon-hover-parent flex items-center p-2 rounded-lg ${
                    activeLink === link.href ? "bg-[#001F3D] text-white" : "text-black hover:bg-[#001F3D] hover:text-white dark:text-white dark:hover:bg-gray-700"
                  } group ${link.className}`}
                >
                  <Image
                    className={`icon w-8 h-8 rounded-lg ${activeLink === link.href ? "filter invert" : ""}`}
                    width={40} height={40} src={link.src} alt={link.alt} priority
                  />
                  <span className="ms-3">{link.label}</span>
                  {link.subLinks && (
                    <button onClick={(e) => toggleSubMenu(e, link.label)} className="ml-auto text-black dark:text-white group-hover:text-white">
                      {isSubMenuOpen(link.label) ? "▲" : "▼"}
                    </button>
                  )}
                </a>

                {link.subLinks && isSubMenuOpen(link.label) && (
                  <ul className="ml-6 space-y-2 mt-2">
                    {link.subLinks.map((subLink) => (
                      <li key={subLink.href}>
                        <a
                          href={subLink.href}
                          onClick={() => handleSubMenuClick(subLink.href)}
                          className={`block p-2 rounded-lg ${
                            activeLink === subLink.href ? "bg-[#001F3D] text-white" : "text-gray-700 hover:bg-[#001F3D] hover:text-white dark:text-gray-400 dark:hover:bg-gray-700"
                          } ${subLink.className}`}
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
        </div>

        {/* Top Up shortcut */}
        <div className="flex-shrink-0 px-3 pb-4 pt-2">
          <div className="bg-[#F58426] text-white py-2 px-5 rounded-lg flex items-center justify-center cursor-pointer w-full gap-2" onClick={() => router.push("/apps/data/data-topup")}>
            <img src="/images/topup.png" alt="Top Up" className="w-5 h-5" />
            <span className="text-sm font-medium">Top Up</span>
          </div>
        </div>
      </aside>

      {/* Tour Modal */}
      <Modal open={openTourModal} onClose={() => setOpenTourModal(false)} className="flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-2xl relative max-w-lg w-full outline-none">
          <h2 className="text-2xl font-bold mb-4 text-left">Welcome to Bulk Data Platform</h2>
          <h3 className="text-[#E88A17] text-xl font-semibold mb-2 text-left">We are thrilled to have you onboard.</h3>
          <p className="text-left text-base mb-6">Get a quick tour to learn how to reward your customers with Mobile Data Bundles</p>
          <div className="flex justify-between space-x-4">
            <button
              className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md"
              onClick={() => {
                setOpenTourModal(false);
                setTimeout(() => setTourActive(true), 300);
              }}
            >
              Take a tour
            </button>
            <button className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md" onClick={() => setOpenTourModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Sign Out Modal */}
      {modalOpen && (
        <ConfirmSignOutModal
          onClose={() => setModalOpen(false)}
          onConfirm={() => {
            clearToken();
            router.push("/signin");
          }}
        />
      )}
    </>
  );
};

export default SidebarData;
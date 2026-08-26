"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { clearToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import ConfirmSignOutModal from "../modal/confirmSignout";
import Joyride from "react-joyride";
import Modal from '@mui/material/Modal';
import { hasRole } from '../../utils/decodeToken';
import { getToken } from "@/utils/auth";
import { set } from "date-fns";
import { X } from "lucide-react";

const SidebarFlowBot = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false); 
  const [isClient, setIsClient] = useState(false);
  const [openTourModal, setOpenTourModal] = useState(false);
  let token = getToken();
  
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      setActiveLink(window.location.pathname);
      if (typeof window !== "undefined" && !localStorage.getItem("hasTakenDataTour")) {
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

  const handleLogoutClick = () => setModalOpen(true);
  const handleSwitchAccount = () => router.push("/user-orgs");

  const handleSignOut = () => {
    if (typeof window !== "undefined") clearToken();
    signOut({ callbackUrl: "/signin" });
  };

  const handleCloseModal = () => setModalOpen(false);

  const handleConfirmLogout = () => {
    handleSignOut();
    setModalOpen(false);
  };

  const handleLinkClick = (link) => {
    setActiveLink(link);
    closeSidebar();
  };

  const toggleSettingsSubMenu = (e) => {
    e.preventDefault(); 
    setIsSettingsOpen(!isSettingsOpen); 
  };

  const handleSubMenuClick = (href) => {
    setActiveLink(href); 
    router.push(href);
    closeSidebar();
  };

  const links = [
    { href: "/apps/flowbot/dashboard", src: "/images/dashboard.svg", alt: "Dashboard", label: "Dashboard", className: "dashboard" },
    { href: "/apps/flowbot/contacts", src: "/images/Account.svg", alt: "Contacts", label: "Contacts", className: "Contacts" },
    { href: "/apps/flowbot/flowbuilder", src: "/images/flowbuillder.svg", alt: "Flow Builder", label: "Flow Builder", className: "Flow Builder" },
    { href: "/apps/flowbot/users", src: "/images/users.svg", alt: "Users", label: "Users", className: "users" },
  ];

  const tourSteps = [
    { target: ".dashboard", content: "Provides an overview of your Data Dispatches & Data Balances" },
    { target: ".data-rewards", content: "Add contacts or contact groups and send data." },
    { target: ".data-units", content: "Top up your account with Data Units or view your Float balance before dispatch." },
    { target: ".users", content: "This is the users section. Click to view and manage users" },
    { target: ".account", content: "This is the account section. Click to view and manage account details" },
    { target: ".reports", content: "This is the reports section. Click to view and manage reports" },
    { target: ".settings", content: "Send Customizable Rewards Messages by adding your Sender ID. Also set your Notification Threshold" },
    { target: ".logout", content: "Click here to logout" },
  ];

  return (
    <>
      {isClient && (
        <Joyride
          steps={tourSteps}
          continuous={true}
          showProgress={true}
          showSkipButton={true}
          run={tourActive}
          styles={{ options: { primaryColor: "#F58426" } }}
        />
      )}

      {/* Backdrop overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" 
          onClick={closeSidebar}
        ></div>
      )}

      <aside
        id="logo-sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-50 dark:bg-gray-800 shadow-lg transform transition-transform duration-300 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
        aria-label="Sidebar"
      >
        {/* Logo with Close Button */}
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

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          <ul className="space-y-4 font-medium">
            {links.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={(e) => {
                    if (link.subLinks) {
                      toggleSettingsSubMenu(e); 
                    } else {
                      handleLinkClick(link.href);
                      router.push(link.href); 
                    }
                  }}
                  className={`icon-hover-parent flex items-center p-2 text-black rounded-lg dark:text-white ${
                    activeLink === link.href ? "bg-[#001F3D] text-white" : "hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700"
                  } group ${link.className}`}
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
                    <button onClick={toggleSettingsSubMenu} className="ml-auto text-black dark:text-white group-hover:text-white">
                      {isSettingsOpen ? "▲" : "▼"}
                    </button>
                  )}
                </a>

                {link.subLinks && isSettingsOpen && (
                  <ul className="ml-6 space-y-2 mt-2">
                    {link.subLinks.map((subLink) => (
                      <li key={subLink.href}>
                        <a
                          href={subLink.href}
                          onClick={() => handleSubMenuClick(subLink.href)}
                          className={`block p-2 text-gray-700 rounded-lg dark:text-gray-400 ${
                            activeLink === subLink.href ? "bg-[#001F3D] text-white" : "hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700"
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
      </aside>

      {/* Logout Modal */}
      {modalOpen && (
        <ConfirmSignOutModal onClose={handleCloseModal} onConfirm={handleConfirmLogout} />
      )}

      {/* Tour Modal */}
      <Modal open={openTourModal} onClose={() => setOpenTourModal(false)} className="flex items-center justify-center">
        <div className="bg-white p-10 rounded-2xl shadow-2xl relative max-w-lg w-full outline-none">
          <h2 className="text-2xl font-bold mb-4 text-left">Welcome to Bulk Data Platform </h2>
          <h3 className="text-[#E88A17] text-xl font-semibold mb-2 text-left">We are thrilled to have you onboard. </h3>
          <p className="text-left text-base mb-6">Get a quick tour to learn how to reward your customers with Mobile Data Bundles </p>
          <div className="flex justify-between space-x-4">
            <button
              className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md"
              onClick={() => {
                setOpenTourModal(false); 
                setTimeout(() => { setTourActive(true); }, 300); 
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
    </>
  );
};

export default SidebarFlowBot;
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


const SidebarData = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false); 
  const [isClient, setIsClient] = useState(false);
  const  [openTourModal, setOpenTourModal] = useState(false);
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
    { href: "/apps/data/dashboard", src: "/images/dashboard.svg", alt: "Dashboard", label: "Dashboard", className: "dashboard" },
    { href: "/apps/data/data-rewards", src: "/images/vector.svg", alt: "Data Rewards", label: "Data Rewards", className: "data-rewards" },
    { href: "/apps/data/data-units", src: "/images/dataunits.svg", alt: "Data Units", label: "Data Units", className: "data-units" },
    { href: "/apps/data/users", src: "/images/users.svg", alt: "Users", label: "Users", className: "users" },
    { href: "/apps/data/account", src: "/images/Account.svg", alt: "Account", label: "Account", className: "account" },
    // { href: "/apps/data/flowbuilder", src: "/images/flowbuillder.svg", alt: "Flow Builder", label: "Flow Builder", className: "Flow Builder" },
    // { href: "/apps/data/reports", src: "/images/Reports.svg", alt: "Reports", label: "Reports", className: "reports" },
    {
      href: "/apps/data/settings",
      src: "/images/Settings.svg",
      alt: "Settings",
      label: "Settings",
      className: "settings",
      subLinks: [
        { href: "/apps/data/senderId", label: "Sender ID", className: "sender-id" },
        { href: "/apps/data/threshold", label: "Notification Threshold", className: "notification-threshold" },

        //{ href: "/apps/data/manageSenderId", label: "Manage Sender Ids", className: "notification-threshold" },
      ]
    },
  ];

   hasRole(token,'SuperAdmin') && links[5].subLinks.push({ href: "/apps/data/manageSenderId",  label: "Manage Sender Ids", className: "notification-threshold" });
   hasRole(token,'SuperAdmin') && links[5].subLinks.push({ href: "/apps/data/provisionUnits",  label: "Unit Provisioning", className: "notification-threshold" });


  const tourSteps = [
    {
      target: ".dashboard",
      content: "Provides an overview of your Data Dispatches & Data Balances",
    },
    {
      target: ".data-rewards",
      content: "Add contacts or contact groups and send data.",
    },
    {
      target: ".data-units",
      content: "Top up your account with Data Units or view your Float balance before dispatch.",
    },
    {
      target: ".users",
      content: "This is the users section. Click to view and manage users",
    },
    {
      target: ".account",
      content: "This is the account section. Click to view and manage account details",
    },
    // {
    //   target: ".reports",
    //   content: "This is the reports section. Click to view and manage reports",
    // },
    {
      target: ".settings",
      content: "Send Customizable Rewards Messages by adding your Sender ID. Also set your Notification Threshold",
    },
    {
      target: ".logout",
      content: "Click here to logout",
    },
  ];

  return (
    <div className="navbar">
      <button onClick={toggleSidebar} className="sm:hidden block p-2 bg-gray-700 text-white">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      </button>

      {/* Joyride Component */}
      {isClient && (<Joyride
        steps={tourSteps}
        continuous={true}
        showProgress={true}
        showSkipButton={true}
        // disableBeacon={true}
        // callback={(data) => {
        //   console.log(data)
        //   // const { status } = data;
        //   if (data.action === 'start' && data.type === 'beacon') {
        //     setTourActive(true); 
        //   }
        // }}
        run={tourActive} // Start tour
        styles={{
          options: {
            primaryColor: "#F58426", // Tour step color
          },
        }}
      />

      )}

      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-40 w-64 h-screen transition-transform transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} sm:translate-x-0 shadow-lg`}
        aria-label="Sidebar"
      >
        <div className="h-full px-3 py-4 overflow-y-auto bg-gray-50 dark:bg-gray-800 flex flex-col">
          <div className="flex-shrink-0">
            <img
              src="/images/peaklogo.png"
              className="h-30 me-24 sm:h-24"
              alt="Peak Logo"
            />
          </div>
          
          <div className="flex-1">
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
          
        {/* Top Up Button*/}
        <div className="flex-shrink-0 mt-4">
          <div
            className="bg-[#F58426] text-white py-2 px-5 rounded-lg flex items-center justify-center cursor-pointer w-full gap-2"
            onClick={() => router.push("/apps/data/data-topup")}
          >
            <img 
              src="/images/topup.png" 
              alt="Top Up" 
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">Top Up</span>
          </div>
        </div>
        </div>
      </aside>
      
      {/* {modalOpen && (
        <ConfirmSignOutModal
          onClose={handleCloseModal}
          onConfirm={handleConfirmLogout}
        />
      )} */}
        <Modal
            open={openTourModal}
            onClose={() => setOpenTourModal(false)}
            className="flex items-center justify-center"
          >
            <div className="bg-white p-10 rounded-2xl shadow-2xl relative max-w-lg w-full">
              <h2 className="text-2xl font-bold mb-4 text-left">
              Welcome to Bulk Data Platform 
              </h2>
              <h3 className="text-[#E88A17] text-xl font-semibold mb-2 text-left">
              We are thrilled to have  you onboard. 
              
              
              </h3>
              <p className="text-left text-base mb-6">
              Get a quick tour to learn how to reward your customers with Mobile Data Bundles 

              </p>
              <div className="flex justify-between space-x-4">
                <button
                  className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md"
                  onClick={() => {
                    setOpenTourModal(false);  // Close the modal
                    setTimeout(() => {
                      setTourActive(true);  // Start the tour after modal closes
                    }, 300);  // Small delay to ensure modal closes first
                  }}
                >
                  Take a tour
                </button>
                <button
                  className="bg-[#001F3D] w-full p-3 text-white text-lg rounded-md"
                  onClick={() => setOpenTourModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </Modal>
    </div>
  );
};

export default SidebarData;
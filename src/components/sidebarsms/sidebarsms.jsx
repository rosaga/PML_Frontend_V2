"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { clearToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import ConfirmSignOutModal from "../modal/confirmSignout";

const SidebarSms = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // New state for sidebar toggle
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const router = useRouter();


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
    { href: '/apps/sms/dashboard', src: '/images/dashboard.svg', alt: 'Dashboard', label: 'Dashboard' },
    { href: '/apps/sms/contacts', src: '/images/vector.svg', alt: 'Contacts', label: 'Contacts' },
    { href: '/apps/sms/messages', src: '/images/users.svg', alt: 'Messages', label: 'Message' },
    {
      href: "/apps/sms/settings",
      src: "/images/Settings.svg",
      alt: "Settings",
      label: "Settings",
      className: "settings",
      subLinks: [
        { href: "/apps/sms/senderId", label: "Sender ID", className: "sender-id" },
        { href: "/apps/sms/smsUnits", label: "SMS Units", className: "notification-threshold" },
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
      </aside>
    </div>
  );
};

export default SidebarSms;

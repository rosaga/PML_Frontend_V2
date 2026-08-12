"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { clearToken } from '@/utils/auth';
import { useRouter } from 'next/navigation';
import ConfirmSignOutModal from "../modal/confirmSignout";
import { X } from "lucide-react";

const SidebarSms = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  // Listen for hamburger click from Navbar
  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(true);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-mobile-sidebar", handleToggle);
  }, []);

  const closeSidebar = () => setIsSidebarOpen(false);

  const router = useRouter();

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
    { href: '/apps/sms/dashboard', src: '/images/dashboard.svg', alt: 'Dashboard', label: 'Dashboard' },
    { href: '/apps/sms/contacts', src: '/images/vector.svg', alt: 'Contacts', label: 'Contacts' },
    { href: '/apps/sms/messages', src: '/images/users.svg', alt: 'Messages', label: 'Message' },
    { href: '/apps/sms/transactions', src: '/images/dataunits.svg', alt: 'Transactions', label: 'Transactions' },
    {
      href: "/apps/sms/settings",
      src: "/images/Settings.svg",
      alt: "Settings",
      label: "Settings",
      className: "settings",
      subLinks: [
        { href: "/apps/sms/senderId", label: "Sender ID", className: "sender-id" },
        { href: "/apps/sms/smsUnits", label: "SMS Units", className: "notification-threshold" },
        { href: "/apps/sms/developer", label: "Developer", className: "developer" },
      ]
    },
    { href: "/apps/sms/reports", src: "/images/Reports.svg", alt: "Reports", label: "Reports", className: "reports" },
  ];

  return (
    <>
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
        {/* Header / Logo with Close Button */}
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

        {/* Nav list (scrollable area) */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4">
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
                  } group ${link.className || ""}`}
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

                {/* Render sub-links for Settings */}
                {link.subLinks && isSettingsOpen && (
                  <ul className="ml-6 space-y-2 mt-2">
                    {link.subLinks.map((subLink) => (
                      <li key={subLink.href}>
                        <a
                          href={subLink.href}
                          onClick={() => handleSubMenuClick(subLink.href)}
                          className={`block p-2 text-gray-700 rounded-lg dark:text-gray-400 ${
                            activeLink === subLink.href ? "bg-[#001F3D] text-white" : "hover:bg-[#001F3D] hover:text-white dark:hover:bg-gray-700" 
                          } ${subLink.className || ""}`}
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
        </nav>

        {/* Footer with Top Up button */}
        <div className="px-3 pb-4 shrink-0 pt-2">
          <div
            className="bg-[#F58426] text-white py-2 px-5 rounded-lg flex items-center justify-center cursor-pointer w-full gap-2"
            onClick={() => router.push("/apps/sms/sms-topup")}
          >
            <img src="/images/topup.png" alt="Top Up" className="w-5 h-5" />
            <span className="text-sm font-medium">Top Up</span>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SidebarSms;
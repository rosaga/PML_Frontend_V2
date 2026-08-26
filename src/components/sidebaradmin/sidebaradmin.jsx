"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { clearToken } from "@/utils/auth";
import { useRouter } from "next/navigation";
import ConfirmSignOutModal from "../modal/confirmSignout";
import { X } from "lucide-react";

const SidebarAdmin = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const router = useRouter();

  // Listen for the hamburger click from the Navbar
  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(true);
    window.addEventListener("toggle-mobile-sidebar", handleToggle);
    return () => window.removeEventListener("toggle-mobile-sidebar", handleToggle);
  }, []);

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const closeSidebar = () => {
    setIsSidebarOpen(false);
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
    { href: "/apps/admin/dashboard", src: "/images/dashboard.svg", alt: "Dashboard", label: "Dashboard" },
    { href: "/apps/admin/organizations", src: "/images/Account.svg", alt: "Organizations", label: "Organizations" },
    { href: "/apps/admin/accounts", src: "/images/Account.svg", alt: "Accounts", label: "Accounts & Wallet" },
    { href: "/apps/admin/provisionUnits", src: "/images/dataunits.svg", alt: "Provision", label: "Provision Units" },
    {
      href: "/apps/admin/services",
      src: "/images/vector.svg",
      alt: "Services",
      label: "Services",
      className: "settings",
      subLinks: [
        { href: "/apps/admin/services/sms", label: "Bulk SMS", className: "bulk-sms" },
        // { href: "/apps/admin/services/bulk-whatsapp", label: "Bulk WhatsApp", className: "bulk-whatsapp" },
        { href: "/apps/admin/services/data", label: "Bulk Data", className: "bulk-data" },
        { href: "/apps/admin/services/airtime", label: "Bulk Airtime", className: "bulk-airtime" },
        // { href: "/apps/admin/services/ussd-flows", label: "USSD Flows", className: "ussd-flows" },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Dark Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" 
          onClick={closeSidebar}
        ></div>
      )}

      {/* Main Sidebar */}
      <aside
        id="logo-sidebar"
        className={`fixed top-0 left-0 z-50 w-64 h-screen transition-transform transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 shadow-lg bg-gray-50 dark:bg-gray-800 flex flex-col`}
        aria-label="Sidebar"
      >
        {/* Header / Logo with X Button to exit sidebar*/}
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
              <li key={link.href || link.label}>
                <a
                  href={link.href || "#"}
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
                    <button onClick={toggleSettingsSubMenu} className="ml-auto text-white">
                      {isSettingsOpen ? "▲" : "▼"}
                    </button>
                  )}
                </a>

                {/* Render sub-links */}
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

        {/* Footer */}
        <div className="px-3 pb-4 shrink-0 pt-2">
          <button
            onClick={() => setModalOpen(true)}
            className="bg-red-600 text-white py-2 px-5 rounded-lg flex items-center justify-center cursor-pointer w-full gap-2 hover:bg-red-700 transition"
          >
            <span>🚪</span>
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Render Logout Modal */}
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

export default SidebarAdmin;
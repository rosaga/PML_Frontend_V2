"use client";

import React, { useState, useEffect } from "react";
import { CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/auth";
import { hasRole } from "../../utils/decodeToken";
import { GetSenderId } from "../api/actions/senderId/senderId";
import "./miniapp.css";

const services = [
  {
    id: "data",
    title: "Data Rewards",
    desc: "Attract & retain with free data bundles",
    iconBg: "#FFF0E6",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F4822A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    id: "airtime",
    title: "Airtime Rewards",
    desc: "Gift free airtime to loyal customers",
    iconBg: "#E8F0FF",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B6FD4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 8.91a16 16 0 0 0 5 5l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
  },
  {
    id: "sms",
    title: "Bulk SMS",
    desc: "Run smart SMS marketing campaigns",
    iconBg: "#E6F7EF",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2E9E6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    id: "whatsapp",
    title: "Bulk WhatsApp",
    desc: "Reach customers on WhatsApp at scale",
    iconBg: "#EDFAE8",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4CAF30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
  {
    id: "flowbot",
    title: "Flow Bots",
    desc: "Automate chats with smart bot flows",
    iconBg: "#F3EAFF",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8B44D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
];

const adminService = {
  id: "admin",
  title: "Admin Portal",
  desc: "Manage your organization and users",
  iconBg: "#E8EAF0",
  icon: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D1B3E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
    </svg>
  ),
};

const MiniApp = () => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [navigating, setNavigating] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const orgId = localStorage.getItem("selectedAccountId");
    const token = getToken();
    setIsAdmin(hasRole(token, "SuperAdmin"));
    if (orgId) GetSenderId(orgId).catch(console.error);
  }, []);

  const navigateToService = (id) => {
    if (!id || navigating) return;
    if (id === "admin" && !isAdmin) return;

    setSelectedOption(id);
    setNavigating(true);

    setTimeout(() => {
      switch (id) {
        case "data":
          router.push("/apps/data/dashboard");
          break;
        case "airtime":
          router.push("/apps/airtime/dashboard");
          break;
        case "sms":
          router.push("/apps/sms/dashboard");
          break;
        case "flowbot":
          router.push("/apps/flowbot/dashboard");
          break;
        case "whatsapp": {
          const orgId = localStorage.getItem("selectedAccountId");
         
          if (orgId) window.open(
                `https://v0-whatsapp-bulk-messaging-six.vercel.app/?token=${btoa(orgId)}`,
                '_blank',
                'noopener,noreferrer'
              );
          break;
        }
        case "admin":
          if (isAdmin) router.push("/apps/admin/dashboard");
          break;
      }
    }, 600);
  };

  const handleCardClick = (id) => {
    navigateToService(id);
  };

  const handleGetStarted = () => {
    navigateToService(selectedOption);
  };

  const visibleServices = isAdmin ? [...services, adminService] : services;

  return (
    <div className="miniapp-page">
      {/* ── Header ── */}
      <div className="miniapp-header">
        <div className="miniapp-header-inner">
          <div>
            <div className="miniapp-logo">
              peak <span>mobile</span>
            </div>
            <div className="miniapp-headline">
              <h1>
                What can we<br />do for you <span style={{ color: "#F4822A" }}>today?</span>
              </h1>
              <p>
                Hey! I&apos;m Amara, your Peak Mobile guide. Pick a service and let&apos;s make it happen.
              </p>
            </div>
          </div>

          {/* Mascot */}
          <svg className="miniapp-mascot" viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="80" cy="215" rx="38" ry="6" fill="rgba(0,0,0,0.2)" />
            <rect x="58" y="172" width="18" height="42" rx="9" fill="#5C3317" />
            <rect x="84" y="172" width="18" height="42" rx="9" fill="#5C3317" />
            <ellipse cx="67" cy="214" rx="12" ry="6" fill="#1a1a1a" />
            <ellipse cx="93" cy="214" rx="12" ry="6" fill="#1a1a1a" />
            <rect x="44" y="110" width="72" height="70" rx="20" fill="#F4822A" />
            <path d="M72 110 L80 128 L88 110" fill="#fff" />
            <rect x="56" y="130" width="30" height="18" rx="4" fill="#0D1B3E" />
            <rect x="59" y="133" width="14" height="2" rx="1" fill="#fff" opacity="0.7" />
            <rect x="59" y="137" width="10" height="2" rx="1" fill="#F4822A" />
            <rect x="20" y="108" width="28" height="14" rx="7" fill="#7B4A1E" transform="rotate(-40 20 108)" />
            <rect x="116" y="108" width="28" height="14" rx="7" fill="#7B4A1E" transform="rotate(30 116 108)" />
            <circle cx="18" cy="92" r="9" fill="#7B4A1E" />
            <circle cx="142" cy="127" r="9" fill="#7B4A1E" />
            <rect x="70" y="90" width="20" height="24" rx="10" fill="#7B4A1E" />
            <ellipse cx="80" cy="72" rx="34" ry="36" fill="#8B5E3C" />
            <ellipse cx="80" cy="40" rx="34" ry="18" fill="#1a1a1a" />
            <ellipse cx="52" cy="58" rx="10" ry="18" fill="#1a1a1a" />
            <ellipse cx="108" cy="58" rx="10" ry="18" fill="#1a1a1a" />
            <ellipse cx="47" cy="73" rx="6" ry="8" fill="#7B4A1E" />
            <ellipse cx="113" cy="73" rx="6" ry="8" fill="#7B4A1E" />
            <ellipse cx="67" cy="70" rx="6" ry="7" fill="#fff" />
            <ellipse cx="93" cy="70" rx="6" ry="7" fill="#fff" />
            <circle cx="68" cy="71" r="4" fill="#1a1a1a" />
            <circle cx="94" cy="71" r="4" fill="#1a1a1a" />
            <circle cx="69" cy="69" r="1.5" fill="#fff" />
            <circle cx="95" cy="69" r="1.5" fill="#fff" />
            <path d="M61 62 Q67 58 73 62" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M87 62 Q93 58 99 62" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M66 84 Q80 96 94 84" stroke="#3a1a08" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M68 85 Q80 93 92 85" stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
            <path d="M47 65 Q48 36 80 34 Q112 36 113 65" stroke="#0D1B3E" strokeWidth="5" strokeLinecap="round" fill="none" />
            <rect x="40" y="65" width="12" height="18" rx="6" fill="#0D1B3E" />
            <rect x="108" y="65" width="12" height="18" rx="6" fill="#0D1B3E" />
            <rect x="42" y="69" width="8" height="10" rx="4" fill="#F4822A" />
            <rect x="110" y="69" width="8" height="10" rx="4" fill="#F4822A" />
            <path d="M116 78 Q130 84 132 92" stroke="#0D1B3E" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="133" cy="94" r="4" fill="#F4822A" />
            <rect x="92" y="18" width="60" height="28" rx="10" fill="#fff" />
            <path d="M100 46 L96 54 L108 46" fill="#fff" />
            <text x="122" y="37" fontSize="11" fontFamily="Plus Jakarta Sans,sans-serif" fontWeight="700" fill="#0D1B3E" textAnchor="middle">Hi there! 👋</text>
          </svg>
        </div>

        {/* Curved arc transition */}
        <svg className="miniapp-arc" viewBox="0 0 600 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40 Q300 0 600 40 L600 40 L0 40Z" fill="#F5F2EE" />
        </svg>
      </div>

      {/* ── Body ── */}
      <div className="miniapp-body">
        <div className="miniapp-label">Choose a service</div>

        <div className="miniapp-grid">
          {visibleServices.map((svc) => {
            const isSelected = selectedOption === svc.id;
            const isDisabled = navigating && !isSelected;
            return (
              <div
                key={svc.id}
                className={`miniapp-card${isSelected ? " selected" : ""}${isDisabled ? " disabled" : ""}`}
                onClick={() => handleCardClick(svc.id)}
              >
                <div className="miniapp-pill">✓</div>

                {navigating && isSelected ? (
                  <div className="miniapp-card-loading">
                    <CircularProgress size={32} sx={{ color: "#F4822A" }} />
                  </div>
                ) : (
                  <>
                    <div className="miniapp-card-icon" style={{ background: svc.iconBg }}>
                      {svc.icon}
                    </div>
                    <div className="miniapp-card-title">{svc.title}</div>
                    <div className="miniapp-card-desc">{svc.desc}</div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {/* <div className="miniapp-footer">
          <p className={`miniapp-footer-text${selectedOption ? " active" : ""}`}>
            {selectedOption ? "Great choice! Click get started." : ""}
          </p>
          <button
            className="miniapp-btn"
            onClick={handleGetStarted}
            disabled={!selectedOption || navigating}
          >
            Get started →
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default MiniApp;
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
  const [organizationName, setOrganizationName] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const orgId = localStorage.getItem("selectedAccountId");
    const orgName = localStorage.getItem("selectedAccountName");
    const token = getToken();

    setIsAdmin(hasRole(token, "SuperAdmin"));

    if (orgName) {
      setOrganizationName(orgName);
    }

    if (orgId) GetSenderId(orgId).catch(console.error);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetCardLoading = () => {
      setSelectedOption(null);
      setNavigating(false);
    };

    window.addEventListener("pageshow", resetCardLoading);
    window.addEventListener("popstate", resetCardLoading);

    return () => {
      window.removeEventListener("pageshow", resetCardLoading);
      window.removeEventListener("popstate", resetCardLoading);
    };
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

          if (orgId) {
            window.open(
              `https://v0-whatsapp-bulk-messaging-six.vercel.app/?token=${btoa(orgId)}`,
              "_blank",
              "noopener,noreferrer"
            );
          }

          setSelectedOption(null);
          setNavigating(false);
          break;
        }

        case "admin":
          if (isAdmin) router.push("/apps/admin/dashboard");
          break;

        default:
          setSelectedOption(null);
          setNavigating(false);
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

  const handleBackToAccounts = () => {
    router.back();
  };

  const visibleServices = isAdmin ? [...services, adminService] : services;

  return (
    <div className="miniapp-page">
      {/* ── Header ── */}
      <div className="miniapp-header">
        <div className="miniapp-header-inner">
          <div>
            <img
              src="/images/Peakwhite.png"
              alt="Peak Mobile"
              className="miniapp-logo-img"
            />

            <div className="miniapp-headline">
              <h1>
                Welcome,{" "}
                <span style={{ color: "#F4822A" }}>
                  {organizationName || "there"}{" "}
                </span>
                <span className="miniapp-wave" role="img" aria-label="waving hand">
                  👋
                </span>
              </h1>

              <p>
                Connect and Engage at Scale with our mobile marketing tools.
              </p>
              <p>
                Pick a service below to get started.
              </p>
            </div>
          </div>

          {/* Mascot */}
          <img
            src="/images/mascot.png"
            alt="Amara mascot"
            className="miniapp-mascot"
          />
        </div>

        {/* Curved arc transition */}
        <svg className="miniapp-arc" viewBox="0 0 600 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40 Q300 0 600 40 L600 40 L0 40Z" fill="#F5F2EE" />
        </svg>
      </div>

      {/* ── Body ── */}
      <div className="miniapp-body">
        <button
          type="button"
          className="miniapp-back-btn"
          onClick={handleBackToAccounts}
        >
          <span className="miniapp-back-icon">←</span>
          <span>Back to Accounts</span>
        </button>

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
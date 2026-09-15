"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useConfig } from "@/lib/whatsapp/config-context";
import { Badge } from "@/components/whatsapp/ui/badge";
import { CheckCircle, XCircle, Menu, ChevronDown, LayoutGrid, ArrowLeftRight, KeyRound, LogOut, Loader2 } from "lucide-react";
import Image from "next/image";
import { getToken, clearToken } from "@/utils/auth";
import { getUserInfo } from "@/utils/decodeToken";
import { signOut } from "next-auth/react";
import dynamic from "next/dynamic";

const ConfirmSignOutModal = dynamic(() => import("@/components/modal/confirmSignout"), { ssr: false });
const ChangePasswordModal = dynamic(() => import("@/components/modal/changePassword"), { ssr: false });

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { isConfigured, isVerifying, isLoading } = useConfig();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = getToken();
    const info = getUserInfo(token);
    if (info?.email) setUserEmail(info.email);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openSidebar = () => {
    window.dispatchEvent(new Event("toggle-mobile-sidebar"));
  };

  const handleSignOut = () => {
    clearToken();
    signOut({ callbackUrl: "/signin" });
  };

  const handlePasswordUpdated = async () => {
    clearToken();
    try {
      await signOut({ callbackUrl: "/signin" });
    } catch {
      window.location.replace("/signin");
    }
  };

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="lg:hidden p-1.5 -ml-2 bg-[#001F3D] text-white rounded-md hover:bg-opacity-90"
          >
            <Menu size={23} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={isLoading || isVerifying ? "outline" : isConfigured ? "default" : "destructive"}
            className="flex items-center gap-1.5"
          >
            {isLoading || isVerifying ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" />Connecting...</>
            ) : isConfigured ? (
              <><CheckCircle className="h-3.5 w-3.5" />API Connected</>
            ) : (
              <><XCircle className="h-3.5 w-3.5" />Not Configured</>
            )}
          </Badge>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen((v) => !v)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors"
            >
              <Image
                src="/images/avatar.png"
                alt="Profile"
                width={36}
                height={36}
                className="rounded-full border border-border"
              />
              <ChevronDown className="h-4 w-4 text-orange-500" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                <div className="px-6 py-4 text-sm text-gray-900 border-b border-gray-200">
                  <p className="font-medium text-base">Welcome</p>
                  <p className="truncate mt-1 text-gray-600">{userEmail || "—"}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setIsDropdownOpen(false); router.push("/miniapp"); }}
                    className="w-full text-left px-6 py-3 text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
                  >
                    <LayoutGrid className="h-4 w-4 text-gray-500" />
                    Switch Products
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setIsDropdownOpen(false); router.push("/user-orgs"); }}
                    className="w-full text-left px-6 py-3 text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
                  >
                    <ArrowLeftRight className="h-4 w-4 text-gray-500" />
                    Switch Accounts
                  </button>
                </div>

                <div className="border-t border-gray-200" />

                <div className="py-1">
                  <button
                    onClick={() => { setIsDropdownOpen(false); setChangePasswordOpen(true); }}
                    className="w-full text-left px-6 py-3 text-sm hover:bg-gray-100 flex items-center gap-3 text-gray-700"
                  >
                    <KeyRound className="h-4 w-4 text-gray-500" />
                    Change Password
                  </button>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => { setIsDropdownOpen(false); setConfirmLogoutOpen(true); }}
                    className="w-full text-left px-6 py-3 text-sm hover:bg-gray-100 flex items-center gap-3 text-red-600"
                  >
                    <LogOut className="h-4 w-4 text-red-500" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmLogoutOpen && (
        <ConfirmSignOutModal
          onClose={() => setConfirmLogoutOpen(false)}
          onConfirm={() => { handleSignOut(); setConfirmLogoutOpen(false); }}
        />
      )}
      {changePasswordOpen && (
        <ChangePasswordModal
          onClose={() => setChangePasswordOpen(false)}
          onSuccess={handlePasswordUpdated}
        />
      )}
    </header>
  );
}
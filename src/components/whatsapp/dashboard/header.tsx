"use client";

import { useConfig } from "@/lib/whatsapp/config-context";
import { Badge } from "@/components/whatsapp/ui/badge";
import { CheckCircle, XCircle, Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { isConfigured } = useConfig();

  const openSidebar = () => {
    window.dispatchEvent(new Event("toggle-mobile-sidebar"));
  };

  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger visible only on small screens */}
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
        <Badge
          variant={isConfigured ? "default" : "destructive"}
          className="flex items-center gap-1.5"
        >
          {isConfigured ? (
            <>
              <CheckCircle className="h-3.5 w-3.5" />
              API Connected
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5" />
              Not Configured
            </>
          )}
        </Badge>
      </div>
    </header>
  );
}